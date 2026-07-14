import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import * as argon2 from 'argon2';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { AuditAction } from '@prisma/client';
import { CurrentUserPayload } from '../common/decorators/current-user.decorator';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class IamService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly auditService: AuditService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: {
        organisationId_email: {
          organisationId: dto.organisationId,
          email: dto.email,
        },
      },
    });
    if (existing) {
      throw new ConflictException('Email already registered in this organisation');
    }

    const passwordHash = await argon2.hash(dto.password);
    const user = await this.prisma.user.create({
      data: {
        organisationId: dto.organisationId,
        branchId: dto.branchId,
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        organisationId: true,
        branchId: true,
      },
    });

    await this.auditService.log({
      action: AuditAction.CREATE,
      entityType: 'User',
      entityId: user.id,
      payload: { email: user.email },
    });

    return user;
  }

  async login(dto: LoginDto, ip?: string, userAgent?: string) {
    const user = await this.prisma.user.findFirst({
      where: { email: dto.email },
      include: {
        organisation: true,
        branch: true,
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: { permission: true },
                },
              },
            },
          },
        },
      },
    });

    if (!user || !(await argon2.verify(user.passwordHash, dto.password))) {
      await this.auditService.log({
        action: AuditAction.LOGIN_FAILED,
        entityType: 'User',
        payload: { email: dto.email, reason: 'invalid_credentials' },
        ipAddress: ip,
        userAgent,
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account disabled');
    }

    if (user.mfaEnabled) {
      if (!dto.totpCode) {
        return {
          mfaRequired: true,
          userId: user.id,
        };
      }
      const verified = speakeasy.totp.verify({
        secret: user.mfaSecret,
        encoding: 'base32',
        token: dto.totpCode,
        window: 1,
      });
      if (!verified) {
        await this.auditService.log({
          action: AuditAction.MFA_FAILED,
          entityType: 'User',
          entityId: user.id,
          user: this.toPayload(user),
          ipAddress: ip,
          userAgent,
        });
        throw new UnauthorizedException('Invalid MFA code');
      }
    }

    const tokens = await this.issueTokenPair(user);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    await this.auditService.log({
      action: AuditAction.LOGIN,
      entityType: 'User',
      entityId: user.id,
      user: this.toPayload(user),
      ipAddress: ip,
      userAgent,
    });

    return {
      mfaRequired: false,
      ...tokens,
      user: this.toPayload(user),
    };
  }

  async refresh(dto: RefreshDto) {
    const activeTokens = await this.prisma.refreshToken.findMany({
      where: {
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: {
        user: {
          include: {
            organisation: true,
            branch: true,
            userRoles: {
              include: {
                role: { include: { rolePermissions: { include: { permission: true } } } },
              },
            },
          },
        },
      },
    });

    let matched: (typeof activeTokens)[number] | null = null;
    for (const token of activeTokens) {
      if (await argon2.verify(token.tokenHash, dto.refreshToken)) {
        matched = token;
        break;
      }
    }

    if (!matched) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    await this.prisma.refreshToken.update({
      where: { id: matched.id },
      data: { revokedAt: new Date() },
    });

    return this.issueTokenPair(matched.user);
  }

  async setupMfa(userId: string) {
    const secret = speakeasy.generateSecret({
      name: `${this.configService.get('TOTP_ISSUER')}:${userId}`,
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: { mfaSecret: secret.base32 },
    });

    const otpauthUrl = secret.otpauth_url;
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

    return {
      secret: secret.base32,
      otpauthUrl,
      qrCodeDataUrl,
    };
  }

  async verifyAndEnableMfa(userId: string, code: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.mfaSecret) throw new NotFoundException('MFA not set up');

    const verified = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token: code,
      window: 1,
    });

    if (!verified) throw new UnauthorizedException('Invalid MFA code');

    await this.prisma.user.update({
      where: { id: userId },
      data: { mfaEnabled: true },
    });

    await this.auditService.log({
      action: AuditAction.MFA_ENABLED,
      entityType: 'User',
      entityId: userId,
    });

    return { enabled: true };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        organisation: true,
        branch: true,
        userRoles: { include: { role: true } },
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return this.toPayload(user);
  }

  async getBranches(organisationId: string) {
    return this.prisma.branch.findMany({
      where: { organisationId, isActive: true },
    });
  }

  private toPayload(user: any): CurrentUserPayload {
    const permissions = new Set<string>();
    const roles: string[] = [];
    for (const ur of user.userRoles || []) {
      roles.push(ur.role.name);
      for (const rp of ur.role.rolePermissions || []) {
        permissions.add(`${rp.permission.resource}:${rp.permission.action}`);
      }
    }
    return {
      userId: user.id,
      organisationId: user.organisationId,
      branchId: user.branchId,
      email: user.email,
      roles,
      permissions: Array.from(permissions),
    };
  }

  private async issueTokenPair(user: any): Promise<TokenPair> {
    const payload = this.toPayload(user);
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_ACCESS_SECRET'),
      expiresIn: this.configService.get('JWT_ACCESS_EXPIRY'),
    });
    const refreshToken = this.jwtService.sign(
      { sub: user.id, type: 'refresh' },
      {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRY'),
      },
    );

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return { accessToken, refreshToken };
  }
}

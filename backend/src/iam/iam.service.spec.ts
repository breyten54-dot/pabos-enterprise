import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { IamService } from './iam.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import * as argon2 from 'argon2';
import * as speakeasy from 'speakeasy';

jest.mock('argon2');
jest.mock('speakeasy');

describe('IamService', () => {
  let service: IamService;
  let prisma: any;
  let auditLog: jest.Mock;

  const mfaUser = {
    id: 'user-1',
    email: 'admin@praeto.local',
    passwordHash: 'hash',
    isActive: true,
    mfaEnabled: true,
    mfaSecret: 'SECRET',
    organisationId: 'org-1',
    branchId: null,
    userRoles: [],
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn().mockResolvedValue({}),
      },
      notification: {
        create: jest.fn().mockResolvedValue({ id: 'n1' }),
      },
      refreshToken: {
        create: jest.fn().mockResolvedValue({}),
      },
    };
    auditLog = jest.fn().mockResolvedValue(undefined);
    (argon2.verify as jest.Mock).mockResolvedValue(true);
    (argon2.hash as jest.Mock).mockResolvedValue('new-hash');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IamService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: { sign: jest.fn().mockReturnValue('jwt') } },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('secret') },
        },
        { provide: AuditService, useValue: { log: auditLog } },
      ],
    }).compile();

    service = module.get(IamService);
  });

  describe('login MFA handshake', () => {
    it('returns mfaRequired and requiresMfa without tokens when totpCode is missing', async () => {
      prisma.user.findFirst.mockResolvedValue(mfaUser);

      const result = await service.login({
        email: mfaUser.email,
        password: 'password12',
      });

      expect(result).toEqual({
        mfaRequired: true,
        requiresMfa: true,
        userId: 'user-1',
      });
      expect((result as { accessToken?: string }).accessToken).toBeUndefined();
    });

    it('issues tokens when totpCode verifies', async () => {
      prisma.user.findFirst.mockResolvedValue(mfaUser);
      (speakeasy.totp.verify as jest.Mock).mockReturnValue(true);

      const result = await service.login({
        email: mfaUser.email,
        password: 'password12',
        totpCode: '123456',
      });

      expect(result).toEqual(
        expect.objectContaining({
          mfaRequired: false,
          requiresMfa: false,
          accessToken: 'jwt',
          refreshToken: 'jwt',
        }),
      );
    });
  });

  describe('forgotPassword', () => {
    it('returns the same message when the email is unknown', async () => {
      prisma.user.findFirst.mockResolvedValue(null);
      const result = await service.forgotPassword({ email: 'missing@praeto.local' });
      expect(result.message).toMatch(/If an account exists/);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('stores a SHA-256 token hash and queues a notification', async () => {
      prisma.user.findFirst.mockResolvedValue({
        id: 'user-1',
        email: 'admin@praeto.local',
        organisationId: 'org-1',
        isActive: true,
      });

      const result = await service.forgotPassword({ email: 'admin@praeto.local' });

      expect(result.message).toMatch(/If an account exists/);
      expect((result as { resetToken?: string }).resetToken).toBeUndefined();
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-1' },
          data: expect.objectContaining({
            passwordResetTokenHash: expect.any(String),
            passwordResetExpiresAt: expect.any(Date),
          }),
        }),
      );
      expect(prisma.notification.create).toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    it('rejects an unknown or expired token', async () => {
      prisma.user.findFirst.mockResolvedValue(null);
      await expect(
        service.resetPassword({ token: 'deadbeef', password: 'newpassword1' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('hashes the new password and clears the token fields', async () => {
      prisma.user.findFirst.mockResolvedValue({ id: 'user-1' });
      const result = await service.resetPassword({
        token: 'deadbeef',
        password: 'newpassword1',
      });
      expect(result).toEqual({ message: 'Password updated' });
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            passwordHash: 'new-hash',
            passwordResetTokenHash: null,
            passwordResetExpiresAt: null,
          }),
        }),
      );
    });
  });
});

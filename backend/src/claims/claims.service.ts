import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { CreateClaimDto } from './dto/create-claim.dto';
import { AuditAction, ClaimStatus } from '@prisma/client';
import { randomBytes } from 'crypto';

@Injectable()
export class ClaimsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async findAll(user: CurrentUserPayload) {
    return this.prisma.claim.findMany({
      where: {
        organisationId: user.organisationId,
        ...(user.branchId ? { branchId: user.branchId } : {}),
        isDeleted: false,
      },
      include: {
        client: { select: { firstName: true, lastName: true } },
        policy: { select: { policyNumber: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(dto: CreateClaimDto, user: CurrentUserPayload) {
    const policy = await this.prisma.policy.findFirst({
      where: {
        id: dto.policyId,
        organisationId: user.organisationId,
        ...(user.branchId ? { branchId: user.branchId } : {}),
        isDeleted: false,
      },
    });
    if (!policy) throw new NotFoundException('Policy not found');

    const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const claimNumber = `CLM-${stamp}-${randomBytes(3).toString('hex').toUpperCase()}`;

    const claim = await this.prisma.claim.create({
      data: {
        organisationId: user.organisationId,
        branchId: user.branchId ?? policy.branchId,
        policyId: policy.id,
        clientId: policy.clientId,
        claimNumber,
        incidentDate: new Date(dto.incidentDate),
        description: dto.description,
        status: ClaimStatus.REGISTERED,
        statusHistory: {
          create: {
            status: ClaimStatus.REGISTERED,
            changedById: user.userId,
            reason: 'Claim registered',
          },
        },
      },
      include: { statusHistory: true },
    });

    await this.auditService.log({
      action: AuditAction.CREATE,
      entityType: 'Claim',
      entityId: claim.id,
      user,
      payload: { claimNumber, policyId: policy.id },
    });

    return claim;
  }
}

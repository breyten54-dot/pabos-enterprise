import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ClaimsService } from './claims.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ClaimStatus } from '@prisma/client';
import type { CurrentUserPayload } from '../common/decorators/current-user.decorator';

describe('ClaimsService', () => {
  let service: ClaimsService;
  let prisma: any;
  let auditLog: jest.Mock;

  const user: CurrentUserPayload = {
    userId: 'user-1',
    organisationId: 'org-1',
    email: 'test@praeto.co.za',
    roles: [],
    permissions: [],
  };

  beforeEach(async () => {
    prisma = {
      policy: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'policy-1',
          clientId: 'client-1',
          branchId: 'branch-1',
        }),
      },
      claim: {
        findMany: jest.fn().mockResolvedValue([{ id: 'claim-1' }]),
        create: jest.fn().mockResolvedValue({
          id: 'claim-1',
          status: ClaimStatus.REGISTERED,
          claimNumber: 'CLM-20260825-ABCDEF',
          statusHistory: [{ status: ClaimStatus.REGISTERED }],
        }),
      },
    };
    auditLog = jest.fn().mockResolvedValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClaimsService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: { log: auditLog } },
      ],
    }).compile();

    service = module.get(ClaimsService);
  });

  it('lists non-deleted claims for the organisation', async () => {
    const result = await service.findAll(user);
    expect(prisma.claim.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { organisationId: 'org-1', isDeleted: false },
      }),
    );
    expect(result).toHaveLength(1);
  });

  it('throws when the policy is missing', async () => {
    prisma.policy.findFirst.mockResolvedValueOnce(null);
    await expect(
      service.create({ policyId: 'missing', incidentDate: '2026-08-01' }, user),
    ).rejects.toThrow(NotFoundException);
  });

  it('creates a REGISTERED claim with status history', async () => {
    const result = await service.create(
      { policyId: 'policy-1', incidentDate: '2026-08-01', description: 'Windscreen' },
      user,
    );
    expect(prisma.claim.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          organisationId: 'org-1',
          policyId: 'policy-1',
          clientId: 'client-1',
          status: ClaimStatus.REGISTERED,
          statusHistory: {
            create: expect.objectContaining({
              status: ClaimStatus.REGISTERED,
              changedById: 'user-1',
            }),
          },
        }),
      }),
    );
    expect(result.status).toBe(ClaimStatus.REGISTERED);
    expect(auditLog).toHaveBeenCalled();
  });
});

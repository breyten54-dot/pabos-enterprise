import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PolicyAdminService } from './policy-admin.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { LineOfBusiness, PolicyStatus, AmendmentType } from '@prisma/client';
import type { CurrentUserPayload } from '../common/decorators/current-user.decorator';

describe('PolicyAdminService', () => {
  let service: PolicyAdminService;
  let prisma: any;
  let auditLog: jest.Mock;

  beforeEach(async () => {
    prisma = {
      policy: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'policy-1',
            policyNumber: 'POL001',
            client: { firstName: 'Jane', lastName: 'Doe' },
          },
        ]),
        findFirst: jest.fn().mockResolvedValue({
          id: 'policy-1',
          policyNumber: 'POL001',
          riskAddressLine1: '1 Old Street',
          riskAddressLine2: null,
          riskSuburb: null,
          riskCity: 'Cape Town',
          riskProvince: 'Western Cape',
          riskPostalCode: '8000',
        }),
        create: jest.fn().mockResolvedValue({
          id: 'policy-1',
          policyNumber: 'POL001',
          status: PolicyStatus.ACTIVE,
        }),
        update: jest.fn().mockResolvedValue({
          id: 'policy-1',
          riskAddressLine1: '2 New Street',
          riskCity: 'Cape Town',
        }),
      },
      client: {
        findFirst: jest.fn().mockResolvedValue({ id: 'client-1' }),
      },
      policyAmendment: {
        create: jest.fn().mockResolvedValue({ id: 'amendment-1' }),
      },
      $transaction: jest.fn().mockImplementation((ops) => Promise.all(ops)),
    };

    auditLog = jest.fn().mockResolvedValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PolicyAdminService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: { log: auditLog } },
      ],
    }).compile();

    service = module.get<PolicyAdminService>(PolicyAdminService);
  });

  const user: CurrentUserPayload = {
    userId: 'user-1',
    organisationId: 'org-1',
    email: 'test@praeto.co.za',
    roles: [],
    permissions: [],
  };

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('returns non-deleted policies scoped to the user organisation', async () => {
      const result = await service.findAll(user);

      expect(prisma.policy.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            organisationId: 'org-1',
            isDeleted: false,
          },
          include: {
            client: { select: { firstName: true, lastName: true } },
          },
          orderBy: { createdAt: 'desc' },
        }),
      );
      expect(result).toHaveLength(1);
    });

    it('filters by branch when the user belongs to a branch', async () => {
      const branchUser = { ...user, branchId: 'branch-1' };
      await service.findAll(branchUser);

      expect(prisma.policy.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            organisationId: 'org-1',
            branchId: 'branch-1',
            isDeleted: false,
          },
        }),
      );
    });
  });

  describe('create', () => {
    const dto = {
      clientId: 'client-1',
      policyNumber: 'POL001',
      lineOfBusiness: LineOfBusiness.MOTOR,
      inceptionDate: '2026-01-01',
      expiryDate: '2027-01-01',
      sumInsured: '150000',
      premium: '1200',
      excess: '500',
    };

    it('throws NotFoundException when the client does not exist', async () => {
      prisma.client.findFirst.mockResolvedValueOnce(null);

      await expect(service.create(dto, user)).rejects.toThrow(
        new NotFoundException('Client not found'),
      );
      expect(prisma.policy.create).not.toHaveBeenCalled();
    });

    it('creates an active policy and audits the action', async () => {
      const result = await service.create(dto, user);

      expect(prisma.client.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: 'client-1',
            organisationId: 'org-1',
          },
        }),
      );
      expect(prisma.policy.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            organisationId: 'org-1',
            clientId: 'client-1',
            policyNumber: 'POL001',
            lineOfBusiness: LineOfBusiness.MOTOR,
            status: PolicyStatus.ACTIVE,
            sumInsured: 150000,
            premium: 1200,
            excess: 500,
          }),
        }),
      );
      expect(auditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          entityType: 'Policy',
          entityId: result.id,
        }),
      );
      expect(result.status).toBe(PolicyStatus.ACTIVE);
    });

    it('converts optional numeric strings to null when omitted', async () => {
      const minimalDto = {
        clientId: 'client-1',
        policyNumber: 'POL002',
        lineOfBusiness: LineOfBusiness.HOME,
        inceptionDate: '2026-01-01',
        expiryDate: '2027-01-01',
      };

      await service.create(minimalDto, user);

      expect(prisma.policy.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            sumInsured: null,
            premium: null,
            excess: null,
          }),
        }),
      );
    });
  });

  describe('addressChange', () => {
    const dto = {
      effectiveDate: '2026-07-01',
      newAddressLine1: '2 New Street',
      newCity: 'Cape Town',
      newProvince: 'Western Cape',
      newPostalCode: '8001',
      reason: 'Moved offices',
    };

    it('throws NotFoundException when the policy does not exist', async () => {
      prisma.policy.findFirst.mockResolvedValueOnce(null);

      await expect(service.addressChange('policy-1', dto, user)).rejects.toThrow(
        new NotFoundException('Policy not found'),
      );
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('creates an endorsement amendment, updates the policy and audits', async () => {
      const result = await service.addressChange('policy-1', dto, user);

      expect(prisma.policy.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: 'policy-1',
            organisationId: 'org-1',
          },
        }),
      );
      expect(prisma.policyAmendment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            policyId: 'policy-1',
            organisationId: 'org-1',
            type: AmendmentType.ENDORSEMENT,
            subType: 'ADDRESS_CHANGE',
            previousValues: expect.objectContaining({
              riskAddressLine1: '1 Old Street',
              riskCity: 'Cape Town',
            }),
            proposedValues: expect.objectContaining({
              riskAddressLine1: '2 New Street',
              riskCity: 'Cape Town',
            }),
            status: 'PENDING',
          }),
        }),
      );
      expect(prisma.policy.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'policy-1' },
          data: expect.objectContaining({
            riskAddressLine1: '2 New Street',
            riskCity: 'Cape Town',
            riskProvince: 'Western Cape',
            riskPostalCode: '8001',
          }),
        }),
      );
      expect(auditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          entityType: 'PolicyAmendment',
          entityId: result.id,
        }),
      );
      expect(result.id).toBe('amendment-1');
    });

    it('filters by branch when the user belongs to a branch', async () => {
      const branchUser = { ...user, branchId: 'branch-1' };
      await service.addressChange('policy-1', dto, branchUser);

      expect(prisma.policy.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: 'policy-1',
            organisationId: 'org-1',
            branchId: 'branch-1',
          },
        }),
      );
      expect(prisma.policyAmendment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ branchId: 'branch-1' }),
        }),
      );
    });
  });
});

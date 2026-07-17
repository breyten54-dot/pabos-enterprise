import { Test, TestingModule } from '@nestjs/testing';
import { CrmService } from './crm.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ClientType, IdType, ConsentPurpose } from '@prisma/client';
import type { CurrentUserPayload } from '../common/decorators/current-user.decorator';

describe('CrmService', () => {
  let service: CrmService;
  let prisma: any;
  let auditLog: jest.Mock;

  beforeEach(async () => {
    prisma = {
      client: {
        create: jest.fn().mockResolvedValue({
          id: 'client-1',
          firstName: 'Jane',
          lastName: 'Doe',
          consentRecords: [
            {
              id: 'consent-1',
              purpose: ConsentPurpose.MARKETING,
              granted: true,
            },
          ],
        }),
        findMany: jest
          .fn()
          .mockResolvedValue([{ id: 'client-1', firstName: 'Jane', lastName: 'Doe' }]),
        findFirst: jest.fn().mockResolvedValue({
          id: 'client-1',
          firstName: 'Jane',
          lastName: 'Doe',
          contacts: [],
          consentRecords: [],
          policies: [],
          claims: [],
        }),
      },
    };

    auditLog = jest.fn().mockResolvedValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CrmService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: { log: auditLog } },
      ],
    }).compile();

    service = module.get<CrmService>(CrmService);
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

  describe('create', () => {
    it('creates a client with a consent record and audits the action', async () => {
      const dto = {
        type: ClientType.INDIVIDUAL,
        idType: IdType.RSA_ID,
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@example.com',
        consentGranted: true,
        consentPurpose: ConsentPurpose.MARKETING,
      };

      const result = await service.create(dto, user);

      expect(prisma.client.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            organisationId: 'org-1',
            firstName: 'Jane',
            lastName: 'Doe',
            email: 'jane@example.com',
            consentRecords: {
              create: expect.objectContaining({
                organisationId: 'org-1',
                purpose: ConsentPurpose.MARKETING,
                granted: true,
                lawfulBasis: 'consent',
                channel: 'system',
              }),
            },
          }),
          include: { consentRecords: true },
        }),
      );
      expect(auditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          entityType: 'Client',
          entityId: result.id,
        }),
      );
      expect(result.id).toBe('client-1');
    });

    it('skips consent record creation when consentGranted is undefined', async () => {
      const dto = {
        type: ClientType.BUSINESS,
        idType: IdType.COMPANY_REG,
        companyName: 'Acme Inc',
      };

      await service.create(dto, user);

      expect(prisma.client.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            consentRecords: { create: undefined },
          }),
        }),
      );
    });

    it('applies the default country when none is provided', async () => {
      const dto = {
        type: ClientType.INDIVIDUAL,
        idType: IdType.RSA_ID,
        firstName: 'Jane',
      };

      await service.create(dto, user);

      expect(prisma.client.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ country: 'ZA' }),
        }),
      );
    });
  });

  describe('findAll', () => {
    it('returns active clients scoped to the user organisation', async () => {
      const result = await service.findAll(user);

      expect(prisma.client.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            organisationId: 'org-1',
            isActive: true,
          },
          include: {
            consentRecords: { take: 5, orderBy: { createdAt: 'desc' } },
          },
        }),
      );
      expect(result).toHaveLength(1);
    });

    it('filters by branch when the user belongs to a branch', async () => {
      const branchUser = { ...user, branchId: 'branch-1' };
      await service.findAll(branchUser);

      expect(prisma.client.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            organisationId: 'org-1',
            branchId: 'branch-1',
            isActive: true,
          },
        }),
      );
    });
  });

  describe('findOne', () => {
    it('returns a client with related data scoped to the user organisation', async () => {
      const result = await service.findOne('client-1', user);

      expect(prisma.client.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: 'client-1',
            organisationId: 'org-1',
          },
          include: {
            contacts: true,
            consentRecords: { orderBy: { createdAt: 'desc' } },
            policies: { take: 10, orderBy: { createdAt: 'desc' } },
            claims: { take: 10, orderBy: { createdAt: 'desc' } },
          },
        }),
      );
      expect(result?.id).toBe('client-1');
    });

    it('filters by branch when the user belongs to a branch', async () => {
      const branchUser = { ...user, branchId: 'branch-1' };
      await service.findOne('client-1', branchUser);

      expect(prisma.client.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: 'client-1',
            organisationId: 'org-1',
            branchId: 'branch-1',
          },
        }),
      );
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentsService } from './documents.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import type { CurrentUserPayload } from '../common/decorators/current-user.decorator';

describe('DocumentsService', () => {
  let service: DocumentsService;
  let prisma: any;

  const user: CurrentUserPayload = {
    userId: 'user-1',
    organisationId: 'org-1',
    email: 'test@praeto.co.za',
    roles: [],
    permissions: [],
  };

  const file = {
    originalname: 'id scan.pdf',
    mimetype: 'application/pdf',
    size: 1024,
  } as Express.Multer.File;

  beforeEach(async () => {
    prisma = {
      document: {
        create: jest.fn().mockResolvedValue({ id: 'doc-1', storageKey: 'key' }),
        findMany: jest.fn().mockResolvedValue([{ id: 'doc-1' }]),
        findFirst: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentsService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: { log: jest.fn() } },
        { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue('x') } },
      ],
    }).compile();

    service = module.get(DocumentsService);
  });

  it('rejects upload without a file', async () => {
    await expect(service.uploadStub(undefined as any, {}, user)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('inserts a Document row on upload', async () => {
    const result = await service.uploadStub(file, { clientId: 'client-1' }, user);
    expect(prisma.document.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          organisationId: 'org-1',
          clientId: 'client-1',
          originalName: 'id scan.pdf',
          mimeType: 'application/pdf',
          sizeBytes: 1024,
          uploadedById: 'user-1',
        }),
      }),
    );
    expect(result.id).toBe('doc-1');
  });

  it('lists documents filtered by clientId', async () => {
    await service.list({ clientId: 'client-1' }, user);
    expect(prisma.document.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          organisationId: 'org-1',
          clientId: 'client-1',
        }),
      }),
    );
  });
});

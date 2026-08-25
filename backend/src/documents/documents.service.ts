import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { AuditAction, DocumentClassification } from '@prisma/client';

@Injectable()
export class DocumentsService {
  constructor(
    private readonly configService: ConfigService,
    private readonly auditService: AuditService,
    private readonly prisma: PrismaService,
  ) {}

  async uploadStub(
    file: Express.Multer.File,
    metadata: { clientId?: string; policyId?: string; claimId?: string },
    user: CurrentUserPayload,
  ) {
    if (!file) {
      throw new BadRequestException('file is required');
    }

    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storageKey = `org-${user.organisationId}/${Date.now()}-${safeName}`;

    const document = await this.prisma.document.create({
      data: {
        organisationId: user.organisationId,
        branchId: user.branchId,
        clientId: metadata.clientId || null,
        policyId: metadata.policyId || null,
        claimId: metadata.claimId || null,
        fileName: safeName,
        originalName: file.originalname,
        mimeType: file.mimetype || 'application/octet-stream',
        sizeBytes: file.size ?? 0,
        storageKey,
        classification: DocumentClassification.INTERNAL,
        uploadedById: user.userId,
      },
    });

    await this.auditService.log({
      action: AuditAction.CREATE,
      entityType: 'Document',
      entityId: document.id,
      user,
      payload: {
        originalName: file.originalname,
        sizeBytes: file.size,
        storageKey,
        ...metadata,
      },
    });

    return {
      message: 'Upload stub: MinIO integration pending',
      id: document.id,
      storageKey,
      originalName: file.originalname,
      sizeBytes: file.size,
      mimeType: file.mimetype,
    };
  }

  async list(
    filters: { clientId?: string; policyId?: string; claimId?: string },
    user: CurrentUserPayload,
  ) {
    return this.prisma.document.findMany({
      where: {
        organisationId: user.organisationId,
        ...(user.branchId ? { branchId: user.branchId } : {}),
        ...(filters.clientId ? { clientId: filters.clientId } : {}),
        ...(filters.policyId ? { policyId: filters.policyId } : {}),
        ...(filters.claimId ? { claimId: filters.claimId } : {}),
      },
      orderBy: { uploadedAt: 'desc' },
    });
  }

  async downloadStub(storageKey: string, user: CurrentUserPayload) {
    const document = await this.prisma.document.findFirst({
      where: {
        storageKey,
        organisationId: user.organisationId,
        ...(user.branchId ? { branchId: user.branchId } : {}),
      },
    });
    if (!document) throw new NotFoundException('Document not found');

    await this.auditService.log({
      action: AuditAction.VIEW,
      entityType: 'Document',
      entityId: document.id,
      user,
      payload: { storageKey },
    });

    return {
      message: 'Download stub: MinIO integration pending',
      storageKey,
      url: `http://${this.configService.get('MINIO_ENDPOINT')}:${this.configService.get('MINIO_PORT')}/${this.configService.get('MINIO_BUCKET_DOCUMENTS')}/${storageKey}`,
    };
  }
}

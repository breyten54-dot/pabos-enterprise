import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuditService } from '../audit/audit.service';
import { CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { AuditAction } from '@prisma/client';

@Injectable()
export class DocumentsService {
  constructor(
    private readonly configService: ConfigService,
    private readonly auditService: AuditService,
  ) {}

  async uploadStub(
    file: Express.Multer.File,
    metadata: { clientId?: string; policyId?: string; claimId?: string },
    user: CurrentUserPayload,
  ) {
    const storageKey = `org-${user.organisationId}/${Date.now()}-${file.originalname}`;

    await this.auditService.log({
      action: AuditAction.CREATE,
      entityType: 'Document',
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
      storageKey,
      originalName: file.originalname,
      sizeBytes: file.size,
      mimeType: file.mimetype,
    };
  }

  async downloadStub(storageKey: string, user: CurrentUserPayload) {
    await this.auditService.log({
      action: AuditAction.VIEW,
      entityType: 'Document',
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

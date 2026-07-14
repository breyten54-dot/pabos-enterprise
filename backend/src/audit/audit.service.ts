import { Injectable } from '@nestjs/common';
import { AuditAction, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CurrentUserPayload } from '../common/decorators/current-user.decorator';

export interface AuditEntryInput {
  action: AuditAction;
  entityType: string;
  entityId?: string;
  payload?: Prisma.JsonValue;
  user?: CurrentUserPayload;
  ipAddress?: string;
  userAgent?: string;
  correlationId?: string;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(entry: AuditEntryInput) {
    return this.prisma.auditLog.create({
      data: {
        organisationId: entry.user?.organisationId,
        branchId: entry.user?.branchId,
        userId: entry.user?.userId,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
        payload: entry.payload ?? Prisma.JsonNull,
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
        correlationId: entry.correlationId,
      },
    });
  }
}

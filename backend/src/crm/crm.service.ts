import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { CreateClientDto } from './dto/create-client.dto';
import { AuditAction, ConsentPurpose } from '@prisma/client';

@Injectable()
export class CrmService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async create(dto: CreateClientDto, user: CurrentUserPayload) {
    const client = await this.prisma.client.create({
      data: {
        organisationId: user.organisationId,
        branchId: user.branchId,
        type: dto.type,
        firstName: dto.firstName,
        lastName: dto.lastName,
        companyName: dto.companyName,
        email: dto.email,
        phone: dto.phone,
        idNumber: dto.idNumber,
        idType: dto.idType,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : null,
        addressLine1: dto.addressLine1,
        addressLine2: dto.addressLine2,
        suburb: dto.suburb,
        city: dto.city,
        province: dto.province,
        postalCode: dto.postalCode,
        country: dto.country ?? 'ZA',
        notes: dto.notes,
        consentRecords: {
          create:
            dto.consentGranted !== undefined
              ? {
                  organisationId: user.organisationId,
                  purpose: dto.consentPurpose ?? ConsentPurpose.DATA_RETENTION,
                  lawfulBasis: 'consent',
                  granted: dto.consentGranted,
                  channel: 'system',
                }
              : undefined,
        },
      },
      include: { consentRecords: true },
    });

    await this.auditService.log({
      action: AuditAction.CREATE,
      entityType: 'Client',
      entityId: client.id,
      user,
      payload: { type: dto.type, email: dto.email },
    });

    return client;
  }

  async findAll(user: CurrentUserPayload) {
    return this.prisma.client.findMany({
      where: {
        organisationId: user.organisationId,
        ...(user.branchId ? { branchId: user.branchId } : {}),
        isActive: true,
      },
      include: { consentRecords: { take: 5, orderBy: { createdAt: 'desc' } } },
    });
  }

  async findOne(id: string, user: CurrentUserPayload) {
    return this.prisma.client.findFirst({
      where: {
        id,
        organisationId: user.organisationId,
        ...(user.branchId ? { branchId: user.branchId } : {}),
      },
      include: {
        contacts: true,
        consentRecords: { orderBy: { createdAt: 'desc' } },
        policies: { take: 10, orderBy: { createdAt: 'desc' } },
        claims: { take: 10, orderBy: { createdAt: 'desc' } },
      },
    });
  }
}

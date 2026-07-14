import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { CreatePolicyDto } from './dto/create-policy.dto';
import { AddressChangeDto } from './dto/address-change.dto';
import { AuditAction, AmendmentType, PolicyStatus } from '@prisma/client';

@Injectable()
export class PolicyAdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async findAll(user: CurrentUserPayload) {
    return this.prisma.policy.findMany({
      where: {
        organisationId: user.organisationId,
        ...(user.branchId ? { branchId: user.branchId } : {}),
        isDeleted: false,
      },
      include: { client: { select: { firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(dto: CreatePolicyDto, user: CurrentUserPayload) {
    const client = await this.prisma.client.findFirst({
      where: {
        id: dto.clientId,
        organisationId: user.organisationId,
        ...(user.branchId ? { branchId: user.branchId } : {}),
      },
    });
    if (!client) throw new NotFoundException('Client not found');

    const policy = await this.prisma.policy.create({
      data: {
        organisationId: user.organisationId,
        branchId: user.branchId,
        clientId: dto.clientId,
        insurerId: dto.insurerId,
        productId: dto.productId,
        policyNumber: dto.policyNumber,
        lineOfBusiness: dto.lineOfBusiness,
        status: PolicyStatus.ACTIVE,
        inceptionDate: new Date(dto.inceptionDate),
        expiryDate: new Date(dto.expiryDate),
        sumInsured: dto.sumInsured ? parseFloat(dto.sumInsured) : null,
        premium: dto.premium ? parseFloat(dto.premium) : null,
        excess: dto.excess ? parseFloat(dto.excess) : null,
        riskAddressLine1: dto.riskAddressLine1,
        riskCity: dto.riskCity,
        riskProvince: dto.riskProvince,
        riskPostalCode: dto.riskPostalCode,
      },
    });

    await this.auditService.log({
      action: AuditAction.CREATE,
      entityType: 'Policy',
      entityId: policy.id,
      user,
      payload: { policyNumber: dto.policyNumber, lineOfBusiness: dto.lineOfBusiness },
    });

    return policy;
  }

  async addressChange(id: string, dto: AddressChangeDto, user: CurrentUserPayload) {
    const policy = await this.prisma.policy.findFirst({
      where: {
        id,
        organisationId: user.organisationId,
        ...(user.branchId ? { branchId: user.branchId } : {}),
      },
    });
    if (!policy) throw new NotFoundException('Policy not found');

    const previousValues = {
      riskAddressLine1: policy.riskAddressLine1,
      riskAddressLine2: policy.riskAddressLine2,
      riskSuburb: policy.riskSuburb,
      riskCity: policy.riskCity,
      riskProvince: policy.riskProvince,
      riskPostalCode: policy.riskPostalCode,
    };

    const proposedValues = {
      riskAddressLine1: dto.newAddressLine1,
      riskAddressLine2: dto.newAddressLine2,
      riskSuburb: dto.newSuburb,
      riskCity: dto.newCity,
      riskProvince: dto.newProvince,
      riskPostalCode: dto.newPostalCode,
    };

    const [amendment] = await this.prisma.$transaction([
      this.prisma.policyAmendment.create({
        data: {
          policyId: id,
          organisationId: user.organisationId,
          branchId: user.branchId,
          type: AmendmentType.ENDORSEMENT,
          subType: 'ADDRESS_CHANGE',
          effectiveDate: new Date(dto.effectiveDate),
          previousValues,
          proposedValues,
          reason: dto.reason,
          status: 'PENDING',
        },
      }),
      this.prisma.policy.update({
        where: { id },
        data: {
          riskAddressLine1: dto.newAddressLine1,
          riskAddressLine2: dto.newAddressLine2,
          riskSuburb: dto.newSuburb,
          riskCity: dto.newCity,
          riskProvince: dto.newProvince,
          riskPostalCode: dto.newPostalCode,
        },
      }),
    ]);

    await this.auditService.log({
      action: AuditAction.CREATE,
      entityType: 'PolicyAmendment',
      entityId: amendment.id,
      user,
      payload: { policyId: id, subType: 'ADDRESS_CHANGE' },
    });

    return amendment;
  }
}

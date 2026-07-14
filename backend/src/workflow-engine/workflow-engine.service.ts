import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { AuditAction, TaskPriority, TaskStatus } from '@prisma/client';

@Injectable()
export class WorkflowEngineService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async findActivityCode(code: string, user: CurrentUserPayload) {
    return this.prisma.activityCode.findUnique({
      where: {
        organisationId_code: {
          organisationId: user.organisationId,
          code,
        },
      },
    });
  }

  async createTask(
    input: {
      activityCodeId?: string;
      title: string;
      description?: string;
      clientId?: string;
      policyId?: string;
      claimId?: string;
      priority?: TaskPriority;
      dueAt?: Date;
      sourceType?: string;
      sourceId?: string;
    },
    user: CurrentUserPayload,
  ) {
    const task = await this.prisma.task.create({
      data: {
        organisationId: user.organisationId,
        branchId: user.branchId,
        activityCodeId: input.activityCodeId,
        title: input.title,
        description: input.description,
        clientId: input.clientId,
        policyId: input.policyId,
        claimId: input.claimId,
        priority: input.priority ?? TaskPriority.MEDIUM,
        status: TaskStatus.PENDING,
        dueAt: input.dueAt,
        sourceType: input.sourceType ?? 'MANUAL',
        sourceId: input.sourceId,
      },
    });

    await this.auditService.log({
      action: AuditAction.CREATE,
      entityType: 'Task',
      entityId: task.id,
      user,
      payload: { title: input.title, activityCodeId: input.activityCodeId },
    });

    return task;
  }
}

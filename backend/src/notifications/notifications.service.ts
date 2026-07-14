import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { AuditAction, NotificationChannel, NotificationStatus } from '@prisma/client';

export interface SendNotificationInput {
  channel: NotificationChannel;
  recipientAddress: string;
  subject?: string;
  body: string;
  userId?: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
}

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    @InjectQueue('notifications') private readonly notificationsQueue: Queue,
  ) {}

  async queueStub(input: SendNotificationInput, user: CurrentUserPayload) {
    const notification = await this.prisma.notification.create({
      data: {
        organisationId: user.organisationId,
        userId: input.userId,
        recipientAddress: input.recipientAddress,
        channel: input.channel,
        subject: input.subject,
        body: input.body,
        status: NotificationStatus.PENDING,
        relatedEntityType: input.relatedEntityType,
        relatedEntityId: input.relatedEntityId,
      },
    });

    await this.notificationsQueue.add('send-notification', {
      notificationId: notification.id,
    });

    await this.auditService.log({
      action: AuditAction.CREATE,
      entityType: 'Notification',
      entityId: notification.id,
      user,
      payload: { channel: input.channel, recipient: input.recipientAddress },
    });

    return {
      message: 'Notification queued',
      notificationId: notification.id,
      status: notification.status,
      jobQueued: true,
    };
  }

  async findPending(organisationId: string, limit = 50) {
    return this.prisma.notification.findMany({
      where: { organisationId, status: NotificationStatus.PENDING },
      take: limit,
      orderBy: { createdAt: 'asc' },
    });
  }
}

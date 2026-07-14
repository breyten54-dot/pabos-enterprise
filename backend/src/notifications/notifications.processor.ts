import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationStatus } from '@prisma/client';

@Processor('notifications')
export class NotificationsProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationsProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<{ notificationId: string }>): Promise<void> {
    this.logger.log(
      `Processing notification job ${job.id} for notification ${job.data.notificationId}`,
    );

    // Stub: in production this would send via SMTP/SMS gateway.
    await this.prisma.notification.update({
      where: { id: job.data.notificationId },
      data: { status: NotificationStatus.SENT, sentAt: new Date() },
    });

    this.logger.log(`Notification ${job.data.notificationId} marked as sent (stub)`);
  }
}

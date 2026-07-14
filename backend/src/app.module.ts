import 'dotenv/config';
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { BullModule } from '@nestjs/bullmq';
import { AppController } from './app.controller';
import { ConfigModule } from '@nestjs/config';
import { validate } from './config/env.validation';
import { AppConfigModule } from './config/config.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuditModule } from './audit/audit.module';
import { IamModule } from './iam/iam.module';
import { CrmModule } from './crm/crm.module';
import { PolicyAdminModule } from './policy-admin/policy-admin.module';
import { DocumentsModule } from './documents/documents.module';
import { NotificationsModule } from './notifications/notifications.module';
import { WorkflowEngineModule } from './workflow-engine/workflow-engine.module';
import { AiCopilotModule } from './ai-copilot/ai-copilot.module';
import { KnowledgeBaseModule } from './knowledge-base/knowledge-base.module';
import { JwtAuthGuard } from './iam/jwt-auth.guard';
import { PermissionsGuard } from './iam/permissions.guard';

const notificationsQueueEnabled = process.env.NOTIFICATIONS_QUEUE_ENABLED !== 'false';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
      envFilePath: ['.env'],
    }),
    ...(notificationsQueueEnabled
      ? [
          BullModule.forRootAsync({
            useFactory: () => ({
              connection: {
                host: process.env.REDIS_HOST || 'localhost',
                port: parseInt(process.env.REDIS_PORT || '6379', 10),
                password: process.env.REDIS_PASSWORD || undefined,
              },
            }),
          }),
        ]
      : []),
    AppConfigModule,
    PrismaModule,
    AuditModule,
    IamModule,
    CrmModule,
    PolicyAdminModule,
    DocumentsModule,
    ...(notificationsQueueEnabled ? [NotificationsModule] : []),
    WorkflowEngineModule,
    AiCopilotModule,
    KnowledgeBaseModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
  ],
})
export class AppModule {}

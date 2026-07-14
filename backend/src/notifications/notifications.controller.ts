import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { NotificationsService, SendNotificationInput } from './notifications.service';
import { JwtAuthGuard } from '../iam/jwt-auth.guard';
import { PermissionsGuard } from '../iam/permissions.guard';
import { CurrentUser, CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { IsEnum, IsString, IsOptional, IsUUID } from 'class-validator';
import { NotificationChannel } from '@prisma/client';

class QueueNotificationDto implements SendNotificationInput {
  @IsEnum(NotificationChannel)
  channel: NotificationChannel;

  @IsString()
  recipientAddress: string;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsString()
  body: string;

  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsString()
  relatedEntityType?: string;

  @IsOptional()
  @IsString()
  relatedEntityId?: string;
}

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @RequirePermission('user:read')
  @Post('queue')
  queue(@Body() dto: QueueNotificationDto, @CurrentUser() user: CurrentUserPayload) {
    return this.notificationsService.queueStub(dto, user);
  }

  @RequirePermission('user:read')
  @Get('pending')
  pending(@CurrentUser() user: CurrentUserPayload) {
    return this.notificationsService.findPending(user.organisationId);
  }
}

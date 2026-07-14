import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { WorkflowEngineService } from './workflow-engine.service';
import { JwtAuthGuard } from '../iam/jwt-auth.guard';
import { PermissionsGuard } from '../iam/permissions.guard';
import { CurrentUser, CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { TaskPriority } from '@prisma/client';
import { IsString, IsOptional, IsUUID, IsEnum, IsDateString } from 'class-validator';

class CreateTaskDto {
  @IsOptional()
  @IsUUID()
  activityCodeId?: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID()
  clientId?: string;

  @IsOptional()
  @IsUUID()
  policyId?: string;

  @IsOptional()
  @IsUUID()
  claimId?: string;

  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @IsOptional()
  @IsDateString()
  dueAt?: string;
}

@ApiTags('Workflow Engine')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('workflow')
export class WorkflowEngineController {
  constructor(private readonly workflowEngineService: WorkflowEngineService) {}

  @RequirePermission('task:read')
  @Get('activity-codes/:code')
  activityCode(@Param('code') code: string, @CurrentUser() user: CurrentUserPayload) {
    return this.workflowEngineService.findActivityCode(code, user);
  }

  @RequirePermission('task:create')
  @Post('tasks')
  createTask(@Body() dto: CreateTaskDto, @CurrentUser() user: CurrentUserPayload) {
    return this.workflowEngineService.createTask(
      {
        ...dto,
        dueAt: dto.dueAt ? new Date(dto.dueAt) : undefined,
      },
      user,
    );
  }
}

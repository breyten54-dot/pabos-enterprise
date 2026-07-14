import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AiCopilotService } from './ai-copilot.service';
import { JwtAuthGuard } from '../iam/jwt-auth.guard';
import { PermissionsGuard } from '../iam/permissions.guard';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { IntakeDto } from './dto/intake.dto';

@ApiTags('AI Copilot')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('ai')
export class AiCopilotController {
  constructor(private readonly aiCopilotService: AiCopilotService) {}

  @RequirePermission('client:read')
  @Post('intake')
  intake(@Body() dto: IntakeDto) {
    return this.aiCopilotService.intake(dto.message, dto.context);
  }
}

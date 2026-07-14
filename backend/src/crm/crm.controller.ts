import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CrmService } from './crm.service';
import { JwtAuthGuard } from '../iam/jwt-auth.guard';
import { PermissionsGuard } from '../iam/permissions.guard';
import { CurrentUser, CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { CreateClientDto } from './dto/create-client.dto';

@ApiTags('CRM')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('clients')
export class CrmController {
  constructor(private readonly crmService: CrmService) {}

  @RequirePermission('client:create')
  @Post()
  create(@Body() dto: CreateClientDto, @CurrentUser() user: CurrentUserPayload) {
    return this.crmService.create(dto, user);
  }

  @RequirePermission('client:read')
  @Get()
  findAll(@CurrentUser() user: CurrentUserPayload) {
    return this.crmService.findAll(user);
  }

  @RequirePermission('client:read')
  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.crmService.findOne(id, user);
  }
}

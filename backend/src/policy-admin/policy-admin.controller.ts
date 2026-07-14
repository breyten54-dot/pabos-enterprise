import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PolicyAdminService } from './policy-admin.service';
import { JwtAuthGuard } from '../iam/jwt-auth.guard';
import { PermissionsGuard } from '../iam/permissions.guard';
import { CurrentUser, CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { CreatePolicyDto } from './dto/create-policy.dto';
import { AddressChangeDto } from './dto/address-change.dto';

@ApiTags('Policy Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('policies')
export class PolicyAdminController {
  constructor(private readonly policyAdminService: PolicyAdminService) {}

  @RequirePermission('policy:read')
  @Get()
  findAll(@CurrentUser() user: CurrentUserPayload) {
    return this.policyAdminService.findAll(user);
  }

  @RequirePermission('policy:create')
  @Post()
  create(@Body() dto: CreatePolicyDto, @CurrentUser() user: CurrentUserPayload) {
    return this.policyAdminService.create(dto, user);
  }

  @RequirePermission('policy:amend')
  @Post(':id/endorsements/address-change')
  addressChange(
    @Param('id') id: string,
    @Body() dto: AddressChangeDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.policyAdminService.addressChange(id, dto, user);
  }
}

import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PolicyAdminService } from './policy-admin.service';
import { JwtAuthGuard } from '../iam/jwt-auth.guard';
import { PermissionsGuard } from '../iam/permissions.guard';
import { CurrentUser, CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { CreatePolicyDto } from './dto/create-policy.dto';
import { AddressChangeDto } from './dto/address-change.dto';
import { CreateRenewalDto } from './dto/create-renewal.dto';

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

  @RequirePermission('policy:read')
  @Get('renewals')
  listRenewals(
    @CurrentUser() user: CurrentUserPayload,
    @Query('days') days?: string,
  ) {
    const parsed = days ? parseInt(days, 10) : 90;
    return this.policyAdminService.listRenewals(user, Number.isFinite(parsed) ? parsed : 90);
  }

  @RequirePermission('policy:create')
  @Post()
  create(@Body() dto: CreatePolicyDto, @CurrentUser() user: CurrentUserPayload) {
    return this.policyAdminService.create(dto, user);
  }

  @RequirePermission('policy:amend')
  @Post(':id/renewals')
  requestRenewal(
    @Param('id') id: string,
    @Body() dto: CreateRenewalDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.policyAdminService.requestRenewal(id, dto, user);
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

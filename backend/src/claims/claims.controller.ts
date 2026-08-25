import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ClaimsService } from './claims.service';
import { JwtAuthGuard } from '../iam/jwt-auth.guard';
import { PermissionsGuard } from '../iam/permissions.guard';
import { CurrentUser, CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { CreateClaimDto } from './dto/create-claim.dto';

@ApiTags('Claims')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('claims')
export class ClaimsController {
  constructor(private readonly claimsService: ClaimsService) {}

  @RequirePermission('claim:read')
  @Get()
  findAll(@CurrentUser() user: CurrentUserPayload) {
    return this.claimsService.findAll(user);
  }

  @RequirePermission('claim:create')
  @Post()
  create(@Body() dto: CreateClaimDto, @CurrentUser() user: CurrentUserPayload) {
    return this.claimsService.create(dto, user);
  }
}

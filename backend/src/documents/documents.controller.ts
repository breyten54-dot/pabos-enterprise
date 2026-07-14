import {
  Controller,
  Post,
  Get,
  Param,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { DocumentsService } from './documents.service';
import { JwtAuthGuard } from '../iam/jwt-auth.guard';
import { PermissionsGuard } from '../iam/permissions.guard';
import { CurrentUser, CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { RequirePermission } from '../common/decorators/require-permission.decorator';

@ApiTags('Documents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('upload')
  @RequirePermission('client:read')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  upload(
    @UploadedFile() file: Express.Multer.File,
    @Query('clientId') clientId?: string,
    @Query('policyId') policyId?: string,
    @Query('claimId') claimId?: string,
    @CurrentUser() user?: CurrentUserPayload,
  ) {
    return this.documentsService.uploadStub(file, { clientId, policyId, claimId }, user);
  }

  @Get(':storageKey/download')
  @RequirePermission('client:read')
  download(@Param('storageKey') storageKey: string, @CurrentUser() user: CurrentUserPayload) {
    return this.documentsService.downloadStub(storageKey, user);
  }
}

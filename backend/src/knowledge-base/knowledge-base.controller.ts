import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { KnowledgeBaseService } from './knowledge-base.service';
import { JwtAuthGuard } from '../iam/jwt-auth.guard';
import { PermissionsGuard } from '../iam/permissions.guard';
import { CurrentUser, CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { CreateArticleDto } from './dto/create-article.dto';

@ApiTags('Knowledge Base')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('knowledge')
export class KnowledgeBaseController {
  constructor(private readonly knowledgeBaseService: KnowledgeBaseService) {}

  @RequirePermission('knowledge:create')
  @Post('articles')
  create(@Body() dto: CreateArticleDto, @CurrentUser() user: CurrentUserPayload) {
    return this.knowledgeBaseService.create(dto, user);
  }

  @RequirePermission('knowledge:read')
  @Get('articles')
  findAll(@CurrentUser() user: CurrentUserPayload) {
    return this.knowledgeBaseService.findAll(user);
  }

  @RequirePermission('knowledge:read')
  @Get('articles/:id')
  findOne(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.knowledgeBaseService.findOne(id, user);
  }

  @RequirePermission('knowledge:create')
  @Post('articles/:id/embed')
  embed(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.knowledgeBaseService.generateEmbeddingStub(id, user);
  }
}

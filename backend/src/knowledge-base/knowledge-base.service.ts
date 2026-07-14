import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { CreateArticleDto } from './dto/create-article.dto';
import { AuditAction } from '@prisma/client';

@Injectable()
export class KnowledgeBaseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async create(dto: CreateArticleDto, user: CurrentUserPayload) {
    const article = await this.prisma.knowledgeArticle.create({
      data: {
        organisationId: user.organisationId,
        category: dto.category,
        title: dto.title,
        slug: dto.slug,
        content: dto.content,
        tags: dto.tags ?? [],
        lineOfBusiness: dto.lineOfBusiness,
        isPublished: dto.isPublished ?? false,
        publishedAt: dto.isPublished ? new Date() : null,
      },
    });

    await this.auditService.log({
      action: AuditAction.CREATE,
      entityType: 'KnowledgeArticle',
      entityId: article.id,
      user,
      payload: { title: dto.title, slug: dto.slug },
    });

    return article;
  }

  async findAll(user: CurrentUserPayload) {
    return this.prisma.knowledgeArticle.findMany({
      where: { organisationId: user.organisationId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOne(id: string, user: CurrentUserPayload) {
    return this.prisma.knowledgeArticle.findFirst({
      where: { id, organisationId: user.organisationId },
      include: { embeddings: { where: { isStale: false } } },
    });
  }

  async generateEmbeddingStub(articleId: string, user: CurrentUserPayload) {
    const article = await this.prisma.knowledgeArticle.findFirst({
      where: { id: articleId, organisationId: user.organisationId },
    });
    if (!article) return null;

    const embedding = await this.prisma.knowledgeEmbedding.create({
      data: {
        organisationId: user.organisationId,
        articleId,
        chunkIndex: 0,
        chunkText: article.content.slice(0, 1000),
        vector: null,
      },
    });

    await this.auditService.log({
      action: AuditAction.CREATE,
      entityType: 'KnowledgeEmbedding',
      entityId: embedding.id,
      user,
      payload: { articleId },
    });

    return embedding;
  }
}

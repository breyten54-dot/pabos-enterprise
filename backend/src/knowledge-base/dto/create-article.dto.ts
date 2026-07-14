import { IsString, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { KnowledgeCategory, LineOfBusiness } from '@prisma/client';

export class CreateArticleDto {
  @IsEnum(KnowledgeCategory)
  category: KnowledgeCategory;

  @IsString()
  title: string;

  @IsString()
  slug: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsEnum(LineOfBusiness)
  lineOfBusiness?: LineOfBusiness;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}

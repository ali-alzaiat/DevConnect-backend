import { PartialType } from '@nestjs/swagger';
import { createArticleDto } from './create-article.dto';

export class updateArticleDto extends PartialType(createArticleDto) {}

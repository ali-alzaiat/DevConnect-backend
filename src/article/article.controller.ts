import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ArticleService } from './article.service';
import { createArticleDto } from './dto/create-article.dto';
import ArticleResponseDto from './dto/article-response.dto';

@Controller('article')
export class ArticleController {
  constructor(private articleService: ArticleService) {}

  @Get()
  @HttpCode(200)
  async getAllArticles(
    @Query('page') page: number,
    @Query('limit') limit: number,
  ): Promise<ArticleResponseDto[]> {
    return await this.articleService.getAllArticles(page, limit);
  }

  @Get('/:articleId')
  @HttpCode(200)
  getArticleById(@Param('articleId') id: number): Promise<ArticleResponseDto> {
    return this.articleService.getArticleById(id);
  }

  @Post('/create')
  @HttpCode(201)
  createArticle(@Body() body: createArticleDto): Promise<ArticleResponseDto> {
    return this.articleService.createArticle(body);
  }
}

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ArticleService } from './article.service';
import { createArticleDto } from './dto/create-article.dto';
import ArticleResponseDto from './dto/article-response.dto';
import { ApiQuery } from '@nestjs/swagger';
import { updateArticleDto } from './dto/update-article.dto';

@Controller('article')
export class ArticleController {
  constructor(private articleService: ArticleService) {}

  @Get()
  @HttpCode(200)
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getAllArticles(
    @Query('page') page: number,
    @Query('limit') limit: number,
  ): Promise<ArticleResponseDto[]> {
    return await this.articleService.getAllArticles(page, limit);
  }

  @Get(':id')
  @HttpCode(200)
  getArticleById(@Param('id') id: number): Promise<ArticleResponseDto> {
    return this.articleService.getArticleById(id);
  }

  @Post('/create')
  @HttpCode(201)
  createArticle(@Body() body: createArticleDto): Promise<ArticleResponseDto> {
    return this.articleService.createArticle(body);
  }

  @Put(':id')
  @HttpCode(200)
  updateArticle(
    @Param('id') id: number,
    @Body() updateArticleDto: updateArticleDto,
  ) {
    return this.articleService.updateArticle(id, updateArticleDto);
  }

  @Delete(':id')
  @HttpCode(204)
  deleteArticle(@Param('id') id: number) {
    return this.articleService.deleteArticle(id);
  }
}

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Patch,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ArticleService } from './article.service';
import { createArticleDto } from './dto/create-article.dto';
import ArticleResponseDto from './dto/article-response.dto';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { updateArticleDto } from './dto/update-article.dto';
import { CurrentUser } from 'src/auth/decorator/current-user.decorator';
import { UserEntity } from 'src/user/entities/user.entity';
import { PaginatedResponseDto } from 'src/common/dto/pagination.dto';

@ApiTags('Articles')
@Controller('article')
export class ArticleController {
  constructor(private articleService: ArticleService) {}

  @Get()
  @HttpCode(200)
  @ApiOperation({ summary: 'Get all articles with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({ status: 200, type: PaginatedResponseDto })
  async getAllArticles(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ): Promise<PaginatedResponseDto<ArticleResponseDto>> {
    return await this.articleService.getAllArticles(page, limit);
  }

  @Get(':id')
  @HttpCode(200)
  @ApiOperation({ summary: 'Get an article by ID' })
  @ApiResponse({ status: 200, type: ArticleResponseDto })
  @ApiResponse({ status: 404, description: 'Article not found' })
  getArticleById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ArticleResponseDto> {
    return this.articleService.getArticleById(id);
  }

  @Post()
  @HttpCode(201)
  @ApiOperation({ summary: 'Create a new article' })
  @ApiResponse({ status: 201, type: ArticleResponseDto })
  createArticle(
    @Body() body: createArticleDto,
    @CurrentUser() user: UserEntity,
  ): Promise<ArticleResponseDto> {
    return this.articleService.createArticle(body, user);
  }

  @Patch(':id')
  @HttpCode(200)
  @ApiOperation({ summary: 'Update an article' })
  @ApiResponse({ status: 200, type: ArticleResponseDto })
  updateArticle(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateArticleDto: updateArticleDto,
    @CurrentUser() user: UserEntity,
  ) {
    return this.articleService.updateArticle(id, updateArticleDto, user.userId);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete an article' })
  @ApiResponse({ status: 204, description: 'Article deleted' })
  deleteArticle(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: UserEntity,
  ) {
    return this.articleService.deleteArticle(id, user.userId);
  }
}

import {
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  LoggerService,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import ArticleResponseDto from './dto/article-response.dto';
import { mapArticleToDTO } from './article.util';
import { createArticleDto } from './dto/create-article.dto';
import { Prisma } from '@prisma/client';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { updateArticleDto } from './dto/update-article.dto';
import { UserEntity } from 'src/user/entities/user.entity';
import { PaginatedResponseDto } from 'src/common/dto/pagination.dto';

@Injectable()
export class ArticleService {
  private readonly logger: LoggerService = new Logger(ArticleService.name);
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  private async getArticleVersion(): Promise<number> {
    const v = await this.cacheManager.get('article_version');
    return (v as number) || 1;
  }

  private async getCacheKey(page: number, limit: number, q?: string) {
    const version = await this.getArticleVersion();
    return `articles_v_${version}_page_${page}_limit_${limit}_q_${q ?? ''}`;
  }

  private async incrementArticleVersion() {
    const version = await this.getArticleVersion();
    await this.cacheManager.set('article_version', version + 1, 0);
  }

  async invalidateArticlesCache() {
    await this.incrementArticleVersion();
  }

  async getAllArticles(
    page: number = 1,
    limit: number = 10,
    q?: string,
  ): Promise<PaginatedResponseDto<ArticleResponseDto>> {
    const cacheKey = await this.getCacheKey(page, limit, q);
    const cachedData: PaginatedResponseDto<ArticleResponseDto> | undefined =
      await this.cacheManager.get(cacheKey);

    if (cachedData) {
      this.logger.log(
        `Returning cached articles for page ${page} with limit ${limit}`,
      );
      return cachedData;
    }

    const where: Prisma.ArticleWhereInput = q
      ? {
          OR: [
            { title: { contains: q } },
            { description: { contains: q } },
            { content: { contains: q } },
          ],
        }
      : {};

    const [articles, total] = await Promise.all([
      this.prisma.article.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: Prisma.SortOrder.desc },
        where,
        include: {
          author: {
            select: { id: true, name: true },
          },
        },
      }),
      this.prisma.article.count({ where }),
    ]);

    const data = articles.map(mapArticleToDTO);
    const totalPages = Math.ceil(total / limit);

    const res: PaginatedResponseDto<ArticleResponseDto> = {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages,
      },
    };

    await this.cacheManager.set(cacheKey, res);

    this.logger.log(`Fetched ${articles.length} articles (Total: ${total})`);

    return res;
  }

  async getArticleById(id: number): Promise<ArticleResponseDto> {
    const article = await this.prisma.article.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, name: true },
        },
      },
    });

    if (!article) {
      this.logger.warn(`Article with ID ${id} not found`);
      throw new NotFoundException(`Article with ID ${id} not found`);
    }

    this.logger.log(`Fetched article with ID ${id}`);

    return mapArticleToDTO(article);
  }

  async createArticle(
    article: createArticleDto,
    user: UserEntity,
  ): Promise<ArticleResponseDto> {
    this.logger.log(`Creating article titled "${article.title}"`);

    const newArticle = await this.prisma.article.create({
      data: {
        title: article.title,
        description: article.description,
        content: article.content,
        author: { connect: { id: user.userId } },
      },
      include: {
        author: {
          select: { id: true, name: true },
        },
      },
    });

    this.logger.log(
      `Created article titled "${article.title}" with ID ${newArticle.id}`,
    );

    await this.invalidateArticlesCache();

    return mapArticleToDTO(newArticle);
  }

  async updateArticle(
    articleId: number,
    updateArticleDto: updateArticleDto,
    userId: number,
  ): Promise<ArticleResponseDto> {
    const article = await this.prisma.article.findUnique({
      where: { id: articleId },
    });

    if (!article) {
      throw new NotFoundException(`Article with ID ${articleId} not found`);
    }

    if (article.authorId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to update this article',
      );
    }

    const updatedArticle = await this.prisma.article.update({
      where: { id: articleId },
      data: updateArticleDto,
      include: { author: { select: { id: true, name: true } } },
    });
    this.logger.log(`Updated article with ID ${articleId}`);
    await this.invalidateArticlesCache();
    return mapArticleToDTO(updatedArticle);
  }

  async deleteArticle(id: number, userId: number): Promise<void> {
    const article = await this.prisma.article.findUnique({
      where: { id },
    });

    if (!article) {
      throw new NotFoundException(`Article with ID ${id} not found`);
    }

    if (article.authorId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to delete this article',
      );
    }

    await this.prisma.article.delete({
      where: { id },
    });
    this.logger.log(`Deleted article with ID ${id}`);
    await this.invalidateArticlesCache();
  }
}

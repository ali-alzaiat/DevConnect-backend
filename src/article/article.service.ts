import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  LoggerService,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import ArticleResponseDto from './dto/article-response.dto';
import { mapArticleToDTO } from './article.util';
import { createArticleDto } from './dto/create-article.dto';
import { Article, Prisma, User } from '@prisma/client';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { updateArticleDto } from './dto/update-article.dto';
import { UserEntity } from 'src/user/entities/user.entity';

type ArticleWithAuthor = Article & { author: Pick<User, 'id' | 'name'> | null };

@Injectable()
export class ArticleService {
  private readonly logger: LoggerService = new Logger(ArticleService.name);
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  private async getArticalVersion(): Promise<number> {
    const v = await this.cacheManager.get('article_version');
    return (v as number) || 1;
  }

  private async getCacheKey(page: number, limit: number) {
    const version = await this.getArticalVersion();
    return `articles_v_${version}_page_${page}_limit_${limit}`;
  }

  private async incrementArticleVersion() {
    const version = await this.getArticalVersion();
    this.cacheManager.set('article_version', version + 1, 0);
  }

  async invalidateArticlesCache() {
    this.incrementArticleVersion();
  }

  async getAllArticles(
    page: number = 1,
    limit: number = 10,
  ): Promise<ArticleResponseDto[]> {
    const cacheKey = await this.getCacheKey(page, limit);
    const cachedArticles: ArticleResponseDto[] | undefined =
      await this.cacheManager.get(cacheKey);
    if (cachedArticles) {
      this.logger.log(
        `Returning cached articles for page ${page} with limit ${limit}`,
      );
      return cachedArticles;
    }

    let articles: Article[];

    try {
      articles = await this.prisma.article.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: Prisma.SortOrder.desc },
        include: {
          author: {
            select: { id: true, name: true },
          },
        },
      });
    } catch (error) {
      this.logger.error('Failed to get projects from database', error.stack);
      throw new InternalServerErrorException(
        'Could not get projects due to database error',
      );
    }

    await this.cacheManager.set(cacheKey, articles);

    this.logger.log(`Fetched ${articles.length} articles`);

    return articles.map(mapArticleToDTO);
  }

  async getArticleById(id: number): Promise<ArticleResponseDto> {
    let article: ArticleWithAuthor | null;
    try {
      article = await this.prisma.article.findUnique({
        where: { id },
        include: {
          author: {
            select: { id: true, name: true },
          },
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        this.logger.warn(`Article with ID ${id} not found for update`);
        throw new NotFoundException('Article not found');
      }
      this.logger.error(
        `Failed to get article with id ${id} from database`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Could not get article due to database error',
      );
    }

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

    let newArticle: ArticleWithAuthor;

    try {
      newArticle = await this.prisma.article.create({
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
    } catch (error) {
      this.logger.error(
        'Failed to create an article because of a database error',
        error.stack,
      );
      throw new InternalServerErrorException('Failed to create an article');
    }

    this.logger.log(
      `Created article titled "${article.title}" with ID ${newArticle.id}`,
    );

    await this.invalidateArticlesCache();

    return mapArticleToDTO(newArticle);
  }

  async updateArticle(
    articleId: number,
    updateArticleDto: updateArticleDto,
  ): Promise<ArticleResponseDto> {
    let article: ArticleWithAuthor;
    this.logger.log(
      `Updating article with ID ${articleId} to ${JSON.stringify(updateArticleDto)}`,
    );
    try {
      article = await this.prisma.article.update({
        where: { id: articleId },
        data: updateArticleDto,
        include: { author: { select: { id: true, name: true } } },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        this.logger.warn(`Article with ID ${articleId} not found for update`);
        throw new NotFoundException('Article not found');
      }
      throw error;
    }
    this.logger.log(`Updated article with ID ${articleId}`);
    await this.invalidateArticlesCache();
    return mapArticleToDTO(article);
  }

  async deleteArticle(id: number): Promise<void> {
    try {
      await this.prisma.article.delete({
        where: { id },
      });
      this.logger.log(`Deleted article with ID ${id}`);
      await this.invalidateArticlesCache();
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        this.logger.warn(`Article with ID ${id} not found for deletion`);
        throw new NotFoundException('Article not found');
      }
      throw error;
    }
  }
}

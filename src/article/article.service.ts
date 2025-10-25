import {
  Inject,
  Injectable,
  LoggerService,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import ArticleResponseDto from './dto/article-response.dto';
import {
  formatArticleResponse,
  invalidateArticleRedisCache,
} from './article.util';
import { createArticleDto } from './dto/create-article.dto';
import { Prisma } from '@prisma/client';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Keyv } from 'keyv';

@Injectable()
export class ArticleService {
  constructor(
    private prisma: PrismaService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    (this.logger as any).setContext(ArticleService.name);
  }

  async getAllArticles(
    page: number,
    limit: number,
  ): Promise<ArticleResponseDto[]> {
    const cacheKey = this.cacheKey(page, limit);
    const cachedArticles: ArticleResponseDto[] | undefined =
      await this.cacheManager.get(cacheKey);
    if (cachedArticles) {
      this.logger.log(
        `Returning cached articles for page ${page} with limit ${limit}`,
      );
      return cachedArticles;
    }
    const options = {
      orderBy: { createdAt: Prisma.SortOrder.desc },
      include: {
        author: true,
      },
    };

    if (page && limit) {
      Object.assign(options, {
        skip: (page - 1) * limit,
        take: limit,
      });
    }

    const articles = await this.prisma.article.findMany(options);

    await this.cacheManager.set(cacheKey, articles);

    this.logger.log(`Fetched ${articles.length} articles`);

    return articles.map((a) => ({
      ...formatArticleResponse(a),
      authorName: a.author.name,
    }));
  }

  async getArticleById(id: number): Promise<ArticleResponseDto> {
    const article = await this.prisma.article.findUnique({
      where: { id },
      include: {
        author: true,
      },
    });

    if (!article) {
      this.logger.warn(`Article with ID ${id} not found`);
      throw new NotFoundException(`Article with ID ${id} not found`);
    }

    this.logger.log(`Fetched article with ID ${id}`);

    return {
      ...formatArticleResponse(article),
      authorName: article.author.name,
    };
  }

  async createArticle(article: createArticleDto): Promise<ArticleResponseDto> {
    this.logger.log(`Creating article titled "${article.title}"`);

    const newArticle = await this.prisma.article.create({
      data: {
        title: article.title,
        description: article.description,
        content: article.content,
        authorId: article.authorId,
      },
      include: {
        author: true,
      },
    });

    this.logger.log(
      `Created article titled "${article.title}" with ID ${newArticle.id}`,
    );

    await this.invalidateArticlesCache();

    return {
      ...formatArticleResponse(newArticle),
      authorName: newArticle.author.name,
    };
  }

  private cacheKey(page: number, limit: number) {
    return `articles_page_${page}_limit_${limit}`;
  }

  async invalidateArticlesCache() {
    invalidateArticleRedisCache();

    // Clear in-memory cache as well
    const memoryStore = this.cacheManager.stores[0] as Keyv;
    await memoryStore.clear();
  }
}

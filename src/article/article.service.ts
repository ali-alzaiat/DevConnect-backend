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
import { PermissionLevel, Prisma } from '@prisma/client';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { updateArticleDto } from './dto/update-article.dto';
import { UserEntity } from 'src/user/entities/user.entity';
import { PaginatedResponseDto } from 'src/common/dto/pagination.dto';
import { ItemPermission } from 'src/types/item-permission';

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

  private async getCacheKey(
    page: number,
    limit: number,
    q: string | undefined,
    userId?: number,
  ) {
    const version = await this.getArticleVersion();
    return `articles_v_${version}_u${userId ?? 0}_page_${page}_limit_${limit}_q_${q ?? ''}`;
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
    userId?: number,
  ): Promise<PaginatedResponseDto<ArticleResponseDto>> {
    const cacheKey = await this.getCacheKey(page, limit, q, userId);
    const cachedData: PaginatedResponseDto<ArticleResponseDto> | undefined =
      await this.cacheManager.get(cacheKey);

    if (cachedData) {
      this.logger.log(
        `Returning cached articles for page ${page} with limit ${limit}`,
      );
      return cachedData;
    }

    const where: Prisma.ArticleWhereInput = {
      // Users only see articles they wrote or that are shared with them;
      // admins see everything
      ...(userId && (await this.isAdmin(userId))
        ? {}
        : {
            OR: [{ authorId: userId }, { permissions: { some: { userId } } }],
          }),
      ...(q
        ? {
            AND: [
              {
                OR: [
                  { title: { contains: q } },
                  { description: { contains: q } },
                  { content: { contains: q } },
                ],
              },
            ],
          }
        : {}),
    };

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

  private async isAdmin(userId?: number): Promise<boolean> {
    if (!userId) return false;
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    return user?.role === 'ADMIN';
  }

  /** Throws unless the user wrote the article, has EDIT access, or is an admin */
  private async assertCanModify(id: number, userId: number) {
    if (await this.isAdmin(userId)) return;
    const article = await this.prisma.article.findFirst({
      where: {
        id,
        OR: [
          { authorId: userId },
          { permissions: { some: { userId, level: PermissionLevel.EDIT } } },
        ],
      },
      select: { id: true },
    });
    if (!article) {
      throw new ForbiddenException(
        'You do not have permission to modify this article',
      );
    }
  }

  async getArticleById(
    id: number,
    userId?: number,
  ): Promise<ArticleResponseDto> {
    const admin = await this.isAdmin(userId);
    const article = await this.prisma.article.findFirst({
      where: {
        id,
        // Users can only view articles they wrote or that are shared with
        // them; admins can view anything
        ...(admin
          ? {}
          : {
              OR: [{ authorId: userId }, { permissions: { some: { userId } } }],
            }),
      },
      include: {
        author: {
          select: { id: true, name: true },
        },
        permissions: { where: { userId: userId ?? -1 } },
      },
    });

    if (!article) {
      this.logger.warn(`Article with ID ${id} not found`);
      throw new NotFoundException(`Article with ID ${id} not found`);
    }

    this.logger.log(`Fetched article with ID ${id}`);

    const permission: ItemPermission = admin
      ? 'ADMIN'
      : article.authorId === userId
        ? 'OWNER'
        : ((article.permissions[0]?.level as ItemPermission) ?? 'VIEW');
    return { ...mapArticleToDTO(article), permission };
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

    await this.assertCanModify(articleId, userId);

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

    await this.assertCanModify(id, userId);

    await this.prisma.article.delete({
      where: { id },
    });
    this.logger.log(`Deleted article with ID ${id}`);
    await this.invalidateArticlesCache();
  }
}

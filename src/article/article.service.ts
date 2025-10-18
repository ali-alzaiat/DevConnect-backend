import {
  Inject,
  Injectable,
  LoggerService,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import ArticleResponseDto from './dto/article-response.dto';
import { formatArticleResponse } from './article.util';
import { createArticleDto } from './dto/create-article.dto';
import { Prisma } from '@prisma/client';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

@Injectable()
export class ArticleService {
  constructor(
    private prisma: PrismaService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {
    (this.logger as any).setContext(ArticleService.name);
  }

  async getAllArticles(
    page: number,
    limit: number,
  ): Promise<ArticleResponseDto[]> {
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
    this.logger.log(`Fetched ${articles.length} articles`);

    // Map DB entities to DTOs (optional, for shaping the data)
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
      throw new NotFoundException(`Article with ID ${id} not found`);
    }
    return {
      ...formatArticleResponse(article),
      authorName: article.author.name,
    };
  }

  async createArticle(article: createArticleDto): Promise<ArticleResponseDto> {
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
    return {
      ...formatArticleResponse(newArticle),
      authorName: newArticle.author.name,
    };
  }
}

import { Article } from '@prisma/client';
import ArticleResponseDto from './dto/article-response.dto';

export type ArticleWithAuthor = Article & {
  author: { name: string; id: number } | null;
};

export function mapArticleToDTO(
  article: ArticleWithAuthor,
): ArticleResponseDto {
  return {
    id: article.id,
    title: article.title,
    description: article.description ?? undefined,
    content: article.content,
    author: article.author
      ? { name: article.author.name, id: article.author.id }
      : { name: 'Unknown', id: 0 },
    createdAt: article.createdAt,
    updatedAt: article.updatedAt,
  };
}

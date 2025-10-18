import { Article } from '@prisma/client';

export function formatArticleResponse(article: Article) {
  return {
    id: article.id,
    title: article.title,
    description: article.description ?? undefined,
    content: article.content,
    createdAt: article.createdAt,
    authorId: article.authorId,
    updatedAt: article.updatedAt,
  };
}

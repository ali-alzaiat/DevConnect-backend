import { Article } from '@prisma/client';
import Redis from 'ioredis';

const redis = new Redis({
  db: 0,
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
});

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

export async function invalidateArticleRedisCache() {
  const keys = await findKeys('articles_*');
  if (keys.length > 0) await redis.del(...keys);
}

async function findKeys(pattern: string): Promise<string[]> {
  const keys: string[] = [];
  let cursor = '0';
  do {
    const [newCursor, foundKeys] = await redis.scan(
      cursor,
      'MATCH',
      pattern,
      'COUNT',
      '100',
    );
    cursor = newCursor;
    keys.push(...foundKeys);
  } while (cursor !== '0');
  return keys;
}

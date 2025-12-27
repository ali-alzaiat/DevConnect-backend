import { findRedisKeys, redis } from "src/common/redis/redis.utils";

export function mapArticleToDTO(article: any) {
  const { authorId, ...rest } = article;
  return {
    ...rest,
    description: rest.description ?? undefined,
  }
}

export async function invalidateArticleRedisCache() {
  const keys = await findRedisKeys('articles_*');
  if (keys.length > 0) await redis.del(...keys);
}
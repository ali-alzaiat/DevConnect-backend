import Redis from "ioredis";

export const redis = new Redis({
  db: 0,
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
});

export async function findRedisKeys(pattern: string): Promise<string[]> {
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
/**
 * キャッシュ抽象層
 * - 本番 (Vercel): @upstash/redis を使用
 *   環境変数: UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN
 *   (Vercel Marketplace から Upstash Redis を追加すると自動設定される)
 * - ローカル開発: 環境変数未設定の場合はメモリキャッシュ
 */

const memCache = new Map<string, { data: unknown; expires: number }>();

async function getRedis() {
  if (!process.env.UPSTASH_REDIS_REST_URL) return null;
  const { Redis } = await import('@upstash/redis');
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN ?? '',
  });
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  const redis = await getRedis();
  if (redis) {
    return (await redis.get<T>(key)) ?? null;
  }
  const entry = memCache.get(key);
  if (entry && entry.expires > Date.now()) {
    return entry.data as T;
  }
  return null;
}

export async function cacheSet(
  key: string,
  value: unknown,
  ttlSeconds = 86_400,
): Promise<void> {
  const redis = await getRedis();
  if (redis) {
    await redis.set(key, value, { ex: ttlSeconds });
    return;
  }
  memCache.set(key, { data: value, expires: Date.now() + ttlSeconds * 1000 });
}

export async function cacheDel(key: string): Promise<void> {
  const redis = await getRedis();
  if (redis) {
    await redis.del(key);
    return;
  }
  memCache.delete(key);
}

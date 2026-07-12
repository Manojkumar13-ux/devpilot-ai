import IORedis from 'ioredis';
import { redisConnection } from '../queue/redis.js';

const DEFAULT_TTL = 60; // seconds

let client: IORedis | null = null;

function getClient(): IORedis {
  if (!client) {
    client = new IORedis({
      host: redisConnection.host,
      port: redisConnection.port,
      password: redisConnection.password,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      enableOfflineQueue: false,
      retryStrategy: (times: number) => {
        if (times > 3) return null;
        return Math.min(times * 200, 2000);
      },
    });

    client.on('error', () => {
      // silently handle — cache degrades gracefully
    });
  }
  return client;
}

async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const c = getClient();
    const val = await c.get(key);
    return val ? JSON.parse(val) : null;
  } catch {
    return null;
  }
}

async function cacheSet(key: string, value: unknown, ttl = DEFAULT_TTL): Promise<void> {
  try {
    const c = getClient();
    const str = JSON.stringify(value);
    if (ttl > 0) {
      await c.setex(key, ttl, str);
    } else {
      await c.set(key, str);
    }
  } catch {
    // silently fail
  }
}

export async function cacheWrap<T>(
  key: string,
  fetch: () => Promise<T>,
  ttl = DEFAULT_TTL,
): Promise<T> {
  const cached = await cacheGet<T>(key);
  if (cached !== null) return cached;

  const value = await fetch();
  await cacheSet(key, value, ttl);
  return value;
}

async function cacheDel(key: string): Promise<void> {
  try {
    const c = getClient();
    await c.del(key);
  } catch {
    // silently fail
  }
}

async function cacheInvalidate(pattern: string): Promise<void> {
  try {
    const c = getClient();
    const keys = await c.keys(pattern);
    if (keys.length > 0) await c.del(...keys);
  } catch {
    // silently fail
  }
}

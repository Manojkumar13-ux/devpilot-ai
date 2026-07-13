import type { RedisOptions } from 'ioredis';

function parseRedisUrl(url: string): RedisOptions {
  try {
    const u = new URL(url);
    return {
      host: u.hostname || 'localhost',
      port: parseInt(u.port || '6379'),
      password: u.password || undefined,
      ...(u.protocol === 'rediss:' ? { tls: {} } : {}),
    };
  } catch {
    return {};
  }
}

function envConfig(): RedisOptions {
  if (process.env.REDIS_URL) {
    const parsed = parseRedisUrl(process.env.REDIS_URL);
    if (parsed.host) return parsed;
  }
  return {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || undefined,
  };
}

export const redisConnection: RedisOptions = {
  ...envConfig(),
  maxRetriesPerRequest: null,
};

export const redisHealthConfig: RedisOptions = {
  ...envConfig(),
  maxRetriesPerRequest: 1,
  retryStrategy: () => null,
};

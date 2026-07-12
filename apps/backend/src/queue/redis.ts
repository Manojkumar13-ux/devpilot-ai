import type { RedisOptions } from 'ioredis';

function envConfig(): RedisOptions {
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

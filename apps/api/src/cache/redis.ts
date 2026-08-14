import Redis from 'ioredis';

export const redis = new Redis({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
});

export const CACHE_KEYS = {
  runwaySnapshot: (accountId: string) => `runway:snapshot:${accountId}`
};

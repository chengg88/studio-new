// src/lib/redis.ts
import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  console.warn('REDIS_URL environment variable is not set. Redis client will not be initialized.');
}

// 使用 db: 0 來明確指定使用 db0
const redis = redisUrl ? new Redis(redisUrl, { db: 0 }) : null;

console.log('Redis connection status:', redis?.status);

redis?.on('error', (err) => {
  console.error('Redis client error:', err);
});

export default redis;

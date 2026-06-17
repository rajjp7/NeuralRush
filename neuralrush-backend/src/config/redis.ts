import Redis from 'ioredis';
import { env } from './env.js';

let redis: Redis | null = null;

if (env.REDIS_URL) {
  try {
    redis = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 3) return null;
        return Math.min(times * 200, 2000);
      },
      lazyConnect: true,
    });

    redis.on('error', (err) => {
      console.warn('⚠️  Redis connection error (falling back to DB):', err.message);
    });

    redis.on('connect', () => {
      console.log('✅ Redis connected');
    });

    // Attempt connection
    redis.connect().catch(() => {
      console.warn('⚠️  Redis unavailable — using DB fallback');
      redis = null;
    });
  } catch {
    console.warn('⚠️  Redis initialization failed — using DB fallback');
    redis = null;
  }
} else {
  console.log('ℹ️  No REDIS_URL provided — leaderboard will use DB queries');
}

export { redis };

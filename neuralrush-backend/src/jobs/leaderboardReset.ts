import cron from 'node-cron';
import { redis } from '../config/redis.js';

/**
 * Weekly Leaderboard Reset Cron Job
 * Runs every Sunday at 00:01 AM.
 *
 * Deletes the Redis leaderboard key so it rebuilds fresh.
 * Does NOT reset any DB data — historical XP is preserved.
 */
export function registerLeaderboardResetJob(): void {
  cron.schedule('1 0 * * 0', async () => {
    console.log('🔄 Running weekly leaderboard reset...');

    try {
      if (redis) {
        await redis.del('leaderboard:weekly');
        console.log('✅ Weekly leaderboard reset in Redis');
      } else {
        console.log('ℹ️  No Redis — leaderboard reset skipped (DB-based leaderboard resets automatically)');
      }
    } catch (err) {
      console.error('❌ Leaderboard reset job failed:', err);
    }
  });

  console.log('📅 Leaderboard reset job scheduled (Sunday at 00:01)');
}

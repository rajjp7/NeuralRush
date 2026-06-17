import cron from 'node-cron';
import { prisma } from '../config/db.js';

/**
 * Streak Reset Cron Job
 * Runs every day at 00:05 AM.
 *
 * For every user whose lastTrainedAt is NOT today and NOT yesterday
 * and currentStreak > 0:
 *   - If they have streakShields, consume one and preserve streak
 *   - If no shields, reset currentStreak to 0
 */
export function registerStreakResetJob(): void {
  cron.schedule('5 0 * * *', async () => {
    console.log('🔄 Running streak reset job...');

    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      // Find users with active streaks who haven't trained today or yesterday
      const usersAtRisk = await prisma.user.findMany({
        where: {
          currentStreak: { gt: 0 },
          OR: [
            { lastTrainedAt: null },
            { lastTrainedAt: { lt: yesterday } },
          ],
        },
        select: {
          id: true,
          currentStreak: true,
          streakShields: true,
        },
      });

      let resetCount = 0;
      let shieldUsedCount = 0;

      for (const user of usersAtRisk) {
        if (user.streakShields > 0) {
          // Consume shield, keep streak
          await prisma.user.update({
            where: { id: user.id },
            data: {
              streakShields: { decrement: 1 },
            },
          });
          shieldUsedCount++;
        } else {
          // Reset streak
          await prisma.user.update({
            where: { id: user.id },
            data: {
              currentStreak: 0,
            },
          });
          resetCount++;
        }
      }

      console.log(`✅ Streak reset complete: ${resetCount} streaks reset, ${shieldUsedCount} shields consumed`);
    } catch (err) {
      console.error('❌ Streak reset job failed:', err);
    }
  });

  console.log('📅 Streak reset job scheduled (daily at 00:05)');
}

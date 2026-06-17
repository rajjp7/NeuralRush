import cron from 'node-cron';
import { prisma } from '../config/db.js';

/**
 * Daily Challenge Generation Cron Job
 * Runs every day at 23:30 PM to generate tomorrow's challenge.
 *
 * Picks a random module, picks 5 exercises from that module at
 * medium difficulty (4-6), creates the DailyChallenge row.
 * If a DailyChallenge already exists for tomorrow, skip.
 */

const MODULES = ['MEMORY', 'FOCUS', 'LOGIC', 'SPEED', 'CREATIVITY', 'LANGUAGE'] as const;

export function registerDailyChallengeGenJob(): void {
  cron.schedule('30 23 * * *', async () => {
    console.log('🔄 Generating tomorrow\'s daily challenge...');

    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      // Check if already exists
      const existing = await prisma.dailyChallenge.findUnique({
        where: { date: tomorrow },
      });

      if (existing) {
        console.log('ℹ️  Daily challenge already exists for tomorrow — skipping');
        return;
      }

      // Pick random module
      const module = MODULES[Math.floor(Math.random() * MODULES.length)];

      // Find 5 exercises at medium difficulty (4-6) for this module
      const exercises = await prisma.exercise.findMany({
        where: {
          module,
          difficulty: { gte: 4, lte: 6 },
          isActive: true,
        },
        take: 10, // fetch more than needed for randomness
      });

      if (exercises.length < 5) {
        // Fallback: get any exercises for this module
        const fallbackExercises = await prisma.exercise.findMany({
          where: {
            module,
            isActive: true,
          },
          take: 10,
        });

        if (fallbackExercises.length === 0) {
          console.warn('⚠️  No exercises found for module', module, '— skipping challenge generation');
          return;
        }

        exercises.push(...fallbackExercises);
      }

      // Shuffle and take 5
      const shuffled = exercises.sort(() => Math.random() - 0.5).slice(0, 5);

      // Remove duplicates
      const uniqueExercises = [...new Map(shuffled.map(e => [e.id, e])).values()];
      const selectedExercises = uniqueExercises.slice(0, 5);

      // Create daily challenge with exercises
      await prisma.dailyChallenge.create({
        data: {
          date: tomorrow,
          module,
          tier: 'NORMAL',
          exercises: {
            create: selectedExercises.map((ex, index) => ({
              exerciseId: ex.id,
              order: index + 1,
            })),
          },
        },
      });

      console.log(`✅ Daily challenge generated for ${tomorrow.toISOString().split('T')[0]} — module: ${module}, exercises: ${selectedExercises.length}`);
    } catch (err) {
      console.error('❌ Daily challenge generation failed:', err);
    }
  });

  console.log('📅 Daily challenge generation job scheduled (daily at 23:30)');
}

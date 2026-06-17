import { prisma } from '../../config/db.js';
import { AppError } from '../../middleware/errorHandler.js';
import { scoreCreativityExercise } from '../../lib/aiScoring.js';
import { calculateXP, calculateNP, calculateStreakUpdate, getLevelFromXP } from '../../lib/xp.js';
import { calculateNewDifficulty } from '../../lib/difficulty.js';
import type { CompleteDailyInput } from './schema.js';

// ─── Helpers ─────────────────────────────────────────────────────────

function startOfToday(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}

const CREATIVITY_TYPES = new Set([
  'ALTERNATIVE_USES',
  'WORD_CHAIN',
  'STORY_SEED',
]);

// ─── Get Today's Challenge ──────────────────────────────────────────

export async function getTodayChallenge(userId: string) {
  const today = startOfToday();

  const challenge = await prisma.dailyChallenge.findUnique({
    where: { date: today },
    include: {
      exercises: {
        orderBy: { order: 'asc' },
        include: {
          exercise: true,
        },
      },
    },
  });

  if (!challenge) {
    return null;
  }

  const completion = await prisma.dailyChallengeCompletion.findUnique({
    where: {
      userId_challengeId: {
        userId,
        challengeId: challenge.id,
      },
    },
  });

  return {
    challenge: {
      id: challenge.id,
      date: challenge.date,
      module: challenge.module,
      tier: challenge.tier,
    },
    exercises: challenge.exercises.map((ce) => ({
      order: ce.order,
      exercise: {
        id: ce.exercise.id,
        module: ce.exercise.module,
        type: ce.exercise.type,
        difficulty: ce.exercise.difficulty,
        content: ce.exercise.content,
        explanation: ce.exercise.explanation,
      },
    })),
    completed: !!completion,
    ...(completion && {
      completion: {
        id: completion.id,
        score: completion.score,
        xpEarned: completion.xpEarned,
        npEarned: completion.npEarned,
        completedAt: completion.completedAt,
      },
    }),
  };
}

// ─── Complete Daily Challenge ───────────────────────────────────────

export async function completeDaily(userId: string, data: CompleteDailyInput) {
  const today = startOfToday();

  // 1. Find today's challenge
  const challenge = await prisma.dailyChallenge.findUnique({
    where: { date: today },
    include: {
      exercises: {
        orderBy: { order: 'asc' },
        include: { exercise: true },
      },
    },
  });

  if (!challenge) {
    throw new AppError('No daily challenge found for today', 404, 'NOT_FOUND');
  }

  // 2. Check for duplicate completion
  const existing = await prisma.dailyChallengeCompletion.findUnique({
    where: {
      userId_challengeId: {
        userId,
        challengeId: challenge.id,
      },
    },
  });

  if (existing) {
    throw new AppError('You have already completed today\'s challenge', 409, 'DUPLICATE');
  }

  // 3. Grade exercises (same as training sessions)
  const exerciseMap = new Map(
    challenge.exercises.map((ce) => [ce.exerciseId, ce.exercise])
  );

  const gradedExercises: Array<{
    exerciseId: string;
    userAnswer: unknown;
    isCorrect: boolean;
    timeTakenMs: number;
    creativityScore: number | null;
  }> = [];

  for (const sub of data.exercises) {
    const exercise = exerciseMap.get(sub.exerciseId);
    if (!exercise) continue;

    let isCorrect = false;
    let creativityScore: number | null = null;

    if (CREATIVITY_TYPES.has(exercise.type)) {
      const aiResult = await scoreCreativityExercise(
        exercise.type,
        typeof exercise.content === 'object' && exercise.content !== null
          ? JSON.stringify(exercise.content)
          : String(exercise.content),
        typeof sub.userAnswer === 'string'
          ? sub.userAnswer
          : JSON.stringify(sub.userAnswer)
      );
      creativityScore = aiResult.score;
      isCorrect = aiResult.score >= 50;
    } else {
      isCorrect =
        JSON.stringify(sub.userAnswer) === JSON.stringify(exercise.correctAnswer);
    }

    gradedExercises.push({
      exerciseId: sub.exerciseId,
      userAnswer: sub.userAnswer,
      isCorrect,
      timeTakenMs: sub.timeTakenMs,
      creativityScore,
    });
  }

  const totalExercises = gradedExercises.length;
  const correctCount = gradedExercises.filter((e) => e.isCorrect).length;
  const accuracy = totalExercises > 0 ? correctCount / totalExercises : 0;
  const score = Math.round(accuracy * 100);

  // 4. Fetch user for gamification state
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      xp: true,
      totalXpEarned: true,
      neuralPoints: true,
      currentStreak: true,
      longestStreak: true,
      lastTrainedAt: true,
      streakShields: true,
      totalSessions: true,
    },
  });

  // 5. Calculate XP and NP
  const xpEarned = calculateXP({
    score,
    streak: user.currentStreak,
    isDailyChallenge: true,
  });
  const npEarned = calculateNP(true);

  // 6. Calculate streak update
  const streakUpdate = calculateStreakUpdate({
    currentStreak: user.currentStreak,
    longestStreak: user.longestStreak,
    lastTrainedAt: user.lastTrainedAt,
    streakShields: user.streakShields,
  });

  // Difficulty tracking — use current challenge difficulty as baseline
  const currentDifficulty = challenge.exercises[0]?.exercise.difficulty ?? 5;
  const newDifficulty = calculateNewDifficulty(currentDifficulty, score);

  const newTotalXP = user.totalXpEarned + xpEarned;
  const newLevel = getLevelFromXP(newTotalXP);

  // 7. Prisma transaction
  const result = await prisma.$transaction(async (tx) => {
    // Create DailyChallengeCompletion
    const completion = await tx.dailyChallengeCompletion.create({
      data: {
        userId,
        challengeId: challenge.id,
        score,
        xpEarned,
        npEarned,
      },
    });

    // Create TrainingSession (isDailyChallenge = true)
    const session = await tx.trainingSession.create({
      data: {
        userId,
        module: challenge.module,
        difficulty: currentDifficulty,
        score,
        accuracy: Math.round(accuracy * 10000) / 10000,
        durationMs: data.durationMs,
        xpEarned,
        npEarned,
        isDailyChallenge: true,
        difficultyBefore: currentDifficulty,
        difficultyAfter: newDifficulty,
        exercises: {
          create: gradedExercises.map((ge) => ({
            exerciseId: ge.exerciseId,
            userAnswer: ge.userAnswer as any,
            isCorrect: ge.isCorrect,
            timeTakenMs: ge.timeTakenMs,
            creativityScore: ge.creativityScore,
          })),
        },
      },
    });

    // Update user gamification state
    await tx.user.update({
      where: { id: userId },
      data: {
        xp: newTotalXP,
        totalXpEarned: newTotalXP,
        level: newLevel,
        neuralPoints: { increment: npEarned },
        currentStreak: streakUpdate.newStreak,
        longestStreak: streakUpdate.newLongestStreak,
        streakShields: streakUpdate.newShields,
        lastTrainedAt: new Date(),
        totalSessions: { increment: 1 },
      },
    });

    return { completion, session };
  });

  // 8. Update brain profile (non-blocking)
  updateBrainProfile(userId, challenge.module, score).catch((err) => {
    console.error('⚠️  Brain profile update failed:', (err as Error).message);
  });

  return {
    completion: {
      id: result.completion.id,
      score,
      xpEarned,
      npEarned,
      completedAt: result.completion.completedAt,
    },
    session: {
      id: result.session.id,
      module: challenge.module,
      accuracy: Math.round(accuracy * 10000) / 10000,
      durationMs: data.durationMs,
    },
    gamification: {
      newLevel,
      totalXP: newTotalXP,
      streak: streakUpdate.newStreak,
      longestStreak: streakUpdate.newLongestStreak,
      shieldsConsumed: streakUpdate.shieldsConsumed,
    },
  };
}

// ─── Brain Profile Update (non-blocking) ────────────────────────────

async function updateBrainProfile(userId: string, module: string, score: number) {
  const moduleKey = module.toLowerCase() as
    | 'memory'
    | 'focus'
    | 'logic'
    | 'speed'
    | 'creativity'
    | 'language';

  await prisma.brainProfile.upsert({
    where: { userId },
    create: {
      userId,
      [moduleKey]: score,
    },
    update: {
      [moduleKey]: score,
    },
  });
}

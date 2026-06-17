import { prisma } from '../../config/db.js';
import { AppError } from '../../middleware/errorHandler.js';
import { scoreExercise } from '../../lib/exerciseGenerator.js';
import {
  calculateXP,
  calculateNP,
  getLevelFromXP,
  getLevelTitle,
  calculateStreakUpdate,
  xpToNextLevel,
} from '../../lib/xp.js';
import { calculateNewDifficulty } from '../../lib/difficulty.js';
import type { SubmitSessionData } from './schema.js';
import type { ModuleType } from '@prisma/client';

// ─── Module → BrainProfile field mapping ────────────────────────────

const MODULE_TO_PROFILE_FIELD: Record<ModuleType, string> = {
  MEMORY: 'memory',
  FOCUS: 'focus',
  LOGIC: 'logic',
  SPEED: 'speed',
  CREATIVITY: 'creativity',
  LANGUAGE: 'language',
};

const ALL_PROFILE_FIELDS = ['memory', 'focus', 'logic', 'speed', 'creativity', 'language'] as const;

// ─── Achievement definitions ────────────────────────────────────────

interface AchievementCheck {
  key: string;
  check: (ctx: AchievementContext) => boolean;
}

interface AchievementContext {
  totalSessions: number;
  currentStreak: number;
  newLevel: number;
  score: number;
  completedAt: Date;
  userId: string;
  distinctModules: number;
}

const ACHIEVEMENT_CHECKS: AchievementCheck[] = [
  { key: 'first_session', check: (ctx) => ctx.totalSessions === 1 },
  { key: 'sessions_10', check: (ctx) => ctx.totalSessions === 10 },
  { key: 'sessions_50', check: (ctx) => ctx.totalSessions === 50 },
  { key: 'sessions_100', check: (ctx) => ctx.totalSessions === 100 },
  { key: 'streak_7', check: (ctx) => ctx.currentStreak === 7 },
  { key: 'streak_14', check: (ctx) => ctx.currentStreak === 14 },
  { key: 'streak_30', check: (ctx) => ctx.currentStreak === 30 },
  { key: 'streak_100', check: (ctx) => ctx.currentStreak === 100 },
  { key: 'level_10', check: (ctx) => ctx.newLevel === 10 },
  { key: 'level_25', check: (ctx) => ctx.newLevel === 25 },
  { key: 'level_50', check: (ctx) => ctx.newLevel === 50 },
  { key: 'perfect_score', check: (ctx) => ctx.score === 100 },
  {
    key: 'night_owl',
    check: (ctx) => {
      const hour = ctx.completedAt.getHours();
      return hour >= 2 && hour < 4;
    },
  },
  { key: 'all_modules', check: (ctx) => ctx.distinctModules >= 6 },
  {
    key: 'new_year',
    check: (ctx) => {
      return ctx.completedAt.getMonth() === 0 && ctx.completedAt.getDate() === 1;
    },
  },
];

// ─── Submit Session ─────────────────────────────────────────────────

export async function submitSession(userId: string, data: SubmitSessionData) {
  const { module, exercises: submittedExercises, durationMs, isDailyChallenge } = data;

  if (!submittedExercises || submittedExercises.length === 0) {
    throw new AppError('No exercises submitted', 400, 'BAD_REQUEST');
  }

  // Grade each exercise using HMAC-signed ID (no DB lookup needed)
  const gradedExercises = submittedExercises.map((submitted) => {
    const isCorrect = scoreExercise(
      submitted.exerciseId,
      typeof submitted.userAnswer === 'string'
        ? submitted.userAnswer
        : JSON.stringify(submitted.userAnswer)
    );
    return {
      exerciseId: submitted.exerciseId,
      userAnswer: submitted.userAnswer,
      isCorrect,
      timeTakenMs: submitted.timeTakenMs,
      creativityScore: null as number | null,
    };
  });

  // 3. Calculate session score & accuracy
  const totalExercises = gradedExercises.length;
  const correctCount = gradedExercises.filter((e) => e.isCorrect).length;
  const score = Math.round((correctCount / totalExercises) * 100);
  const accuracy = correctCount / totalExercises;

  // 4. Load user's current gamification state
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      xp: true,
      level: true,
      neuralPoints: true,
      currentStreak: true,
      longestStreak: true,
      lastTrainedAt: true,
      streakShields: true,
      totalSessions: true,
      totalXpEarned: true,
    },
  });

  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  // 5. Calculate streak update
  const streakUpdate = calculateStreakUpdate({
    currentStreak: user.currentStreak,
    longestStreak: user.longestStreak,
    lastTrainedAt: user.lastTrainedAt,
    streakShields: user.streakShields,
  });

  // 6. Calculate XP
  const xpEarned = calculateXP({
    score,
    streak: streakUpdate.newStreak,
    isDailyChallenge,
  });

  // 7. Calculate NP
  const npEarned = calculateNP(isDailyChallenge);

  // 8. Calculate new level
  const newTotalXP = user.totalXpEarned + xpEarned;
  const newLevel = getLevelFromXP(newTotalXP);
  const previousLevel = user.level;
  const leveledUp = newLevel > previousLevel;

  // 9. Calculate new difficulty
  // 10. Get previous difficulty for this module from last session (or 1 if first)
  const lastSessionForModule = await prisma.trainingSession.findFirst({
    where: { userId, module: module as ModuleType },
    orderBy: { completedAt: 'desc' },
    select: { difficultyAfter: true },
  });

  const previousDifficulty = lastSessionForModule?.difficultyAfter ?? 1;
  const newDifficulty = calculateNewDifficulty(previousDifficulty, score);

  // 11. Write everything in a SINGLE Prisma transaction
  const now = new Date();
  const newTotalSessions = user.totalSessions + 1;

  const result = await prisma.$transaction(async (tx) => {
    // Create training session
    const session = await tx.trainingSession.create({
      data: {
        userId,
        module: module as ModuleType,
        difficulty: previousDifficulty,
        score,
        accuracy,
        durationMs,
        xpEarned,
        npEarned,
        isDailyChallenge,
        difficultyBefore: previousDifficulty,
        difficultyAfter: newDifficulty,
        completedAt: now,
      },
      select: {
        id: true,
        module: true,
        score: true,
        accuracy: true,
        durationMs: true,
        xpEarned: true,
        npEarned: true,
        difficultyBefore: true,
        difficultyAfter: true,
        completedAt: true,
      },
    });

    // Update user gamification state
    await tx.user.update({
      where: { id: userId },
      data: {
        xp: { increment: xpEarned },
        neuralPoints: { increment: npEarned },
        level: newLevel,
        currentStreak: streakUpdate.newStreak,
        longestStreak: streakUpdate.newLongestStreak,
        lastTrainedAt: now,
        streakShields: streakUpdate.newShields,
        totalSessions: newTotalSessions,
        totalXpEarned: newTotalXP,
      },
    });

    return session;
  });

  // 12. Update BrainProfile (weighted average)
  const profileField = MODULE_TO_PROFILE_FIELD[module as ModuleType];
  const sessionScore = score; // 0-100 scale matches profile scale

  try {
    const existingProfile = await prisma.brainProfile.findUnique({
      where: { userId },
    });

    if (existingProfile) {
      const currentVal = existingProfile[profileField as keyof typeof existingProfile] as number;
      const newVal = currentVal === 0
        ? sessionScore  // first session for this module — use directly
        : currentVal * 0.7 + sessionScore * 0.3;  // weighted average

      const updateData: Record<string, number> = { [profileField]: newVal };

      // Recalculate humanScore as average of all 6
      const allValues = ALL_PROFILE_FIELDS.map((f) =>
        f === profileField ? newVal : (existingProfile[f] as number),
      );
      updateData.humanScore = allValues.reduce((a, b) => a + b, 0) / 6;

      await prisma.brainProfile.update({
        where: { userId },
        data: updateData,
      });

      // Create snapshot
      await prisma.brainSnapshot.create({
        data: {
          profileId: existingProfile.id,
          memory: profileField === 'memory' ? newVal : existingProfile.memory,
          focus: profileField === 'focus' ? newVal : existingProfile.focus,
          logic: profileField === 'logic' ? newVal : existingProfile.logic,
          speed: profileField === 'speed' ? newVal : existingProfile.speed,
          creativity: profileField === 'creativity' ? newVal : existingProfile.creativity,
          language: profileField === 'language' ? newVal : existingProfile.language,
          humanScore: updateData.humanScore,
        },
      });
    } else {
      // Create new profile with first session data
      const profileData: Record<string, number> = {};
      for (const f of ALL_PROFILE_FIELDS) {
        profileData[f] = f === profileField ? sessionScore : 0;
      }
      profileData.humanScore = sessionScore / 6;

      const newProfile = await prisma.brainProfile.create({
        data: {
          userId,
          ...profileData,
        },
      });

      await prisma.brainSnapshot.create({
        data: {
          profileId: newProfile.id,
          memory: profileData.memory,
          focus: profileData.focus,
          logic: profileData.logic,
          speed: profileData.speed,
          creativity: profileData.creativity,
          language: profileData.language,
          humanScore: profileData.humanScore,
        },
      });
    }
  } catch (err) {
    console.error('⚠️  Failed to update brain profile:', (err as Error).message);
  }

  // 13. Check achievements (non-blocking, never break session)
  checkAchievements(userId, {
    totalSessions: newTotalSessions,
    currentStreak: streakUpdate.newStreak,
    newLevel,
    score,
    completedAt: now,
    userId,
    distinctModules: 0, // placeholder — computed inside
  }).catch((err) => {
    console.warn('⚠️  Achievement check failed:', err.message);
  });

  // 15. Build and return response
  const levelInfo = xpToNextLevel(newTotalXP);

  return {
    session: result,
    exerciseResults: gradedExercises.map((e) => ({
      exerciseId: e.exerciseId,
      isCorrect: e.isCorrect,
      creativityScore: e.creativityScore,
    })),
    score,
    accuracy: Math.round(accuracy * 100),
    xpEarned,
    npEarned,
    streak: {
      current: streakUpdate.newStreak,
      longest: streakUpdate.newLongestStreak,
      shieldsRemaining: streakUpdate.newShields,
      shieldsConsumed: streakUpdate.shieldsConsumed,
    },
    level: {
      current: newLevel,
      title: getLevelTitle(newLevel),
      leveledUp,
      previousLevel,
      xpToNext: levelInfo.xpNeeded,
      xpProgress: levelInfo.xpProgress,
    },
    difficulty: {
      before: previousDifficulty,
      after: newDifficulty,
    },
    isPerfect: score === 100,
  };
}

// ─── Get Sessions (History) ─────────────────────────────────────────

export async function getSessions(userId: string, limit: number, offset: number) {
  const [sessions, total] = await Promise.all([
    prisma.trainingSession.findMany({
      where: { userId },
      orderBy: { completedAt: 'desc' },
      skip: offset,
      take: limit,
      select: {
        id: true,
        module: true,
        difficulty: true,
        score: true,
        accuracy: true,
        durationMs: true,
        xpEarned: true,
        npEarned: true,
        isDailyChallenge: true,
        difficultyBefore: true,
        difficultyAfter: true,
        completedAt: true,
      },
    }),
    prisma.trainingSession.count({ where: { userId } }),
  ]);

  return { sessions, total, limit, offset };
}

// ─── Achievement Checker ────────────────────────────────────────────

async function checkAchievements(userId: string, ctx: AchievementContext): Promise<void> {
  // Count distinct modules the user has completed sessions in
  const moduleCounts = await prisma.trainingSession.groupBy({
    by: ['module'],
    where: { userId },
  });
  ctx.distinctModules = moduleCounts.length;

  // Get user's already-unlocked achievements
  const unlocked = await prisma.userAchievement.findMany({
    where: { userId },
    select: { achievement: { select: { key: true } } },
  });
  const unlockedKeys = new Set(unlocked.map((u) => u.achievement.key));

  // Check each achievement
  for (const ac of ACHIEVEMENT_CHECKS) {
    if (unlockedKeys.has(ac.key)) continue; // already unlocked
    if (!ac.check(ctx)) continue; // condition not met

    // Find the achievement definition in DB
    const achievement = await prisma.achievement.findUnique({
      where: { key: ac.key },
      select: { id: true, xpReward: true, npReward: true },
    });

    if (!achievement) continue; // achievement not seeded yet

    // Award in a transaction
    await prisma.$transaction([
      prisma.userAchievement.create({
        data: {
          userId,
          achievementId: achievement.id,
        },
      }),
      prisma.user.update({
        where: { id: userId },
        data: {
          xp: { increment: achievement.xpReward },
          neuralPoints: { increment: achievement.npReward },
          totalXpEarned: { increment: achievement.xpReward },
        },
      }),
    ]);
  }
}

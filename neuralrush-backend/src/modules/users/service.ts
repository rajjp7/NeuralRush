import { prisma } from '../../config/db.js';
import { AppError } from '../../middleware/errorHandler.js';
import { getLevelFromXP, getLevelTitle, xpToNextLevel } from '../../lib/xp.js';

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      username: true,
      name: true,
      avatarUrl: true,
      xp: true,
      level: true,
      neuralPoints: true,
      currentStreak: true,
      longestStreak: true,
      lastTrainedAt: true,
      streakShields: true,
      totalSessions: true,
      totalXpEarned: true,
      createdAt: true,
      updatedAt: true,
      brainProfile: {
        select: {
          memory: true,
          focus: true,
          logic: true,
          speed: true,
          creativity: true,
          language: true,
          humanScore: true,
          updatedAt: true,
        },
      },
      battleRecord: {
        select: {
          wins: true,
          losses: true,
          draws: true,
          winStreak: true,
          totalXpWon: true,
        },
      },
      clanMembership: {
        select: {
          role: true,
          joinedAt: true,
          clan: {
            select: {
              id: true,
              name: true,
              emblemKey: true,
            },
          },
        },
      },
      _count: {
        select: {
          userAchievements: true,
        },
      },
    },
  });

  if (!user) {
    throw new AppError('User not found', 404, 'NOT_FOUND');
  }

  // Flatten _count into achievementCount
  const { _count, ...rest } = user;
  return {
    ...rest,
    achievementCount: _count.userAchievements,
    levelTitle: getLevelTitle(user.level),
    levelProgress: xpToNextLevel(user.xp),
  };
}

export async function updateMe(userId: string, data: { name?: string; avatarUrl?: string }) {
  const user = await prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      email: true,
      username: true,
      name: true,
      avatarUrl: true,
      updatedAt: true,
    },
  });

  return user;
}

export async function getMyStats(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      xp: true,
      level: true,
      currentStreak: true,
      longestStreak: true,
      neuralPoints: true,
      totalSessions: true,
      totalXpEarned: true,
    },
  });

  if (!user) {
    throw new AppError('User not found', 404, 'NOT_FOUND');
  }

  // Last 30 days sessions summary
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentSessions = await prisma.trainingSession.findMany({
    where: {
      userId,
      completedAt: { gte: thirtyDaysAgo },
    },
    select: {
      score: true,
      module: true,
    },
  });

  const avgScore =
    recentSessions.length > 0
      ? recentSessions.reduce((sum, s) => sum + s.score, 0) / recentSessions.length
      : 0;

  const modulesTrainedSet = new Set(recentSessions.map((s) => s.module));

  return {
    ...user,
    levelTitle: getLevelTitle(user.level),
    levelProgress: xpToNextLevel(user.xp),
    last30Days: {
      sessionsCount: recentSessions.length,
      avgScore: Math.round(avgScore * 100) / 100,
      modulesTrained: Array.from(modulesTrainedSet),
    },
  };
}

export async function getPublicProfile(username: string) {
  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      name: true,
      avatarUrl: true,
      xp: true,
      level: true,
      currentStreak: true,
      totalSessions: true,
      brainProfile: {
        select: {
          memory: true,
          focus: true,
          logic: true,
          speed: true,
          creativity: true,
          language: true,
          humanScore: true,
        },
      },
    },
  });

  if (!user) {
    throw new AppError('User not found', 404, 'NOT_FOUND');
  }

  return {
    ...user,
    levelTitle: getLevelTitle(user.level),
  };
}

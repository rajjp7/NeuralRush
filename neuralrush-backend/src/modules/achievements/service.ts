import { prisma } from '../../config/db.js';

interface AchievementWithStatus {
  id: string;
  key: string;
  title: string;
  description: string;
  rarity: string;
  xpReward: number;
  npReward: number;
  iconKey: string | null;
  isHidden: boolean;
  unlocked: boolean;
  unlockedAt: Date | null;
}

interface UnlockedAchievement {
  id: string;
  achievementId: string;
  unlockedAt: Date;
  achievement: {
    key: string;
    title: string;
    description: string;
    rarity: string;
    iconKey: string | null;
  };
}

export async function getAllAchievements(userId: string): Promise<AchievementWithStatus[]> {
  // Fetch all achievements and the user's unlocks in parallel
  const [allAchievements, userUnlocks] = await Promise.all([
    prisma.achievement.findMany({
      select: {
        id: true,
        key: true,
        title: true,
        description: true,
        rarity: true,
        xpReward: true,
        npReward: true,
        iconKey: true,
        isHidden: true,
      },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.userAchievement.findMany({
      where: { userId },
      select: {
        achievementId: true,
        unlockedAt: true,
      },
    }),
  ]);

  // Build a map of achievementId -> unlockedAt
  const unlockMap = new Map<string, Date>();
  for (const unlock of userUnlocks) {
    unlockMap.set(unlock.achievementId, unlock.unlockedAt);
  }

  // Filter: show non-hidden ones + hidden ones the user has unlocked
  const results: AchievementWithStatus[] = [];

  for (const achievement of allAchievements) {
    const unlockedAt = unlockMap.get(achievement.id) ?? null;
    const unlocked = unlockedAt !== null;

    // Skip hidden achievements that the user hasn't unlocked
    if (achievement.isHidden && !unlocked) {
      continue;
    }

    results.push({
      ...achievement,
      unlocked,
      unlockedAt,
    });
  }

  return results;
}

export async function getMyAchievements(userId: string): Promise<UnlockedAchievement[]> {
  const unlocked = await prisma.userAchievement.findMany({
    where: { userId },
    select: {
      id: true,
      achievementId: true,
      unlockedAt: true,
      achievement: {
        select: {
          key: true,
          title: true,
          description: true,
          rarity: true,
          iconKey: true,
        },
      },
    },
    orderBy: { unlockedAt: 'desc' },
  });

  return unlocked;
}

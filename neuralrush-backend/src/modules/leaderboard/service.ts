import { prisma } from '../../config/db.js';
import { redis } from '../../config/redis.js';
import { getLevelFromXP } from '../../lib/xp.js';

const LEADERBOARD_KEY = 'leaderboard:global';
const TOP_N = 50;

interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  name: string | null;
  avatarUrl: string | null;
  xp: number;
  level: number;
}

interface LeaderboardResult {
  entries: LeaderboardEntry[];
  userRank: number;
}

export async function getLeaderboard(
  userId: string,
  scope: 'global' | 'friends'
): Promise<LeaderboardResult> {
  // For now, 'friends' scope falls through to the same logic (no friends system yet).
  // In the future, filter by friend list.

  if (redis) {
    return getLeaderboardFromRedis(userId);
  }

  return getLeaderboardFromDB(userId);
}

// ─── Redis-backed leaderboard ───────────────────────────────────────

async function getLeaderboardFromRedis(userId: string): Promise<LeaderboardResult> {
  // Get top N members with scores: returns [member, score, member, score, ...]
  const topRaw = await redis!.zrevrange(LEADERBOARD_KEY, 0, TOP_N - 1, 'WITHSCORES');

  const topUserIds: { id: string; xp: number }[] = [];
  for (let i = 0; i < topRaw.length; i += 2) {
    topUserIds.push({ id: topRaw[i], xp: parseInt(topRaw[i + 1], 10) });
  }

  // Get current user's rank (0-indexed, null if not in set)
  const userRankRaw = await redis!.zrevrank(LEADERBOARD_KEY, userId);
  const userRank = userRankRaw !== null ? userRankRaw + 1 : -1;

  // Check if user is already in top N
  const userInTop = topUserIds.some((u) => u.id === userId);

  // Collect all user IDs we need to hydrate
  const idsToFetch = topUserIds.map((u) => u.id);
  if (!userInTop) {
    idsToFetch.push(userId);
  }

  // Hydrate user details from DB
  const users = await prisma.user.findMany({
    where: { id: { in: idsToFetch } },
    select: {
      id: true,
      username: true,
      name: true,
      avatarUrl: true,
      xp: true,
    },
  });

  const userMap = new Map(users.map((u) => [u.id, u]));

  const entries: LeaderboardEntry[] = topUserIds.map((item, index) => {
    const user = userMap.get(item.id);
    return {
      rank: index + 1,
      userId: item.id,
      username: user?.username ?? 'unknown',
      name: user?.name ?? null,
      avatarUrl: user?.avatarUrl ?? null,
      xp: item.xp,
      level: getLevelFromXP(item.xp),
    };
  });

  // Append current user if not already in list
  if (!userInTop) {
    const currentUser = userMap.get(userId);
    if (currentUser) {
      entries.push({
        rank: userRank,
        userId: currentUser.id,
        username: currentUser.username,
        name: currentUser.name,
        avatarUrl: currentUser.avatarUrl,
        xp: currentUser.xp,
        level: getLevelFromXP(currentUser.xp),
      });
    }
  }

  return { entries, userRank };
}

// ─── DB fallback leaderboard ────────────────────────────────────────

async function getLeaderboardFromDB(userId: string): Promise<LeaderboardResult> {
  const topUsers = await prisma.user.findMany({
    orderBy: { xp: 'desc' },
    take: TOP_N,
    select: {
      id: true,
      username: true,
      name: true,
      avatarUrl: true,
      xp: true,
    },
  });

  const entries: LeaderboardEntry[] = topUsers.map((user, index) => ({
    rank: index + 1,
    userId: user.id,
    username: user.username,
    name: user.name,
    avatarUrl: user.avatarUrl,
    xp: user.xp,
    level: getLevelFromXP(user.xp),
  }));

  // Determine current user's rank
  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, username: true, name: true, avatarUrl: true, xp: true },
  });

  let userRank = -1;
  if (currentUser) {
    const usersAbove = await prisma.user.count({
      where: { xp: { gt: currentUser.xp } },
    });
    userRank = usersAbove + 1;

    // Append user if not in top N
    const userInTop = entries.some((e) => e.userId === userId);
    if (!userInTop) {
      entries.push({
        rank: userRank,
        userId: currentUser.id,
        username: currentUser.username,
        name: currentUser.name,
        avatarUrl: currentUser.avatarUrl,
        xp: currentUser.xp,
        level: getLevelFromXP(currentUser.xp),
      });
    }
  }

  return { entries, userRank };
}

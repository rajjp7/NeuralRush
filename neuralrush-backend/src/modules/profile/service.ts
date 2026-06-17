import { prisma } from '../../config/db.js';

const PROFILE_SELECT = {
  memory: true,
  focus: true,
  logic: true,
  speed: true,
  creativity: true,
  language: true,
  humanScore: true,
} as const;

export async function getBrainProfile(userId: string) {
  // Upsert: return existing profile or create one with all zeros
  const profile = await prisma.brainProfile.upsert({
    where: { userId },
    create: { userId },
    update: {},
    select: {
      id: true,
      ...PROFILE_SELECT,
      updatedAt: true,
    },
  });

  return profile;
}

interface WeeklySnapshot {
  week: string;
  memory: number;
  focus: number;
  logic: number;
  speed: number;
  creativity: number;
  language: number;
  humanScore: number;
}

export async function getBrainHistory(userId: string): Promise<WeeklySnapshot[]> {
  const twelveWeeksAgo = new Date();
  twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84); // 12 * 7 = 84 days

  // Ensure the user has a profile (so we can query snapshots)
  const profile = await prisma.brainProfile.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!profile) {
    return [];
  }

  const snapshots = await prisma.brainSnapshot.findMany({
    where: {
      profileId: profile.id,
      takenAt: { gte: twelveWeeksAgo },
    },
    orderBy: { takenAt: 'desc' },
    select: {
      memory: true,
      focus: true,
      logic: true,
      speed: true,
      creativity: true,
      language: true,
      humanScore: true,
      takenAt: true,
    },
  });

  // Group by ISO week and take the latest snapshot per week
  const weekMap = new Map<string, WeeklySnapshot>();

  for (const snap of snapshots) {
    const weekKey = getISOWeekKey(snap.takenAt);

    // Since snapshots are ordered desc, the first one we encounter per week is the latest
    if (!weekMap.has(weekKey)) {
      weekMap.set(weekKey, {
        week: weekKey,
        memory: snap.memory,
        focus: snap.focus,
        logic: snap.logic,
        speed: snap.speed,
        creativity: snap.creativity,
        language: snap.language,
        humanScore: snap.humanScore,
      });
    }
  }

  // Return sorted by week ascending
  return Array.from(weekMap.values()).sort((a, b) => a.week.localeCompare(b.week));
}

/** Returns an ISO-week string like "2026-W24" */
function getISOWeekKey(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  // Set to nearest Thursday: current date + 4 - day number (Mon=1..Sun=7)
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

/**
 * XP, Level, Streak, and Neural Points calculation — all rules from the spec.
 */

// ─── Streak Multiplier ──────────────────────────────────────────────

export function getStreakMultiplier(streak: number): number {
  if (streak >= 30) return 3.0;
  if (streak >= 14) return 2.0;
  if (streak >= 7) return 1.5;
  return 1.0;
}

// ─── XP Calculation ─────────────────────────────────────────────────

interface XPCalcInput {
  score: number;            // 0-100
  streak: number;           // current streak
  isDailyChallenge: boolean;
}

export function calculateXP(input: XPCalcInput): number {
  const baseXP = input.isDailyChallenge ? 250 : 100;
  const multiplier = getStreakMultiplier(input.streak);
  let xp = Math.round(baseXP * multiplier * (input.score / 100));

  // Perfect score bonus
  if (input.score === 100) {
    xp += 50;
  }

  return xp;
}

// ─── Neural Points ──────────────────────────────────────────────────

export function calculateNP(isDailyChallenge: boolean): number {
  return isDailyChallenge ? 50 : 20;
}

// ─── Level Calculation ──────────────────────────────────────────────
// Formula: XP required for level N = N × (N+1) × 250
// Level 1 = 0 XP, Level 2 = 1500, Level 3 = 3000, Level 10 = 27500

export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  return level * (level + 1) * 250;
}

export function getLevelFromXP(totalXP: number): number {
  let level = 1;
  while (xpForLevel(level + 1) <= totalXP) {
    level++;
  }
  return level;
}

export function xpToNextLevel(totalXP: number): { currentLevel: number; xpNeeded: number; xpProgress: number } {
  const currentLevel = getLevelFromXP(totalXP);
  const currentThreshold = xpForLevel(currentLevel);
  const nextThreshold = xpForLevel(currentLevel + 1);
  return {
    currentLevel,
    xpNeeded: nextThreshold - totalXP,
    xpProgress: totalXP - currentThreshold,
  };
}

// ─── Level Titles ───────────────────────────────────────────────────

export function getLevelTitle(level: number): string {
  if (level >= 51) return 'Brain Immortal';
  if (level >= 41) return 'Neural Sovereign';
  if (level >= 31) return 'Logic Archon';
  if (level >= 21) return 'Memory Warden';
  if (level >= 16) return 'Synapse Knight';
  if (level >= 11) return 'Neuromancer';
  if (level >= 6) return 'Cognitive Scout';
  return 'Apprentice Mind';
}

// ─── Streak Update ──────────────────────────────────────────────────

interface StreakUpdateInput {
  currentStreak: number;
  longestStreak: number;
  lastTrainedAt: Date | null;
  streakShields: number;
}

interface StreakUpdateResult {
  newStreak: number;
  newLongestStreak: number;
  shieldsConsumed: number;
  newShields: number;
}

export function calculateStreakUpdate(input: StreakUpdateInput): StreakUpdateResult {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  let { currentStreak, longestStreak, streakShields } = input;
  let shieldsConsumed = 0;

  if (!input.lastTrainedAt) {
    // First ever session
    currentStreak = 1;
  } else {
    const lastDate = new Date(input.lastTrainedAt);
    const lastDay = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate());

    const diffMs = today.getTime() - lastDay.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      // Already trained today — streak stays the same
    } else if (diffDays === 1) {
      // Trained yesterday — increment streak
      currentStreak += 1;
    } else {
      // Missed more than one day
      if (streakShields > 0) {
        streakShields -= 1;
        shieldsConsumed = 1;
        // Keep streak, don't increment
      } else {
        currentStreak = 1;
      }
    }
  }

  longestStreak = Math.max(longestStreak, currentStreak);

  return {
    newStreak: currentStreak,
    newLongestStreak: longestStreak,
    shieldsConsumed,
    newShields: streakShields,
  };
}

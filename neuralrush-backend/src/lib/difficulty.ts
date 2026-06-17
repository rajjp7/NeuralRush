/**
 * Adaptive Difficulty Algorithm
 *
 * After each session:
 *   score >= 85  → difficulty + 1 (max 10)
 *   score 50-84  → no change
 *   score < 50   → difficulty - 1 (min 1)
 *
 * For new users starting a module for the first time:
 *   profile score 0-40   → difficulty 1
 *   profile score 40-60  → difficulty 3
 *   profile score 60-80  → difficulty 5
 *   profile score 80+    → difficulty 7
 */

export function calculateNewDifficulty(currentDifficulty: number, score: number): number {
  let newDiff = currentDifficulty;

  if (score >= 85) {
    newDiff += 1;
  } else if (score < 50) {
    newDiff -= 1;
  }

  return Math.max(1, Math.min(10, newDiff));
}

export function getStartingDifficulty(profileScore: number): number {
  if (profileScore >= 80) return 7;
  if (profileScore >= 60) return 5;
  if (profileScore >= 40) return 3;
  return 1;
}

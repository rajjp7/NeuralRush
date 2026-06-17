import type { ModuleType } from '@prisma/client';
import { generateExercises } from '../../lib/exerciseGenerator.js';

export async function getExercises(module: ModuleType, difficulty: number, count: number) {
  return generateExercises(module, difficulty, count);
}

import { z } from 'zod';

export const getExercisesQuery = z.object({
  module: z.enum(['MEMORY', 'FOCUS', 'LOGIC', 'SPEED', 'CREATIVITY', 'LANGUAGE']),
  difficulty: z.coerce.number().int().min(1).max(10),
  count: z.coerce.number().int().min(1).max(20).default(10),
});

export type GetExercisesQuery = z.infer<typeof getExercisesQuery>;

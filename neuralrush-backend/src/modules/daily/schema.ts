import { z } from 'zod';

export const completeDailySchema = z.object({
  score: z.number().min(0).max(100),
  exercises: z
    .array(
      z.object({
        exerciseId: z.string(),
        userAnswer: z.any(),
        timeTakenMs: z.number().int().positive(),
      })
    )
    .min(1),
  durationMs: z.number().int().positive(),
});

export type CompleteDailyInput = z.infer<typeof completeDailySchema>;

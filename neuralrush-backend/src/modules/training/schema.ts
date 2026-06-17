import { z } from 'zod';

export const submitSessionSchema = z.object({
  module: z.enum(['MEMORY', 'FOCUS', 'LOGIC', 'SPEED', 'CREATIVITY', 'LANGUAGE']),
  exercises: z.array(
    z.object({
      exerciseId: z.string().min(1),
      userAnswer: z.any(),
      timeTakenMs: z.number().int().min(0),
    }),
  ).min(1),
  durationMs: z.number().int().min(0),
  isDailyChallenge: z.boolean().default(false),
});

export type SubmitSessionData = z.infer<typeof submitSessionSchema>;

export const sessionsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export type SessionsQuery = z.infer<typeof sessionsQuerySchema>;

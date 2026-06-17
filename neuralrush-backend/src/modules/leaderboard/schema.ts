import { z } from 'zod';

export const leaderboardQuerySchema = z.object({
  scope: z.enum(['global', 'friends']).default('global'),
});

export type LeaderboardQuery = z.infer<typeof leaderboardQuerySchema>;

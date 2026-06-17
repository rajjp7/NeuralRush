import { z } from 'zod';

export const joinWaitlistSchema = z.object({
  email: z.string().email(),
});

export type JoinWaitlistInput = z.infer<typeof joinWaitlistSchema>;

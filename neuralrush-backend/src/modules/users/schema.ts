import { z } from 'zod';

export const updateProfileSchema = z.object({
  name: z.string().optional(),
  avatarUrl: z.string().url('Invalid avatar URL').optional(),
});

export const usernameParamSchema = z.object({
  username: z.string().min(1, 'Username is required'),
});

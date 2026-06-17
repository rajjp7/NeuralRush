import { z } from 'zod';

export const createClanSchema = z.object({
  name: z
    .string()
    .min(3, 'Clan name must be at least 3 characters')
    .max(30, 'Clan name must be at most 30 characters'),
  description: z
    .string()
    .max(500, 'Description must be at most 500 characters')
    .optional(),
  isPublic: z.boolean().default(true),
});

export const clanIdParamSchema = z.object({
  id: z.string().min(1, 'Clan ID is required'),
});

export type CreateClanInput = z.infer<typeof createClanSchema>;
export type ClanIdParam = z.infer<typeof clanIdParamSchema>;

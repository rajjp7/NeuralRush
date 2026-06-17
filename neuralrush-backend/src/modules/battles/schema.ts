import { z } from 'zod';

export const ModuleTypeEnum = z.enum([
  'MEMORY',
  'FOCUS',
  'LOGIC',
  'SPEED',
  'CREATIVITY',
  'LANGUAGE',
]);

export const createBattleSchema = z.object({
  username: z.string().min(1, 'Opponent username is required'),
  module: ModuleTypeEnum,
});

export const battleIdParamSchema = z.object({
  id: z.string().min(1, 'Battle ID is required'),
});

export type CreateBattleInput = z.infer<typeof createBattleSchema>;
export type BattleIdParam = z.infer<typeof battleIdParamSchema>;

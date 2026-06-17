import { Response, NextFunction } from 'express';
import type { AuthRequest } from '../../middleware/auth.js';
import { sendSuccess } from '../../lib/response.js';
import { getExercises } from './service.js';
import type { GetExercisesQuery } from './schema.js';
import type { ModuleType } from '@prisma/client';

export async function getExercisesHandler(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { module, difficulty, count } = req.query as unknown as GetExercisesQuery;

    const exercises = await getExercises(module as ModuleType, difficulty, count);

    sendSuccess(res, { exercises });
  } catch (err) {
    next(err);
  }
}

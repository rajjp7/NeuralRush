import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth.js';
import { sendSuccess } from '../../lib/response.js';
import * as achievementsService from './service.js';

export async function getAllAchievements(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const achievements = await achievementsService.getAllAchievements(req.userId!);
    sendSuccess(res, achievements);
  } catch (err) {
    next(err);
  }
}

export async function getMyAchievements(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const achievements = await achievementsService.getMyAchievements(req.userId!);
    sendSuccess(res, achievements);
  } catch (err) {
    next(err);
  }
}

import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth.js';
import { sendSuccess } from '../../lib/response.js';
import * as leaderboardService from './service.js';
import type { LeaderboardQuery } from './schema.js';

export async function getLeaderboard(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { scope } = req.query as unknown as LeaderboardQuery;
    const result = await leaderboardService.getLeaderboard(req.userId!, scope);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

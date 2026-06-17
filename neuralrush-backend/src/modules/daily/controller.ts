import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth.js';
import { sendSuccess } from '../../lib/response.js';
import { getTodayChallenge, completeDaily } from './service.js';
import type { CompleteDailyInput } from './schema.js';

export async function getTodayChallengeHandler(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.userId!;
    const result = await getTodayChallenge(userId);

    if (!result) {
      sendSuccess(res, { challenge: null, message: 'No daily challenge available today' });
      return;
    }

    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function completeDailyHandler(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.userId!;
    const data = req.body as CompleteDailyInput;
    const result = await completeDaily(userId, data);

    sendSuccess(res, result, 201);
  } catch (err) {
    next(err);
  }
}

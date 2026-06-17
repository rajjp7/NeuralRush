import { Response, NextFunction } from 'express';
import type { AuthRequest } from '../../middleware/auth.js';
import { sendSuccess } from '../../lib/response.js';
import { submitSession, getSessions } from './service.js';
import type { SubmitSessionData, SessionsQuery } from './schema.js';

export async function submitSessionHandler(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.userId!;
    const data = req.body as SubmitSessionData;

    const result = await submitSession(userId, data);

    sendSuccess(res, result, 201);
  } catch (err) {
    next(err);
  }
}

export async function getSessionsHandler(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.userId!;
    const { limit, offset } = req.query as unknown as SessionsQuery;

    const result = await getSessions(userId, limit, offset);

    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

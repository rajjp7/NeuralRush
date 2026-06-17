import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../../lib/response.js';
import { joinWaitlist, getWaitlistCount } from './service.js';
import type { JoinWaitlistInput } from './schema.js';

export async function joinWaitlistHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email } = req.body as JoinWaitlistInput;
    const result = await joinWaitlist(email);

    sendSuccess(res, result, 201);
  } catch (err) {
    next(err);
  }
}

export async function getWaitlistCountHandler(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await getWaitlistCount();

    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

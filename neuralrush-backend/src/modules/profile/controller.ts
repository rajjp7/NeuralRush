import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth.js';
import { sendSuccess } from '../../lib/response.js';
import * as profileService from './service.js';

export async function getBrainProfile(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const profile = await profileService.getBrainProfile(req.userId!);
    sendSuccess(res, profile);
  } catch (err) {
    next(err);
  }
}

export async function getBrainHistory(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const history = await profileService.getBrainHistory(req.userId!);
    sendSuccess(res, history);
  } catch (err) {
    next(err);
  }
}

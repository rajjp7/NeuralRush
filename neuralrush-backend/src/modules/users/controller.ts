import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth.js';
import * as usersService from './service.js';
import { sendSuccess } from '../../lib/response.js';

export async function getMe(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const user = await usersService.getMe(req.userId!);
    sendSuccess(res, user);
  } catch (err) {
    next(err);
  }
}

export async function updateMe(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const user = await usersService.updateMe(req.userId!, req.body);
    sendSuccess(res, user);
  } catch (err) {
    next(err);
  }
}

export async function getMyStats(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const stats = await usersService.getMyStats(req.userId!);
    sendSuccess(res, stats);
  } catch (err) {
    next(err);
  }
}

export async function getPublicProfile(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { username } = req.params;
    const profile = await usersService.getPublicProfile(username);
    sendSuccess(res, profile);
  } catch (err) {
    next(err);
  }
}

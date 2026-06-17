import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth.js';
import { sendSuccess } from '../../lib/response.js';
import * as clanService from './service.js';
import type { CreateClanInput } from './schema.js';

export async function createClan(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const data = req.body as CreateClanInput;
    const clan = await clanService.createClan(req.userId!, data);
    sendSuccess(res, clan, 201);
  } catch (err) {
    next(err);
  }
}

export async function getClan(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const clan = await clanService.getClan(req.params.id as string);
    sendSuccess(res, clan);
  } catch (err) {
    next(err);
  }
}

export async function joinClan(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const membership = await clanService.joinClan(req.params.id as string, req.userId!);
    sendSuccess(res, membership, 201);
  } catch (err) {
    next(err);
  }
}

export async function leaveClan(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await clanService.leaveClan(req.params.id as string, req.userId!);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function getClanLeaderboard(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const leaderboard = await clanService.getClanLeaderboard(req.params.id as string);
    sendSuccess(res, leaderboard);
  } catch (err) {
    next(err);
  }
}

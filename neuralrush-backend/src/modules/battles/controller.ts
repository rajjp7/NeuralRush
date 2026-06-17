import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth.js';
import { sendSuccess } from '../../lib/response.js';
import * as battleService from './service.js';
import type { CreateBattleInput } from './schema.js';

export async function createBattle(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { username, module } = req.body as CreateBattleInput;
    const battle = await battleService.createBattle(
      req.userId!,
      username,
      module
    );
    sendSuccess(res, battle, 201);
  } catch (err) {
    next(err);
  }
}

export async function getMyBattles(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const battles = await battleService.getMyBattles(req.userId!);
    sendSuccess(res, { battles });
  } catch (err) {
    next(err);
  }
}

export async function getBattle(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const battle = await battleService.getBattle(req.params.id as string, req.userId!);
    sendSuccess(res, battle);
  } catch (err) {
    next(err);
  }
}

export async function acceptBattle(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const battle = await battleService.acceptBattle(req.params.id as string, req.userId!);
    sendSuccess(res, battle);
  } catch (err) {
    next(err);
  }
}

export async function declineBattle(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const battle = await battleService.declineBattle(
      req.params.id as string,
      req.userId!
    );
    sendSuccess(res, battle);
  } catch (err) {
    next(err);
  }
}

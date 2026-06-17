import { prisma } from '../../config/db.js';
import { AppError } from '../../middleware/errorHandler.js';
import type { ModuleType } from '@prisma/client';

const userSelectFields = {
  id: true,
  username: true,
  name: true,
  avatarUrl: true,
  xp: true,
  level: true,
} as const;

export async function createBattle(
  challengerId: string,
  opponentUsername: string,
  module: ModuleType
) {
  // Find opponent by username
  const opponent = await prisma.user.findUnique({
    where: { username: opponentUsername },
    select: { id: true, username: true },
  });

  if (!opponent) {
    throw new AppError('Opponent not found', 404, 'USER_NOT_FOUND');
  }

  // Can't battle yourself
  if (opponent.id === challengerId) {
    throw new AppError('You cannot battle yourself', 400, 'SELF_BATTLE');
  }

  // Check no active battle between these users
  const existingBattle = await prisma.battle.findFirst({
    where: {
      status: { in: ['PENDING', 'ACTIVE'] },
      OR: [
        { challengerId, challengedId: opponent.id },
        { challengerId: opponent.id, challengedId: challengerId },
      ],
    },
  });

  if (existingBattle) {
    throw new AppError(
      'An active battle already exists between you and this user',
      409,
      'BATTLE_EXISTS'
    );
  }

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  const battle = await prisma.battle.create({
    data: {
      challengerId,
      challengedId: opponent.id,
      module,
      status: 'PENDING',
      expiresAt,
    },
    include: {
      challenger: { select: userSelectFields },
      challenged: { select: userSelectFields },
    },
  });

  return battle;
}

export async function getMyBattles(userId: string) {
  const battles = await prisma.battle.findMany({
    where: {
      OR: [{ challengerId: userId }, { challengedId: userId }],
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
    include: {
      challenger: { select: userSelectFields },
      challenged: { select: userSelectFields },
    },
  });

  return battles;
}

export async function getBattle(battleId: string, userId: string) {
  const battle = await prisma.battle.findUnique({
    where: { id: battleId },
    include: {
      challenger: { select: userSelectFields },
      challenged: { select: userSelectFields },
      winner: { select: userSelectFields },
    },
  });

  if (!battle) {
    throw new AppError('Battle not found', 404, 'BATTLE_NOT_FOUND');
  }

  if (battle.challengerId !== userId && battle.challengedId !== userId) {
    throw new AppError(
      'You are not a participant in this battle',
      403,
      'FORBIDDEN'
    );
  }

  return battle;
}

export async function acceptBattle(battleId: string, userId: string) {
  const battle = await prisma.battle.findUnique({
    where: { id: battleId },
  });

  if (!battle) {
    throw new AppError('Battle not found', 404, 'BATTLE_NOT_FOUND');
  }

  if (battle.challengedId !== userId) {
    throw new AppError(
      'Only the challenged user can accept a battle',
      403,
      'FORBIDDEN'
    );
  }

  if (battle.status !== 'PENDING') {
    throw new AppError(
      'Battle is no longer pending',
      400,
      'INVALID_BATTLE_STATUS'
    );
  }

  const updatedBattle = await prisma.battle.update({
    where: { id: battleId },
    data: {
      status: 'ACTIVE',
      startedAt: new Date(),
    },
    include: {
      challenger: { select: userSelectFields },
      challenged: { select: userSelectFields },
    },
  });

  return updatedBattle;
}

export async function declineBattle(battleId: string, userId: string) {
  const battle = await prisma.battle.findUnique({
    where: { id: battleId },
  });

  if (!battle) {
    throw new AppError('Battle not found', 404, 'BATTLE_NOT_FOUND');
  }

  if (battle.challengedId !== userId) {
    throw new AppError(
      'Only the challenged user can decline a battle',
      403,
      'FORBIDDEN'
    );
  }

  if (battle.status !== 'PENDING') {
    throw new AppError(
      'Battle is no longer pending',
      400,
      'INVALID_BATTLE_STATUS'
    );
  }

  const updatedBattle = await prisma.battle.update({
    where: { id: battleId },
    data: {
      status: 'EXPIRED',
    },
    include: {
      challenger: { select: userSelectFields },
      challenged: { select: userSelectFields },
    },
  });

  return updatedBattle;
}

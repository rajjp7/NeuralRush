import { prisma } from '../../config/db.js';
import { AppError } from '../../middleware/errorHandler.js';
import type { CreateClanInput } from './schema.js';

const userSelectFields = {
  id: true,
  username: true,
  name: true,
  avatarUrl: true,
  xp: true,
  level: true,
} as const;

export async function createClan(userId: string, data: CreateClanInput) {
  // Check user not already in a clan
  const existingMembership = await prisma.clanMember.findUnique({
    where: { userId },
  });

  if (existingMembership) {
    throw new AppError(
      'You are already a member of a clan',
      409,
      'ALREADY_IN_CLAN'
    );
  }

  const clan = await prisma.clan.create({
    data: {
      name: data.name,
      description: data.description,
      isPublic: data.isPublic,
      members: {
        create: {
          userId,
          role: 'LEADER',
        },
      },
    },
    include: {
      members: {
        include: {
          user: { select: userSelectFields },
        },
      },
    },
  });

  return clan;
}

export async function getClan(clanId: string) {
  const clan = await prisma.clan.findUnique({
    where: { id: clanId },
    include: {
      members: {
        include: {
          user: { select: userSelectFields },
        },
        orderBy: { joinedAt: 'asc' },
      },
    },
  });

  if (!clan) {
    throw new AppError('Clan not found', 404, 'CLAN_NOT_FOUND');
  }

  return clan;
}

export async function joinClan(clanId: string, userId: string) {
  // Check clan exists and is public
  const clan = await prisma.clan.findUnique({
    where: { id: clanId },
    select: { id: true, isPublic: true },
  });

  if (!clan) {
    throw new AppError('Clan not found', 404, 'CLAN_NOT_FOUND');
  }

  if (!clan.isPublic) {
    throw new AppError(
      'This clan is private and cannot be joined directly',
      403,
      'CLAN_PRIVATE'
    );
  }

  // Check user not already in a clan
  const existingMembership = await prisma.clanMember.findUnique({
    where: { userId },
  });

  if (existingMembership) {
    throw new AppError(
      'You are already a member of a clan',
      409,
      'ALREADY_IN_CLAN'
    );
  }

  const membership = await prisma.clanMember.create({
    data: {
      userId,
      clanId,
      role: 'MEMBER',
    },
    include: {
      user: { select: userSelectFields },
      clan: { select: { id: true, name: true } },
    },
  });

  return membership;
}

export async function leaveClan(clanId: string, userId: string) {
  const membership = await prisma.clanMember.findFirst({
    where: { clanId, userId },
  });

  if (!membership) {
    throw new AppError(
      'You are not a member of this clan',
      404,
      'NOT_CLAN_MEMBER'
    );
  }

  // If user is LEADER, check if there are other members
  if (membership.role === 'LEADER') {
    const memberCount = await prisma.clanMember.count({
      where: { clanId },
    });

    if (memberCount > 1) {
      throw new AppError(
        'You must transfer leadership before leaving the clan',
        400,
        'LEADER_CANNOT_LEAVE'
      );
    }

    // Last member — delete clan entirely
    await prisma.clanMember.delete({
      where: { id: membership.id },
    });

    await prisma.clan.delete({
      where: { id: clanId },
    });

    return { deleted: true, message: 'Clan deleted (you were the last member)' };
  }

  // Regular member — just remove
  await prisma.clanMember.delete({
    where: { id: membership.id },
  });

  return { deleted: false, message: 'You have left the clan' };
}

export async function getClanLeaderboard(clanId: string) {
  // Verify clan exists
  const clan = await prisma.clan.findUnique({
    where: { id: clanId },
    select: { id: true, name: true },
  });

  if (!clan) {
    throw new AppError('Clan not found', 404, 'CLAN_NOT_FOUND');
  }

  const members = await prisma.clanMember.findMany({
    where: { clanId },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          name: true,
          avatarUrl: true,
          xp: true,
          level: true,
          totalXpEarned: true,
        },
      },
    },
    orderBy: {
      user: { xp: 'desc' },
    },
  });

  const leaderboard = members.map((member, index) => ({
    rank: index + 1,
    userId: member.user.id,
    username: member.user.username,
    name: member.user.name,
    avatarUrl: member.user.avatarUrl,
    xp: member.user.xp,
    level: member.user.level,
    role: member.role,
    joinedAt: member.joinedAt,
  }));

  return {
    clanId: clan.id,
    clanName: clan.name,
    leaderboard,
  };
}

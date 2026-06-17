import { prisma } from '../../config/db.js';
import { hashPassword, comparePassword } from '../../lib/bcrypt.js';
import { signAccessToken, signRefreshToken, getRefreshTokenExpiry } from '../../lib/jwt.js';
import { AppError } from '../../middleware/errorHandler.js';

const userSelectFields = {
  id: true,
  email: true,
  username: true,
  name: true,
  avatarUrl: true,
  xp: true,
  level: true,
  neuralPoints: true,
  currentStreak: true,
  longestStreak: true,
  totalSessions: true,
  createdAt: true,
} as const;

export async function register(
  email: string,
  username: string,
  password: string,
  name?: string
) {
  // Check if email or username already taken
  const existing = await prisma.user.findFirst({
    where: {
      OR: [{ email }, { username }],
    },
    select: { id: true, email: true, username: true },
  });

  if (existing) {
    if (existing.email === email) {
      throw new AppError('Email already in use', 409, 'DUPLICATE');
    }
    throw new AppError('Username already taken', 409, 'DUPLICATE');
  }

  const passwordHash = await hashPassword(password);

  // Create user + BrainProfile + BattleRecord in a transaction
  const user = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        email,
        username,
        name,
        passwordHash,
      },
      select: userSelectFields,
    });

    await tx.brainProfile.create({
      data: { userId: newUser.id },
    });

    await tx.battleRecord.create({
      data: { userId: newUser.id },
    });

    return newUser;
  });

  // Sign tokens
  const accessToken = signAccessToken(user.id);
  const refreshToken = signRefreshToken(user.id);

  // Store refresh token in DB
  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: getRefreshTokenExpiry(),
    },
  });

  return { user, accessToken, refreshToken };
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { ...userSelectFields, passwordHash: true },
  });

  if (!user || !user.passwordHash) {
    throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }

  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) {
    throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }

  // Sign tokens
  const accessToken = signAccessToken(user.id);
  const refreshToken = signRefreshToken(user.id);

  // Store refresh token in DB
  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: getRefreshTokenExpiry(),
    },
  });

  // Remove passwordHash from response
  const { passwordHash: _, ...safeUser } = user;

  return { user: safeUser, accessToken, refreshToken };
}

export async function refresh(refreshToken: string) {
  const storedToken = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
  });

  if (!storedToken) {
    throw new AppError('Invalid refresh token', 401, 'INVALID_TOKEN');
  }

  if (storedToken.expiresAt < new Date()) {
    // Clean up expired token
    await prisma.refreshToken.delete({ where: { id: storedToken.id } });
    throw new AppError('Refresh token has expired', 401, 'TOKEN_EXPIRED');
  }

  // Delete old token (rotation)
  await prisma.refreshToken.delete({ where: { id: storedToken.id } });

  // Sign new access token
  const accessToken = signAccessToken(storedToken.userId);

  // Issue a new refresh token as well for rotation
  const newRefreshToken = signRefreshToken(storedToken.userId);
  await prisma.refreshToken.create({
    data: {
      token: newRefreshToken,
      userId: storedToken.userId,
      expiresAt: getRefreshTokenExpiry(),
    },
  });

  return { accessToken, refreshToken: newRefreshToken };
}

export async function logout(refreshToken: string) {
  // Delete the refresh token; ignore if it doesn't exist
  await prisma.refreshToken.deleteMany({
    where: { token: refreshToken },
  });
}

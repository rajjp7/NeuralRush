import { Server, Socket } from 'socket.io';
import { verifyAccessToken } from '../../lib/jwt.js';
import { prisma } from '../../config/db.js';
import { getLevelFromXP } from '../../lib/xp.js';

// Track scores submitted per battle: battleId -> { [userId]: score }
const battleScores = new Map<string, Record<string, number>>();

// Track disconnect timers: `${battleId}:${userId}` -> timeout
const disconnectTimers = new Map<string, NodeJS.Timeout>();

// Track connected sockets per user in a battle: `${battleId}:${userId}` -> socketId
const battleSockets = new Map<string, string>();

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

export function registerBattleSocket(io: Server): void {
  const battleNamespace = io.of('/battles');

  // Authenticate via JWT in handshake
  battleNamespace.use((socket: AuthenticatedSocket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        return next(new Error('Authentication required'));
      }

      const payload = verifyAccessToken(token);
      socket.userId = payload.userId;
      next();
    } catch {
      next(new Error('Invalid or expired token'));
    }
  });

  battleNamespace.on('connection', (socket: AuthenticatedSocket) => {
    const userId = socket.userId!;

    // ── battle:join ────────────────────────────────────────────────
    socket.on('battle:join', async (data: { battleId: string }) => {
      try {
        const { battleId } = data;

        // Verify user is participant
        const battle = await prisma.battle.findUnique({
          where: { id: battleId },
        });

        if (!battle) {
          socket.emit('error', { message: 'Battle not found' });
          return;
        }

        if (
          battle.challengerId !== userId &&
          battle.challengedId !== userId
        ) {
          socket.emit('error', {
            message: 'You are not a participant in this battle',
          });
          return;
        }

        const room = `battle:${battleId}`;
        await socket.join(room);

        // Track this socket for the battle
        const key = `${battleId}:${userId}`;
        battleSockets.set(key, socket.id);

        // If reconnecting, cancel the disconnect timer
        const timerKey = `${battleId}:${userId}`;
        if (disconnectTimers.has(timerKey)) {
          clearTimeout(disconnectTimers.get(timerKey)!);
          disconnectTimers.delete(timerKey);
        }

        socket.emit('battle:joined', { battleId });
      } catch {
        socket.emit('error', { message: 'Failed to join battle' });
      }
    });

    // ── battle:progress ────────────────────────────────────────────
    socket.on(
      'battle:progress',
      (data: { battleId: string; progress: unknown }) => {
        const { battleId, progress } = data;
        const room = `battle:${battleId}`;

        // Forward to opponent only (exclude sender)
        socket.to(room).emit('battle:progress', {
          userId,
          progress,
        });
      }
    );

    // ── battle:complete ────────────────────────────────────────────
    socket.on(
      'battle:complete',
      async (data: { battleId: string; score: number }) => {
        try {
          const { battleId, score } = data;

          // Initialize scores map for this battle if needed
          if (!battleScores.has(battleId)) {
            battleScores.set(battleId, {});
          }

          const scores = battleScores.get(battleId)!;
          scores[userId] = score;

          // Get battle to know the participants
          const battle = await prisma.battle.findUnique({
            where: { id: battleId },
          });

          if (!battle) {
            socket.emit('error', { message: 'Battle not found' });
            return;
          }

          if (battle.status !== 'ACTIVE') {
            socket.emit('error', { message: 'Battle is not active' });
            return;
          }

          const bothDone =
            scores[battle.challengerId] !== undefined &&
            scores[battle.challengedId] !== undefined;

          if (!bothDone) {
            // Notify opponent that this user has finished
            const room = `battle:${battleId}`;
            socket.to(room).emit('battle:opponent-complete', { userId });
            return;
          }

          // Both users have submitted scores — determine winner
          const challengerScore = scores[battle.challengerId];
          const challengedScore = scores[battle.challengedId];

          let winnerId: string | null = null;
          if (challengerScore > challengedScore) {
            winnerId = battle.challengerId;
          } else if (challengedScore > challengerScore) {
            winnerId = battle.challengedId;
          }
          // Tie: winnerId stays null (draw)

          // Update battle in DB
          const completedBattle = await prisma.battle.update({
            where: { id: battleId },
            data: {
              status: 'COMPLETE',
              challengerScore,
              challengedScore,
              winnerId,
              completedAt: new Date(),
            },
            include: {
              challenger: {
                select: {
                  id: true,
                  username: true,
                  name: true,
                  avatarUrl: true,
                },
              },
              challenged: {
                select: {
                  id: true,
                  username: true,
                  name: true,
                  avatarUrl: true,
                },
              },
            },
          });

          // Update BattleRecords for both users
          const XP_REWARD = 150;
          const NP_REWARD = 40;

          for (const playerId of [
            battle.challengerId,
            battle.challengedId,
          ]) {
            const isWinner = winnerId === playerId;
            const isDraw = winnerId === null;

            await prisma.battleRecord.upsert({
              where: { userId: playerId },
              create: {
                userId: playerId,
                wins: isWinner ? 1 : 0,
                losses: !isWinner && !isDraw ? 1 : 0,
                draws: isDraw ? 1 : 0,
                winStreak: isWinner ? 1 : 0,
                totalXpWon: isWinner ? XP_REWARD : 0,
              },
              update: {
                wins: isWinner ? { increment: 1 } : undefined,
                losses:
                  !isWinner && !isDraw ? { increment: 1 } : undefined,
                draws: isDraw ? { increment: 1 } : undefined,
                winStreak: isWinner
                  ? { increment: 1 }
                  : isDraw
                    ? undefined
                    : 0,
                totalXpWon: isWinner
                  ? { increment: XP_REWARD }
                  : undefined,
              },
            });
          }

          // Award XP and NP to winner
          if (winnerId) {
            const winner = await prisma.user.update({
              where: { id: winnerId },
              data: {
                xp: { increment: XP_REWARD },
                totalXpEarned: { increment: XP_REWARD },
                neuralPoints: { increment: NP_REWARD },
              },
            });

            // Recalculate level
            const newLevel = getLevelFromXP(winner.xp);
            if (newLevel !== winner.level) {
              await prisma.user.update({
                where: { id: winnerId },
                data: { level: newLevel },
              });
            }
          }

          // Emit result to both users in the room
          const room = `battle:${battleId}`;
          battleNamespace.to(room).emit('battle:result', {
            battle: completedBattle,
            challengerScore,
            challengedScore,
            winnerId,
            isDraw: winnerId === null,
            xpReward: XP_REWARD,
            npReward: NP_REWARD,
          });

          // Cleanup
          battleScores.delete(battleId);
        } catch {
          socket.emit('error', { message: 'Failed to complete battle' });
        }
      }
    );

    // ── disconnect ─────────────────────────────────────────────────
    socket.on('disconnect', () => {
      // Find all battles this socket was in
      for (const [key, socketId] of battleSockets.entries()) {
        if (socketId !== socket.id) continue;

        const [battleId] = key.split(':');
        const timerKey = key; // `${battleId}:${userId}`

        // Start 30-second forfeit timer
        const timer = setTimeout(async () => {
          try {
            const battle = await prisma.battle.findUnique({
              where: { id: battleId },
            });

            if (!battle || battle.status !== 'ACTIVE') {
              disconnectTimers.delete(timerKey);
              battleSockets.delete(key);
              return;
            }

            // Other user wins by forfeit
            const forfeitWinnerId =
              battle.challengerId === userId
                ? battle.challengedId
                : battle.challengerId;

            const completedBattle = await prisma.battle.update({
              where: { id: battleId },
              data: {
                status: 'COMPLETE',
                winnerId: forfeitWinnerId,
                completedAt: new Date(),
              },
              include: {
                challenger: {
                  select: {
                    id: true,
                    username: true,
                    name: true,
                    avatarUrl: true,
                  },
                },
                challenged: {
                  select: {
                    id: true,
                    username: true,
                    name: true,
                    avatarUrl: true,
                  },
                },
              },
            });

            // Award winner
            const XP_REWARD = 150;
            const NP_REWARD = 40;

            await prisma.battleRecord.upsert({
              where: { userId: forfeitWinnerId },
              create: {
                userId: forfeitWinnerId,
                wins: 1,
                winStreak: 1,
                totalXpWon: XP_REWARD,
              },
              update: {
                wins: { increment: 1 },
                winStreak: { increment: 1 },
                totalXpWon: { increment: XP_REWARD },
              },
            });

            // Record loss for disconnected user
            await prisma.battleRecord.upsert({
              where: { userId },
              create: {
                userId,
                losses: 1,
              },
              update: {
                losses: { increment: 1 },
                winStreak: 0,
              },
            });

            const winner = await prisma.user.update({
              where: { id: forfeitWinnerId },
              data: {
                xp: { increment: XP_REWARD },
                totalXpEarned: { increment: XP_REWARD },
                neuralPoints: { increment: NP_REWARD },
              },
            });

            const newLevel = getLevelFromXP(winner.xp);
            if (newLevel !== winner.level) {
              await prisma.user.update({
                where: { id: forfeitWinnerId },
                data: { level: newLevel },
              });
            }

            // Notify remaining user
            const room = `battle:${battleId}`;
            battleNamespace.to(room).emit('battle:result', {
              battle: completedBattle,
              winnerId: forfeitWinnerId,
              forfeit: true,
              disconnectedUserId: userId,
              xpReward: XP_REWARD,
              npReward: NP_REWARD,
            });

            // Cleanup
            battleScores.delete(battleId);
          } catch (err) {
            console.error('Forfeit timer error:', err);
          } finally {
            disconnectTimers.delete(timerKey);
            battleSockets.delete(key);
          }
        }, 30_000); // 30 seconds

        disconnectTimers.set(timerKey, timer);
      }
    });
  });
}

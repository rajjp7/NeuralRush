import { prisma } from '../../config/db.js';
import { AppError } from '../../middleware/errorHandler.js';

// ─── Join Waitlist ──────────────────────────────────────────────────

export async function joinWaitlist(email: string) {
  // Check if email already exists
  const existing = await prisma.waitlist.findUnique({
    where: { email },
    select: { email: true, position: true },
  });

  if (existing) {
    return { email: existing.email, position: existing.position };
  }

  // Create new entry
  const entry = await prisma.waitlist.create({
    data: { email },
    select: { email: true, position: true },
  });

  return { email: entry.email, position: entry.position };
}

// ─── Get Waitlist Count ─────────────────────────────────────────────

export async function getWaitlistCount() {
  const count = await prisma.waitlist.count();
  return { count };
}

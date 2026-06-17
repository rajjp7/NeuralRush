import rateLimit from 'express-rate-limit';

/** Register: 10 per hour per IP */
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { message: 'Too many registration attempts. Try again later.', code: 'RATE_LIMITED' },
  },
});

/** Login: 10 per 15 minutes per IP */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { message: 'Too many login attempts. Try again later.', code: 'RATE_LIMITED' },
  },
});

/** Waitlist: 5 per hour per IP */
export const waitlistLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { message: 'Too many waitlist requests. Try again later.', code: 'RATE_LIMITED' },
  },
});

/** General API: 100 per 15 minutes */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { message: 'Too many requests. Slow down.', code: 'RATE_LIMITED' },
  },
});

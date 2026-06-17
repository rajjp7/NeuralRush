import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { waitlistLimiter } from '../../middleware/rateLimiter.js';
import { joinWaitlistSchema } from './schema.js';
import { joinWaitlistHandler, getWaitlistCountHandler } from './controller.js';

const router = Router();

// POST / — Join the waitlist (rate-limited, validated, no auth)
router.post('/', waitlistLimiter, validate(joinWaitlistSchema, 'body'), joinWaitlistHandler);

// GET /count — Get total waitlist count (no auth)
router.get('/count', getWaitlistCountHandler);

export default router;

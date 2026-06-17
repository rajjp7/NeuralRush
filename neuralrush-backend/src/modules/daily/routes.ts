import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { completeDailySchema } from './schema.js';
import { getTodayChallengeHandler, completeDailyHandler } from './controller.js';

const router = Router();

// GET / — Get today's daily challenge
router.get('/', authenticate, getTodayChallengeHandler);

// POST /complete — Complete today's daily challenge
router.post('/complete', authenticate, validate(completeDailySchema, 'body'), completeDailyHandler);

export default router;

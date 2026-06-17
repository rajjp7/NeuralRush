import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { leaderboardQuerySchema } from './schema.js';
import * as leaderboardController from './controller.js';

const router = Router();

router.get('/', authenticate, validate(leaderboardQuerySchema, 'query'), leaderboardController.getLeaderboard);

export default router;

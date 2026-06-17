import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { createClanSchema, clanIdParamSchema } from './schema.js';
import * as clanController from './controller.js';

const router = Router();

// POST / — Create a new clan
router.post(
  '/',
  authenticate,
  validate(createClanSchema, 'body'),
  clanController.createClan
);

// GET /:id — Get clan details with members
router.get(
  '/:id',
  authenticate,
  validate(clanIdParamSchema, 'params'),
  clanController.getClan
);

// POST /:id/join — Join a public clan
router.post(
  '/:id/join',
  authenticate,
  validate(clanIdParamSchema, 'params'),
  clanController.joinClan
);

// POST /:id/leave — Leave a clan
router.post(
  '/:id/leave',
  authenticate,
  validate(clanIdParamSchema, 'params'),
  clanController.leaveClan
);

// GET /:id/leaderboard — Get clan leaderboard
router.get(
  '/:id/leaderboard',
  authenticate,
  validate(clanIdParamSchema, 'params'),
  clanController.getClanLeaderboard
);

export default router;

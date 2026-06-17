import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { createBattleSchema, battleIdParamSchema } from './schema.js';
import * as battleController from './controller.js';

const router = Router();

// POST / — Create a new battle challenge
router.post(
  '/',
  authenticate,
  validate(createBattleSchema, 'body'),
  battleController.createBattle
);

// GET /my — Get my battles
router.get('/my', authenticate, battleController.getMyBattles);

// GET /:id — Get a specific battle
router.get(
  '/:id',
  authenticate,
  validate(battleIdParamSchema, 'params'),
  battleController.getBattle
);

// PATCH /:id/accept — Accept a battle challenge
router.patch(
  '/:id/accept',
  authenticate,
  validate(battleIdParamSchema, 'params'),
  battleController.acceptBattle
);

// PATCH /:id/decline — Decline a battle challenge
router.patch(
  '/:id/decline',
  authenticate,
  validate(battleIdParamSchema, 'params'),
  battleController.declineBattle
);

export default router;

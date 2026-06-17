import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { submitSessionSchema, sessionsQuerySchema } from './schema.js';
import { submitSessionHandler, getSessionsHandler } from './controller.js';

const router = Router();

router.post(
  '/sessions',
  authenticate,
  validate(submitSessionSchema, 'body'),
  submitSessionHandler,
);

router.get(
  '/sessions',
  authenticate,
  validate(sessionsQuerySchema, 'query'),
  getSessionsHandler,
);

export default router;

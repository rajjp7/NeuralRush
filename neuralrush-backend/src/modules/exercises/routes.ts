import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { getExercisesQuery } from './schema.js';
import { getExercisesHandler } from './controller.js';

const router = Router();

router.get(
  '/',
  authenticate,
  validate(getExercisesQuery, 'query'),
  getExercisesHandler,
);

export default router;

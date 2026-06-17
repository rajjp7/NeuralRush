import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import * as achievementsController from './controller.js';

const router = Router();

router.get('/', authenticate, achievementsController.getAllAchievements);
router.get('/me', authenticate, achievementsController.getMyAchievements);

export default router;

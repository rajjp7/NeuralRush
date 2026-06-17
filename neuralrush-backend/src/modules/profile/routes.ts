import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import * as profileController from './controller.js';

const router = Router();

router.get('/me', authenticate, profileController.getBrainProfile);
router.get('/brain', authenticate, profileController.getBrainProfile);
router.get('/brain/history', authenticate, profileController.getBrainHistory);

export default router;

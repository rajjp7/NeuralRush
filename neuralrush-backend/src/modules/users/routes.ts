import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { updateProfileSchema, usernameParamSchema } from './schema.js';
import * as usersController from './controller.js';

const router = Router();

router.get('/me', authenticate, usersController.getMe);
router.patch('/me', authenticate, validate(updateProfileSchema), usersController.updateMe);
router.get('/me/stats', authenticate, usersController.getMyStats);
router.get('/:username', authenticate, validate(usernameParamSchema, 'params'), usersController.getPublicProfile);

export default router;

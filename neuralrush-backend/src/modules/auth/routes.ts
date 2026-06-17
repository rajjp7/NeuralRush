import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { registerLimiter, loginLimiter } from '../../middleware/rateLimiter.js';
import { registerSchema, loginSchema, refreshSchema, logoutSchema } from './schema.js';
import * as authController from './controller.js';

const router = Router();

router.post('/register', registerLimiter, validate(registerSchema), authController.register);
router.post('/login', loginLimiter, validate(loginSchema), authController.login);
router.post('/refresh', validate(refreshSchema), authController.refresh);
router.post('/logout', validate(logoutSchema), authController.logout);

export default router;

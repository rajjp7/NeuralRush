import { Router } from 'express';
import { register, login } from '../controllers/auth.controllers';
import { validateRequest } from '../middlewares/validate';
import { registerSchema, loginSchema } from '../models/auth.schema';

const router = Router();

router.post('/register', validateRequest(registerSchema), register);

router.post('/login', validateRequest(loginSchema), login);

export default router;
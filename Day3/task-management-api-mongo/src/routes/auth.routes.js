import { Router } from 'express';
import { validateBody } from '../middleware/validate.js';
import { loginSchema, refreshSchema } from '../utils/schemas.js';
import { login, refresh } from '../controllers/auth.controller.js';

export const authRouter = Router();

authRouter.post('/login', validateBody(loginSchema), login);
authRouter.post('/refresh', validateBody(refreshSchema), refresh);


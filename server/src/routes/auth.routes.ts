import { Router } from 'express';
import { register, login, me, updateUser, deleteUser } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const authRouter = Router();

authRouter.post('/register', register);
authRouter.post('/login', login);
authRouter.get('/me', authMiddleware, me);
authRouter.put('/me', authMiddleware, updateUser);
authRouter.delete('/me', authMiddleware, deleteUser);

export { authRouter };
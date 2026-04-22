import { Router } from 'express';
import { createLog, deleteLog, getLogs } from '../controllers/logs.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const logsRouter = Router();

logsRouter.use(authMiddleware);
logsRouter.get('/', getLogs);
logsRouter.post('/', createLog);
logsRouter.delete('/', deleteLog);

export { logsRouter };
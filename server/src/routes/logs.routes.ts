import { createLog, deleteLog } from '../controllers/logs.controller';
import {authMiddleware} from "../middleware/auth.middleware";
import {Router} from "express";

const logsRouter = Router();
logsRouter.use(authMiddleware);
logsRouter.post('/', createLog);
logsRouter.delete('/', deleteLog);

export { logsRouter };
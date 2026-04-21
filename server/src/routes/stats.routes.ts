import { overview, habitStats } from '../controllers/stats.controller';
import {authMiddleware} from "../middleware/auth.middleware";
import {Router} from "express";

const statsRouter = Router();
statsRouter.use(authMiddleware);
statsRouter.get('/overview', overview);
statsRouter.get('/habits/:id', habitStats);

export { statsRouter };
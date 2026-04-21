import { getGoals, getGoal, createGoal, updateGoal, deleteGoal } from '../controllers/goals.controller';
import {authMiddleware} from "../middleware/auth.middleware";
import {Router} from "express";

const goalsRouter = Router();
goalsRouter.use(authMiddleware);
goalsRouter.get('/', getGoals);
goalsRouter.get('/:id', getGoal);
goalsRouter.post('/', createGoal);
goalsRouter.put('/:id', updateGoal);
goalsRouter.delete('/:id', deleteGoal);

export { goalsRouter };
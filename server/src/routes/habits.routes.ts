import { getHabits, getHabit, createHabit, updateHabit, deleteHabit } from '../controllers/habits.controller';
import {authMiddleware} from "../middleware/auth.middleware";
import {Router} from "express";

const habitsRouter = Router();
habitsRouter.use(authMiddleware);
habitsRouter.get('/', getHabits);
habitsRouter.get('/:id', getHabit);
habitsRouter.post('/', createHabit);
habitsRouter.put('/:id', updateHabit);
habitsRouter.delete('/:id', deleteHabit);

export { habitsRouter };
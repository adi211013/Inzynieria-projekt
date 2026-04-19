import { Router } from 'express';
import { getHabits, getHabit, createHabit, updateHabit, deleteHabit } from '../controllers/habits.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', getHabits);
router.get('/:id', getHabit);
router.post('/', createHabit);
router.put('/:id', updateHabit);
router.delete('/:id', deleteHabit);

export default router;
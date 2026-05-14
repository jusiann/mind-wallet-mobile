import { Router } from 'express';
import {
    createGoal,
    getGoals,
    getGoal,
    updateGoal,
    deleteGoal,
} from '../controllers/goals.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import { createRateLimiter } from '../utils/rate.limiter.js';

const router = Router();

const goalLimiter = createRateLimiter(30);

router.post('/', authMiddleware, goalLimiter, createGoal);
router.get('/', authMiddleware, getGoals);
router.get('/:id', authMiddleware, getGoal);
router.put('/:id', authMiddleware, updateGoal);
router.delete('/:id', authMiddleware, deleteGoal);

export default router;

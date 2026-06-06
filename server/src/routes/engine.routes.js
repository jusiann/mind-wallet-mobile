import { Router } from 'express';
import { chat, action } from '../controllers/engine.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import { createRateLimiter } from '../utils/rate.limiter.js';

const router = Router();

const engineLimiter = createRateLimiter(100);

router.post('/chat', authMiddleware, engineLimiter, chat);
router.post('/action', authMiddleware, engineLimiter, action);

export default router;

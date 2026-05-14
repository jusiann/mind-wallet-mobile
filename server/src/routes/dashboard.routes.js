import { Router } from 'express';
import { getDashboard } from '../controllers/dashboard.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', authMiddleware, getDashboard);

export default router;

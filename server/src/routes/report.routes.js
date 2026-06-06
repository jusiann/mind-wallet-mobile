import express from 'express';
import authMiddleware from '../middlewares/auth.middleware.js';
import { getMonthlyReport } from '../controllers/report.controller.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/monthly', getMonthlyReport);

export default router;

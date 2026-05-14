import { Router } from 'express';
import {
    createTransaction,
    getTransactions,
    getTransaction,
    updateTransaction,
    deleteTransaction,
    exportTransactions,
} from '../controllers/transaction.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import { createRateLimiter } from '../utils/rate.limiter.js';

const router = Router();

const transactionLimiter = createRateLimiter(30);

router.post('/', authMiddleware, transactionLimiter, createTransaction);
router.get('/export', authMiddleware, exportTransactions);
router.get('/', authMiddleware, getTransactions);
router.get('/:id', authMiddleware, getTransaction);
router.put('/:id', authMiddleware, updateTransaction);
router.delete('/:id', authMiddleware, deleteTransaction);

export default router;

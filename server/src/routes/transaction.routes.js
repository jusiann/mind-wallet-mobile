import { Router } from 'express';
import {
    getCategories,
    createTransaction,
    getTransactions,
    exportTransactions,
    getTransaction,
    updateTransaction,
    deleteTransaction,
} from '../controllers/transaction.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import { createRateLimiter } from '../utils/rate.limiter.js';

const router = Router();

const transactionLimiter = createRateLimiter(30);

router.get('/categories', getCategories);
router.post('/', authMiddleware, transactionLimiter, createTransaction);
router.get('/', authMiddleware, getTransactions);
router.get('/export', authMiddleware, exportTransactions);
router.get('/:id', authMiddleware, getTransaction);
router.put('/:id', authMiddleware, updateTransaction);
router.delete('/:id', authMiddleware, deleteTransaction);

export default router;

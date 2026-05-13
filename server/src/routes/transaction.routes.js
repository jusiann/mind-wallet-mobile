import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
    createTransaction,
    getTransactions,
    getTransaction,
    updateTransaction,
    deleteTransaction,
} from '../controllers/transaction.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const router = Router();

const transactionLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    message: { success: false, error: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});

router.post('/', authMiddleware, transactionLimiter, createTransaction);
router.get('/', authMiddleware, getTransactions);
router.get('/:id', authMiddleware, getTransaction);
router.put('/:id', authMiddleware, updateTransaction);
router.delete('/:id', authMiddleware, deleteTransaction);

export default router;

import express from 'express';
import authMiddleware from '../middlewares/auth.middleware.js';
import {
    getRecurringTransactions,
    createRecurringTransaction,
    toggleRecurringTransaction,
    deleteRecurringTransaction
} from '../controllers/recurring.controller.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', getRecurringTransactions);
router.post('/', createRecurringTransaction);
router.patch('/:id/toggle', toggleRecurringTransaction);
router.delete('/:id', deleteRecurringTransaction);

export default router;

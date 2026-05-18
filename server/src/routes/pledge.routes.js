import { Router } from 'express';
import {
    listPledges,
    resolvePledge,
    cancelPledge,
} from '../controllers/pledge.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', authMiddleware, listPledges);
router.post('/:id/resolve', authMiddleware, resolvePledge);
router.post('/:id/cancel', authMiddleware, cancelPledge);

export default router;

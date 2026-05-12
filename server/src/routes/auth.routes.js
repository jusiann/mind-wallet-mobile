import { Router } from 'express';
import {
    signUp,
    signIn,
    forgotPassword,
    checkResetCode,
    resetPassword,
    refreshToken,
    getMe,
    logout,
    deleteAccount,
} from '../controllers/auth.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/signup', signUp);
router.post('/signin', signIn);
router.post('/forgot-password', forgotPassword);
router.post('/check-reset-code', checkResetCode);
router.post('/reset-password', resetPassword);
router.post('/refresh-token', refreshToken);

router.get('/me', authMiddleware, getMe);
router.post('/logout', authMiddleware, logout);
router.delete('/delete-account', authMiddleware, deleteAccount);

export default router;

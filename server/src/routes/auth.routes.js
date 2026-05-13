import { Router } from 'express';
import rateLimit from 'express-rate-limit';
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

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { success: false, error: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});

const forgotLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 3,
    message: { success: false, error: 'Too many password reset requests, please try again in an hour.' },
    standardHeaders: true,
    legacyHeaders: false,
});

const resetCodeLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { success: false, error: 'Too many attempts, please request a new reset code.' },
    standardHeaders: true,
    legacyHeaders: false,
});

router.post('/signup', authLimiter, signUp);
router.post('/signin', authLimiter, signIn);
router.post('/forgot-password', forgotLimiter, forgotPassword);
router.post('/check-reset-code', resetCodeLimiter, checkResetCode);
router.post('/reset-password', resetPassword);
router.post('/refresh-token', authLimiter, refreshToken);

router.get('/me', authMiddleware, getMe);
router.post('/logout', authMiddleware, logout);
router.delete('/delete-account', authMiddleware, deleteAccount);

export default router;

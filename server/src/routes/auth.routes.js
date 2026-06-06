import { Router } from 'express';
import {
    signUp,
    signIn,
    forgotPassword,
    checkResetCode,
    resetPassword,
    refreshToken,
    getMe,
    updateProfile,
    changePassword,
    logout,
    deleteAccount,
    setPin,
    verifyPin,
    changePin
} from '../controllers/auth.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import { createRateLimiter } from '../utils/rate.limiter.js';

const router = Router();

const authLimiter = createRateLimiter(10);
const forgotLimiter = createRateLimiter(3, 60 * 60 * 1000, 'Too many password reset requests, please try again in an hour.');
const resetCodeLimiter = createRateLimiter(5, 15 * 60 * 1000, 'Too many attempts, please request a new reset code.');
const resetPasswordLimiter = createRateLimiter(5, 60 * 60 * 1000, 'Too many reset attempts, please try again in an hour.');

router.post('/signup', authLimiter, signUp);
router.post('/signin', authLimiter, signIn);
router.post('/forgot-password', forgotLimiter, forgotPassword);
router.post('/check-reset-code', resetCodeLimiter, checkResetCode);
router.post('/reset-password', resetPasswordLimiter, resetPassword);
router.post('/refresh-token', authLimiter, refreshToken);

router.get('/me', authMiddleware, getMe);
router.patch('/me', authMiddleware, updateProfile);
router.patch('/change-password', authMiddleware, changePassword);
router.post('/logout', authMiddleware, logout);
router.delete('/delete-account', authMiddleware, deleteAccount);

router.post('/set-pin', authMiddleware, setPin);
router.post('/verify-pin', authLimiter, verifyPin);
router.post('/change-pin', authMiddleware, changePin);

export default router;

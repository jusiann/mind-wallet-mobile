import rateLimit from 'express-rate-limit';

export const createRateLimiter = (max, windowMs = 15 * 60 * 1000, message = 'Too many requests, please try again later.') =>
    rateLimit({
        windowMs,
        max,
        message: { success: false, error: message },
        standardHeaders: true,
        legacyHeaders: false,
    });

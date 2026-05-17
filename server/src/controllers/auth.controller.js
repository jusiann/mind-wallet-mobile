import ApiError from '../utils/error.js';
import db from '../lib/db/database.js';
import { generateTokens, generateResetToken } from '../utils/jwt.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import sendEmail from '../utils/send.mail.js';

const validateEmail = (email) => {
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    if (!emailRegex.test(email))
        return 'Invalid email format. Please enter a valid email address.';
    return null;
};

const validatePassword = (password) => {
    if (password.length < 8)
        return 'Password must be at least 8 characters long.';
    if (password.length > 128)
        return 'Password must not exceed 128 characters.';
    if (!/[A-Z]/.test(password))
        return 'Password must contain at least one uppercase letter.';
    if (!/[a-z]/.test(password))
        return 'Password must contain at least one lowercase letter.';
    if (!/[0-9]/.test(password))
        return 'Password must contain at least one number.';
    return null;
};

export const signUp = async (req, res) => {
    try {
        const { fullname, email, password } = req.body;
        if (!fullname || !email || !password)
            throw ApiError.badRequest('fullname, email and password are required.');

        const emailError = validateEmail(email);
        if (emailError)
            throw ApiError.badRequest(emailError);

        if (fullname.length < 2 || fullname.length > 50)
            throw ApiError.badRequest('Full name must be between 2 and 50 characters long.');

        const passError = validatePassword(password);
        if (passError)
            throw ApiError.badRequest(passError);

        const { rows: existing } = await db.query(
            'SELECT id FROM users WHERE email = $1 LIMIT 1',
            [email.toLowerCase()],
        );
        if (existing.length > 0)
            throw ApiError.conflict('Email already exists.');

        const hashedPassword = await bcrypt.hash(password, 10);

        const { rows } = await db.query(
            'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email, total_balance, monthly_income, token_version',
            [fullname.trim(), email.toLowerCase(), hashedPassword],
        );

        const user = rows[0];
        const { accessToken, refreshToken } = generateTokens(user);

        res.status(201).json({
            success: true,
            message: 'Sign-up successful',
            access_token: accessToken,
            refresh_token: refreshToken,
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            },
        });
    } catch (error) {
        const statusCode = error.statusCode || 500;
        res.status(statusCode).json({
            success: false,
            error: error.message || 'Sign-up failed'
        });
    }
};

export const signIn = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password)
            throw ApiError.badRequest('Email and password are required.');

        const emailError = validateEmail(email);
        if (emailError)
            throw ApiError.badRequest(emailError);

        const { rows } = await db.query(
            'SELECT id, name, email, password, token_version FROM users WHERE email = $1 LIMIT 1',
            [email.toLowerCase()],
        );
        const existingUser = rows[0];

        const fallbackHash = '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa';
        const hashToCheck = existingUser?.password ?? fallbackHash;
        const isPasswordValid = await bcrypt.compare(password, hashToCheck);

        if (!existingUser || !isPasswordValid)
            throw ApiError.unauthorized('Invalid email or password.');

        const { accessToken, refreshToken } = generateTokens(existingUser);

        res.status(200).json({
            success: true,
            message: 'Sign-in successful',
            access_token: accessToken,
            refresh_token: refreshToken,
            user: {
                id: existingUser.id,
                name: existingUser.name,
                email: existingUser.email
            },
        });
    } catch (error) {
        const statusCode = error.statusCode || 500;
        res.status(statusCode).json({
            success: false,
            error: error.message || 'Sign-in failed'
        });
    }
};

export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email)
            throw ApiError.badRequest('Email is required.');

        const emailError = validateEmail(email);
        if (emailError)
            throw ApiError.badRequest(emailError);

        const { rows } = await db.query(
            'SELECT id FROM users WHERE email = $1 LIMIT 1',
            [email.toLowerCase()],
        );
        const user = rows[0];

        if (!user) {
            res.status(200).json({
                success: true,
                message: 'If this email is registered, a reset code will be sent.',
            });
            return;
        }

        const resetCode = crypto.randomBytes(4).toString('hex').toUpperCase();
        const resetCodeExpires = new Date(Date.now() + 15 * 60 * 1000);
        const hashedResetCode = await bcrypt.hash(resetCode, 10);

        await db.query(
            'UPDATE users SET reset_code = $1, reset_code_expires = $2 WHERE id = $3',
            [hashedResetCode, resetCodeExpires, user.id],
        );

        const emailSubject = 'Password Reset Code';
        const emailText = `Your password reset code is: ${resetCode}\n\nThis code expires in 15 minutes.\n\nIf you didn't request this, please ignore this email.`;
        const emailHtml = `
            <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; background-color: #F5F3FF; padding: 40px 20px; border-radius: 12px;">
                <div style="background-color: #FFFFFF; padding: 30px; border-radius: 10px; border: 1px solid #E5E7EB;">
                    <h2 style="color: #111111; margin-top: 0;">Password Reset</h2>
                    <p style="color: #555555;">Your reset code:</p>
                    <div style="background-color: #F5F3FF; padding: 20px; text-align: center; margin: 24px 0; border-radius: 8px; border: 1px dashed #7C3AED;">
                        <h1 style="color: #7C3AED; font-size: 36px; margin: 0; letter-spacing: 8px;">${resetCode}</h1>
                    </div>
                    <p style="color: #888888; font-size: 14px;">Expires in <strong style="color: #111111;">15 minutes</strong>.</p>
                    <p style="color: #888888; font-size: 14px; margin-bottom: 0;">If you didn't request this, ignore this email.</p>
                </div>
            </div>
        `;

        sendEmail(email, emailSubject, emailText, emailHtml).catch(err =>
            console.error('[forgot-password] email send failed:', err.message),
        );

        if (process.env.NODE_ENV === 'development')
            console.log(`[DEV] Reset code for ${email}: ${resetCode}`);

        res.status(200).json({
            success: true,
            message: 'If this email is registered, a reset code will be sent.',
        });
    } catch (error) {
        const statusCode = error.statusCode || 500;
        res.status(statusCode).json({
            success: false,
            error: error.message || 'Password reset failed'
        });
    }
};

export const checkResetCode = async (req, res) => {
    try {
        const { email, reset_code } = req.body;
        if (!email || !reset_code)
            throw ApiError.badRequest('Email and reset code are required.');

        const { rows } = await db.query(
            'SELECT id, email, reset_code FROM users WHERE email = $1 AND reset_code_expires > NOW() LIMIT 1',
            [email.toLowerCase()],
        );
        const user = rows[0];

        if (!user || !user.reset_code)
            throw ApiError.badRequest('Invalid or expired reset code.');

        const isCodeValid = await bcrypt.compare(reset_code.toUpperCase(), user.reset_code);
        if (!isCodeValid)
            throw ApiError.badRequest('Invalid or expired reset code.');

        await db.query(
            'UPDATE users SET reset_code = NULL, reset_code_expires = NULL WHERE id = $1',
            [user.id],
        );

        const temporary_token = generateResetToken(user);

        res.status(200).json({
            success: true,
            message: 'Reset code verified successfully',
            temporary_token,
            email: user.email,
        });
    } catch (error) {
        const statusCode = error.statusCode || 500;
        res.status(statusCode).json({
            success: false,
            error: error.message || 'Reset code verification failed'
        });
    }
};

export const resetPassword = async (req, res) => {
    try {
        const { password, temporary_token } = req.body;
        if (!password || !temporary_token)
            throw ApiError.badRequest('Password and temporary token are required.');

        const passError = validatePassword(password);
        if (passError)
            throw ApiError.badRequest(passError);

        let decoded;
        try {
            decoded = jwt.verify(temporary_token, process.env.JWT_RESET_SECRET_KEY);
        } catch (err) {
            if (err instanceof jwt.TokenExpiredError)
                throw ApiError.unauthorized('Temporary token has expired.');
            throw ApiError.unauthorized('Invalid temporary token.');
        }

        if (decoded.type !== 'reset')
            throw ApiError.unauthorized('Invalid temporary token type.');

        const { rows } = await db.query(
            'SELECT id, password FROM users WHERE id = $1 LIMIT 1',
            [decoded.userId],
        );
        const user = rows[0];
        if (!user)
            throw ApiError.notFound('User not found.');

        const isSamePassword = await bcrypt.compare(password, user.password);
        if (isSamePassword)
            throw ApiError.badRequest('New password must be different from the current password.');

        const hashedPassword = await bcrypt.hash(password, 10);
        await db.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, user.id]);

        res.status(200).json({
            success: true,
            message: 'Password reset successfully'
        });
    } catch (error) {
        const statusCode = error.statusCode || 500;
        res.status(statusCode).json({
            success: false,
            error: error.message || 'Password reset failed'
        });
    }
};

export const refreshToken = async (req, res) => {
    try {
        const { refresh_token } = req.body;
        if (!refresh_token)
            throw ApiError.unauthorized('Refresh token is required.');

        const decoded = jwt.verify(refresh_token, process.env.JWT_REFRESH_SECRET_KEY);

        const { rows } = await db.query(
            'SELECT id, name, email, token_version FROM users WHERE id = $1 LIMIT 1',
            [decoded.userId],
        );
        const user = rows[0];
        if (!user)
            throw ApiError.notFound('User not found.');

        if (decoded.tokenVersion !== user.token_version)
            throw ApiError.unauthorized('Refresh token has been invalidated.');

        const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);

        res.status(200).json({
            success: true,
            message: 'Token refreshed successfully',
            access_token: accessToken,
            refresh_token: newRefreshToken,
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            },
        });
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            res.status(401).json({
                success: false,
                error: 'Refresh token has expired'
            });
        } else if (error instanceof jwt.JsonWebTokenError) {
            res.status(403).json({
                success: false,
                error: 'Invalid refresh token'
            });
        } else {
            const statusCode = error.statusCode || 500;
            res.status(statusCode).json({
                success: false,
                error: error.message || 'Token refresh failed'
            });
        }
    }
};

export const updateProfile = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name || name.trim().length < 2 || name.trim().length > 50)
            throw ApiError.badRequest('Name must be between 2 and 50 characters.');

        const { rows } = await db.query(
            'UPDATE users SET name = $1 WHERE id = $2 RETURNING id, name, email',
            [name.trim(), req.user.id],
        );
        res.status(200).json({ success: true, user: rows[0] });
    } catch (error) {
        const statusCode = error.statusCode || 500;
        res.status(statusCode).json({ success: false, error: error.message || 'Update failed' });
    }
};

export const changePassword = async (req, res) => {
    try {
        const { current_password, new_password } = req.body;
        if (!current_password || !new_password)
            throw ApiError.badRequest('Current and new password are required.');

        const passError = validatePassword(new_password);
        if (passError) throw ApiError.badRequest(passError);

        const { rows } = await db.query('SELECT password FROM users WHERE id = $1', [req.user.id]);
        const isValid = await bcrypt.compare(current_password, rows[0].password);
        if (!isValid) throw ApiError.unauthorized('Current password is incorrect.');

        const isSame = await bcrypt.compare(new_password, rows[0].password);
        if (isSame) throw ApiError.badRequest('New password must be different from the current password.');

        const hashed = await bcrypt.hash(new_password, 10);
        await db.query('UPDATE users SET password = $1 WHERE id = $2', [hashed, req.user.id]);

        res.status(200).json({ success: true, message: 'Password changed successfully.' });
    } catch (error) {
        const statusCode = error.statusCode || 500;
        res.status(statusCode).json({ success: false, error: error.message || 'Password change failed' });
    }
};

export const getMe = async (req, res) => {
    try {
        const { rows } = await db.query(
            `SELECT u.id, u.name, u.email, u.created_at,
                    COALESCE((SELECT SUM(CASE WHEN type = 'INCOME' THEN amount ELSE -amount END)
                              FROM transactions WHERE user_id = u.id), 0) AS total_balance
             FROM users u WHERE u.id = $1 LIMIT 1`,
            [req.user.id],
        );
        const user = rows[0];
        if (!user)
            throw ApiError.notFound('User not found.');

        res.status(200).json({
            success: true,
            user
        });
    } catch (error) {
        const statusCode = error.statusCode || 500;
        res.status(statusCode).json({
            success: false,
            error: error.message || 'Failed to get user data'
        });
    }
};

export const logout = async (req, res) => {
    try {
        await db.query(
            'UPDATE users SET token_version = token_version + 1 WHERE id = $1',
            [req.user.id],
        );
        res.status(200).json({
            success: true,
            message: 'Logged out successfully.'
        });
    } catch (error) {
        const statusCode = error.statusCode || 500;
        res.status(statusCode).json({
            success: false,
            error: error.message || 'Logout failed'
        });
    }
};

export const deleteAccount = async (req, res) => {
    try {
        const { password } = req.body;
        if (!password)
            throw ApiError.badRequest('Password is required to delete your account.');

        const { rows } = await db.query(
            'SELECT id, password FROM users WHERE id = $1 LIMIT 1',
            [req.user.id],
        );
        const user = rows[0];
        if (!user)
            throw ApiError.notFound('User not found.');

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid)
            throw ApiError.unauthorized('Incorrect password.');

        await db.query('DELETE FROM users WHERE id = $1', [user.id]);

        res.status(200).json({
            success: true,
            message: 'Account deleted successfully.'
        });
    } catch (error) {
        const statusCode = error.statusCode || 500;
        res.status(statusCode).json({
            success: false,
            error: error.message || 'Account deletion failed'
        });
    }
};

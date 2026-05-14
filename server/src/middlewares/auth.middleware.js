import jwt from 'jsonwebtoken';
import ApiError from '../utils/error.js';
import db from '../lib/db/database.js';

const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.header('Authorization');
        if (!authHeader?.startsWith('Bearer '))
            throw ApiError.unauthorized('Access token is required.');

        const token = authHeader.replace('Bearer ', '');
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

        const { rows } = await db.query(
            'SELECT token_version FROM users WHERE id = $1 LIMIT 1',
            [decoded.userId],
        );
        const user = rows[0];

        if (!user || decoded.tokenVersion !== user.token_version)
            throw ApiError.unauthorized('Token has been invalidated.');

        req.user = { id: decoded.userId, email: decoded.email };
        next();
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            res.status(401).json({ success: false, error: 'Access token has expired.' });
        } else if (error instanceof jwt.JsonWebTokenError) {
            res.status(401).json({ success: false, error: 'Invalid access token.' });
        } else {
            const statusCode = error.statusCode || 500;
            res.status(statusCode).json({ success: false, error: error.message });
        }
    }
};

export default authMiddleware;

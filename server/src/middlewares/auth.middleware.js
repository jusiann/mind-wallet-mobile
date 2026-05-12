import jwt from 'jsonwebtoken';
import ApiError from '../utils/error.js';

const authMiddleware = (req, res, next) => {
    try {
        const authHeader = req.header('Authorization');
        if (!authHeader?.startsWith('Bearer '))
            throw ApiError.unauthorized('Access token is required.');

        const token = authHeader.replace('Bearer ', '');
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
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

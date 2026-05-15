import jwt from 'jsonwebtoken';

export const generateTokens = (user) => {
    const accessToken = jwt.sign(
        { userId: user.id, email: user.email, tokenVersion: user.token_version },
        process.env.JWT_SECRET_KEY,
        { expiresIn: '15m', algorithm: 'HS256' },
    );
    const refreshToken = jwt.sign(
        { userId: user.id, tokenVersion: user.token_version },
        process.env.JWT_REFRESH_SECRET_KEY,
        { expiresIn: '7d', algorithm: 'HS256' },
    );
    return { accessToken, refreshToken };
};

export const generateResetToken = (user) =>
    jwt.sign(
        { userId: user.id, email: user.email, type: 'reset' },
        process.env.JWT_RESET_SECRET_KEY,
        { expiresIn: '5m', algorithm: 'HS256' },
    );

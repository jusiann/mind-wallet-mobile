import jwt from 'jsonwebtoken';

export const generateTokens = (user) => {
    const accessToken = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET_KEY,
        { expiresIn: '15m' },
    );
    const refreshToken = jwt.sign(
        { userId: user.id },
        process.env.JWT_REFRESH_SECRET_KEY,
        { expiresIn: '7d' },
    );
    return { accessToken, refreshToken };
};

export const generateResetToken = (user) =>
    jwt.sign(
        { userId: user.id, email: user.email, type: 'reset' },
        process.env.JWT_RESET_SECRET_KEY,
        { expiresIn: '5m' },
    );

import nodemailer from 'nodemailer';
import ApiError from './error.js';

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
    },
    connectionTimeout: 8000,
    greetingTimeout: 5000,
    socketTimeout: 8000,
});

const sendEmail = async (to, subject, text, html = null) => {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
        console.warn('[EMAIL] Configuration missing, skipping send.');
        return;
    }

    try {
        await transporter.sendMail({
            from: `"${process.env.EMAIL_FROM_NAME || 'Mind Wallet'}" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            text,
            html: html || text,
        });
    } catch (error) {
        throw ApiError.badRequest('Failed to send email.');
    }
};

export default sendEmail;

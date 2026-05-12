import express from 'express';
import 'dotenv/config';
import helmet from 'helmet';
import cors from 'cors';
import swaggerJsDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { connectDB } from './src/lib/db/database.js';
import authRoutes from './src/routes/auth.routes.js';

const PORT = process.env.PORT || 3000;
const app = express();

app.use(helmet());
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:8081'],
    credentials: true,
}));
app.use(express.json({ limit: '10kb' }));

const swaggerOptions = {
    swaggerDefinition: {
        openapi: '3.0.0',
        info: {
            title: 'Mind Wallet API',
            version: '1.0.0',
            description: 'API Documentation for Mind Wallet Mobile',
        },
        servers: [{ url: `http://localhost:${PORT}` }],
        components: {
            securitySchemes: {
                bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
            },
        },
    },
    apis: ['./src/routes/*.js', './src/docs/*.yaml'],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

app.use((req, res, next) => {
    const start = Date.now();
    const originalSend = res.send;
    res.send = function (data) {
        const duration = Date.now() - start;
        const time = new Date().toLocaleTimeString('tr-TR', { hour12: false });
        console.log(`[LOG - ${time}] ${req.method} ${req.url} ${res.statusCode} ${duration}ms`);
        return originalSend.call(this, data);
    };
    next();
});

app.get('/api/health', (req, res) => {
    const time = new Date().toLocaleTimeString('tr-TR', { hour12: false });
    res.status(200).json({
        success: true,
        message: `[SERVER - ${time}] System is healthy`,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});

app.use('/api/auth', authRoutes);

app.use((req, res) => {
    res.status(404).json({ success: false, error: 'Route not found' });
});

app.use((err, req, res, next) => {
    console.error('Global error handler:', err);
    const statusCode = err.statusCode || 500;
    const message = process.env.NODE_ENV === 'production' && statusCode === 500
        ? 'Internal server error'
        : (err.message || 'Internal server error');
    res.status(statusCode).json({ success: false, error: message });
});

app.listen(PORT, async () => {
    const time = new Date().toLocaleTimeString('tr-TR', { hour12: false });
    console.log(`[SERVER - ${time}] Started on port ${PORT}`);
    await connectDB();
});

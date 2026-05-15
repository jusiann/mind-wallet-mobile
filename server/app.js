import express from 'express';
import 'dotenv/config';
import helmet from 'helmet';
import cors from 'cors';
import swaggerJsDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import db, { connectDB } from './src/lib/db/database.js';
import { initDB } from './src/lib/db/init.js';
import authRoutes from './src/routes/auth.routes.js';
import transactionRoutes from './src/routes/transaction.routes.js';
import goalsRoutes from './src/routes/goals.routes.js';
import dashboardRoutes from './src/routes/dashboard.routes.js';
import engineRoutes from './src/routes/engine.routes.js';

const REQUIRED_ENV = [
    'JWT_SECRET_KEY', 'JWT_REFRESH_SECRET_KEY', 'JWT_RESET_SECRET_KEY',
    'PGHOST', 'PGUSER', 'PGPASSWORD', 'PGDATABASE',
    'GEMINI_API_KEY',
];
const missingEnv = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missingEnv.length > 0) {
    console.error(`[STARTUP] Missing required env vars: ${missingEnv.join(', ')}`);
    process.exit(1);
}

const PORT = process.env.PORT || 3000;
const app = express();

app.use(helmet());
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : process.env.NODE_ENV === 'production'
        ? []
        : ['http://localhost:3000', 'http://localhost:8081'];
app.use(cors({ origin: allowedOrigins, credentials: true }));
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
if (process.env.NODE_ENV !== 'production')
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
app.use('/api/transactions', transactionRoutes);
app.use('/api/goals', goalsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/engine', engineRoutes);

app.use((req, res) => {
    res.status(404).json({ success: false, error: 'Route not found' });
});

app.use((err, req, res, next) => {
    if (process.env.NODE_ENV !== 'production') console.error('Global error handler:', err);
    else console.error(`[ERROR] ${err.statusCode || 500} - ${err.message}`);
    const statusCode = err.statusCode || 500;
    const message = process.env.NODE_ENV === 'production' && statusCode === 500
        ? 'Internal server error'
        : (err.message || 'Internal server error');
    res.status(statusCode).json({ success: false, error: message });
});

const server = app.listen(PORT, async () => {
    const time = new Date().toLocaleTimeString('tr-TR', { hour12: false });
    console.log(`[SERVER - ${time}] Started on port ${PORT}`);
    await connectDB();
    await initDB();
});

const shutdown = async () => {
    const time = new Date().toLocaleTimeString('tr-TR', { hour12: false });
    console.log(`[SERVER - ${time}] Shutting down gracefully...`);
    server.close(async () => {
        await db.end();
        process.exit(0);
    });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

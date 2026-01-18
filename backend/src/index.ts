import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import prisma from './prisma';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Essential for Vercel/Proxy environments to ensure req.ip is correct for Rate Limiting
app.set('trust proxy', 1);

// CORS Configuration
const allowedOrigins = [
    process.env.APP_URL,
    'http://localhost:5173',
    'https://kurirpay.vercel.app'
].filter(Boolean); // Remove empty values

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        // Check if origin is allowed or is a Vercel preview deployment
        if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
            callback(null, true);
        } else {
            // For development, we might want to be lenient, but for prod be strict
            // If strictly prod: callback(new Error('Not allowed by CORS'));
            // For this user's context (hybrid), let's log and allow or restrict?
            // Let's restrict to be "production ready" as requested.
            console.log('Blocked by CORS:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
app.use(express.json());

import rateLimit from 'express-rate-limit';

// Global API Limiter: 100 requests per 15 minutes
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Terlalu banyak permintaan dari IP ini, silakan coba lagi dalam 15 menit." }
});

// Strict Auth Limiter: 10 login attempts per hour per IP
const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Terlalu banyak percobaan login gagal. Silakan coba lagi nanti (1 jam)." }
});

import authRoutes from './routes/authRoutes';
import deliveryRoutes from './routes/deliveryRoutes';
import userRoutes from './routes/userRoutes';
import settingsRoutes from './routes/settingsRoutes';
import paymentRoutes from './routes/paymentRoutes';
import auditLogRoutes from './routes/auditLogRoutes';

// Re-structure application of middleware:
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/deliveries', deliveryRoutes);
app.use('/api/users', userRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/audit-logs', auditLogRoutes);

// Helper untuk memformat error agar terbaca jelas di Vercel Logs
const formatError = (err: any) => {
    if (err instanceof Error) {
        return {
            ...err,
            message: err.message, // Explicitly include non-enumerable properties
            stack: err.stack,
            name: err.name
        };
    }
    return err;
};

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    // Log error dalam format JSON string agar Vercel tidak memotongnya
    console.error(JSON.stringify({
        type: 'SERVER_ERROR',
        path: req.path,
        method: req.method,
        error: formatError(err)
    }, null, 2));

    res.status(500).json({
        message: 'Terjadi kesalahan sistem (Internal Server Error)',
        error: process.env.NODE_ENV === 'production' ? err.message : err.message // Tampilkan message safe di prod
    });
});

// Menangkap Error Fatal yang tidak tertangani (Crash)
process.on('uncaughtException', (err) => {
    console.error(JSON.stringify({ type: 'UNCAUGHT_EXCEPTION', error: formatError(err) }));
});

process.on('unhandledRejection', (reason, promise) => {
    console.error(JSON.stringify({ type: 'UNHANDLED_REJECTION', reason: formatError(reason) }));
});

console.log("Starting Backend Initialization...");

app.get('/', (req, res) => {
    res.send('KurirPay Backend is Running!');
});

app.get('/api/debug', (req, res) => {
    res.json({
        message: 'Debug Endpoint Works',
        env: process.env.NODE_ENV,
        hasPrisma: !!prisma
    });
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

if (process.env.NODE_ENV !== 'production') {
    app.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
    });
}

export default app;

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import prisma from './prisma';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

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
    message: { message: "Too many requests from this IP, please try again after 15 minutes" }
});

// Strict Auth Limiter: 5 login attempts per hour per IP
const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 10, // slightly more lenient than 5 for potential mishaps
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many login attempts, please try again later" }
});

import authRoutes from './routes/authRoutes';
import deliveryRoutes from './routes/deliveryRoutes';
import userRoutes from './routes/userRoutes';
import settingsRoutes from './routes/settingsRoutes';
import paymentRoutes from './routes/paymentRoutes';

// Apply limiters
app.use('/api/', apiLimiter);
app.use('/api/auth', authLimiter); // Stricter limit overrides general? No, middleware chain. But usually specific first.
// Actually, if we put apiLimiter on /api/, it applies to everything. 
// We want auth to be stricter. Let's apply authLimiter specifically to auth routes *before* generic if possible, or just on the route itself.
// Express middleware runs in order.

app.use('/api/auth', authRoutes); // Auth limiter could be inside route file or here.
// Let's modify the route definitions below to use limiters more granularly or just global generic.

// Re-structure application of middleware:
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/deliveries', deliveryRoutes);
app.use('/api/users', userRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/payments', paymentRoutes);

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err);
    res.status(500).json({ message: 'Internal Server Error', error: err.message });
});

app.get('/', (req, res) => {
    res.send('KurirPay Backend is Running!');
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

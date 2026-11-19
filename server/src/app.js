import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import path from 'path';
import { fileURLToPath } from 'url';

import config from './config/index.js';
import errorHandler from './middleware/errorHandler.js';
import { readLimiter } from './middleware/limiters.js';
import { requestId } from './utils/logger.js';
import './models/index.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import menuRoutes from './routes/menuRoutes.js';
import tableRoutes from './routes/tableRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import chatRoutes from './routes/chatRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Behind a host's proxy the client IP — and therefore every rate limit — is only
// correct when express is told to trust exactly that many hops.
app.set('trust proxy', config.trustProxy);
app.disable('x-powered-by');

// The console and the guest pages parse this JSON directly. A conditional request that
// came back 304 has no body, axios treats it as a failure, and a freshly loaded screen
// ends up empty — so API responses are never cached.
app.disable('etag');
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

app.use(requestId);

// Security headers. The API serves JSON, so the defaults are enough; cross-origin
// resource sharing is left to CORS below.
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS: a real allowlist. Requests with no Origin header (curl, health checks, native
// apps) are allowed; anything else must match CLIENT_URL / CLIENT_URLS.
const allowedOrigins = new Set(config.allowedOrigins);
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) return callback(null, true);
    return callback(new Error('Origin not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Table-Token', 'X-Request-Id'],
  exposedHeaders: ['X-Request-Id'],
  maxAge: 600,
}));

// Webhook route needs raw body for signature verification — must come before json parser
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }), (req, res, next) => {
  req.rawBody = req.body.toString();
  req.body = JSON.parse(req.rawBody);
  next();
});

// Body parsing
app.use(express.json({ limit: '256kb' }));
app.use(express.urlencoded({ extended: true, limit: '256kb' }));
app.use(cookieParser(config.cookieSecret));
app.use(compression());

// Logging
if (config.nodeEnv === 'development' && process.env.HTTP_LOG === '1') {
  app.use(morgan('dev'));
}

// Static files (generated QR images only; uploads are never user supplied today)
app.use('/qrcodes', express.static(path.join(__dirname, '../qrcodes'), { fallthrough: true }));

// Public: the base URL a phone should open for table QRs. It is a URL, never a secret.
app.get('/api/config/public', (req, res) => {
  res.json({ success: true, data: { publicUrl: config.publicClientUrl } });
});

// A generous ceiling in front of the API; each sensitive route adds its own budget.
app.use('/api/', readLimiter);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/chat', chatRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Smart Café API is running', timestamp: new Date() });
});

// Unknown API route
app.use('/api', (req, res) => {
  res.status(404).json({ success: false, message: 'Not found' });
});

// Error handler
app.use(errorHandler);

export default app;

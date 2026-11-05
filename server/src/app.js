import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { ENV } from './config/env.js';
import { ApiError } from './utils/apiError.js';
import { errorHandler } from './middleware/errorHandler.js';
import { getDBStatus } from './config/db.js';
import apiRouter from './routes/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const findDistPath = () => {
  const candidates = [
    path.resolve(process.cwd(), 'dist'),
    path.resolve(__dirname, '../../client/dist'),
    path.resolve(__dirname, '../../dist'),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return path.resolve(process.cwd(), 'dist');
};

const app = express();

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);

// CORS configuration supporting credentials (HttpOnly cookies & Bearer tokens)
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// Logging middleware
if (ENV.NODE_ENV !== 'test') {
  app.use(morgan(ENV.NODE_ENV === 'development' ? 'dev' : 'combined'));
}

// Request parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser(ENV.COOKIE_SECRET));

// Root health check convenience alias with database connection status
app.get('/health', (req, res) => {
  res.redirect('/api/v1/health');
});

app.get('/api/v1/health', (req, res) => {
  const dbStatus = getDBStatus();
  res.status(200).json({
    status: 'OK',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database: {
      connected: dbStatus.isConnected,
      host: dbStatus.host,
      name: dbStatus.name,
    },
  });
});

// Mount modular REST API v1
app.use('/api/v1', apiRouter);

// Serve frontend static assets in production mode
const clientDistPath = findDistPath();
if (fs.existsSync(clientDistPath) && process.env.NODE_ENV === 'production') {
  app.use(express.static(clientDistPath));
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Catch-all 404 handler for unmatched API routes
app.use('/api', (req, res, next) => {
  next(ApiError.notFound(`Route not found: [${req.method}] ${req.originalUrl}`));
});

// Centralized error handler
app.use(errorHandler);

export default app;

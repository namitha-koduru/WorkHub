import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { ENV } from './config/env.js';
import { ApiError } from './utils/apiError.js';
import { errorHandler } from './middleware/errorHandler.js';
import apiRouter from './routes/index.js';

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration supporting credentials (HttpOnly cookies)
app.use(
  cors({
    origin: [ENV.CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
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

// Root health check convenience alias
app.get('/health', (req, res) => {
  res.redirect('/api/v1/health');
});

// Mount modular API v1
app.use('/api/v1', apiRouter);

// Catch-all 404 handler
app.use((req, res, next) => {
  next(ApiError.notFound(`Route not found: [${req.method}] ${req.originalUrl}`));
});

// Centralized error handler
app.use(errorHandler);

export default app;


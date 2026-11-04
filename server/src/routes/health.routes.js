import { Router } from 'express';
import mongoose from 'mongoose';
import { ApiResponse } from '../utils/apiResponse.js';

const router = Router();

router.get('/health', (req, res) => {
  const dbStatus = ['disconnected', 'connected', 'connecting', 'disconnecting'][
    mongoose.connection.readyState
  ] || 'unknown';

  const healthData = {
    service: 'WorkHub API',
    status: 'UP',
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(process.uptime())}s`,
    database: {
      status: dbStatus,
      connected: mongoose.connection.readyState === 1,
    },
    version: '1.0.0',
  };

  return ApiResponse.success(res, healthData, 'WorkHub service is operational');
});

export default router;


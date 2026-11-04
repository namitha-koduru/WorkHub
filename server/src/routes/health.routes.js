import { Router } from 'express';
import mongoose from 'mongoose';
import { ApiResponse } from '../utils/apiResponse.js';
import { seedDatabase } from '../utils/seedData.js';

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

// One-click demo seed route
router.post('/seed', async (req, res, next) => {
  try {
    const result = await seedDatabase();
    return ApiResponse.success(res, result, 'Database seeded successfully with demo operations dataset.');
  } catch (error) {
    next(error);
  }
});

export default router;


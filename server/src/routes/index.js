import { Router } from 'express';
import healthRoutes from './health.routes.js';

const router = Router();

// Health check endpoint
router.use('/', healthRoutes);

// Feature routes will be mounted in upcoming phases:
// router.use('/auth', authRoutes);
// router.use('/users', userRoutes);
// router.use('/organizations', orgRoutes);
// router.use('/workspaces', workspaceRoutes);
// router.use('/rooms', roomRoutes);
// router.use('/tasks', taskRoutes);
// router.use('/schedules', scheduleRoutes);
// router.use('/daily-plans', dailyPlanRoutes);
// router.use('/comments', commentRoutes);
// router.use('/suggestions', suggestionRoutes);
// router.use('/approvals', approvalRoutes);
// router.use('/notifications', notificationRoutes);
// router.use('/activities', activityRoutes);
// router.use('/reports', reportRoutes);

export default router;


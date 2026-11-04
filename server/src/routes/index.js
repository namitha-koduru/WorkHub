import { Router } from 'express';
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import orgRoutes from './org.routes.js';
import workspaceRoutes from './workspace.routes.js';
import teamRoutes from './team.routes.js';
import roomRoutes from './room.routes.js';
import taskRoutes from './task.routes.js';
import checkpointRoutes from './checkpoint.routes.js';
import scheduleRoutes from './schedule.routes.js';
import dailyPlanRoutes from './dailyPlan.routes.js';
import commentRoutes from './comment.routes.js';
import suggestionRoutes from './suggestion.routes.js';
import approvalRoutes from './approval.routes.js';
import announcementRoutes from './announcement.routes.js';
import notificationRoutes from './notification.routes.js';
import activityRoutes from './activity.routes.js';
import reportRoutes from './report.routes.js';

const router = Router();

// Infrastructure & health
router.use('/', healthRoutes);

// Core Modules
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/organizations', orgRoutes);
router.use('/workspaces', workspaceRoutes);
router.use('/teams', teamRoutes);
router.use('/rooms', roomRoutes);
router.use('/tasks', taskRoutes);
router.use('/checkpoints', checkpointRoutes);
router.use('/schedules', scheduleRoutes);
router.use('/daily-plans', dailyPlanRoutes);
router.use('/comments', commentRoutes);
router.use('/suggestions', suggestionRoutes);
router.use('/approvals', approvalRoutes);
router.use('/announcements', announcementRoutes);
router.use('/notifications', notificationRoutes);
router.use('/activities', activityRoutes);
router.use('/reports', reportRoutes);

export default router;

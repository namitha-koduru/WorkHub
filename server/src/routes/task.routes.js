import { Router } from 'express';
import {
  createTask,
  getTasks,
  getMyTasks,
  getTaskById,
  updateTask,
  updateTaskStatus,
  deleteTask,
} from '../controllers/task.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createTaskSchema,
  updateTaskSchema,
  updateTaskStatusSchema,
} from '../validations/index.js';

const router = Router();

router.use(authenticate);

router.post('/', validate(createTaskSchema), createTask);
router.get('/', getTasks);
router.get('/my-tasks', getMyTasks);
router.get('/:taskId', getTaskById);
router.put('/:taskId', validate(updateTaskSchema), updateTask);
router.patch('/:taskId/status', validate(updateTaskStatusSchema), updateTaskStatus);
router.delete('/:taskId', deleteTask);

export default router;


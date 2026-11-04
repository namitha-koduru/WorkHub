import { Router } from 'express';
import {
  createSchedule,
  getPersonalSchedules,
  updateSchedule,
  deleteSchedule,
} from '../controllers/schedule.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createScheduleSchema } from '../validations/index.js';

const router = Router();

router.use(authenticate);

router.post('/', validate(createScheduleSchema), createSchedule);
router.get('/personal', getPersonalSchedules);
router.put('/:scheduleId', updateSchedule);
router.delete('/:scheduleId', deleteSchedule);

export default router;


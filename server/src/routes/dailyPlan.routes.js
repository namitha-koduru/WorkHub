import { Router } from 'express';
import {
  saveDailyPlan,
  getMyDailyPlan,
  getRoomDailyPlans,
  getDailyPlanHistory,
} from '../controllers/dailyPlan.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { saveDailyPlanSchema } from '../validations/index.js';

const router = Router();

router.use(authenticate);

router.post('/', validate(saveDailyPlanSchema), saveDailyPlan);
router.get('/me', getMyDailyPlan);
router.get('/room/:roomId', getRoomDailyPlans);
router.get('/history', getDailyPlanHistory);

export default router;


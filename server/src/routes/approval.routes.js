import { Router } from 'express';
import {
  submitForApproval,
  decideApproval,
  getApprovalHistory,
} from '../controllers/approval.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  submitApprovalSchema,
  decideApprovalSchema,
} from '../validations/index.js';

const router = Router();

router.use(authenticate);

router.post('/submit', validate(submitApprovalSchema), submitForApproval);
router.post('/:approvalId/decide', validate(decideApprovalSchema), decideApproval);
router.get('/task/:taskId', getApprovalHistory);

export default router;


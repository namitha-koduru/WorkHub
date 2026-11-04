import { Router } from 'express';
import {
  createCheckpoint,
  updateCheckpoint,
  deleteCheckpoint,
} from '../controllers/checkpoint.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createCheckpointSchema, updateCheckpointSchema } from '../validations/index.js';

const router = Router();

router.use(authenticate);

router.post('/', validate(createCheckpointSchema), createCheckpoint);
router.patch('/:checkpointId', validate(updateCheckpointSchema), updateCheckpoint);
router.delete('/:checkpointId', deleteCheckpoint);

export default router;


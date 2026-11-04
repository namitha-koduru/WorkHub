import { Router } from 'express';
import {
  createComment,
  getComments,
  deleteComment,
} from '../controllers/comment.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createCommentSchema } from '../validations/index.js';

const router = Router();

router.use(authenticate);

router.post('/', validate(createCommentSchema), createComment);
router.get('/', getComments);
router.delete('/:commentId', deleteComment);

export default router;


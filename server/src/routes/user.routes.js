import { Router } from 'express';
import { updateProfile, changePassword, searchUsers } from '../controllers/user.controller.js';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import { updateProfileSchema, changePasswordSchema } from '../validations/index.js';

const router = Router();

router.use(authenticate);

router.put('/profile', validate(updateProfileSchema), updateProfile);
router.put('/change-password', validate(changePasswordSchema), changePassword);
router.get('/search', searchUsers);

export default router;


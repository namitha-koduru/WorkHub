import { Router } from 'express';
import {
  createAnnouncement,
  getAnnouncements,
  deleteAnnouncement,
} from '../controllers/announcement.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createAnnouncementSchema } from '../validations/index.js';

const router = Router();

router.use(authenticate);

router.post('/', validate(createAnnouncementSchema), createAnnouncement);
router.get('/', getAnnouncements);
router.delete('/:announcementId', deleteAnnouncement);

export default router;


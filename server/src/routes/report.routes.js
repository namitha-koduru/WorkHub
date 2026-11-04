import { Router } from 'express';
import {
  getPersonalReport,
  getRoomReport,
  getWorkspaceReport,
  getOrgReport,
} from '../controllers/report.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/personal', getPersonalReport);
router.get('/room/:roomId', getRoomReport);
router.get('/workspace/:workspaceId', getWorkspaceReport);
router.get('/organization/:orgId', getOrgReport);

export default router;


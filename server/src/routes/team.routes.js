import { Router } from 'express';
import {
  createTeam,
  getTeams,
  getTeamById,
  updateTeam,
  getTeamMembers,
  addTeamMember,
  removeTeamMember,
  getTeamCalendar,
} from '../controllers/team.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requireTeamAccess, requireWorkspaceAccess } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import {
  createTeamSchema,
  updateTeamSchema,
  addTeamMemberSchema,
} from '../validations/index.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

router.use(authenticate);

router.post(
  '/',
  validate(createTeamSchema),
  requireWorkspaceAccess([ROLES.WORKSPACE_MANAGER]),
  createTeam
);

router.get('/', getTeams);

router.get('/:teamId', requireTeamAccess(), getTeamById);

router.put(
  '/:teamId',
  requireTeamAccess([ROLES.TEAM_LEADER]),
  validate(updateTeamSchema),
  updateTeam
);

router.get('/:teamId/members', requireTeamAccess(), getTeamMembers);

router.post(
  '/:teamId/members',
  requireTeamAccess([ROLES.TEAM_LEADER]),
  validate(addTeamMemberSchema),
  addTeamMember
);

router.delete(
  '/:teamId/members/:userId',
  requireTeamAccess([ROLES.TEAM_LEADER]),
  removeTeamMember
);

router.get('/:teamId/calendar', requireTeamAccess(), getTeamCalendar);

export default router;


import { Router } from 'express';
import {
  createWorkspace,
  getWorkspaces,
  getWorkspaceById,
  updateWorkspace,
  archiveWorkspace,
  getWorkspaceMembers,
  addWorkspaceMember,
  removeWorkspaceMember,
  getWorkspaceCalendar,
  searchWorkspaces,
  getWorkspaceByCodeOrId,
  submitJoinRequest,
  getWorkspaceJoinRequests,
  decideWorkspaceJoinRequest,
} from '../controllers/workspace.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requireOrgRole, requireWorkspaceAccess } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import {
  createWorkspaceSchema,
  updateWorkspaceSchema,
  addWorkspaceMemberSchema,
  submitJoinRequestSchema,
  decideJoinRequestSchema,
} from '../validations/index.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

router.use(authenticate);

// Search & Discover Workspaces (placed before :workspaceId)
router.get('/search', searchWorkspaces);
router.get('/invite/:codeOrId', getWorkspaceByCodeOrId);

router.post(
  '/',
  validate(createWorkspaceSchema),
  requireOrgRole([ROLES.ORG_OWNER, ROLES.ORG_ADMIN]),
  createWorkspace
);

router.get('/', getWorkspaces);

router.get('/:workspaceId', requireWorkspaceAccess(), getWorkspaceById);
router.put(
  '/:workspaceId',
  requireWorkspaceAccess([ROLES.WORKSPACE_MANAGER]),
  validate(updateWorkspaceSchema),
  updateWorkspace
);
router.put(
  '/:workspaceId/archive',
  requireWorkspaceAccess([ROLES.WORKSPACE_MANAGER]),
  archiveWorkspace
);

// Member Management
router.get('/:workspaceId/members', requireWorkspaceAccess(), getWorkspaceMembers);
router.post(
  '/:workspaceId/members',
  requireWorkspaceAccess([ROLES.WORKSPACE_MANAGER]),
  validate(addWorkspaceMemberSchema),
  addWorkspaceMember
);
router.delete(
  '/:workspaceId/members/:userId',
  requireWorkspaceAccess([ROLES.WORKSPACE_MANAGER]),
  removeWorkspaceMember
);

// Join Requests Management
router.post(
  '/:workspaceId/join-request',
  validate(submitJoinRequestSchema),
  submitJoinRequest
);
router.get(
  '/:workspaceId/join-requests',
  requireWorkspaceAccess([ROLES.WORKSPACE_MANAGER]),
  getWorkspaceJoinRequests
);
router.patch(
  '/:workspaceId/join-requests/:requestId',
  requireWorkspaceAccess([ROLES.WORKSPACE_MANAGER]),
  validate(decideJoinRequestSchema),
  decideWorkspaceJoinRequest
);

// Calendar
router.get('/:workspaceId/calendar', requireWorkspaceAccess(), getWorkspaceCalendar);

export default router;

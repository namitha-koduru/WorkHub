import { Router } from 'express';
import {
  createOrganization,
  getMyOrganizations,
  getOrganizationById,
  updateOrganization,
  getOrganizationMembers,
  addOrganizationMember,
  updateMemberRole,
  removeMember,
} from '../controllers/org.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requireOrgRole } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import {
  createOrgSchema,
  updateOrgSchema,
  addOrgMemberSchema,
} from '../validations/index.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

router.use(authenticate);

router.post('/', validate(createOrgSchema), createOrganization);
router.get('/', getMyOrganizations);

router.get('/:orgId', requireOrgRole(), getOrganizationById);
router.put(
  '/:orgId',
  requireOrgRole([ROLES.ORG_OWNER, ROLES.ORG_ADMIN]),
  validate(updateOrgSchema),
  updateOrganization
);

router.get('/:orgId/members', requireOrgRole(), getOrganizationMembers);
router.post(
  '/:orgId/members',
  requireOrgRole([ROLES.ORG_OWNER, ROLES.ORG_ADMIN]),
  validate(addOrgMemberSchema),
  addOrganizationMember
);
router.put(
  '/:orgId/members/:userId',
  requireOrgRole([ROLES.ORG_OWNER, ROLES.ORG_ADMIN]),
  updateMemberRole
);
router.delete(
  '/:orgId/members/:userId',
  requireOrgRole([ROLES.ORG_OWNER, ROLES.ORG_ADMIN]),
  removeMember
);

export default router;


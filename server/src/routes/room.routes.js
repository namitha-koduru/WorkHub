import { Router } from 'express';
import {
  createRoom,
  getRooms,
  getRoomById,
  updateRoom,
  getRoomMembers,
  addRoomMember,
  removeRoomMember,
  getRoomCalendar,
} from '../controllers/room.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requireRoomAccess, requireWorkspaceAccess } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import {
  createRoomSchema,
  updateRoomSchema,
  addRoomMemberSchema,
} from '../validations/index.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

router.use(authenticate);

router.post(
  '/',
  validate(createRoomSchema),
  requireWorkspaceAccess([ROLES.WORKSPACE_MANAGER]),
  createRoom
);

router.get('/', getRooms);

router.get('/:roomId', requireRoomAccess(), getRoomById);
router.put(
  '/:roomId',
  requireRoomAccess([ROLES.ROOM_LEADER]),
  validate(updateRoomSchema),
  updateRoom
);

router.get('/:roomId/members', requireRoomAccess(), getRoomMembers);
router.post(
  '/:roomId/members',
  requireRoomAccess([ROLES.ROOM_LEADER]),
  validate(addRoomMemberSchema),
  addRoomMember
);
router.delete(
  '/:roomId/members/:userId',
  requireRoomAccess([ROLES.ROOM_LEADER]),
  removeRoomMember
);

router.get('/:roomId/calendar', requireRoomAccess(), getRoomCalendar);

export default router;


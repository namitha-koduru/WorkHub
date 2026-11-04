import { ActivityLog } from '../models/ActivityLog.js';
import { emitToRoom, emitToWorkspace } from './socket.service.js';

export const logActivity = async ({
  organizationId,
  workspaceId = null,
  roomId = null,
  actor,
  action,
  entityType,
  entityId = null,
  details = {},
  ipAddress = '',
}) => {
  try {
    const activity = await ActivityLog.create({
      organizationId,
      workspaceId,
      roomId,
      actor,
      action,
      entityType,
      entityId,
      details,
      ipAddress,
    });

    const populatedActivity = await ActivityLog.findById(activity._id).populate(
      'actor',
      'name email avatarUrl'
    );

    // Real-time broadcast to room or workspace
    if (roomId) {
      emitToRoom(roomId, 'activity_logged', populatedActivity);
    } else if (workspaceId) {
      emitToWorkspace(workspaceId, 'activity_logged', populatedActivity);
    }

    return populatedActivity;
  } catch (error) {
    console.error('[ActivityLog Error] Failed to log activity:', error.message);
  }
};


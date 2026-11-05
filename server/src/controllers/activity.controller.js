import { ActivityLog } from '../models/ActivityLog.js';
import { ApiResponse } from '../utils/apiResponse.js';

export const getActivities = async (req, res, next) => {
  try {
    const { workspaceId, roomId, organizationId, limit = 50 } = req.query;

    const query = {};
    if (roomId) query.roomId = roomId;
    else if (workspaceId) query.workspaceId = workspaceId;
    else if (organizationId) query.organizationId = organizationId;

    const activities = await ActivityLog.find(query)
      .populate('actor', 'name email avatarUrl title')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit, 10));

    return ApiResponse.success(res, activities);
  } catch (error) {
    next(error);
  }
};


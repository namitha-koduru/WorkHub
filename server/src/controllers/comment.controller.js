import { Comment } from '../models/Comment.js';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { logActivity } from '../services/activity.service.js';
import { ACTIVITY_ACTION, NOTIFICATION_TYPE } from '../constants/activityTypes.js';
import { createNotification } from '../services/notification.service.js';
import { emitToRoom } from '../services/socket.service.js';

export const createComment = async (req, res, next) => {
  try {
    const { targetType, targetId, organizationId, workspaceId, roomId, content, mentions = [] } =
      req.body;

    const comment = await Comment.create({
      targetType,
      targetId,
      organizationId,
      workspaceId,
      roomId,
      author: req.user._id,
      content,
      mentions,
    });

    const populated = await Comment.findById(comment._id)
      .populate('author', 'name email avatarUrl title')
      .populate('mentions', 'name email');

    await logActivity({
      organizationId,
      workspaceId,
      roomId,
      actor: req.user._id,
      action: ACTIVITY_ACTION.COMMENT_ADDED,
      entityType: targetType === 'TASK' ? 'TASK' : 'ROOM',
      entityId: targetId,
      details: { snippet: content.slice(0, 50) },
    });

    // Notify mentioned members
    for (const mentionUserId of mentions) {
      if (String(mentionUserId) !== String(req.user._id)) {
        await createNotification({
          recipient: mentionUserId,
          sender: req.user._id,
          organizationId,
          workspaceId,
          roomId,
          type: NOTIFICATION_TYPE.COMMENT_MENTION,
          title: 'You were mentioned',
          message: `${req.user.name} mentioned you in a comment.`,
        });
      }
    }

    emitToRoom(roomId, 'comment_created', populated);

    return ApiResponse.created(res, populated, 'Comment posted.');
  } catch (error) {
    next(error);
  }
};

export const getComments = async (req, res, next) => {
  try {
    const { targetId, targetType } = req.query;
    if (!targetId) {
      return next(ApiError.badRequest('Target ID is required'));
    }

    const query = { targetId };
    if (targetType) query.targetType = targetType;

    const comments = await Comment.find(query)
      .populate('author', 'name email avatarUrl title')
      .populate('mentions', 'name email')
      .sort({ createdAt: 1 });

    return ApiResponse.success(res, comments);
  } catch (error) {
    next(error);
  }
};

export const deleteComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;
    const comment = await Comment.findById(commentId);

    if (!comment) {
      return next(ApiError.notFound('Comment not found'));
    }

    if (String(comment.author) !== String(req.user._id) && !req.isOrgAdmin) {
      return next(ApiError.forbidden('You can only delete your own comments.'));
    }

    await Comment.findByIdAndDelete(commentId);

    emitToRoom(comment.roomId, 'comment_deleted', { commentId });

    return ApiResponse.success(res, null, 'Comment deleted.');
  } catch (error) {
    next(error);
  }
};


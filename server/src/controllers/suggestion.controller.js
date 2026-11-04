import { Suggestion } from '../models/Suggestion.js';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { logActivity } from '../services/activity.service.js';
import { ACTIVITY_ACTION, NOTIFICATION_TYPE } from '../constants/activityTypes.js';
import { createNotification } from '../services/notification.service.js';
import { emitToRoom } from '../services/socket.service.js';

export const createSuggestion = async (req, res, next) => {
  try {
    const { roomId, workspaceId, organizationId, title, description } = req.body;

    const suggestion = await Suggestion.create({
      roomId,
      workspaceId,
      organizationId,
      author: req.user._id,
      title,
      description,
    });

    const populated = await Suggestion.findById(suggestion._id).populate(
      'author',
      'name email avatarUrl title'
    );

    await logActivity({
      organizationId,
      workspaceId,
      roomId,
      actor: req.user._id,
      action: ACTIVITY_ACTION.SUGGESTION_CREATED,
      entityType: 'SUGGESTION',
      entityId: suggestion._id,
      details: { title: suggestion.title },
    });

    emitToRoom(roomId, 'suggestion_created', populated);

    return ApiResponse.created(res, populated, 'Suggestion submitted successfully.');
  } catch (error) {
    next(error);
  }
};

export const getSuggestions = async (req, res, next) => {
  try {
    const { roomId, status } = req.query;
    if (!roomId) {
      return next(ApiError.badRequest('Room ID is required'));
    }

    const query = { roomId };
    if (status) query.status = status;

    const suggestions = await Suggestion.find(query)
      .populate('author', 'name email avatarUrl title')
      .populate('reviewedBy', 'name email avatarUrl')
      .sort({ createdAt: -1 });

    return ApiResponse.success(res, suggestions);
  } catch (error) {
    next(error);
  }
};

export const decideSuggestion = async (req, res, next) => {
  try {
    const { suggestionId } = req.params;
    const { status, resolutionNotes } = req.body;

    const suggestion = await Suggestion.findById(suggestionId);
    if (!suggestion) {
      return next(ApiError.notFound('Suggestion not found'));
    }

    suggestion.status = status;
    suggestion.reviewedBy = req.user._id;
    suggestion.reviewedAt = new Date();
    if (resolutionNotes) suggestion.resolutionNotes = resolutionNotes;

    await suggestion.save();

    const populated = await Suggestion.findById(suggestion._id)
      .populate('author', 'name email avatarUrl title')
      .populate('reviewedBy', 'name email avatarUrl');

    await logActivity({
      organizationId: suggestion.organizationId,
      workspaceId: suggestion.workspaceId,
      roomId: suggestion.roomId,
      actor: req.user._id,
      action:
        status === 'ACCEPTED'
          ? ACTIVITY_ACTION.SUGGESTION_ACCEPTED
          : ACTIVITY_ACTION.SUGGESTION_REJECTED,
      entityType: 'SUGGESTION',
      entityId: suggestion._id,
      details: { title: suggestion.title, status },
    });

    if (String(suggestion.author._id) !== String(req.user._id)) {
      await createNotification({
        recipient: suggestion.author._id,
        sender: req.user._id,
        organizationId: suggestion.organizationId,
        workspaceId: suggestion.workspaceId,
        roomId: suggestion.roomId,
        type: NOTIFICATION_TYPE.SUGGESTION_UPDATE,
        title: `Suggestion ${status}`,
        message: `Your suggestion "${suggestion.title}" was ${status.toLowerCase()} by ${req.user.name}.`,
      });
    }

    emitToRoom(suggestion.roomId, 'suggestion_updated', populated);

    return ApiResponse.success(res, populated, `Suggestion marked as ${status.toLowerCase()}.`);
  } catch (error) {
    next(error);
  }
};


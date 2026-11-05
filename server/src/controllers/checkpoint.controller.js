import { Checkpoint } from '../models/Checkpoint.js';
import { Task } from '../models/Task.js';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { logActivity } from '../services/activity.service.js';
import { ACTIVITY_ACTION } from '../constants/activityTypes.js';

export const createCheckpoint = async (req, res, next) => {
  try {
    const { taskId, title, description, responsibleMember, targetDate } = req.body;

    const task = await Task.findById(taskId);
    if (!task) {
      return next(ApiError.notFound('Parent task not found'));
    }

    const checkpoint = await Checkpoint.create({
      taskId,
      roomId: task.roomId,
      workspaceId: task.workspaceId,
      organizationId: task.organizationId,
      title,
      description: description || '',
      responsibleMember: responsibleMember || null,
      targetDate: targetDate || null,
    });

    const populated = await Checkpoint.findById(checkpoint._id).populate(
      'responsibleMember',
      'name email avatarUrl'
    );

    await logActivity({
      organizationId: task.organizationId,
      workspaceId: task.workspaceId,
      roomId: task.roomId,
      actor: req.user._id,
      action: ACTIVITY_ACTION.CHECKPOINT_CREATED,
      entityType: 'TASK',
      entityId: task._id,
      details: { checkpointTitle: checkpoint.title },
    });

    return ApiResponse.created(res, populated, 'Checkpoint created successfully.');
  } catch (error) {
    next(error);
  }
};

export const updateCheckpoint = async (req, res, next) => {
  try {
    const { checkpointId } = req.params;
    const { status, title, description, responsibleMember, targetDate } = req.body;

    const checkpoint = await Checkpoint.findById(checkpointId);
    if (!checkpoint) {
      return next(ApiError.notFound('Checkpoint not found'));
    }

    if (title) checkpoint.title = title;
    if (description !== undefined) checkpoint.description = description;
    if (responsibleMember !== undefined) checkpoint.responsibleMember = responsibleMember;
    if (targetDate !== undefined) checkpoint.targetDate = targetDate;

    if (status) {
      checkpoint.status = status;
      if (status === 'COMPLETED') {
        checkpoint.completedAt = new Date();
        checkpoint.completedBy = req.user._id;

        await logActivity({
          organizationId: checkpoint.organizationId,
          workspaceId: checkpoint.workspaceId,
          roomId: checkpoint.roomId,
          actor: req.user._id,
          action: ACTIVITY_ACTION.CHECKPOINT_COMPLETED,
          entityType: 'TASK',
          entityId: checkpoint.taskId,
          details: { checkpointTitle: checkpoint.title },
        });
      } else {
        checkpoint.completedAt = null;
        checkpoint.completedBy = null;
      }
    }

    await checkpoint.save();

    const populated = await Checkpoint.findById(checkpoint._id)
      .populate('responsibleMember', 'name email avatarUrl')
      .populate('completedBy', 'name email');

    return ApiResponse.success(res, populated, 'Checkpoint updated successfully.');
  } catch (error) {
    next(error);
  }
};

export const deleteCheckpoint = async (req, res, next) => {
  try {
    const { checkpointId } = req.params;
    await Checkpoint.findByIdAndDelete(checkpointId);
    return ApiResponse.success(res, null, 'Checkpoint removed.');
  } catch (error) {
    next(error);
  }
};


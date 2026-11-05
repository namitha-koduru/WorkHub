import { Approval } from '../models/Approval.js';
import { Task } from '../models/Task.js';
import { Room } from '../models/Room.js';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { logActivity } from '../services/activity.service.js';
import { ACTIVITY_ACTION, NOTIFICATION_TYPE } from '../constants/activityTypes.js';
import { createNotification } from '../services/notification.service.js';
import { emitToRoom } from '../services/socket.service.js';
import { TASK_STATUS } from '../constants/taskStatuses.js';

export const submitForApproval = async (req, res, next) => {
  try {
    const { taskId, comments } = req.body;

    const task = await Task.findById(taskId);
    if (!task) {
      return next(ApiError.notFound('Task not found'));
    }

    const room = await Room.findById(task.roomId);
    if (!room) {
      return next(ApiError.notFound('Task room not found'));
    }

    // Update task status to Under Review
    task.status = TASK_STATUS.UNDER_REVIEW;
    await task.save();

    // Create approval record
    const approval = await Approval.create({
      taskId,
      organizationId: task.organizationId,
      workspaceId: task.workspaceId,
      roomId: task.roomId,
      requester: req.user._id,
      reviewer: room.leader,
      status: 'PENDING',
      comments: comments || '',
      history: [
        {
          status: 'PENDING',
          actor: req.user._id,
          comment: comments || 'Submitted for leader review',
          timestamp: new Date(),
        },
      ],
    });

    const populated = await Approval.findById(approval._id)
      .populate('requester', 'name email avatarUrl')
      .populate('reviewer', 'name email avatarUrl')
      .populate('taskId', 'title');

    await logActivity({
      organizationId: task.organizationId,
      workspaceId: task.workspaceId,
      roomId: task.roomId,
      actor: req.user._id,
      action: ACTIVITY_ACTION.TASK_SUBMITTED_FOR_REVIEW,
      entityType: 'APPROVAL',
      entityId: approval._id,
      details: { taskTitle: task.title },
    });

    // Notify room leader
    if (room.leader && String(room.leader) !== String(req.user._id)) {
      await createNotification({
        recipient: room.leader,
        sender: req.user._id,
        organizationId: task.organizationId,
        workspaceId: task.workspaceId,
        roomId: task.roomId,
        type: NOTIFICATION_TYPE.REVIEW_REQUESTED,
        title: 'Review Requested',
        message: `${req.user.name} submitted task "${task.title}" for your approval.`,
        link: `/workspaces/${task.workspaceId}/rooms/${task.roomId}/board?taskId=${task._id}`,
      });
    }

    emitToRoom(task.roomId, 'approval_submitted', populated);

    return ApiResponse.created(res, populated, 'Task submitted for leader review.');
  } catch (error) {
    next(error);
  }
};

export const decideApproval = async (req, res, next) => {
  try {
    const { approvalId } = req.params;
    const { decision, comments } = req.body; // 'APPROVED' or 'CHANGES_REQUESTED'

    const approval = await Approval.findById(approvalId);
    if (!approval) {
      return next(ApiError.notFound('Approval record not found'));
    }

    const task = await Task.findById(approval.taskId);
    if (!task) {
      return next(ApiError.notFound('Associated task not found'));
    }

    approval.status = decision;
    approval.reviewer = req.user._id;
    approval.reviewedAt = new Date();
    approval.history.push({
      status: decision,
      actor: req.user._id,
      comment: comments || '',
      timestamp: new Date(),
    });

    await approval.save();

    // Transition task status according to specification:
    // Approved -> Completed
    // Changes Requested -> Changes Requested (or In Progress)
    if (decision === 'APPROVED') {
      task.status = TASK_STATUS.COMPLETED;
    } else {
      task.status = TASK_STATUS.CHANGES_REQUESTED;
    }
    await task.save();

    const populated = await Approval.findById(approval._id)
      .populate('requester', 'name email avatarUrl')
      .populate('reviewer', 'name email avatarUrl')
      .populate('taskId', 'title status');

    await logActivity({
      organizationId: task.organizationId,
      workspaceId: task.workspaceId,
      roomId: task.roomId,
      actor: req.user._id,
      action:
        decision === 'APPROVED'
          ? ACTIVITY_ACTION.TASK_APPROVED
          : ACTIVITY_ACTION.TASK_CHANGES_REQUESTED,
      entityType: 'APPROVAL',
      entityId: approval._id,
      details: { taskTitle: task.title, decision, comments },
    });

    // Notify requester
    await createNotification({
      recipient: approval.requester,
      sender: req.user._id,
      organizationId: task.organizationId,
      workspaceId: task.workspaceId,
      roomId: task.roomId,
      type:
        decision === 'APPROVED'
          ? NOTIFICATION_TYPE.TASK_APPROVED
          : NOTIFICATION_TYPE.CHANGES_REQUESTED,
      title: decision === 'APPROVED' ? 'Task Approved!' : 'Changes Requested on Task',
      message: `${req.user.name} ${
        decision === 'APPROVED' ? 'approved' : 'requested revisions on'
      } "${task.title}". ${comments ? `Note: "${comments}"` : ''}`,
      link: `/workspaces/${task.workspaceId}/rooms/${task.roomId}/board?taskId=${task._id}`,
    });

    emitToRoom(task.roomId, 'approval_decided', populated);

    return ApiResponse.success(res, populated, `Task has been marked as ${decision.toLowerCase()}.`);
  } catch (error) {
    next(error);
  }
};

export const getApprovalHistory = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const approvals = await Approval.find({ taskId })
      .populate('requester', 'name email avatarUrl')
      .populate('reviewer', 'name email avatarUrl')
      .populate('history.actor', 'name email avatarUrl')
      .sort({ createdAt: -1 });

    return ApiResponse.success(res, approvals);
  } catch (error) {
    next(error);
  }
};


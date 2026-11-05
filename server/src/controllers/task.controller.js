import { Task } from '../models/Task.js';
import { Checkpoint } from '../models/Checkpoint.js';
import { Room } from '../models/Room.js';
import { RoomMember } from '../models/RoomMember.js';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { logActivity } from '../services/activity.service.js';
import { ACTIVITY_ACTION, NOTIFICATION_TYPE } from '../constants/activityTypes.js';
import { createNotification } from '../services/notification.service.js';
import { emitToRoom } from '../services/socket.service.js';
import { TASK_STATUS, ALLOWED_STATUS_TRANSITIONS } from '../constants/taskStatuses.js';

export const createTask = async (req, res, next) => {
  try {
    const {
      title,
      description,
      workspaceId,
      roomId,
      assignedTo,
      collaborators = [],
      priority,
      status,
      startDate,
      dueDate,
      tags = [],
      checkpoints = [],
    } = req.body;

    const room = await Room.findById(roomId);
    if (!room) {
      return next(ApiError.notFound('Room not found'));
    }

    // Business rule: Tasks can only be assigned to eligible room members
    if (assignedTo) {
      const isMember = await RoomMember.findOne({ roomId, userId: assignedTo });
      if (!isMember) {
        return next(
          ApiError.badRequest('Assigned user must be an active member of this room.')
        );
      }
    }

    // Determine order
    const taskCount = await Task.countDocuments({ roomId, status: status || TASK_STATUS.TODO });

    const teamId = req.body.teamId || room.teamId || null;

    const task = await Task.create({
      title,
      description: description || '',
      organizationId: room.organizationId,
      workspaceId,
      teamId,
      roomId,
      createdBy: req.user._id,
      assignedTo: assignedTo || null,
      collaborators,
      priority: priority || 'Medium',
      status: status || TASK_STATUS.TODO,
      startDate: startDate || null,
      dueDate: dueDate || null,
      tags,
      order: taskCount,
    });

    // Create any initial checkpoints
    if (checkpoints.length > 0) {
      const checkpointDocs = checkpoints.map((cp) => ({
        taskId: task._id,
        roomId: room._id,
        workspaceId,
        organizationId: room.organizationId,
        title: cp.title,
        description: cp.description || '',
        targetDate: cp.targetDate || null,
        responsibleMember: cp.responsibleMember || assignedTo || null,
      }));
      await Checkpoint.insertMany(checkpointDocs);
    }

    const populated = await Task.findById(task._id)
      .populate('assignedTo', 'name email avatarUrl')
      .populate('createdBy', 'name email avatarUrl')
      .populate('collaborators', 'name email avatarUrl');

    await logActivity({
      organizationId: room.organizationId,
      workspaceId,
      roomId,
      actor: req.user._id,
      action: ACTIVITY_ACTION.TASK_CREATED,
      entityType: 'TASK',
      entityId: task._id,
      details: { title: task.title, priority: task.priority },
    });

    if (assignedTo && String(assignedTo) !== String(req.user._id)) {
      await createNotification({
        recipient: assignedTo,
        sender: req.user._id,
        organizationId: room.organizationId,
        workspaceId,
        roomId,
        type: NOTIFICATION_TYPE.TASK_ASSIGNED,
        title: 'New Task Assigned',
        message: `You were assigned task "${task.title}".`,
        link: `/workspaces/${workspaceId}/rooms/${roomId}/board?taskId=${task._id}`,
      });
    }

    emitToRoom(roomId, 'task_created', populated);

    return ApiResponse.created(res, populated, 'Task created successfully.');
  } catch (error) {
    next(error);
  }
};

export const getTasks = async (req, res, next) => {
  try {
    const { roomId, teamId, workspaceId, status, priority, search, assignedTo } = req.query;
    if (!roomId && !teamId && !workspaceId) {
      return next(ApiError.badRequest('Room ID, Team ID, or Workspace ID is required'));
    }

    const query = { isArchived: false };
    if (roomId) query.roomId = roomId;
    else if (teamId) query.teamId = teamId;
    else if (workspaceId) query.workspaceId = workspaceId;

    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (assignedTo) query.assignedTo = assignedTo;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
      ];
    }

    const tasks = await Task.find(query)
      .populate('assignedTo', 'name email avatarUrl title')
      .populate('createdBy', 'name email avatarUrl')
      .populate('collaborators', 'name email avatarUrl')
      .populate('roomId', 'name')
      .populate('teamId', 'name')
      .sort({ order: 1, createdAt: -1 });

    // Fetch checkpoint counts for each task
    const taskIds = tasks.map((t) => t._id);
    const checkpoints = await Checkpoint.find({ taskId: { $in: taskIds } });

    const enriched = tasks.map((task) => {
      const taskCps = checkpoints.filter((cp) => String(cp.taskId) === String(task._id));
      const completedCps = taskCps.filter((cp) => cp.status === 'COMPLETED').length;
      return {
        ...task.toObject(),
        checkpointCount: taskCps.length,
        completedCheckpointCount: completedCps,
      };
    });

    return ApiResponse.success(res, enriched);
  } catch (error) {
    next(error);
  }
};

export const getMyTasks = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const tasks = await Task.find({
      $or: [{ assignedTo: userId }, { collaborators: userId }],
      isArchived: false,
    })
      .populate('workspaceId', 'name slug')
      .populate('roomId', 'name slug')
      .populate('assignedTo', 'name email avatarUrl')
      .sort({ dueDate: 1, createdAt: -1 });

    return ApiResponse.success(res, tasks);
  } catch (error) {
    next(error);
  }
};

export const getTaskById = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const task = await Task.findById(taskId)
      .populate('assignedTo', 'name email avatarUrl title phone')
      .populate('createdBy', 'name email avatarUrl')
      .populate('collaborators', 'name email avatarUrl')
      .populate('roomId', 'name leader')
      .populate('workspaceId', 'name');

    if (!task || task.isArchived) {
      return next(ApiError.notFound('Task not found'));
    }

    const checkpoints = await Checkpoint.find({ taskId })
      .populate('responsibleMember', 'name email avatarUrl')
      .populate('completedBy', 'name email')
      .sort({ createdAt: 1 });

    return ApiResponse.success(res, {
      ...task.toObject(),
      checkpoints,
    });
  } catch (error) {
    next(error);
  }
};

export const updateTask = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const updates = req.body;

    const task = await Task.findById(taskId);
    if (!task) {
      return next(ApiError.notFound('Task not found'));
    }

    const oldAssignee = task.assignedTo;
    const oldDueDate = task.dueDate;

    if (updates.title) task.title = updates.title;
    if (updates.description !== undefined) task.description = updates.description;
    if (updates.priority) task.priority = updates.priority;
    if (updates.startDate !== undefined) task.startDate = updates.startDate;
    if (updates.dueDate !== undefined) task.dueDate = updates.dueDate;
    if (updates.tags) task.tags = updates.tags;
    if (updates.collaborators) task.collaborators = updates.collaborators;
    if (updates.order !== undefined) task.order = updates.order;

    if (updates.assignedTo !== undefined) {
      if (updates.assignedTo) {
        const isMember = await RoomMember.findOne({
          roomId: task.roomId,
          userId: updates.assignedTo,
        });
        if (!isMember) {
          return next(
            ApiError.badRequest('Assigned user must be an active member of this room.')
          );
        }
      }
      task.assignedTo = updates.assignedTo;
    }

    await task.save();

    const populated = await Task.findById(task._id)
      .populate('assignedTo', 'name email avatarUrl')
      .populate('createdBy', 'name email avatarUrl')
      .populate('collaborators', 'name email avatarUrl');

    // Handle notifications on assignment change
    if (
      updates.assignedTo &&
      String(updates.assignedTo) !== String(oldAssignee) &&
      String(updates.assignedTo) !== String(req.user._id)
    ) {
      await createNotification({
        recipient: updates.assignedTo,
        sender: req.user._id,
        organizationId: task.organizationId,
        workspaceId: task.workspaceId,
        roomId: task.roomId,
        type: oldAssignee ? NOTIFICATION_TYPE.TASK_REASSIGNED : NOTIFICATION_TYPE.TASK_ASSIGNED,
        title: oldAssignee ? 'Task Reassigned' : 'Task Assigned',
        message: `You were assigned to "${task.title}".`,
        link: `/workspaces/${task.workspaceId}/rooms/${task.roomId}/board?taskId=${task._id}`,
      });
    }

    // Handle notification on deadline change
    if (
      updates.dueDate &&
      oldDueDate &&
      new Date(updates.dueDate).getTime() !== new Date(oldDueDate).getTime() &&
      task.assignedTo &&
      String(task.assignedTo) !== String(req.user._id)
    ) {
      await createNotification({
        recipient: task.assignedTo,
        sender: req.user._id,
        organizationId: task.organizationId,
        workspaceId: task.workspaceId,
        roomId: task.roomId,
        type: NOTIFICATION_TYPE.DEADLINE_CHANGED,
        title: 'Task Deadline Changed',
        message: `Deadline for "${task.title}" updated to ${new Date(updates.dueDate).toLocaleDateString()}.`,
        link: `/workspaces/${task.workspaceId}/rooms/${task.roomId}/board?taskId=${task._id}`,
      });
    }

    emitToRoom(task.roomId, 'task_updated', populated);

    return ApiResponse.success(res, populated, 'Task updated successfully.');
  } catch (error) {
    next(error);
  }
};

export const updateTaskStatus = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const { status } = req.body;

    const task = await Task.findById(taskId);
    if (!task) {
      return next(ApiError.notFound('Task not found'));
    }

    const previousStatus = task.status;
    task.status = status;
    await task.save();

    await logActivity({
      organizationId: task.organizationId,
      workspaceId: task.workspaceId,
      roomId: task.roomId,
      actor: req.user._id,
      action: ACTIVITY_ACTION.TASK_STATUS_CHANGED,
      entityType: 'TASK',
      entityId: task._id,
      details: {
        from: previousStatus,
        to: status,
        taskTitle: task.title,
      },
    });

    const populated = await Task.findById(task._id)
      .populate('assignedTo', 'name email avatarUrl')
      .populate('createdBy', 'name email avatarUrl');

    emitToRoom(task.roomId, 'task_status_changed', {
      taskId: task._id,
      from: previousStatus,
      to: status,
      task: populated,
    });

    return ApiResponse.success(res, populated, 'Task status updated.');
  } catch (error) {
    next(error);
  }
};

export const deleteTask = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const task = await Task.findById(taskId);

    if (!task) {
      return next(ApiError.notFound('Task not found'));
    }

    task.isArchived = true;
    await task.save();

    await logActivity({
      organizationId: task.organizationId,
      workspaceId: task.workspaceId,
      roomId: task.roomId,
      actor: req.user._id,
      action: ACTIVITY_ACTION.TASK_DELETED,
      entityType: 'TASK',
      entityId: task._id,
      details: { title: task.title },
    });

    emitToRoom(task.roomId, 'task_deleted', { taskId: task._id });

    return ApiResponse.success(res, null, 'Task deleted successfully.');
  } catch (error) {
    next(error);
  }
};


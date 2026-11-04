import { Workspace } from '../models/Workspace.js';
import { WorkspaceMember } from '../models/WorkspaceMember.js';
import { OrganizationMember } from '../models/OrganizationMember.js';
import { Room } from '../models/Room.js';
import { Task } from '../models/Task.js';
import { Schedule } from '../models/Schedule.js';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { ROLES } from '../constants/roles.js';
import { logActivity } from '../services/activity.service.js';
import { ACTIVITY_ACTION } from '../constants/activityTypes.js';

export const createWorkspace = async (req, res, next) => {
  try {
    const { organizationId, name, description, category, managers = [] } = req.body;

    const slug = `${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString().slice(-4)}`;

    const initialManagers = managers.includes(String(req.user._id))
      ? managers
      : [...managers, req.user._id];

    const workspace = await Workspace.create({
      organizationId,
      name,
      slug,
      description: description || '',
      category: category || 'Event Operations',
      managers: initialManagers,
      createdBy: req.user._id,
    });

    // Add creator as Workspace Manager
    await WorkspaceMember.create({
      workspaceId: workspace._id,
      userId: req.user._id,
      role: ROLES.WORKSPACE_MANAGER,
    });

    // Add any specified managers as Workspace Members
    for (const managerId of managers) {
      if (String(managerId) !== String(req.user._id)) {
        await WorkspaceMember.create({
          workspaceId: workspace._id,
          userId: managerId,
          role: ROLES.WORKSPACE_MANAGER,
        });
      }
    }

    await logActivity({
      organizationId,
      workspaceId: workspace._id,
      actor: req.user._id,
      action: ACTIVITY_ACTION.WORKSPACE_CREATED,
      entityType: 'WORKSPACE',
      entityId: workspace._id,
      details: { name: workspace.name },
    });

    return ApiResponse.created(res, workspace, 'Workspace created successfully.');
  } catch (error) {
    next(error);
  }
};

export const getWorkspaces = async (req, res, next) => {
  try {
    const { orgId } = req.query;
    if (!orgId) {
      return next(ApiError.badRequest('Organization ID is required'));
    }

    // Check if user is Org Owner or Org Admin
    const orgMembership = await OrganizationMember.findOne({
      organizationId: orgId,
      userId: req.user._id,
      status: 'ACTIVE',
    });

    let workspaces;
    if (orgMembership && [ROLES.ORG_OWNER, ROLES.ORG_ADMIN].includes(orgMembership.role)) {
      // Org Admins see all workspaces in the org
      workspaces = await Workspace.find({ organizationId: orgId })
        .populate('managers', 'name email avatarUrl')
        .sort({ updatedAt: -1 });
    } else {
      // Regular members see workspaces they belong to
      const myMemberships = await WorkspaceMember.find({ userId: req.user._id });
      const wsIds = myMemberships.map((m) => m.workspaceId);

      workspaces = await Workspace.find({
        _id: { $in: wsIds },
        organizationId: orgId,
      })
        .populate('managers', 'name email avatarUrl')
        .sort({ updatedAt: -1 });
    }

    // Attach summary room and task stats
    const enriched = await Promise.all(
      workspaces.map(async (ws) => {
        const roomCount = await Room.countDocuments({ workspaceId: ws._id, isArchived: false });
        const taskCount = await Task.countDocuments({ workspaceId: ws._id, isArchived: false });
        const completedTaskCount = await Task.countDocuments({
          workspaceId: ws._id,
          status: 'Completed',
          isArchived: false,
        });

        return {
          ...ws.toObject(),
          roomCount,
          taskCount,
          completedTaskCount,
          progress: taskCount > 0 ? Math.round((completedTaskCount / taskCount) * 100) : 0,
        };
      })
    );

    return ApiResponse.success(res, enriched);
  } catch (error) {
    next(error);
  }
};

export const getWorkspaceById = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;
    const workspace = await Workspace.findById(workspaceId)
      .populate('managers', 'name email avatarUrl title')
      .populate('createdBy', 'name email avatarUrl');

    if (!workspace) {
      return next(ApiError.notFound('Workspace not found'));
    }

    // Metrics
    const roomCount = await Room.countDocuments({ workspaceId, isArchived: false });
    const totalTasks = await Task.countDocuments({ workspaceId, isArchived: false });
    const completedTasks = await Task.countDocuments({
      workspaceId,
      status: 'Completed',
      isArchived: false,
    });
    const pendingTasks = await Task.countDocuments({
      workspaceId,
      status: { $in: ['To Do', 'In Progress', 'Under Review', 'Changes Requested'] },
      isArchived: false,
    });
    const overdueTasks = await Task.countDocuments({
      workspaceId,
      dueDate: { $lt: new Date() },
      status: { $ne: 'Completed' },
      isArchived: false,
    });

    return ApiResponse.success(res, {
      ...workspace.toObject(),
      metrics: {
        roomCount,
        totalTasks,
        completedTasks,
        pendingTasks,
        overdueTasks,
        progress: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateWorkspace = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;
    const { name, description, category, managers, status } = req.body;

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return next(ApiError.notFound('Workspace not found'));
    }

    if (name) workspace.name = name;
    if (description !== undefined) workspace.description = description;
    if (category) workspace.category = category;
    if (managers) workspace.managers = managers;
    if (status) workspace.status = status;

    await workspace.save();

    return ApiResponse.success(res, workspace, 'Workspace updated successfully.');
  } catch (error) {
    next(error);
  }
};

export const archiveWorkspace = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;
    const workspace = await Workspace.findById(workspaceId);

    if (!workspace) {
      return next(ApiError.notFound('Workspace not found'));
    }

    const newStatus = workspace.status === 'ARCHIVED' ? 'ACTIVE' : 'ARCHIVED';
    workspace.status = newStatus;
    await workspace.save();

    await logActivity({
      organizationId: workspace.organizationId,
      workspaceId: workspace._id,
      actor: req.user._id,
      action:
        newStatus === 'ARCHIVED'
          ? ACTIVITY_ACTION.WORKSPACE_ARCHIVED
          : ACTIVITY_ACTION.WORKSPACE_RESTORED,
      entityType: 'WORKSPACE',
      entityId: workspace._id,
    });

    return ApiResponse.success(res, workspace, `Workspace ${newStatus.toLowerCase()} successfully.`);
  } catch (error) {
    next(error);
  }
};

export const getWorkspaceMembers = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;
    const members = await WorkspaceMember.find({ workspaceId })
      .populate('userId', 'name email avatarUrl title phone')
      .sort({ createdAt: -1 });

    const formatted = members.map((m) => ({
      _id: m._id,
      user: m.userId,
      role: m.role,
      joinedAt: m.joinedAt,
    }));

    return ApiResponse.success(res, formatted);
  } catch (error) {
    next(error);
  }
};

export const addWorkspaceMember = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;
    const { userId, role } = req.body;

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return next(ApiError.notFound('Workspace not found'));
    }

    // Ensure user is an organization member first
    const isOrgMember = await OrganizationMember.findOne({
      organizationId: workspace.organizationId,
      userId,
      status: 'ACTIVE',
    });

    if (!isOrgMember) {
      return next(
        ApiError.badRequest('User must be an active organization member before joining a workspace.')
      );
    }

    const existing = await WorkspaceMember.findOne({ workspaceId, userId });
    if (existing) {
      existing.role = role || ROLES.WORKSPACE_MEMBER;
      await existing.save();
      return ApiResponse.success(res, existing, 'Workspace member role updated.');
    }

    const member = await WorkspaceMember.create({
      workspaceId,
      userId,
      role: role || ROLES.WORKSPACE_MEMBER,
    });

    return ApiResponse.created(res, member, 'Member added to workspace.');
  } catch (error) {
    next(error);
  }
};

export const removeWorkspaceMember = async (req, res, next) => {
  try {
    const { workspaceId, userId } = req.params;

    await WorkspaceMember.findOneAndDelete({ workspaceId, userId });

    return ApiResponse.success(res, null, 'Member removed from workspace.');
  } catch (error) {
    next(error);
  }
};

export const getWorkspaceCalendar = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;

    // 1. Fetch all schedules in the workspace
    const schedules = await Schedule.find({ workspaceId })
      .populate('roomId', 'name')
      .populate('participants', 'name email avatarUrl');

    // 2. Fetch all tasks with due dates or start dates in the workspace
    const tasks = await Task.find({
      workspaceId,
      isArchived: false,
      $or: [{ dueDate: { $ne: null } }, { startDate: { $ne: null } }],
    })
      .populate('roomId', 'name')
      .populate('assignedTo', 'name email avatarUrl');

    // Transform into unified FullCalendar event objects
    const events = [
      ...schedules.map((s) => ({
        id: `schedule_${s._id}`,
        title: s.title,
        start: s.startTime,
        end: s.endTime,
        allDay: s.isAllDay,
        type: 'SCHEDULE',
        scheduleType: s.type,
        location: s.location,
        room: s.roomId ? { id: s.roomId._id, name: s.roomId.name } : null,
        participants: s.participants,
        color: s.type === 'MILESTONE' ? '#10b981' : s.type === 'MEETING' ? '#6366f1' : '#f59e0b',
      })),
      ...tasks.map((t) => ({
        id: `task_${t._id}`,
        title: `Task: ${t.title}`,
        start: t.startDate || t.dueDate,
        end: t.dueDate,
        allDay: true,
        type: 'TASK',
        status: t.status,
        priority: t.priority,
        room: t.roomId ? { id: t.roomId._id, name: t.roomId.name } : null,
        assignedTo: t.assignedTo,
        color:
          t.status === 'Completed'
            ? '#10b981'
            : t.priority === 'Urgent'
            ? '#ef4444'
            : t.priority === 'High'
            ? '#f59e0b'
            : '#3b82f6',
      })),
    ];

    return ApiResponse.success(res, events);
  } catch (error) {
    next(error);
  }
};


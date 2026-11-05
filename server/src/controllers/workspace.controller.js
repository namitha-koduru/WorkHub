import mongoose from 'mongoose';
import { Workspace } from '../models/Workspace.js';
import { WorkspaceMember } from '../models/WorkspaceMember.js';
import { OrganizationMember } from '../models/OrganizationMember.js';
import { WorkspaceJoinRequest } from '../models/WorkspaceJoinRequest.js';
import { User } from '../models/User.js';
import { Team } from '../models/Team.js';
import { Room } from '../models/Room.js';
import { Task } from '../models/Task.js';
import { Schedule } from '../models/Schedule.js';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { ROLES } from '../constants/roles.js';
import { logActivity } from '../services/activity.service.js';
import { ACTIVITY_ACTION, NOTIFICATION_TYPE } from '../constants/activityTypes.js';
import { createNotification } from '../services/notification.service.js';

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
        const teamCount = await Team.countDocuments({ workspaceId: ws._id, isArchived: false });
        const roomCount = await Room.countDocuments({ workspaceId: ws._id, isArchived: false });
        const taskCount = await Task.countDocuments({ workspaceId: ws._id, isArchived: false });
        const completedTaskCount = await Task.countDocuments({
          workspaceId: ws._id,
          status: 'Completed',
          isArchived: false,
        });

        return {
          ...ws.toObject(),
          teamCount,
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
    const teamCount = await Team.countDocuments({ workspaceId, isArchived: false });
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
        teamCount,
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
    const { userId, memberId, identifier, role } = req.body;

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return next(ApiError.notFound('Workspace not found'));
    }

    const searchKey = identifier || memberId || userId;
    if (!searchKey) {
      return next(ApiError.badRequest('Member unique ID, User ID, or email is required.'));
    }

    let targetUser = null;
    if (mongoose.Types.ObjectId.isValid(searchKey)) {
      targetUser = await User.findById(searchKey);
    }
    if (!targetUser) {
      targetUser = await User.findOne({
        $or: [
          { memberId: searchKey.toUpperCase().trim() },
          { email: searchKey.toLowerCase().trim() },
        ],
      });
    }

    if (!targetUser) {
      return next(
        ApiError.notFound(
          `No user found matching "${searchKey}". Please verify the unique Member ID or email.`
        )
      );
    }

    // Ensure user is an organization member (auto-enroll if not yet)
    let isOrgMember = await OrganizationMember.findOne({
      organizationId: workspace.organizationId,
      userId: targetUser._id,
      status: 'ACTIVE',
    });

    if (!isOrgMember) {
      isOrgMember = await OrganizationMember.create({
        organizationId: workspace.organizationId,
        userId: targetUser._id,
        role: ROLES.ORG_MEMBER,
        status: 'ACTIVE',
      });
    }

    const existing = await WorkspaceMember.findOne({ workspaceId, userId: targetUser._id });
    if (existing) {
      existing.role = role || ROLES.WORKSPACE_MEMBER;
      await existing.save();
      const populated = await WorkspaceMember.findById(existing._id).populate(
        'userId',
        'name email avatarUrl title memberId'
      );
      return ApiResponse.success(res, populated, 'Workspace member role updated.');
    }

    const member = await WorkspaceMember.create({
      workspaceId,
      userId: targetUser._id,
      role: role || ROLES.WORKSPACE_MEMBER,
    });

    // Mark any pending join requests as APPROVED
    await WorkspaceJoinRequest.updateMany(
      { workspaceId, userId: targetUser._id, status: 'PENDING' },
      { status: 'APPROVED', reviewedBy: req.user._id, reviewedAt: new Date() }
    );

    // Notify user
    createNotification({
      recipient: targetUser._id,
      sender: req.user._id,
      organizationId: workspace.organizationId,
      workspaceId: workspace._id,
      type: NOTIFICATION_TYPE.SYSTEM_ALERT,
      title: 'Added to Workspace',
      message: `You were added to workspace "${workspace.name}".`,
      link: `/app/workspaces/${workspace._id}/overview`,
    }).catch(() => {});

    const populated = await WorkspaceMember.findById(member._id).populate(
      'userId',
      'name email avatarUrl title memberId'
    );
    return ApiResponse.created(res, populated, 'Member added to workspace successfully.');
  } catch (error) {
    next(error);
  }
};

export const searchWorkspaces = async (req, res, next) => {
  try {
    const { q, orgId } = req.query;
    const filter = { status: 'ACTIVE' };

    if (orgId) {
      filter.organizationId = orgId;
    }

    if (q && q.trim()) {
      filter.$or = [
        { name: { $regex: q.trim(), $options: 'i' } },
        { description: { $regex: q.trim(), $options: 'i' } },
        { category: { $regex: q.trim(), $options: 'i' } },
        { inviteCode: q.trim().toUpperCase() },
      ];
    }

    const workspaces = await Workspace.find(filter)
      .populate('managers', 'name email avatarUrl title')
      .populate('organizationId', 'name slug')
      .sort({ createdAt: -1 })
      .limit(30);

    const enriched = await Promise.all(
      workspaces.map(async (ws) => {
        const isMember = await WorkspaceMember.exists({
          workspaceId: ws._id,
          userId: req.user._id,
        });
        const hasPendingRequest = await WorkspaceJoinRequest.exists({
          workspaceId: ws._id,
          userId: req.user._id,
          status: 'PENDING',
        });
        const memberCount = await WorkspaceMember.countDocuments({ workspaceId: ws._id });
        const roomCount = await Room.countDocuments({ workspaceId: ws._id, isArchived: false });
        const teamCount = await Team.countDocuments({ workspaceId: ws._id, isArchived: false });

        return {
          ...ws.toObject(),
          memberCount,
          roomCount,
          teamCount,
          isMember: !!isMember,
          hasPendingRequest: !!hasPendingRequest,
        };
      })
    );

    return ApiResponse.success(res, enriched);
  } catch (error) {
    next(error);
  }
};

export const getWorkspaceByCodeOrId = async (req, res, next) => {
  try {
    const { codeOrId } = req.params;
    let workspace = null;

    if (mongoose.Types.ObjectId.isValid(codeOrId)) {
      workspace = await Workspace.findById(codeOrId)
        .populate('managers', 'name email avatarUrl title')
        .populate('organizationId', 'name slug');
    }

    if (!workspace) {
      workspace = await Workspace.findOne({ inviteCode: codeOrId.toUpperCase().trim() })
        .populate('managers', 'name email avatarUrl title')
        .populate('organizationId', 'name slug');
    }

    if (!workspace) {
      return next(ApiError.notFound('Workspace not found or invalid invite link.'));
    }

    const isMember = await WorkspaceMember.exists({
      workspaceId: workspace._id,
      userId: req.user._id,
    });
    const hasPendingRequest = await WorkspaceJoinRequest.exists({
      workspaceId: workspace._id,
      userId: req.user._id,
      status: 'PENDING',
    });
    const memberCount = await WorkspaceMember.countDocuments({ workspaceId: workspace._id });
    const teamCount = await Team.countDocuments({ workspaceId: workspace._id, isArchived: false });

    return ApiResponse.success(res, {
      ...workspace.toObject(),
      memberCount,
      teamCount,
      isMember: !!isMember,
      hasPendingRequest: !!hasPendingRequest,
    });
  } catch (error) {
    next(error);
  }
};

export const submitJoinRequest = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;
    const { message = '' } = req.body;

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return next(ApiError.notFound('Workspace not found'));
    }

    // Check if user is already a member
    const isMember = await WorkspaceMember.findOne({ workspaceId, userId: req.user._id });
    if (isMember) {
      return next(ApiError.badRequest('You are already a member of this workspace.'));
    }

    // Check if user already has a pending join request
    const existing = await WorkspaceJoinRequest.findOne({
      workspaceId,
      userId: req.user._id,
      status: 'PENDING',
    });
    if (existing) {
      return next(
        ApiError.badRequest('You already have a pending request to join this workspace.')
      );
    }

    const joinRequest = await WorkspaceJoinRequest.create({
      workspaceId,
      organizationId: workspace.organizationId,
      userId: req.user._id,
      message,
    });

    // Notify workspace managers
    const managers = await WorkspaceMember.find({
      workspaceId,
      role: ROLES.WORKSPACE_MANAGER,
    });

    for (const mgr of managers) {
      createNotification({
        recipient: mgr.userId,
        sender: req.user._id,
        organizationId: workspace.organizationId,
        workspaceId,
        type: NOTIFICATION_TYPE.SYSTEM_ALERT,
        title: 'New Workspace Join Request',
        message: `${req.user.name} has requested to join "${workspace.name}".`,
        link: `/app/workspaces/${workspaceId}/members`,
      }).catch(() => {});
    }

    const populated = await WorkspaceJoinRequest.findById(joinRequest._id).populate(
      'userId',
      'name email avatarUrl memberId title'
    );

    return ApiResponse.created(
      res,
      populated,
      'Join request sent to workspace owner and managers.'
    );
  } catch (error) {
    next(error);
  }
};

export const getWorkspaceJoinRequests = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;
    const { status = 'PENDING' } = req.query;

    const filter = { workspaceId };
    if (status && status !== 'ALL') {
      filter.status = status;
    }

    const requests = await WorkspaceJoinRequest.find(filter)
      .populate('userId', 'name email avatarUrl title memberId phone')
      .populate('reviewedBy', 'name email')
      .sort({ createdAt: -1 });

    return ApiResponse.success(res, requests);
  } catch (error) {
    next(error);
  }
};

export const decideWorkspaceJoinRequest = async (req, res, next) => {
  try {
    const { workspaceId, requestId } = req.params;
    const { status } = req.body; // 'APPROVED' or 'REJECTED'

    const joinRequest = await WorkspaceJoinRequest.findById(requestId);
    if (!joinRequest) {
      return next(ApiError.notFound('Join request not found'));
    }

    if (joinRequest.status !== 'PENDING') {
      return next(ApiError.badRequest(`This request has already been ${joinRequest.status.toLowerCase()}.`));
    }

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return next(ApiError.notFound('Workspace not found'));
    }

    joinRequest.status = status;
    joinRequest.reviewedBy = req.user._id;
    joinRequest.reviewedAt = new Date();
    await joinRequest.save();

    if (status === 'APPROVED') {
      // Auto-enroll in OrganizationMember if not yet
      let isOrgMember = await OrganizationMember.findOne({
        organizationId: workspace.organizationId,
        userId: joinRequest.userId,
        status: 'ACTIVE',
      });

      if (!isOrgMember) {
        await OrganizationMember.create({
          organizationId: workspace.organizationId,
          userId: joinRequest.userId,
          role: ROLES.ORG_MEMBER,
          status: 'ACTIVE',
        });
      }

      // Add to WorkspaceMember
      await WorkspaceMember.findOneAndUpdate(
        { workspaceId, userId: joinRequest.userId },
        {
          workspaceId,
          userId: joinRequest.userId,
          role: ROLES.WORKSPACE_MEMBER,
        },
        { upsert: true, new: true }
      );

      // Notify requester
      createNotification({
        recipient: joinRequest.userId,
        sender: req.user._id,
        organizationId: workspace.organizationId,
        workspaceId,
        type: NOTIFICATION_TYPE.SYSTEM_ALERT,
        title: 'Join Request Approved!',
        message: `Your request to join workspace "${workspace.name}" was approved!`,
        link: `/app/workspaces/${workspaceId}/overview`,
      }).catch(() => {});
    } else {
      // Notify rejected
      createNotification({
        recipient: joinRequest.userId,
        sender: req.user._id,
        organizationId: workspace.organizationId,
        workspaceId,
        type: NOTIFICATION_TYPE.SYSTEM_ALERT,
        title: 'Join Request Declined',
        message: `Your request to join workspace "${workspace.name}" was declined.`,
      }).catch(() => {});
    }

    const populated = await WorkspaceJoinRequest.findById(joinRequest._id).populate(
      'userId',
      'name email avatarUrl memberId title'
    );

    return ApiResponse.success(res, populated, `Join request ${status.toLowerCase()} successfully.`);
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


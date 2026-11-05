import { Team } from '../models/Team.js';
import { TeamMember } from '../models/TeamMember.js';
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
import { ACTIVITY_ACTION, NOTIFICATION_TYPE } from '../constants/activityTypes.js';
import { createNotification } from '../services/notification.service.js';

export const createTeam = async (req, res, next) => {
  try {
    const { workspaceId, organizationId, name, description, responsibilities = [], leader } = req.body;

    const slug = `${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString().slice(-4)}`;

    const team = await Team.create({
      workspaceId,
      organizationId,
      name,
      slug,
      description: description || '',
      responsibilities,
      leader,
    });

    // Add leader as Team Leader
    await TeamMember.create({
      teamId: team._id,
      workspaceId,
      userId: leader,
      role: ROLES.TEAM_LEADER,
    });

    // Also add creator if different
    if (String(req.user._id) !== String(leader)) {
      await TeamMember.create({
        teamId: team._id,
        workspaceId,
        userId: req.user._id,
        role: ROLES.TEAM_LEADER,
      });
    }

    await logActivity({
      organizationId,
      workspaceId,
      actor: req.user._id,
      action: ACTIVITY_ACTION.TEAM_CREATED,
      entityType: 'WORKSPACE',
      entityId: team._id,
      details: { teamName: team.name },
    });

    await createNotification({
      recipient: leader,
      sender: req.user._id,
      organizationId,
      workspaceId,
      type: NOTIFICATION_TYPE.SYSTEM_ALERT,
      title: 'Appointed as Team Leader',
      message: `You have been appointed as the Leader for team "${team.name}".`,
      link: `/app/workspaces/${workspaceId}/teams/${team._id}`,
    });

    const populated = await Team.findById(team._id).populate('leader', 'name email avatarUrl title');

    return ApiResponse.created(res, populated, 'Team created successfully.');
  } catch (error) {
    next(error);
  }
};

export const getTeams = async (req, res, next) => {
  try {
    const { workspaceId } = req.query;
    if (!workspaceId) {
      return next(ApiError.badRequest('Workspace ID is required'));
    }

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return next(ApiError.notFound('Workspace not found'));
    }

    // Check if user is Org Admin or Workspace Manager
    const orgMembership = await OrganizationMember.findOne({
      organizationId: workspace.organizationId,
      userId: req.user._id,
      status: 'ACTIVE',
    });
    const isOrgAdmin = orgMembership && [ROLES.ORG_OWNER, ROLES.ORG_ADMIN].includes(orgMembership.role);

    const wsMembership = await WorkspaceMember.findOne({
      workspaceId,
      userId: req.user._id,
    });
    const isWsManager = wsMembership && wsMembership.role === ROLES.WORKSPACE_MANAGER;

    let teams;
    if (isOrgAdmin || isWsManager) {
      teams = await Team.find({ workspaceId, isArchived: false })
        .populate('leader', 'name email avatarUrl title')
        .sort({ createdAt: 1 });
    } else {
      // Find teams user belongs to
      const myMemberships = await TeamMember.find({ workspaceId, userId: req.user._id });
      const teamIds = myMemberships.map((m) => m.teamId);

      teams = await Team.find({
        _id: { $in: teamIds },
        workspaceId,
        isArchived: false,
      })
        .populate('leader', 'name email avatarUrl title')
        .sort({ createdAt: 1 });
    }

    // Attach rooms count, member counts, and task stats
    const enriched = await Promise.all(
      teams.map(async (t) => {
        const roomCount = await Room.countDocuments({ teamId: t._id, isArchived: false });
        const memberCount = await TeamMember.countDocuments({ teamId: t._id });
        const totalTasks = await Task.countDocuments({ teamId: t._id, isArchived: false });
        const completedTasks = await Task.countDocuments({
          teamId: t._id,
          status: 'Completed',
          isArchived: false,
        });

        return {
          ...t.toObject(),
          roomCount,
          memberCount,
          totalTasks,
          completedTasks,
          progress: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
        };
      })
    );

    return ApiResponse.success(res, enriched);
  } catch (error) {
    next(error);
  }
};

export const getTeamById = async (req, res, next) => {
  try {
    const { teamId } = req.params;
    const team = await Team.findById(teamId)
      .populate('leader', 'name email avatarUrl title')
      .populate('workspaceId', 'name slug category');

    if (!team || team.isArchived) {
      return next(ApiError.notFound('Team not found or archived'));
    }

    // Rooms under this team
    const rooms = await Room.find({ teamId, isArchived: false }).populate('leader', 'name avatarUrl');

    const memberCount = await TeamMember.countDocuments({ teamId });
    const totalTasks = await Task.countDocuments({ teamId, isArchived: false });
    const completedTasks = await Task.countDocuments({
      teamId,
      status: 'Completed',
      isArchived: false,
    });
    const overdueTasks = await Task.countDocuments({
      teamId,
      dueDate: { $lt: new Date() },
      status: { $ne: 'Completed' },
      isArchived: false,
    });

    return ApiResponse.success(res, {
      ...team.toObject(),
      rooms,
      metrics: {
        memberCount,
        roomCount: rooms.length,
        totalTasks,
        completedTasks,
        overdueTasks,
        progress: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateTeam = async (req, res, next) => {
  try {
    const { teamId } = req.params;
    const { name, description, responsibilities, leader, isArchived } = req.body;

    const team = await Team.findById(teamId);
    if (!team) {
      return next(ApiError.notFound('Team not found'));
    }

    if (name) team.name = name;
    if (description !== undefined) team.description = description;
    if (responsibilities) team.responsibilities = responsibilities;
    if (isArchived !== undefined) team.isArchived = isArchived;

    if (leader && String(leader) !== String(team.leader)) {
      team.leader = leader;
      const existing = await TeamMember.findOne({ teamId, userId: leader });
      if (existing) {
        existing.role = ROLES.TEAM_LEADER;
        await existing.save();
      } else {
        await TeamMember.create({
          teamId,
          workspaceId: team.workspaceId,
          userId: leader,
          role: ROLES.TEAM_LEADER,
        });
      }
    }

    await team.save();

    const populated = await Team.findById(team._id).populate('leader', 'name email avatarUrl');

    return ApiResponse.success(res, populated, 'Team updated successfully.');
  } catch (error) {
    next(error);
  }
};

export const getTeamMembers = async (req, res, next) => {
  try {
    const { teamId } = req.params;
    const members = await TeamMember.find({ teamId })
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

export const addTeamMember = async (req, res, next) => {
  try {
    const { teamId } = req.params;
    const { userId, role } = req.body;

    const team = await Team.findById(teamId);
    if (!team) {
      return next(ApiError.notFound('Team not found'));
    }

    // Ensure user is an active WorkspaceMember first
    const isWsMember = await WorkspaceMember.findOne({
      workspaceId: team.workspaceId,
      userId,
    });

    if (!isWsMember) {
      return next(
        ApiError.badRequest('User must be a member of the workspace before being added to this team.')
      );
    }

    const existing = await TeamMember.findOne({ teamId, userId });
    if (existing) {
      existing.role = role || ROLES.TEAM_MEMBER;
      await existing.save();
      return ApiResponse.success(res, existing, 'Team member role updated.');
    }

    const member = await TeamMember.create({
      teamId,
      workspaceId: team.workspaceId,
      userId,
      role: role || ROLES.TEAM_MEMBER,
    });

    await logActivity({
      organizationId: team.organizationId,
      workspaceId: team.workspaceId,
      actor: req.user._id,
      action: ACTIVITY_ACTION.MEMBER_ADDED,
      entityType: 'MEMBER',
      entityId: userId,
      details: { teamName: team.name, role: member.role },
    });

    return ApiResponse.created(res, member, 'Member added to team.');
  } catch (error) {
    next(error);
  }
};

export const removeTeamMember = async (req, res, next) => {
  try {
    const { teamId, userId } = req.params;

    const team = await Team.findById(teamId);
    if (String(team.leader) === String(userId)) {
      return next(ApiError.badRequest('Cannot remove the team leader. Reassign the team leader first.'));
    }

    await TeamMember.findOneAndDelete({ teamId, userId });

    return ApiResponse.success(res, null, 'Member removed from team.');
  } catch (error) {
    next(error);
  }
};

export const getTeamCalendar = async (req, res, next) => {
  try {
    const { teamId } = req.params;

    const schedules = await Schedule.find({ teamId })
      .populate('roomId', 'name')
      .populate('participants', 'name email avatarUrl');

    const tasks = await Task.find({
      teamId,
      isArchived: false,
      $or: [{ dueDate: { $ne: null } }, { startDate: { $ne: null } }],
    })
      .populate('roomId', 'name')
      .populate('assignedTo', 'name email avatarUrl');

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


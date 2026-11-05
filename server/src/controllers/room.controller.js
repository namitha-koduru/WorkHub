import { Room } from '../models/Room.js';
import { RoomMember } from '../models/RoomMember.js';
import { Team } from '../models/Team.js';
import { TeamMember } from '../models/TeamMember.js';
import { Workspace } from '../models/Workspace.js';
import { WorkspaceMember } from '../models/WorkspaceMember.js';
import { OrganizationMember } from '../models/OrganizationMember.js';
import { Task } from '../models/Task.js';
import { Schedule } from '../models/Schedule.js';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { ROLES } from '../constants/roles.js';
import { logActivity } from '../services/activity.service.js';
import { ACTIVITY_ACTION, NOTIFICATION_TYPE } from '../constants/activityTypes.js';
import { createNotification } from '../services/notification.service.js';

export const createRoom = async (req, res, next) => {
  try {
    const { teamId, workspaceId, organizationId, name, description, leader } = req.body;

    if (!teamId) {
      return next(ApiError.badRequest('Team ID is required to create a room.'));
    }

    const team = await Team.findById(teamId);
    if (!team) {
      return next(ApiError.notFound('Team not found.'));
    }

    const slug = `${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString().slice(-4)}`;

    const room = await Room.create({
      teamId,
      workspaceId,
      organizationId,
      name,
      slug,
      description: description || '',
      leader,
    });

    // Ensure leader is added to RoomMember as ROOM_LEADER
    await RoomMember.create({
      roomId: room._id,
      teamId,
      workspaceId,
      userId: leader,
      role: ROLES.ROOM_LEADER,
    });

    // Also add room creator if different
    if (String(req.user._id) !== String(leader)) {
      await RoomMember.create({
        roomId: room._id,
        teamId,
        workspaceId,
        userId: req.user._id,
        role: ROLES.ROOM_LEADER,
      });
    }

    await logActivity({
      organizationId,
      workspaceId,
      roomId: room._id,
      actor: req.user._id,
      action: ACTIVITY_ACTION.ROOM_CREATED,
      entityType: 'ROOM',
      entityId: room._id,
      details: { name: room.name, teamName: team.name },
    });

    await createNotification({
      recipient: leader,
      sender: req.user._id,
      organizationId,
      workspaceId,
      roomId: room._id,
      type: NOTIFICATION_TYPE.SYSTEM_ALERT,
      title: 'Assigned as Room Leader',
      message: `You have been appointed as the Leader for room "${room.name}" in team "${team.name}".`,
    });

    const populated = await Room.findById(room._id)
      .populate('leader', 'name email avatarUrl title')
      .populate('teamId', 'name slug');

    return ApiResponse.created(res, populated, 'Room created successfully.');
  } catch (error) {
    next(error);
  }
};

export const getRooms = async (req, res, next) => {
  try {
    const { workspaceId, teamId } = req.query;
    if (!workspaceId) {
      return next(ApiError.badRequest('Workspace ID is required'));
    }

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return next(ApiError.notFound('Workspace not found'));
    }

    // Check Org Owner / Admin status
    const orgMembership = await OrganizationMember.findOne({
      organizationId: workspace.organizationId,
      userId: req.user._id,
      status: 'ACTIVE',
    });
    const isOrgAdmin =
      orgMembership && [ROLES.ORG_OWNER, ROLES.ORG_ADMIN].includes(orgMembership.role);

    // Check Workspace Manager status
    const wsMembership = await WorkspaceMember.findOne({
      workspaceId,
      userId: req.user._id,
    });
    const isWsManager = wsMembership && wsMembership.role === ROLES.WORKSPACE_MANAGER;

    let isTeamLeader = false;
    if (teamId) {
      const tm = await TeamMember.findOne({ teamId, userId: req.user._id });
      isTeamLeader = tm && tm.role === ROLES.TEAM_LEADER;
    }

    const queryFilter = { workspaceId, isArchived: false };
    if (teamId) {
      queryFilter.teamId = teamId;
    }

    let rooms;
    if (isOrgAdmin || isWsManager || isTeamLeader) {
      rooms = await Room.find(queryFilter)
        .populate('leader', 'name email avatarUrl')
        .populate('teamId', 'name slug')
        .sort({ createdAt: 1 });
    } else {
      // Team members only see rooms they belong to
      const myMemberships = await RoomMember.find({
        workspaceId,
        userId: req.user._id,
      });
      const roomIds = myMemberships.map((m) => m.roomId);

      queryFilter._id = { $in: roomIds };
      rooms = await Room.find(queryFilter)
        .populate('leader', 'name email avatarUrl')
        .populate('teamId', 'name slug')
        .sort({ createdAt: 1 });
    }

    // Attach task metrics for each room
    const enriched = await Promise.all(
      rooms.map(async (r) => {
        const memberCount = await RoomMember.countDocuments({ roomId: r._id });
        const totalTasks = await Task.countDocuments({ roomId: r._id, isArchived: false });
        const completedTasks = await Task.countDocuments({
          roomId: r._id,
          status: 'Completed',
          isArchived: false,
        });

        return {
          ...r.toObject(),
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

export const getRoomById = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const room = await Room.findById(roomId)
      .populate('leader', 'name email avatarUrl title')
      .populate('teamId', 'name slug responsibilities leader')
      .populate('workspaceId', 'name slug category');

    if (!room || room.isArchived) {
      return next(ApiError.notFound('Room not found or archived'));
    }

    // Task count breakdown
    const totalTasks = await Task.countDocuments({ roomId, isArchived: false });
    const todoTasks = await Task.countDocuments({ roomId, status: 'To Do', isArchived: false });
    const inProgressTasks = await Task.countDocuments({
      roomId,
      status: 'In Progress',
      isArchived: false,
    });
    const underReviewTasks = await Task.countDocuments({
      roomId,
      status: 'Under Review',
      isArchived: false,
    });
    const changesRequestedTasks = await Task.countDocuments({
      roomId,
      status: 'Changes Requested',
      isArchived: false,
    });
    const completedTasks = await Task.countDocuments({
      roomId,
      status: 'Completed',
      isArchived: false,
    });

    const memberCount = await RoomMember.countDocuments({ roomId });

    return ApiResponse.success(res, {
      ...room.toObject(),
      metrics: {
        totalTasks,
        todoTasks,
        inProgressTasks,
        underReviewTasks,
        changesRequestedTasks,
        completedTasks,
        memberCount,
        progress: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateRoom = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const { name, description, leader, isArchived } = req.body;

    const room = await Room.findById(roomId);
    if (!room) {
      return next(ApiError.notFound('Room not found'));
    }

    if (name) room.name = name;
    if (description !== undefined) room.description = description;
    if (isArchived !== undefined) room.isArchived = isArchived;

    if (leader && String(leader) !== String(room.leader)) {
      room.leader = leader;
      // Ensure new leader is a RoomMember
      const existing = await RoomMember.findOne({ roomId, userId: leader });
      if (existing) {
        existing.role = ROLES.ROOM_LEADER;
        await existing.save();
      } else {
        await RoomMember.create({
          roomId,
          workspaceId: room.workspaceId,
          userId: leader,
          role: ROLES.ROOM_LEADER,
        });
      }
    }

    await room.save();

    return ApiResponse.success(res, room, 'Room updated successfully.');
  } catch (error) {
    next(error);
  }
};

export const getRoomMembers = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const members = await RoomMember.find({ roomId })
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

export const addRoomMember = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const { userId, role } = req.body;

    const room = await Room.findById(roomId);
    if (!room) {
      return next(ApiError.notFound('Room not found'));
    }

    // Ensure user is an active WorkspaceMember first
    const isWsMember = await WorkspaceMember.findOne({
      workspaceId: room.workspaceId,
      userId,
    });

    if (!isWsMember) {
      return next(
        ApiError.badRequest('User must be a member of the workspace before being added to this room.')
      );
    }

    const existing = await RoomMember.findOne({ roomId, userId });
    if (existing) {
      existing.role = role || ROLES.ROOM_MEMBER;
      await existing.save();
      return ApiResponse.success(res, existing, 'Room member role updated.');
    }

    const member = await RoomMember.create({
      roomId,
      teamId: room.teamId,
      workspaceId: room.workspaceId,
      userId,
      role: role || ROLES.ROOM_MEMBER,
    });

    await logActivity({
      organizationId: room.organizationId,
      workspaceId: room.workspaceId,
      roomId: room._id,
      actor: req.user._id,
      action: ACTIVITY_ACTION.MEMBER_ADDED,
      entityType: 'MEMBER',
      entityId: userId,
      details: { role: member.role },
    });

    return ApiResponse.created(res, member, 'Member added to room.');
  } catch (error) {
    next(error);
  }
};

export const removeRoomMember = async (req, res, next) => {
  try {
    const { roomId, userId } = req.params;

    const room = await Room.findById(roomId);
    if (String(room.leader) === String(userId)) {
      return next(ApiError.badRequest('Cannot remove the room leader. Reassign the leader first.'));
    }

    await RoomMember.findOneAndDelete({ roomId, userId });

    return ApiResponse.success(res, null, 'Member removed from room.');
  } catch (error) {
    next(error);
  }
};

export const getRoomCalendar = async (req, res, next) => {
  try {
    const { roomId } = req.params;

    const schedules = await Schedule.find({ roomId }).populate(
      'participants',
      'name email avatarUrl'
    );

    const tasks = await Task.find({
      roomId,
      isArchived: false,
      $or: [{ dueDate: { $ne: null } }, { startDate: { $ne: null } }],
    }).populate('assignedTo', 'name email avatarUrl');

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

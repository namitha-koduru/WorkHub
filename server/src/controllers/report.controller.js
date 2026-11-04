import { Task } from '../models/Task.js';
import { Workspace } from '../models/Workspace.js';
import { Team } from '../models/Team.js';
import { TeamMember } from '../models/TeamMember.js';
import { Room } from '../models/Room.js';
import { OrganizationMember } from '../models/OrganizationMember.js';
import { Schedule } from '../models/Schedule.js';
import { DailyPlan } from '../models/DailyPlan.js';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';

export const getPersonalReport = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const today = new Date().toISOString().split('T')[0];

    // Assigned tasks
    const tasks = await Task.find({ assignedTo: userId, isArchived: false })
      .populate('workspaceId', 'name')
      .populate('roomId', 'name');

    const totalAssigned = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === 'Completed').length;
    const pendingTasks = tasks.filter((t) => t.status !== 'Completed').length;
    const overdueTasks = tasks.filter(
      (t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'Completed'
    ).length;

    // Status breakdown
    const statusCounts = {
      'To Do': tasks.filter((t) => t.status === 'To Do').length,
      'In Progress': tasks.filter((t) => t.status === 'In Progress').length,
      'Under Review': tasks.filter((t) => t.status === 'Under Review').length,
      'Changes Requested': tasks.filter((t) => t.status === 'Changes Requested').length,
      'Completed': completedTasks,
    };

    // Priority breakdown
    const priorityCounts = {
      Low: tasks.filter((t) => t.priority === 'Low').length,
      Medium: tasks.filter((t) => t.priority === 'Medium').length,
      High: tasks.filter((t) => t.priority === 'High').length,
      Urgent: tasks.filter((t) => t.priority === 'Urgent').length,
    };

    // Today's schedule
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const todaySchedules = await Schedule.find({
      $or: [{ participants: userId }, { createdBy: userId }],
      startTime: { $gte: startOfToday, $lte: endOfToday },
    });

    // Today's daily plan
    const todayPlan = await DailyPlan.findOne({ userId, date: today });

    return ApiResponse.success(res, {
      kpi: {
        totalAssigned,
        completedTasks,
        pendingTasks,
        overdueTasks,
        completionRate: totalAssigned > 0 ? Math.round((completedTasks / totalAssigned) * 100) : 0,
      },
      statusDistribution: Object.entries(statusCounts).map(([name, value]) => ({ name, value })),
      priorityDistribution: Object.entries(priorityCounts).map(([name, value]) => ({
        name,
        value,
      })),
      todaySchedules,
      todayPlan,
      upcomingDeadlines: tasks
        .filter((t) => t.dueDate && t.status !== 'Completed')
        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
        .slice(0, 5),
    });
  } catch (error) {
    next(error);
  }
};

export const getWorkspaceReport = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;

    const teams = await Team.find({ workspaceId, isArchived: false }).populate('leader', 'name avatarUrl');
    const rooms = await Room.find({ workspaceId, isArchived: false });
    const tasks = await Task.find({ workspaceId, isArchived: false }).populate(
      'assignedTo',
      'name avatarUrl'
    );

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === 'Completed').length;
    const overdueTasks = tasks.filter(
      (t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'Completed'
    ).length;

    // Team-wise performance breakdown
    const teamPerformance = await Promise.all(
      teams.map(async (team) => {
        const teamTasks = tasks.filter((t) => String(t.teamId) === String(team._id));
        const teamCompleted = teamTasks.filter((t) => t.status === 'Completed').length;
        const memberCount = await TeamMember.countDocuments({ teamId: team._id });
        const roomCount = rooms.filter((r) => String(r.teamId) === String(team._id)).length;
        return {
          id: team._id,
          name: team.name,
          leader: team.leader,
          memberCount,
          roomCount,
          total: teamTasks.length,
          completed: teamCompleted,
          pending: teamTasks.length - teamCompleted,
          rate: teamTasks.length > 0 ? Math.round((teamCompleted / teamTasks.length) * 100) : 0,
        };
      })
    );

    // Room-wise performance breakdown
    const roomPerformance = rooms.map((room) => {
      const roomTasks = tasks.filter((t) => String(t.roomId) === String(room._id));
      const roomCompleted = roomTasks.filter((t) => t.status === 'Completed').length;
      return {
        id: room._id,
        name: room.name,
        total: roomTasks.length,
        completed: roomCompleted,
        pending: roomTasks.length - roomCompleted,
        rate: roomTasks.length > 0 ? Math.round((roomCompleted / roomTasks.length) * 100) : 0,
      };
    });

    // Status breakdown
    const statusDistribution = ['To Do', 'In Progress', 'Under Review', 'Changes Requested', 'Completed'].map(
      (status) => ({
        name: status,
        value: tasks.filter((t) => t.status === status).length,
      })
    );

    // Milestones (from Schedule with type MILESTONE)
    const milestones = await Schedule.find({
      workspaceId,
      type: 'MILESTONE',
    }).sort({ startTime: 1 });

    return ApiResponse.success(res, {
      kpi: {
        totalTeams: teams.length,
        totalRooms: rooms.length,
        totalTasks,
        completedTasks,
        overdueTasks,
        overallProgress: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      },
      teamPerformance,
      roomPerformance,
      statusDistribution,
      milestones,
    });
  } catch (error) {
    next(error);
  }
};

export const getRoomReport = async (req, res, next) => {
  try {
    const { roomId } = req.params;

    const tasks = await Task.find({ roomId, isArchived: false }).populate(
      'assignedTo',
      'name email avatarUrl'
    );

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === 'Completed').length;
    const overdueTasks = tasks.filter(
      (t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'Completed'
    ).length;

    // Member task allocation breakdown
    const memberMap = {};
    tasks.forEach((t) => {
      const name = t.assignedTo?.name || 'Unassigned';
      if (!memberMap[name]) {
        memberMap[name] = { name, total: 0, completed: 0 };
      }
      memberMap[name].total += 1;
      if (t.status === 'Completed') memberMap[name].completed += 1;
    });

    const memberDistribution = Object.values(memberMap);

    const statusDistribution = ['To Do', 'In Progress', 'Under Review', 'Changes Requested', 'Completed'].map(
      (status) => ({
        name: status,
        value: tasks.filter((t) => t.status === status).length,
      })
    );

    return ApiResponse.success(res, {
      kpi: {
        totalTasks,
        completedTasks,
        overdueTasks,
        progress: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      },
      statusDistribution,
      memberDistribution,
    });
  } catch (error) {
    next(error);
  }
};

export const getOrgReport = async (req, res, next) => {
  try {
    const { orgId } = req.params;

    const workspaces = await Workspace.find({ organizationId: orgId, status: 'ACTIVE' });
    const memberCount = await OrganizationMember.countDocuments({
      organizationId: orgId,
      status: 'ACTIVE',
    });

    const wsIds = workspaces.map((w) => w._id);
    const tasks = await Task.find({ workspaceId: { $in: wsIds }, isArchived: false });

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === 'Completed').length;

    const workspaceBreakdown = workspaces.map((ws) => {
      const wsTasks = tasks.filter((t) => String(t.workspaceId) === String(ws._id));
      const wsCompleted = wsTasks.filter((t) => t.status === 'Completed').length;
      return {
        name: ws.name,
        category: ws.category,
        totalTasks: wsTasks.length,
        completedTasks: wsCompleted,
        progress: wsTasks.length > 0 ? Math.round((wsCompleted / wsTasks.length) * 100) : 0,
      };
    });

    return ApiResponse.success(res, {
      kpi: {
        totalWorkspaces: workspaces.length,
        totalMembers: memberCount,
        totalTasks,
        completedTasks,
        progress: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      },
      workspaceBreakdown,
    });
  } catch (error) {
    next(error);
  }
};


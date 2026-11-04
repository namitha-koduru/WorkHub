import { Schedule } from '../models/Schedule.js';
import { Task } from '../models/Task.js';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { logActivity } from '../services/activity.service.js';
import { ACTIVITY_ACTION } from '../constants/activityTypes.js';

export const createSchedule = async (req, res, next) => {
  try {
    const {
      title,
      description,
      organizationId,
      workspaceId,
      roomId,
      type,
      startTime,
      endTime,
      isAllDay,
      location,
      participants = [],
    } = req.body;

    const initialParticipants = participants.includes(String(req.user._id))
      ? participants
      : [...participants, req.user._id];

    const schedule = await Schedule.create({
      title,
      description: description || '',
      organizationId,
      workspaceId,
      roomId: roomId || null,
      type: type || 'MEETING',
      startTime,
      endTime,
      isAllDay: !!isAllDay,
      location: location || '',
      participants: initialParticipants,
      createdBy: req.user._id,
    });

    const populated = await Schedule.findById(schedule._id)
      .populate('participants', 'name email avatarUrl')
      .populate('roomId', 'name')
      .populate('workspaceId', 'name');

    await logActivity({
      organizationId,
      workspaceId,
      roomId: roomId || null,
      actor: req.user._id,
      action: ACTIVITY_ACTION.SCHEDULE_CREATED,
      entityType: 'SCHEDULE',
      entityId: schedule._id,
      details: { title: schedule.title, type: schedule.type },
    });

    return ApiResponse.created(res, populated, 'Schedule created successfully.');
  } catch (error) {
    next(error);
  }
};

export const getPersonalSchedules = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // 1. Fetch schedules where user is participant or creator
    const schedules = await Schedule.find({
      $or: [{ participants: userId }, { createdBy: userId }],
    })
      .populate('roomId', 'name slug')
      .populate('workspaceId', 'name slug')
      .populate('participants', 'name email avatarUrl');

    // 2. Fetch tasks assigned to user with deadlines or start dates
    const tasks = await Task.find({
      assignedTo: userId,
      isArchived: false,
      $or: [{ dueDate: { $ne: null } }, { startDate: { $ne: null } }],
    })
      .populate('roomId', 'name slug')
      .populate('workspaceId', 'name slug');

    // Aggregate into unified FullCalendar event objects
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
        workspace: s.workspaceId ? { id: s.workspaceId._id, name: s.workspaceId.name } : null,
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
        workspace: t.workspaceId ? { id: t.workspaceId._id, name: t.workspaceId.name } : null,
        room: t.roomId ? { id: t.roomId._id, name: t.roomId.name } : null,
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

export const updateSchedule = async (req, res, next) => {
  try {
    const { scheduleId } = req.params;
    const schedule = await Schedule.findById(scheduleId);

    if (!schedule) {
      return next(ApiError.notFound('Schedule event not found'));
    }

    const updates = req.body;
    if (updates.title) schedule.title = updates.title;
    if (updates.description !== undefined) schedule.description = updates.description;
    if (updates.type) schedule.type = updates.type;
    if (updates.startTime) schedule.startTime = updates.startTime;
    if (updates.endTime) schedule.endTime = updates.endTime;
    if (updates.isAllDay !== undefined) schedule.isAllDay = updates.isAllDay;
    if (updates.location !== undefined) schedule.location = updates.location;
    if (updates.participants) schedule.participants = updates.participants;
    if (updates.status) schedule.status = updates.status;

    await schedule.save();

    const populated = await Schedule.findById(schedule._id)
      .populate('participants', 'name email avatarUrl')
      .populate('roomId', 'name')
      .populate('workspaceId', 'name');

    return ApiResponse.success(res, populated, 'Schedule updated successfully.');
  } catch (error) {
    next(error);
  }
};

export const deleteSchedule = async (req, res, next) => {
  try {
    const { scheduleId } = req.params;
    await Schedule.findByIdAndDelete(scheduleId);
    return ApiResponse.success(res, null, 'Schedule deleted successfully.');
  } catch (error) {
    next(error);
  }
};


import { DailyPlan } from '../models/DailyPlan.js';
import { RoomMember } from '../models/RoomMember.js';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';

export const saveDailyPlan = async (req, res, next) => {
  try {
    const { date, organizationId, workspaceId, roomId, todayWork, tomorrowPlan } = req.body;
    const userId = req.user._id;

    const plan = await DailyPlan.findOneAndUpdate(
      { userId, date },
      {
        userId,
        organizationId,
        workspaceId: workspaceId || null,
        roomId: roomId || null,
        date,
        todayWork,
        tomorrowPlan,
      },
      { upsert: true, new: true, runValidators: true }
    ).populate('userId', 'name email avatarUrl title');

    return ApiResponse.success(res, plan, 'Daily work plan saved successfully.');
  } catch (error) {
    next(error);
  }
};

export const getMyDailyPlan = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const date = req.query.date || new Date().toISOString().split('T')[0];

    const plan = await DailyPlan.findOne({ userId, date });

    return ApiResponse.success(res, plan);
  } catch (error) {
    next(error);
  }
};

export const getRoomDailyPlans = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const date = req.query.date || new Date().toISOString().split('T')[0];

    // Find all room members
    const roomMembers = await RoomMember.find({ roomId }).populate(
      'userId',
      'name email avatarUrl title'
    );

    const userIds = roomMembers.map((m) => m.userId?._id).filter(Boolean);

    // Find submitted plans for this date by room members
    const plans = await DailyPlan.find({
      userId: { $in: userIds },
      date,
    }).populate('userId', 'name email avatarUrl title');

    // Merge members with their plan status
    const result = roomMembers.map((m) => {
      const userPlan = plans.find((p) => String(p.userId?._id) === String(m.userId?._id));
      return {
        member: m.userId,
        role: m.role,
        hasSubmitted: !!userPlan,
        plan: userPlan || null,
      };
    });

    return ApiResponse.success(res, result);
  } catch (error) {
    next(error);
  }
};

export const getDailyPlanHistory = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const limit = parseInt(req.query.limit, 10) || 14;

    const plans = await DailyPlan.find({ userId })
      .sort({ date: -1 })
      .limit(limit);

    return ApiResponse.success(res, plans);
  } catch (error) {
    next(error);
  }
};


import { User } from '../models/User.js';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';

export const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, title, avatarUrl } = req.body;
    const user = req.user;

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (title !== undefined) user.title = title;
    if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;

    await user.save();

    return ApiResponse.success(res, user.toJSON(), 'Profile updated successfully.');
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+passwordHash');

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return next(ApiError.badRequest('Current password is incorrect.'));
    }

    user.passwordHash = await User.hashPassword(newPassword);
    await user.save();

    return ApiResponse.success(res, null, 'Password changed successfully.');
  } catch (error) {
    next(error);
  }
};

export const searchUsers = async (req, res, next) => {
  try {
    const { query } = req.query;
    if (!query || query.length < 2) {
      return ApiResponse.success(res, []);
    }

    const users = await User.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
      ],
      isActive: true,
    })
      .select('name email avatarUrl title')
      .limit(10);

    return ApiResponse.success(res, users);
  } catch (error) {
    next(error);
  }
};


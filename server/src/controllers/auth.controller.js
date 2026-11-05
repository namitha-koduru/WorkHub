import { User } from '../models/User.js';
import { Organization } from '../models/Organization.js';
import { OrganizationMember } from '../models/OrganizationMember.js';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { generateToken, setAuthCookie, clearAuthCookie } from '../utils/jwt.js';
import { ROLES } from '../constants/roles.js';

export const register = async (req, res, next) => {
  try {
    const { name, email, password, title } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(ApiError.conflict('An account with this email address already exists.'));
    }

    const passwordHash = await User.hashPassword(password);
    const user = await User.create({
      name,
      email,
      passwordHash,
      title: title || 'Team Member',
    });

    // Auto-create initial personal organization for the user
    const slug = `${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString().slice(-4)}`;
    const organization = await Organization.create({
      name: `${name}'s Organization`,
      slug,
      description: `Default collaborative workspace for ${name}`,
      owner: user._id,
    });

    await OrganizationMember.create({
      organizationId: organization._id,
      userId: user._id,
      role: ROLES.ORG_OWNER,
      status: 'ACTIVE',
    });

    const token = generateToken({ userId: user._id, email: user.email });
    setAuthCookie(res, token);

    return ApiResponse.created(
      res,
      {
        user: user.toJSON(),
        token,
        activeOrg: organization,
      },
      'Account created successfully.'
    );
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user) {
      return next(ApiError.unauthorized('Invalid email or password.'));
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return next(ApiError.unauthorized('Invalid email or password.'));
    }

    if (!user.isActive) {
      return next(ApiError.forbidden('Your account has been deactivated. Please contact support.'));
    }

    user.lastLoginAt = new Date();
    await user.save();

    // Find user's primary or first active organization
    const membership = await OrganizationMember.findOne({
      userId: user._id,
      status: 'ACTIVE',
    }).populate('organizationId');

    const token = generateToken({ userId: user._id, email: user.email });
    setAuthCookie(res, token);

    return ApiResponse.success(
      res,
      {
        user: user.toJSON(),
        token,
        activeOrg: membership?.organizationId || null,
      },
      'Logged in successfully.'
    );
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    clearAuthCookie(res);
    return ApiResponse.success(res, null, 'Logged out successfully.');
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const user = req.user;

    // Fetch all user organizations with roles
    const memberships = await OrganizationMember.find({
      userId: user._id,
      status: 'ACTIVE',
    }).populate('organizationId');

    const organizations = memberships
      .filter((m) => m.organizationId && !m.organizationId.isArchived)
      .map((m) => ({
        ...m.organizationId.toObject(),
        myRole: m.role,
      }));

    return ApiResponse.success(
      res,
      {
        user: user.toJSON(),
        organizations,
        activeOrg: organizations[0] || null,
      },
      'User profile loaded.'
    );
  } catch (error) {
    next(error);
  }
};


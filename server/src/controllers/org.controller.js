import { Organization } from '../models/Organization.js';
import { OrganizationMember } from '../models/OrganizationMember.js';
import { User } from '../models/User.js';
import { Workspace } from '../models/Workspace.js';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { ROLES } from '../constants/roles.js';
import { logActivity } from '../services/activity.service.js';
import { ACTIVITY_ACTION, NOTIFICATION_TYPE } from '../constants/activityTypes.js';
import { createNotification } from '../services/notification.service.js';

export const createOrganization = async (req, res, next) => {
  try {
    const { name, description, logoUrl } = req.body;
    const userId = req.user._id;

    const slug = `${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString().slice(-4)}`;

    const organization = await Organization.create({
      name,
      slug,
      description: description || '',
      logoUrl: logoUrl || '',
      owner: userId,
    });

    await OrganizationMember.create({
      organizationId: organization._id,
      userId,
      role: ROLES.ORG_OWNER,
      status: 'ACTIVE',
    });

    return ApiResponse.created(res, organization, 'Organization created successfully.');
  } catch (error) {
    next(error);
  }
};

export const getMyOrganizations = async (req, res, next) => {
  try {
    const memberships = await OrganizationMember.find({
      userId: req.user._id,
      status: 'ACTIVE',
    }).populate('organizationId');

    const orgs = memberships
      .filter((m) => m.organizationId && !m.organizationId.isArchived)
      .map((m) => ({
        ...m.organizationId.toObject(),
        myRole: m.role,
        joinedAt: m.joinedAt,
      }));

    return ApiResponse.success(res, orgs);
  } catch (error) {
    next(error);
  }
};

export const getOrganizationById = async (req, res, next) => {
  try {
    const { orgId } = req.params;
    const organization = await Organization.findById(orgId).populate('owner', 'name email avatarUrl');

    if (!organization || organization.isArchived) {
      return next(ApiError.notFound('Organization not found'));
    }

    // Get counts
    const workspaceCount = await Workspace.countDocuments({
      organizationId: orgId,
      status: 'ACTIVE',
    });
    const memberCount = await OrganizationMember.countDocuments({
      organizationId: orgId,
      status: 'ACTIVE',
    });

    return ApiResponse.success(res, {
      ...organization.toObject(),
      workspaceCount,
      memberCount,
    });
  } catch (error) {
    next(error);
  }
};

export const updateOrganization = async (req, res, next) => {
  try {
    const { orgId } = req.params;
    const { name, description, logoUrl } = req.body;

    const organization = await Organization.findById(orgId);
    if (!organization) {
      return next(ApiError.notFound('Organization not found'));
    }

    if (name) organization.name = name;
    if (description !== undefined) organization.description = description;
    if (logoUrl !== undefined) organization.logoUrl = logoUrl;

    await organization.save();

    return ApiResponse.success(res, organization, 'Organization updated successfully.');
  } catch (error) {
    next(error);
  }
};

export const getOrganizationMembers = async (req, res, next) => {
  try {
    const { orgId } = req.params;
    const members = await OrganizationMember.find({
      organizationId: orgId,
    })
      .populate('userId', 'name email avatarUrl title phone')
      .sort({ createdAt: -1 });

    const formatted = members.map((m) => ({
      _id: m._id,
      user: m.userId,
      role: m.role,
      status: m.status,
      joinedAt: m.joinedAt,
    }));

    return ApiResponse.success(res, formatted);
  } catch (error) {
    next(error);
  }
};

export const addOrganizationMember = async (req, res, next) => {
  try {
    const { orgId } = req.params;
    const { email, role } = req.body;

    const targetUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (!targetUser) {
      return next(ApiError.notFound('No registered user found with that email address.'));
    }

    const existingMember = await OrganizationMember.findOne({
      organizationId: orgId,
      userId: targetUser._id,
    });

    if (existingMember) {
      if (existingMember.status === 'ACTIVE') {
        return next(ApiError.conflict('User is already an active member of this organization.'));
      }
      existingMember.status = 'ACTIVE';
      existingMember.role = role || ROLES.ORG_MEMBER;
      await existingMember.save();

      return ApiResponse.success(res, existingMember, 'Member re-activated in organization.');
    }

    const member = await OrganizationMember.create({
      organizationId: orgId,
      userId: targetUser._id,
      role: role || ROLES.ORG_MEMBER,
      status: 'ACTIVE',
    });

    await logActivity({
      organizationId: orgId,
      actor: req.user._id,
      action: ACTIVITY_ACTION.MEMBER_ADDED,
      entityType: 'MEMBER',
      entityId: targetUser._id,
      details: { memberName: targetUser.name, role: member.role },
    });

    await createNotification({
      recipient: targetUser._id,
      sender: req.user._id,
      organizationId: orgId,
      type: NOTIFICATION_TYPE.SYSTEM_ALERT,
      title: 'Added to Organization',
      message: `You were added to the organization as ${member.role}.`,
    });

    return ApiResponse.created(res, member, 'Member added to organization.');
  } catch (error) {
    next(error);
  }
};

export const updateMemberRole = async (req, res, next) => {
  try {
    const { orgId, userId } = req.params;
    const { role } = req.body;

    const organization = await Organization.findById(orgId);
    if (String(organization.owner) === String(userId) && role !== ROLES.ORG_OWNER) {
      return next(ApiError.badRequest('Cannot change the role of the Organization Owner.'));
    }

    const member = await OrganizationMember.findOne({
      organizationId: orgId,
      userId,
    });

    if (!member) {
      return next(ApiError.notFound('Member not found in organization.'));
    }

    member.role = role;
    await member.save();

    await logActivity({
      organizationId: orgId,
      actor: req.user._id,
      action: ACTIVITY_ACTION.ROLE_UPDATED,
      entityType: 'MEMBER',
      entityId: userId,
      details: { newRole: role },
    });

    return ApiResponse.success(res, member, 'Member role updated successfully.');
  } catch (error) {
    next(error);
  }
};

export const removeMember = async (req, res, next) => {
  try {
    const { orgId, userId } = req.params;

    const organization = await Organization.findById(orgId);
    if (String(organization.owner) === String(userId)) {
      return next(ApiError.badRequest('Cannot remove the organization owner.'));
    }

    await OrganizationMember.findOneAndDelete({
      organizationId: orgId,
      userId,
    });

    await logActivity({
      organizationId: orgId,
      actor: req.user._id,
      action: ACTIVITY_ACTION.MEMBER_REMOVED,
      entityType: 'MEMBER',
      entityId: userId,
      details: { removedUserId: userId },
    });

    return ApiResponse.success(res, null, 'Member removed from organization.');
  } catch (error) {
    next(error);
  }
};


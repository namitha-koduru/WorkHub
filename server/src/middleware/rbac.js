import { ApiError } from '../utils/apiError.js';
import { ROLES } from '../constants/roles.js';
import { OrganizationMember } from '../models/OrganizationMember.js';
import { WorkspaceMember } from '../models/WorkspaceMember.js';
import { TeamMember } from '../models/TeamMember.js';
import { RoomMember } from '../models/RoomMember.js';
import { Workspace } from '../models/Workspace.js';
import { Team } from '../models/Team.js';
import { Room } from '../models/Room.js';

/**
 * Checks organization membership and ensures user has one of the allowed roles
 */
export const requireOrgRole = (allowedRoles = []) => async (req, res, next) => {
  try {
    const orgId = req.params.orgId || req.body.organizationId || req.query.organizationId;
    if (!orgId) {
      return next(ApiError.badRequest('Organization ID is required for access verification'));
    }

    const membership = await OrganizationMember.findOne({
      organizationId: orgId,
      userId: req.user._id,
      status: 'ACTIVE',
    });

    if (!membership) {
      return next(ApiError.forbidden('You are not an active member of this organization'));
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(membership.role)) {
      return next(
        ApiError.forbidden(`Requires one of the following organization roles: ${allowedRoles.join(', ')}`)
      );
    }

    req.orgMembership = membership;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Checks workspace access: Org Owner/Admin or Workspace Manager/Member
 */
export const requireWorkspaceAccess = (allowedWorkspaceRoles = []) => async (req, res, next) => {
  try {
    const workspaceId = req.params.workspaceId || req.body.workspaceId || req.query.workspaceId;
    if (!workspaceId) {
      return next(ApiError.badRequest('Workspace ID is required for access verification'));
    }

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return next(ApiError.notFound('Workspace not found'));
    }

    // Check if user is Org Owner or Org Admin
    const orgMembership = await OrganizationMember.findOne({
      organizationId: workspace.organizationId,
      userId: req.user._id,
      status: 'ACTIVE',
    });

    if (orgMembership && [ROLES.ORG_OWNER, ROLES.ORG_ADMIN].includes(orgMembership.role)) {
      req.workspace = workspace;
      req.isOrgAdmin = true;
      return next();
    }

    // Check workspace direct membership
    const wsMembership = await WorkspaceMember.findOne({
      workspaceId,
      userId: req.user._id,
    });

    if (!wsMembership) {
      return next(ApiError.forbidden('You do not have permission to access this workspace'));
    }

    if (
      allowedWorkspaceRoles.length > 0 &&
      !allowedWorkspaceRoles.includes(wsMembership.role)
    ) {
      return next(
        ApiError.forbidden(`Workspace action requires roles: ${allowedWorkspaceRoles.join(', ')}`)
      );
    }

    req.workspace = workspace;
    req.wsMembership = wsMembership;
    req.isWsManager = wsMembership.role === ROLES.WORKSPACE_MANAGER;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Checks team access: Org Owner/Admin, Workspace Manager, or Team Leader/Member
 */
export const requireTeamAccess = (allowedTeamRoles = []) => async (req, res, next) => {
  try {
    const teamId = req.params.teamId || req.body.teamId || req.query.teamId;
    if (!teamId) {
      return next(ApiError.badRequest('Team ID is required for access verification'));
    }

    const team = await Team.findById(teamId);
    if (!team) {
      return next(ApiError.notFound('Team not found'));
    }

    // Org Owner / Admin check
    const orgMembership = await OrganizationMember.findOne({
      organizationId: team.organizationId,
      userId: req.user._id,
      status: 'ACTIVE',
    });

    if (orgMembership && [ROLES.ORG_OWNER, ROLES.ORG_ADMIN].includes(orgMembership.role)) {
      req.team = team;
      req.isOrgAdmin = true;
      return next();
    }

    // Workspace Manager check
    const wsMembership = await WorkspaceMember.findOne({
      workspaceId: team.workspaceId,
      userId: req.user._id,
    });

    if (wsMembership && wsMembership.role === ROLES.WORKSPACE_MANAGER) {
      req.team = team;
      req.isWsManager = true;
      return next();
    }

    // Direct Team Membership check
    const teamMembership = await TeamMember.findOne({
      teamId,
      userId: req.user._id,
    });

    if (!teamMembership) {
      return next(ApiError.forbidden('You do not have permission to access this team'));
    }

    if (allowedTeamRoles.length > 0 && !allowedTeamRoles.includes(teamMembership.role)) {
      return next(
        ApiError.forbidden(`Team action requires roles: ${allowedTeamRoles.join(', ')}`)
      );
    }

    req.team = team;
    req.teamMembership = teamMembership;
    req.isTeamLeader = teamMembership.role === ROLES.TEAM_LEADER;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Checks room access: Org Owner/Admin, Workspace Manager, Team Leader, or Room Member
 */
export const requireRoomAccess = (allowedRoomRoles = []) => async (req, res, next) => {
  try {
    const roomId = req.params.roomId || req.body.roomId || req.query.roomId;
    if (!roomId) {
      return next(ApiError.badRequest('Room ID is required for access verification'));
    }

    const room = await Room.findById(roomId);
    if (!room) {
      return next(ApiError.notFound('Room not found'));
    }

    // Org Owner / Admin check
    const orgMembership = await OrganizationMember.findOne({
      organizationId: room.organizationId,
      userId: req.user._id,
      status: 'ACTIVE',
    });

    if (orgMembership && [ROLES.ORG_OWNER, ROLES.ORG_ADMIN].includes(orgMembership.role)) {
      req.room = room;
      req.isOrgAdmin = true;
      return next();
    }

    // Workspace Manager check
    const wsMembership = await WorkspaceMember.findOne({
      workspaceId: room.workspaceId,
      userId: req.user._id,
    });

    if (wsMembership && wsMembership.role === ROLES.WORKSPACE_MANAGER) {
      req.room = room;
      req.isWsManager = true;
      return next();
    }

    // Team Leader check
    if (room.teamId) {
      const tmMembership = await TeamMember.findOne({
        teamId: room.teamId,
        userId: req.user._id,
      });
      if (tmMembership && tmMembership.role === ROLES.TEAM_LEADER) {
        req.room = room;
        req.isTeamLeader = true;
        return next();
      }
    }

    // Direct Room Membership check
    const roomMembership = await RoomMember.findOne({
      roomId,
      userId: req.user._id,
    });

    if (!roomMembership) {
      return next(ApiError.forbidden('You do not have access to this room'));
    }

    if (allowedRoomRoles.length > 0 && !allowedRoomRoles.includes(roomMembership.role)) {
      return next(
        ApiError.forbidden(`Room action requires roles: ${allowedRoomRoles.join(', ')}`)
      );
    }

    req.room = room;
    req.roomMembership = roomMembership;
    next();
  } catch (error) {
    next(error);
  }
};

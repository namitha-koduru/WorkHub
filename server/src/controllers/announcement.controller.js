import { Announcement } from '../models/Announcement.js';
import { WorkspaceMember } from '../models/WorkspaceMember.js';
import { OrganizationMember } from '../models/OrganizationMember.js';
import { TeamMember } from '../models/TeamMember.js';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { ROLES } from '../constants/roles.js';
import { logActivity } from '../services/activity.service.js';
import { ACTIVITY_ACTION, NOTIFICATION_TYPE } from '../constants/activityTypes.js';
import { createNotification } from '../services/notification.service.js';

export const createAnnouncement = async (req, res, next) => {
  try {
    const {
      scope = 'WORKSPACE',
      organizationId,
      workspaceId,
      teamId = null,
      title,
      content,
      isPinned = false,
      priority = 'NORMAL',
    } = req.body;

    // Verify permission
    const orgMembership = await OrganizationMember.findOne({
      organizationId,
      userId: req.user._id,
      status: 'ACTIVE',
    });
    const isOrgAdmin = orgMembership && [ROLES.ORG_OWNER, ROLES.ORG_ADMIN].includes(orgMembership.role);

    const wsMembership = await WorkspaceMember.findOne({
      workspaceId,
      userId: req.user._id,
    });
    const isWsManager = wsMembership && wsMembership.role === ROLES.WORKSPACE_MANAGER;

    if (scope === 'WORKSPACE') {
      if (!isOrgAdmin && !isWsManager) {
        return next(
          ApiError.forbidden('Only workspace managers or org admins can publish workspace announcements.')
        );
      }
    } else if (scope === 'TEAM') {
      if (!teamId) {
        return next(ApiError.badRequest('Team ID is required for team-scoped announcements.'));
      }
      const teamMembership = await TeamMember.findOne({
        teamId,
        userId: req.user._id,
      });
      const isTeamLeader = teamMembership && teamMembership.role === ROLES.TEAM_LEADER;
      if (!isOrgAdmin && !isWsManager && !isTeamLeader) {
        return next(
          ApiError.forbidden('Only team leaders, workspace managers, or org admins can publish team announcements.')
        );
      }
    }

    const announcement = await Announcement.create({
      scope,
      organizationId,
      workspaceId,
      teamId: scope === 'TEAM' ? teamId : null,
      author: req.user._id,
      title,
      content,
      isPinned,
      priority,
    });

    await logActivity({
      organizationId,
      workspaceId,
      actor: req.user._id,
      action: ACTIVITY_ACTION.ANNOUNCEMENT_POSTED,
      entityType: 'WORKSPACE',
      entityId: announcement._id,
      details: { title, scope, priority },
    });

    // Notify members asynchronously
    if (scope === 'WORKSPACE') {
      const allMembers = await WorkspaceMember.find({ workspaceId }).select('userId');
      for (const m of allMembers) {
        if (String(m.userId) !== String(req.user._id)) {
          createNotification({
            recipient: m.userId,
            sender: req.user._id,
            organizationId,
            workspaceId,
            type: priority === 'URGENT' ? NOTIFICATION_TYPE.SYSTEM_ALERT : NOTIFICATION_TYPE.MENTION,
            title: `Announcement: ${title}`,
            message: content.slice(0, 120),
            link: `/app/workspaces/${workspaceId}/announcements`,
          }).catch(() => {});
        }
      }
    } else if (scope === 'TEAM' && teamId) {
      const teamMembers = await TeamMember.find({ teamId }).select('userId');
      for (const m of teamMembers) {
        if (String(m.userId) !== String(req.user._id)) {
          createNotification({
            recipient: m.userId,
            sender: req.user._id,
            organizationId,
            workspaceId,
            type: priority === 'URGENT' ? NOTIFICATION_TYPE.SYSTEM_ALERT : NOTIFICATION_TYPE.MENTION,
            title: `Team Announcement: ${title}`,
            message: content.slice(0, 120),
            link: `/app/workspaces/${workspaceId}/teams/${teamId}`,
          }).catch(() => {});
        }
      }
    }

    const populated = await Announcement.findById(announcement._id).populate(
      'author',
      'name email avatarUrl title'
    );

    return ApiResponse.created(res, populated, 'Announcement published successfully.');
  } catch (error) {
    next(error);
  }
};

export const getAnnouncements = async (req, res, next) => {
  try {
    const { workspaceId, teamId, scope } = req.query;

    if (!workspaceId) {
      return next(ApiError.badRequest('Workspace ID is required'));
    }

    const filter = { workspaceId };

    if (scope) {
      filter.scope = scope;
      if (scope === 'TEAM' && teamId) {
        filter.teamId = teamId;
      }
    } else if (teamId) {
      // Include both workspace-level announcements and this team's announcements
      filter.$or = [{ scope: 'WORKSPACE' }, { teamId }];
    }

    const announcements = await Announcement.find(filter)
      .populate('author', 'name email avatarUrl title')
      .populate('teamId', 'name')
      .sort({ isPinned: -1, createdAt: -1 });

    return ApiResponse.success(res, announcements);
  } catch (error) {
    next(error);
  }
};

export const deleteAnnouncement = async (req, res, next) => {
  try {
    const { announcementId } = req.params;

    const announcement = await Announcement.findById(announcementId);
    if (!announcement) {
      return next(ApiError.notFound('Announcement not found'));
    }

    const isAuthor = String(announcement.author) === String(req.user._id);

    const orgMembership = await OrganizationMember.findOne({
      organizationId: announcement.organizationId,
      userId: req.user._id,
      status: 'ACTIVE',
    });
    const isOrgAdmin = orgMembership && [ROLES.ORG_OWNER, ROLES.ORG_ADMIN].includes(orgMembership.role);

    const wsMembership = await WorkspaceMember.findOne({
      workspaceId: announcement.workspaceId,
      userId: req.user._id,
    });
    const isWsManager = wsMembership && wsMembership.role === ROLES.WORKSPACE_MANAGER;

    let isTeamLeader = false;
    if (announcement.scope === 'TEAM' && announcement.teamId) {
      const tm = await TeamMember.findOne({
        teamId: announcement.teamId,
        userId: req.user._id,
      });
      isTeamLeader = tm && tm.role === ROLES.TEAM_LEADER;
    }

    if (!isAuthor && !isOrgAdmin && !isWsManager && !isTeamLeader) {
      return next(ApiError.forbidden('You are not authorized to delete this announcement.'));
    }

    await Announcement.findByIdAndDelete(announcementId);

    return ApiResponse.success(res, null, 'Announcement deleted successfully.');
  } catch (error) {
    next(error);
  }
};

import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { workspaceApi } from '../../api/workspace.api';
import { teamApi } from '../../api/team.api';
import { announcementApi } from '../../api/announcement.api';
import { dailyPlanApi, activityApi, reportApi } from '../../api/features.api';
import { useAuth } from '../../context/AuthContext';
import { TeamModal } from '../../components/modals/TeamModal';
import { AnnouncementModal } from '../../components/modals/AnnouncementModal';
import { Avatar } from '../../components/common/Avatar';
import { Button } from '../../components/common/Button';
import { PriorityBadge, StatusBadge } from '../../components/common/Badge';
import {
  Users,
  DoorOpen,
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  Plus,
  ArrowRight,
  Pin,
  Megaphone,
  CheckSquare,
  ShieldCheck,
  Calendar,
  Activity,
  Layers,
  Loader2,
} from 'lucide-react';

export default function WorkspaceOverviewPage() {
  const { workspaceId } = useParams();
  const { activeOrg, user } = useAuth();
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [isAnnounceModalOpen, setIsAnnounceModalOpen] = useState(false);

  // Fetch Workspace Details & Metrics
  const { data: wsRes, isLoading: wsLoading } = useQuery({
    queryKey: ['workspace', workspaceId],
    queryFn: () => workspaceApi.getById(workspaceId),
    enabled: !!workspaceId,
  });
  const workspace = wsRes?.data;
  const metrics = workspace?.metrics || {};

  // Fetch Teams
  const { data: teamsRes, isLoading: teamsLoading } = useQuery({
    queryKey: ['teams', workspaceId],
    queryFn: () => teamApi.getAll(workspaceId),
    enabled: !!workspaceId,
  });
  const teams = teamsRes?.data || [];

  // Fetch Announcements
  const { data: annRes } = useQuery({
    queryKey: ['announcements', workspaceId],
    queryFn: () => announcementApi.getAll(workspaceId),
    enabled: !!workspaceId,
  });
  const announcements = annRes?.data || [];
  const pinnedAnnouncements = announcements.filter((a) => a.isPinned);

  // Fetch Workspace Report (for upcoming deadlines and milestones)
  const { data: reportRes } = useQuery({
    queryKey: ['workspace-report', workspaceId],
    queryFn: () => reportApi.getWorkspace(workspaceId),
    enabled: !!workspaceId,
  });
  const report = reportRes?.data;
  const milestones = report?.milestones || [];

  // Fetch Today's Daily Summary
  const todayStr = new Date().toISOString().split('T')[0];
  const { data: dailySummaryRes } = useQuery({
    queryKey: ['workspace-daily-summary', workspaceId, todayStr],
    queryFn: () => dailyPlanApi.getWorkspaceSummary(workspaceId, todayStr),
    enabled: !!workspaceId,
  });
  const dailySummary = dailySummaryRes?.data;
  const blockers = dailySummary?.allBlockers || [];

  // Fetch Workspace Recent Activity
  const { data: activityRes } = useQuery({
    queryKey: ['workspace-activities', workspaceId],
    queryFn: () => activityApi.get({ workspaceId, limit: 6 }),
    enabled: !!workspaceId,
  });
  const activities = activityRes?.data?.activities || [];

  if (wsLoading || teamsLoading) {
    return (
      <div className="p-12 flex justify-center">
        <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Pinned Announcements Ribbon */}
      {announcements.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Megaphone className="h-3.5 w-3.5 text-indigo-600" /> Event Directives & Announcements
            </h3>
            <div className="flex items-center gap-2">
              <Link
                to={`/app/workspaces/${workspaceId}/announcements`}
                className="text-xs font-semibold text-indigo-600 hover:underline"
              >
                View All ({announcements.length}) →
              </Link>
              <Button
                variant="outline"
                size="xs"
                onClick={() => setIsAnnounceModalOpen(true)}
              >
                <Plus className="h-3 w-3 mr-1" /> Post Announcement
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {announcements.slice(0, 2).map((ann) => (
              <div
                key={ann._id}
                className={`p-4 rounded-xl border transition-all ${
                  ann.priority === 'URGENT'
                    ? 'bg-red-50/80 border-red-200 text-red-950 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-800 shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {ann.isPinned && (
                      <Pin className="h-3.5 w-3.5 text-amber-500 shrink-0 fill-amber-500" />
                    )}
                    <h4 className="text-sm font-bold line-clamp-1">{ann.title}</h4>
                  </div>
                  {ann.priority === 'URGENT' && (
                    <span className="shrink-0 px-2 py-0.5 rounded text-[10px] font-bold bg-red-600 text-white">
                      URGENT
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 mt-1.5 line-clamp-2 leading-relaxed">
                  {ann.content}
                </p>
                <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-slate-100/80 text-[11px] text-slate-400">
                  <span>Scope: <strong className="text-slate-600">{ann.scope === 'TEAM' && ann.teamId ? ann.teamId.name : 'Workspace'}</strong></span>
                  <span>{new Date(ann.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KPI Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Teams
            </span>
            <Users className="h-4 w-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">{metrics.teamCount || teams.length || 0}</div>
          <span className="text-[11px] text-slate-400">Functional departments</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Rooms & Channels
            </span>
            <DoorOpen className="h-4 w-4 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">{metrics.roomCount || 0}</div>
          <span className="text-[11px] text-slate-400">Collaborative spaces</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Total Tasks
            </span>
            <CheckSquare className="h-4 w-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {metrics.completedTasks || 0}{' '}
            <span className="text-xs font-normal text-slate-400">/ {metrics.totalTasks || 0}</span>
          </div>
          <span className="text-[11px] text-slate-400">Total deliverables</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Overall Progress
            </span>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600">{metrics.progress || 0}%</div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full"
              style={{ width: `${metrics.progress || 0}%` }}
            />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Overdue
            </span>
            <AlertTriangle className="h-4 w-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-600">{metrics.overdueTasks || 0}</div>
          <span className="text-[11px] text-slate-400">Requires triage</span>
        </div>
      </div>

      {/* Daily Standup Coordination Summary & Active Blockers */}
      {dailySummary && (
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Clock className="h-4 w-4 text-indigo-600" /> Today's Daily Coordination Health (All Teams)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {dailySummary.totalSubmitted} of {dailySummary.totalWorkspaceMembers} event staff filed their daily plan today ({dailySummary.overallSubmissionRate}% participation rate).
              </p>
            </div>
            <Link
              to={`/app/workspaces/${workspaceId}/daily-standups`}
              className="text-xs font-semibold text-indigo-600 hover:underline shrink-0"
            >
              Open Daily Standup Manager →
            </Link>
          </div>

          {blockers.length > 0 && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs space-y-2">
              <span className="font-bold text-red-900 flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-red-600" /> {blockers.length} Active Blocker(s) Reported Across Teams:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {blockers.map((b, i) => (
                  <div key={i} className="p-2 rounded bg-white border border-red-100 flex items-center justify-between gap-2">
                    <span className="text-slate-800">
                      <strong>{b.user?.name}:</strong> {b.blocker}
                    </span>
                    <Avatar user={b.user} size="xs" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Functional Teams & Departments Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">Teams & Departments</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Autonomous units managing specialized operational portfolios for {workspace?.name}.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to={`/app/workspaces/${workspaceId}/teams`}
              className="text-xs font-semibold text-indigo-600 hover:underline"
            >
              View All Teams →
            </Link>
            <Button size="sm" onClick={() => setIsTeamModalOpen(true)}>
              <Plus className="h-4 w-4 mr-1.5" /> Create Team
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {teams.map((team) => (
            <div
              key={team._id}
              className="bg-white rounded-xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
            >
              <div className="p-5 space-y-3.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Link
                      to={`/app/workspaces/${workspaceId}/teams/${team._id}/overview`}
                      className="text-base font-bold text-slate-900 hover:text-indigo-600 transition-colors line-clamp-1"
                    >
                      {team.name}
                    </Link>
                    {team.description && (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        {team.description}
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {team.progress || 0}%
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                    style={{ width: `${team.progress || 0}%` }}
                  />
                </div>

                {/* Leader & Stats */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <Avatar user={team.leader} size="xs" />
                    <div>
                      <span className="block text-[10px] text-slate-400 font-medium">Lead</span>
                      <span className="text-xs font-semibold text-slate-800 line-clamp-1">
                        {team.leader?.name || 'Unassigned'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1 font-medium text-slate-600" title="Rooms / Channels">
                      <DoorOpen className="h-3.5 w-3.5 text-slate-400" />
                      {team.roomCount || 0}
                    </span>
                    <span className="flex items-center gap-1 font-medium text-slate-600" title="Team Members">
                      <Users className="h-3.5 w-3.5 text-slate-400" />
                      {team.memberCount || 0}
                    </span>
                  </div>
                </div>
              </div>

              <Link
                to={`/app/workspaces/${workspaceId}/teams/${team._id}/overview`}
                className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-indigo-600 group-hover:bg-indigo-50 group-hover:text-indigo-700 transition-colors"
              >
                <span>Enter Department</span>
                <ArrowRight className="h-4 w-4 transform group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Event Milestones & Activity Feeds Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Event Milestones */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Calendar className="h-4 w-4 text-indigo-600" /> Master Event Milestones
            </h3>
            <Link
              to={`/app/workspaces/${workspaceId}/calendar`}
              className="text-xs font-semibold text-indigo-600 hover:underline"
            >
              View Calendar →
            </Link>
          </div>

          {milestones.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center italic">
              No milestones scheduled yet. Add milestones in the master calendar.
            </p>
          ) : (
            <div className="space-y-3">
              {milestones.map((m) => (
                <div
                  key={m._id}
                  className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 flex items-start justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <span className="font-bold text-slate-900 block">{m.title}</span>
                    {m.description && <p className="text-slate-500 line-clamp-1">{m.description}</p>}
                    <span className="text-[11px] font-semibold text-indigo-600 block">
                      Target: {new Date(m.startTime).toLocaleDateString()}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 shrink-0">
                    Milestone
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Collaborative Activity */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Activity className="h-4 w-4 text-indigo-600" /> Recent Operations Activity
            </h3>
            <span className="text-xs text-slate-400">Live feed</span>
          </div>

          {activities.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center italic">
              No recent activity recorded.
            </p>
          ) : (
            <div className="space-y-3">
              {activities.map((act) => (
                <div
                  key={act._id}
                  className="p-3 rounded-lg border border-slate-100 flex items-start gap-3 text-xs"
                >
                  <Avatar user={act.actor} size="xs" />
                  <div className="flex-1 space-y-0.5">
                    <p className="text-slate-800">
                      <strong>{act.actor?.name || 'Someone'}</strong>{' '}
                      <span className="text-slate-600">
                        {act.action?.toLowerCase().replace(/_/g, ' ')}
                      </span>{' '}
                      {act.details?.title && (
                        <span className="font-medium text-indigo-600">"{act.details.title}"</span>
                      )}
                      {act.details?.teamName && (
                        <span className="font-medium text-slate-700"> in {act.details.teamName}</span>
                      )}
                    </p>
                    <span className="text-[10px] text-slate-400 block">
                      {new Date(act.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <TeamModal
        isOpen={isTeamModalOpen}
        onClose={() => setIsTeamModalOpen(false)}
        workspaceId={workspaceId}
        organizationId={workspace?.organizationId}
      />

      <AnnouncementModal
        isOpen={isAnnounceModalOpen}
        onClose={() => setIsAnnounceModalOpen(false)}
        workspaceId={workspaceId}
        organizationId={workspace?.organizationId}
        teams={teams}
        defaultScope="WORKSPACE"
      />
    </div>
  );
}

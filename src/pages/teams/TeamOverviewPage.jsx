import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { teamApi } from '../../api/team.api';
import { announcementApi } from '../../api/announcement.api';
import { taskApi } from '../../api/task.api';
import { RoomModal } from '../../components/modals/RoomModal';
import { AnnouncementModal } from '../../components/modals/AnnouncementModal';
import { Avatar } from '../../components/common/Avatar';
import { Button } from '../../components/common/Button';
import { PriorityBadge, StatusBadge } from '../../components/common/Badge';
import {
  DoorOpen,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Plus,
  ArrowRight,
  Pin,
  Megaphone,
  CheckSquare,
  ShieldCheck,
  ListOrdered,
  Calendar,
} from 'lucide-react';

export default function TeamOverviewPage() {
  const { workspaceId, teamId } = useParams();
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [isAnnounceModalOpen, setIsAnnounceModalOpen] = useState(false);

  // Fetch Team Details
  const { data: teamRes } = useQuery({
    queryKey: ['team', teamId],
    queryFn: () => teamApi.getById(teamId),
    enabled: !!teamId,
  });
  const team = teamRes?.data;
  const metrics = team?.metrics || {};
  const rooms = team?.rooms || [];

  // Fetch Announcements for this team (scope: TEAM or WORKSPACE)
  const { data: annRes } = useQuery({
    queryKey: ['announcements', workspaceId, teamId],
    queryFn: () => announcementApi.getAll(workspaceId, teamId),
    enabled: !!workspaceId && !!teamId,
  });
  const announcements = annRes?.data || [];

  // Fetch Team Tasks
  const { data: tasksRes } = useQuery({
    queryKey: ['tasks', 'team', teamId],
    queryFn: () => taskApi.getTasks({ teamId }),
    enabled: !!teamId,
  });
  const tasks = tasksRes?.data || [];
  const upcomingTasks = tasks
    .filter((t) => t.dueDate && t.status !== 'Completed')
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 5);

  return (
    <div className="p-4 sm:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Top Announcements Banner if any */}
      {announcements.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Megaphone className="h-3.5 w-3.5 text-indigo-600" /> Department Directives & Announcements
            </h3>
            <Button
              variant="outline"
              size="xs"
              onClick={() => setIsAnnounceModalOpen(true)}
            >
              <Plus className="h-3 w-3 mr-1" /> Post Notice
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {announcements.slice(0, 2).map((ann) => (
              <div
                key={ann._id}
                className={`p-4 rounded-xl border transition-all ${
                  ann.priority === 'URGENT'
                    ? 'bg-red-50/70 border-red-200 text-red-900'
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
                  <span>From: {ann.author?.name || 'Leadership'}</span>
                  <span>{new Date(ann.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Overall Progress</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">{metrics.progress || 0}%</div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full"
              style={{ width: `${metrics.progress || 0}%` }}
            />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Rooms / Channels</span>
            <DoorOpen className="h-4 w-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">{metrics.roomCount || 0}</div>
          <p className="text-xs text-slate-400 mt-1">Active collaboration spaces</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Completed Work</span>
            <CheckSquare className="h-4 w-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {metrics.completedTasks || 0}{' '}
            <span className="text-xs font-normal text-slate-400">/ {metrics.totalTasks || 0}</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Deliverables delivered</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Overdue Tasks</span>
            <AlertTriangle className="h-4 w-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-600">{metrics.overdueTasks || 0}</div>
          <p className="text-xs text-slate-400 mt-1">Requires immediate attention</p>
        </div>
      </div>

      {/* Responsibilities Banner */}
      {team?.responsibilities && team.responsibilities.length > 0 && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-50 to-slate-50 border border-indigo-100/80">
          <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-indigo-600" /> Department Mandate & Responsibilities
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
            {team.responsibilities.map((resp, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2 bg-white/90 p-2.5 rounded-lg border border-indigo-50 shadow-xs text-xs font-medium text-slate-700"
              >
                <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                <span>{resp}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Collaborative Rooms / Channels Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">
              Collaborative Rooms & Channels
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Working groups with dedicated task boards, calendars, daily standups, and discussions.
            </p>
          </div>
          <Button size="sm" onClick={() => setIsRoomModalOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" /> Create Room
          </Button>
        </div>

        {rooms.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-xl border border-dashed border-slate-300">
            <DoorOpen className="h-8 w-8 text-slate-400 mx-auto mb-2" />
            <h4 className="text-sm font-semibold text-slate-700">No rooms created yet</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Create rooms inside this team (e.g. Email Comms, Social Media Campaigns, Poster Approvals).
            </p>
            <Button size="xs" className="mt-4" onClick={() => setIsRoomModalOpen(true)}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Create First Room
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rooms.map((room) => (
              <Link
                key={room._id}
                to={`/app/workspaces/${workspaceId}/rooms/${room._id}/board`}
                className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                      {room.name}
                    </h4>
                    <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                      Channel
                    </span>
                  </div>
                  {room.description && (
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {room.description}
                    </p>
                  )}
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <Avatar user={room.leader} size="xs" />
                    <span className="text-[11px] font-semibold text-slate-700 line-clamp-1">
                      {room.leader?.name || 'Leader'}
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-indigo-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                    Enter Board <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Approaching Team Deadlines */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900 tracking-tight">Approaching Deadlines</h3>
          <Link
            to={`/app/workspaces/${workspaceId}/teams/${teamId}/calendar`}
            className="text-xs font-semibold text-indigo-600 hover:underline"
          >
            View Calendar →
          </Link>
        </div>

        {upcomingTasks.length === 0 ? (
          <div className="p-6 text-center bg-white rounded-xl border border-slate-200 text-xs text-slate-400 italic">
            No upcoming deadlines scheduled for this team.
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200/90 divide-y divide-slate-100 shadow-sm overflow-hidden">
            {upcomingTasks.map((t) => (
              <div
                key={t._id}
                className="p-3.5 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 line-clamp-1">{t.title}</span>
                    <PriorityBadge priority={t.priority} />
                    <StatusBadge status={t.status} />
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <span>Room: {t.roomId?.name || 'General'}</span>
                    <span>•</span>
                    <span>Due: {new Date(t.dueDate).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-xs text-slate-600">
                    <Avatar user={t.assignedTo} size="xs" />
                    <span className="font-medium">{t.assignedTo?.name || 'Unassigned'}</span>
                  </div>
                  <Link
                    to={`/app/workspaces/${workspaceId}/rooms/${t.roomId?._id || t.roomId}/board?taskId=${t._id}`}
                    className="p-1 rounded text-slate-400 hover:text-indigo-600"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <RoomModal
        isOpen={isRoomModalOpen}
        onClose={() => setIsRoomModalOpen(false)}
        workspaceId={workspaceId}
        organizationId={team?.organizationId}
        teamId={teamId}
      />

      <AnnouncementModal
        isOpen={isAnnounceModalOpen}
        onClose={() => setIsAnnounceModalOpen(false)}
        workspaceId={workspaceId}
        organizationId={team?.organizationId}
        teamId={teamId}
        defaultScope="TEAM"
      />
    </div>
  );
}


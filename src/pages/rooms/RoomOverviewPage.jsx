import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { roomApi } from '../../api/room.api';
import { activityApi } from '../../api/features.api';
import { Avatar } from '../../components/common/Avatar';
import { Button } from '../../components/common/Button';
import { TaskModal } from '../../components/modals/TaskModal';
import {
  CheckCircle2,
  Clock,
  FileCheck,
  AlertTriangle,
  RotateCcw,
  Users,
  Plus,
  ArrowRight,
  TrendingUp,
  History,
  Loader2,
} from 'lucide-react';

export default function RoomOverviewPage() {
  const { workspaceId, roomId } = useParams();
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  const { data: roomRes, isLoading } = useQuery({
    queryKey: ['room', roomId],
    queryFn: () => roomApi.getById(roomId),
  });

  const { data: membersRes } = useQuery({
    queryKey: ['room-members', roomId],
    queryFn: () => roomApi.getMembers(roomId),
  });

  const { data: activitiesRes } = useQuery({
    queryKey: ['activities', roomId],
    queryFn: () => activityApi.get({ roomId, limit: 5 }),
  });

  const room = roomRes?.data;
  const metrics = room?.metrics || {};
  const members = membersRes?.data || [];
  const activities = activitiesRes?.data || [];

  if (isLoading) {
    return (
      <div className="p-12 flex justify-center">
        <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Department Health & Operations</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational throughput, review queues, and personnel allocation
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to={`/app/workspaces/${workspaceId}/rooms/${roomId}/board`}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center gap-1.5"
          >
            <span>Open Kanban</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <Button size="sm" icon={Plus} onClick={() => setIsTaskModalOpen(true)}>
            Create Task
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block mb-1">
            To Do
          </span>
          <span className="text-xl font-bold text-slate-700">{metrics.todoTasks || 0}</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-600 block mb-1">
            In Progress
          </span>
          <span className="text-xl font-bold text-blue-600">{metrics.inProgressTasks || 0}</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-600 block mb-1">
            Under Review
          </span>
          <span className="text-xl font-bold text-amber-600">{metrics.underReviewTasks || 0}</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-pink-600 block mb-1">
            Revisions
          </span>
          <span className="text-xl font-bold text-pink-600">
            {metrics.changesRequestedTasks || 0}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600 block mb-1">
            Completed
          </span>
          <span className="text-xl font-bold text-emerald-600">{metrics.completedTasks || 0}</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-600 block mb-1">
            Completion Rate
          </span>
          <span className="text-xl font-bold text-indigo-600">{metrics.progress || 0}%</span>
        </div>
      </div>

      {/* Grid: Room Personnel & Recent Audit Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personnel */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Users className="h-4 w-4 text-indigo-600" />
              Room Members ({members.length})
            </h3>
          </div>

          <div className="divide-y divide-slate-100">
            {members.map((m) => (
              <div key={m._id} className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Avatar user={m.user} size="sm" />
                  <div>
                    <h4 className="text-xs font-semibold text-slate-800">{m.user?.name}</h4>
                    <p className="text-[11px] text-slate-400">{m.user?.email}</p>
                  </div>
                </div>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                    m.role === 'ROOM_LEADER'
                      ? 'bg-amber-50 text-amber-800 border border-amber-200'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {m.role === 'ROOM_LEADER' ? 'Leader' : 'Member'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
            <History className="h-4 w-4 text-slate-500" />
            Recent Room Activity
          </h3>

          <div className="space-y-3">
            {activities.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No recent activities recorded.</p>
            ) : (
              activities.map((a) => (
                <div key={a._id} className="flex items-start gap-2.5 text-xs">
                  <Avatar user={a.actor} size="xs" />
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-800 leading-snug">
                      <span className="font-semibold text-slate-900">{a.actor?.name}</span>{' '}
                      performed{' '}
                      <span className="font-mono text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1 py-0.5 rounded">
                        {a.action}
                      </span>
                    </p>
                    <span className="text-[10px] text-slate-400">
                      {new Date(a.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {isTaskModalOpen && (
        <TaskModal
          isOpen={isTaskModalOpen}
          onClose={() => setIsTaskModalOpen(false)}
          roomId={roomId}
          workspaceId={workspaceId}
        />
      )}
    </div>
  );
}


import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { reportApi } from '../../api/features.api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  BarChart3,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Milestone,
  DoorOpen,
  Loader2,
} from 'lucide-react';

const STATUS_COLORS = ['#64748b', '#3b82f6', '#f59e0b', '#ec4899', '#10b981'];

export default function WorkspaceReportsPage() {
  const { workspaceId } = useParams();

  const { data: reportRes, isLoading } = useQuery({
    queryKey: ['workspace-report', workspaceId],
    queryFn: () => reportApi.getWorkspace(workspaceId),
  });

  const report = reportRes?.data;

  if (isLoading) {
    return (
      <div className="p-12 flex justify-center">
        <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  const kpi = report?.kpi || {};
  const teamPerformance = report?.teamPerformance || [];
  const roomPerformance = report?.roomPerformance || [];
  const statusDistribution = report?.statusDistribution?.filter((s) => s.value > 0) || [];
  const milestones = report?.milestones || [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-indigo-600" />
          Workspace Analytics & Performance Velocity
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Room-wise velocity comparisons, completion tracking, and milestone readiness
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Total Tasks
          </span>
          <div className="text-2xl font-bold text-slate-900 mt-1">{kpi.totalTasks || 0}</div>
          <span className="text-[11px] text-slate-400">In {kpi.totalRooms || 0} rooms</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Completed
          </span>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{kpi.completedTasks || 0}</div>
          <span className="text-[11px] text-slate-400">Signed off</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Overdue Velocity
          </span>
          <div className="text-2xl font-bold text-red-600 mt-1">{kpi.overdueTasks || 0}</div>
          <span className="text-[11px] text-slate-400">Behind schedule</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Overall Progress
          </span>
          <div className="text-2xl font-bold text-indigo-600 mt-1">
            {kpi.overallProgress || 0}%
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
            <div
              className="bg-indigo-600 h-1.5 rounded-full"
              style={{ width: `${kpi.overallProgress || 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Visualizers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Comparative Velocity */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">
            Department / Team Task Completion Comparison
          </h3>
          {teamPerformance.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-8 text-center">No teams recorded.</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={teamPerformance}>
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                  <YAxis allowDecimals={false} stroke="#94a3b8" fontSize={11} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="completed" name="Completed" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="pending" name="Pending" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Room Comparative Velocity */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">
            Room-wise Task Completion Comparison
          </h3>
          {roomPerformance.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-8 text-center">No rooms recorded.</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={roomPerformance}>
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                  <YAxis allowDecimals={false} stroke="#94a3b8" fontSize={11} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="completed" name="Completed" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="pending" name="Pending" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Task Status Distribution */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">
            Workspace Task Status Distribution
          </h3>
          {statusDistribution.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-8 text-center">No tasks recorded.</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={STATUS_COLORS[index % STATUS_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Milestones Roadmap */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Milestone className="h-4 w-4 text-emerald-600" />
          Key Milestones & Critical Deadlines ({milestones.length})
        </h3>

        {milestones.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No milestone items recorded.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {milestones.map((m) => (
              <div key={m._id} className="py-3 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-800">{m.title}</h4>
                  {m.description && <p className="text-[11px] text-slate-500">{m.description}</p>}
                </div>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  {new Date(m.startTime).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


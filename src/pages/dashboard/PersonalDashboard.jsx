import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportApi } from '../../api/features.api';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge, PriorityBadge } from '../../components/common/Badge';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Calendar,
  ListTodo,
  TrendingUp,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

const STATUS_COLORS = {
  'To Do': '#64748b',
  'In Progress': '#3b82f6',
  'Under Review': '#f59e0b',
  'Changes Requested': '#ec4899',
  'Completed': '#10b981',
};

const PRIORITY_COLORS = {
  Low: '#10b981',
  Medium: '#3b82f6',
  High: '#f59e0b',
  Urgent: '#ef4444',
};

export default function PersonalDashboard() {
  const { user } = useAuth();

  const { data: reportRes, isLoading } = useQuery({
    queryKey: ['personal-report'],
    queryFn: () => reportApi.getPersonal(),
  });

  const report = reportRes?.data;

  if (isLoading) {
    return (
      <div className="p-12 flex justify-center">
        <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  const kpi = report?.kpi || {
    totalAssigned: 0,
    completedTasks: 0,
    pendingTasks: 0,
    overdueTasks: 0,
    completionRate: 0,
  };

  const statusData = report?.statusDistribution?.filter((d) => d.value > 0) || [];
  const priorityData = report?.priorityDistribution || [];
  const todaySchedules = report?.todaySchedules || [];
  const upcomingDeadlines = report?.upcomingDeadlines || [];
  const todayPlan = report?.todayPlan;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-indigo-700 to-indigo-900 rounded-2xl p-6 sm:p-8 text-white shadow-lg">
        <div>
          <span className="text-xs uppercase font-semibold tracking-wider text-indigo-200">
            Operations Workspace
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mt-1">
            Welcome back, {user?.name}
          </h1>
          <p className="text-sm text-indigo-100 mt-1">
            You have {kpi.pendingTasks} active tasks assigned with {kpi.overdueTasks} overdue items.
          </p>
        </div>

        <Link
          to="/app/daily-planner"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-indigo-700 hover:bg-indigo-50 font-semibold text-xs transition-colors shrink-0 shadow"
        >
          <Clock className="h-4 w-4" />
          <span>{todayPlan ? "Review Today's Plan" : "Fill Today's Work Plan"}</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Assigned Tasks
            </span>
            <ListTodo className="h-4 w-4" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{kpi.totalAssigned}</div>
          <span className="text-[11px] text-slate-500 mt-1 block">Across all accessible rooms</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-blue-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              In Progress / Pending
            </span>
            <Clock className="h-4 w-4" />
          </div>
          <div className="text-2xl font-bold text-blue-600">{kpi.pendingTasks}</div>
          <span className="text-[11px] text-slate-500 mt-1 block">Active work items</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-emerald-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Completed
            </span>
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <div className="text-2xl font-bold text-emerald-600">{kpi.completedTasks}</div>
          <span className="text-[11px] text-slate-500 mt-1 block">Tasks signed off</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-red-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Overdue
            </span>
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div className="text-2xl font-bold text-red-600">{kpi.overdueTasks}</div>
          <span className="text-[11px] text-slate-500 mt-1 block">Past due deadline</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-indigo-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Completion Rate
            </span>
            <TrendingUp className="h-4 w-4" />
          </div>
          <div className="text-2xl font-bold text-indigo-600">{kpi.completionRate}%</div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
            <div
              className="bg-indigo-600 h-1.5 rounded-full"
              style={{ width: `${kpi.completionRate}%` }}
            />
          </div>
        </div>
      </div>

      {/* Analytics Visualizers (Recharts) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution Pie Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Task Status Distribution</h3>
          {statusData.length === 0 ? (
            <div className="h-60 flex items-center justify-center text-xs text-slate-400 italic">
              No task records available
            </div>
          ) : (
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {statusData.map((entry) => (
                      <Cell
                        key={`cell-${entry.name}`}
                        fill={STATUS_COLORS[entry.name] || '#6366f1'}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
                {statusData.map((d) => (
                  <div key={d.name} className="flex items-center gap-1.5 text-xs text-slate-600">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: STATUS_COLORS[d.name] || '#6366f1' }}
                    />
                    <span>
                      {d.name} ({d.value})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Priority Breakdown Bar Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Task Priority Breakdown</h3>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityData}>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                <YAxis allowDecimals={false} stroke="#94a3b8" fontSize={11} />
                <Tooltip />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {priorityData.map((entry) => (
                    <Cell
                      key={`bar-${entry.name}`}
                      fill={PRIORITY_COLORS[entry.name] || '#6366f1'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Today's Schedule & Upcoming Deadlines */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Schedule */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-indigo-600" />
              Today's Schedule & Meetings ({todaySchedules.length})
            </h3>
            <Link
              to="/app/my-calendar"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
            >
              Open Full Calendar
            </Link>
          </div>

          <div className="space-y-3">
            {todaySchedules.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4">No meetings scheduled for today.</p>
            ) : (
              todaySchedules.map((s) => (
                <div
                  key={s._id}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-start justify-between"
                >
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-600">
                      {s.type}
                    </span>
                    <h4 className="text-xs font-semibold text-slate-900 mt-0.5">{s.title}</h4>
                    {s.location && (
                      <p className="text-[11px] text-slate-500 mt-1">📍 {s.location}</p>
                    )}
                  </div>
                  <span className="text-xs font-mono font-semibold text-slate-600">
                    {new Date(s.startTime).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Upcoming Deadlines */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" />
              Upcoming Task Deadlines
            </h3>
            <Link
              to="/app/my-tasks"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
            >
              View My Tasks
            </Link>
          </div>

          <div className="space-y-3">
            {upcomingDeadlines.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4">No upcoming deadlines.</p>
            ) : (
              upcomingDeadlines.map((t) => (
                <div
                  key={t._id}
                  className="p-3 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-900 truncate">{t.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <StatusBadge status={t.status} />
                      <PriorityBadge priority={t.priority} />
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-semibold text-slate-700 block">
                      {new Date(t.dueDate).toLocaleDateString()}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {t.roomId?.name || 'Department'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


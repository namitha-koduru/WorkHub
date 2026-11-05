import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { dailyPlanApi } from '../../api/features.api';
import { workspaceApi } from '../../api/workspace.api';
import { Avatar } from '../../components/common/Avatar';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Users,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

export default function WorkspaceDailyStandupsPage() {
  const { workspaceId } = useParams();
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  const { data: wsRes } = useQuery({
    queryKey: ['workspace', workspaceId],
    queryFn: () => workspaceApi.getById(workspaceId),
    enabled: !!workspaceId,
  });
  const workspace = wsRes?.data;

  const { data: summaryRes, isLoading } = useQuery({
    queryKey: ['workspace-daily-summary', workspaceId, selectedDate],
    queryFn: () => dailyPlanApi.getWorkspaceSummary(workspaceId, selectedDate),
    enabled: !!workspaceId,
  });

  const summary = summaryRes?.data;
  const teamSummaries = summary?.teamSummaries || [];
  const allBlockers = summary?.allBlockers || [];

  const handleDateShift = (days) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + days);
    setSelectedDate(current.toISOString().split('T')[0]);
  };

  if (isLoading) {
    return (
      <div className="p-12 flex justify-center">
        <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            All-Teams Daily Coordination & Standups
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Cross-department standup monitoring, progress tracking, and blocker triage across {workspace?.name}.
          </p>
        </div>

        {/* Date Navigator */}
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs">
          <button
            onClick={() => handleDateShift(-1)}
            className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-900"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 px-2">
            <Calendar className="h-3.5 w-3.5 text-indigo-600" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-xs font-bold border-none p-0 focus:outline-none cursor-pointer text-slate-800"
            />
          </div>

          <button
            onClick={() => handleDateShift(1)}
            className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-900"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* High-level Summary Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Workspace Submission Rate
            </span>
            <div className="text-2xl font-black text-slate-900 mt-0.5">
              {summary?.overallSubmissionRate || 0}%
            </div>
            <span className="text-xs text-slate-500 font-medium">
              {summary?.totalSubmitted || 0} of {summary?.totalWorkspaceMembers || 0} staff filed
            </span>
          </div>
          <div className="h-12 w-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <TrendingUp className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Department Units
            </span>
            <div className="text-2xl font-black text-slate-900 mt-0.5">
              {teamSummaries.length}
            </div>
            <span className="text-xs text-slate-500 font-medium">
              Active operating teams
            </span>
          </div>
          <div className="h-12 w-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              All-Teams Blockers
            </span>
            <div
              className={`text-2xl font-black mt-0.5 ${
                allBlockers.length > 0 ? 'text-rose-600' : 'text-emerald-600'
              }`}
            >
              {allBlockers.length}
            </div>
            <span className="text-xs text-slate-500 font-medium">
              {allBlockers.length > 0
                ? 'High-priority management blockers'
                : 'All teams unblocked'}
            </span>
          </div>
          <div
            className={`h-12 w-12 rounded-full flex items-center justify-center ${
              allBlockers.length > 0
                ? 'bg-rose-50 text-rose-600'
                : 'bg-emerald-50 text-emerald-600'
            }`}
          >
            <AlertTriangle className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Cross-Team Blockers Triage Panel */}
      {allBlockers.length > 0 && (
        <div className="p-5 rounded-2xl bg-red-50/80 border border-red-200 space-y-3">
          <h3 className="text-sm font-bold text-red-950 uppercase tracking-wider flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-600" /> Operational Blockers Requiring Immediate Coordination
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {allBlockers.map((b, idx) => (
              <div
                key={idx}
                className="bg-white p-4 rounded-xl border border-red-100 shadow-xs flex items-start justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-slate-900">{b.user?.name}</span>
                    <span className="text-[10px] text-slate-400">({b.user?.title || 'Staff'})</span>
                  </div>
                  <p className="text-red-700 font-medium leading-relaxed">{b.blocker}</p>
                </div>
                <Avatar user={b.user} size="xs" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Department Summaries Grid */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-900 tracking-tight">
          Department Daily Standup Breakdown
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {teamSummaries.map((team) => (
            <div
              key={team.teamId}
              className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-sm space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-base font-bold text-slate-900">{team.teamName}</h4>
                    <span className="text-xs text-slate-500">
                      {team.submittedCount} of {team.totalMembers} members submitted ({team.submissionRate}%)
                    </span>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      team.submissionRate === 100
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : team.submissionRate > 0
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {team.submissionRate}% Filed
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      team.submissionRate === 100 ? 'bg-emerald-500' : 'bg-indigo-600'
                    }`}
                    style={{ width: `${team.submissionRate}%` }}
                  />
                </div>

                {/* Department Blockers */}
                {team.blockers.length > 0 ? (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-xs space-y-1">
                    <span className="font-bold text-red-900 block">Reported Blocker:</span>
                    {team.blockers.map((b, i) => (
                      <div key={i} className="text-red-700">
                        • <strong>{b.user?.name}:</strong> {b.blocker}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-emerald-700 font-medium flex items-center gap-1.5 pt-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> No blockers reported in this department
                  </div>
                )}
              </div>

              {/* View Department Updates Link */}
              <Link
                to={`/app/workspaces/${workspaceId}/teams/${team.teamId}/daily-updates`}
                className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-indigo-600 hover:text-indigo-700"
              >
                <span>Inspect Member Daily Updates</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


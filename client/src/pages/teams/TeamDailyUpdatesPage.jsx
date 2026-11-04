import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { dailyPlanApi } from '../../api/features.api';
import { Avatar } from '../../components/common/Avatar';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Check,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';

export default function TeamDailyUpdatesPage() {
  const { teamId } = useParams();
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  const { data: plansRes, isLoading } = useQuery({
    queryKey: ['team-daily-plans', teamId, selectedDate],
    queryFn: () => dailyPlanApi.getTeamPlans(teamId, selectedDate),
    enabled: !!teamId,
  });

  const memberPlans = plansRes?.data || [];

  const submittedCount = memberPlans.filter((m) => m.hasSubmitted).length;
  const totalCount = memberPlans.length;
  const submissionRate = totalCount > 0 ? Math.round((submittedCount / totalCount) * 100) : 0;

  // Extract all blockers
  const blockers = memberPlans
    .filter((m) => m.hasSubmitted && m.plan?.todayWork?.blockers?.trim())
    .map((m) => ({
      member: m.member,
      blocker: m.plan.todayWork.blockers,
    }));

  const handleDateShift = (days) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + days);
    setSelectedDate(current.toISOString().split('T')[0]);
  };

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header & Date Picker */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Daily Standup & Tomorrow's Work Plans
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Team leader supervision: inspect member accomplishments, WIP status, and blockers.
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

      {/* Standup Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Submission Rate
            </span>
            <div className="text-2xl font-black text-slate-900 mt-0.5">
              {submissionRate}%
            </div>
            <span className="text-xs text-slate-500 font-medium">
              {submittedCount} of {totalCount} submitted
            </span>
          </div>
          <div className="h-10 w-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Clock className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Active Blockers
            </span>
            <div
              className={`text-2xl font-black mt-0.5 ${
                blockers.length > 0 ? 'text-rose-600' : 'text-emerald-600'
              }`}
            >
              {blockers.length}
            </div>
            <span className="text-xs text-slate-500 font-medium">
              {blockers.length > 0 ? 'Requires leader assistance' : 'No blockers reported'}
            </span>
          </div>
          <div
            className={`h-10 w-10 rounded-full flex items-center justify-center ${
              blockers.length > 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
            }`}
          >
            <AlertTriangle className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Pending Updates
            </span>
            <div className="text-2xl font-black text-amber-600 mt-0.5">
              {totalCount - submittedCount}
            </div>
            <span className="text-xs text-slate-500 font-medium">
              Members yet to file standup
            </span>
          </div>
          <div className="h-10 w-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
            <AlertCircle className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Blockers Alert Banner */}
      {blockers.length > 0 && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 space-y-2">
          <h4 className="text-xs font-bold text-red-900 uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4 text-red-600" /> Urgent Team Blockers Requiring Intervention
          </h4>
          <div className="space-y-1.5">
            {blockers.map((b, idx) => (
              <div
                key={idx}
                className="bg-white p-3 rounded-lg border border-red-100 shadow-2xs flex items-start justify-between gap-3 text-xs"
              >
                <div>
                  <span className="font-bold text-slate-900">{b.member?.name || 'Member'}: </span>
                  <span className="text-red-700 font-medium">{b.blocker}</span>
                </div>
                <Avatar user={b.member} size="xs" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Member Standup Submissions List */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-slate-900 tracking-tight">Member Submissions</h3>

        {isLoading ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
          </div>
        ) : memberPlans.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-xs text-slate-400 italic">
            No members enrolled in this team yet.
          </div>
        ) : (
          <div className="space-y-4">
            {memberPlans.map((item) => {
              const { member, role, hasSubmitted, plan } = item;
              return (
                <div
                  key={member?._id || Math.random()}
                  className={`bg-white rounded-xl border transition-all overflow-hidden ${
                    hasSubmitted
                      ? 'border-slate-200/90 shadow-sm'
                      : 'border-dashed border-slate-300 opacity-80'
                  }`}
                >
                  {/* Member Header */}
                  <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Avatar user={member} size="sm" />
                      <div>
                        <span className="text-xs font-bold text-slate-900">{member?.name}</span>
                        <span className="block text-[10px] text-slate-400">{member?.title || role}</span>
                      </div>
                    </div>

                    <div>
                      {hasSubmitted ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <Check className="h-3 w-3" /> Submitted
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock className="h-3 w-3" /> Pending Standup
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Submission Body */}
                  {hasSubmitted && plan ? (
                    <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                      {/* Today's Accomplishments & Status */}
                      <div className="space-y-3">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 block">
                          Today's Execution
                        </span>

                        {plan.todayWork?.completedTasks?.length > 0 && (
                          <div>
                            <span className="font-semibold text-slate-700 block mb-1">
                              Completed Work:
                            </span>
                            <ul className="list-disc pl-4 space-y-0.5 text-slate-600">
                              {plan.todayWork.completedTasks.map((t, i) => (
                                <li key={i}>{t}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {plan.todayWork?.inProgressTasks?.length > 0 && (
                          <div>
                            <span className="font-semibold text-slate-700 block mb-1">
                              In Progress / WIP:
                            </span>
                            <ul className="list-disc pl-4 space-y-0.5 text-slate-600">
                              {plan.todayWork.inProgressTasks.map((t, i) => (
                                <li key={i}>{t}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {plan.todayWork?.blockers && (
                          <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-800">
                            <span className="font-bold flex items-center gap-1 text-red-900 mb-0.5">
                              <AlertTriangle className="h-3.5 w-3.5" /> Blocker:
                            </span>
                            <span>{plan.todayWork.blockers}</span>
                          </div>
                        )}
                      </div>

                      {/* Tomorrow's Plan */}
                      <div className="space-y-3 md:border-l md:border-slate-100 md:pl-6">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                          Tomorrow's Plan & Commitments
                        </span>

                        {plan.tomorrowPlan?.continueTasks?.length > 0 && (
                          <div>
                            <span className="font-semibold text-slate-700 block mb-1">
                              Continuing Tasks:
                            </span>
                            <ul className="list-disc pl-4 space-y-0.5 text-slate-600">
                              {plan.tomorrowPlan.continueTasks.map((t, i) => (
                                <li key={i}>{t}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {plan.tomorrowPlan?.newTasks?.length > 0 && (
                          <div>
                            <span className="font-semibold text-slate-700 block mb-1">
                              New Tasks:
                            </span>
                            <ul className="list-disc pl-4 space-y-0.5 text-slate-600">
                              {plan.tomorrowPlan.newTasks.map((t, i) => (
                                <li key={i}>{t}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {plan.tomorrowPlan?.notes && (
                          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-600">
                            <span className="font-semibold text-slate-700 block mb-0.5">Notes:</span>
                            <span>{plan.tomorrowPlan.notes}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 text-center text-xs text-slate-400 italic">
                      No daily standup logged for {selectedDate}.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}


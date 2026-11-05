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
  AlertTriangle,
  Loader2,
} from 'lucide-react';

export default function RoomDailyPlansPage() {
  const { roomId } = useParams();
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);

  const { data: plansRes, isLoading } = useQuery({
    queryKey: ['room-daily-plans', roomId, selectedDate],
    queryFn: () => dailyPlanApi.getRoomPlans(roomId, selectedDate),
  });

  const memberPlans = plansRes?.data || [];

  if (isLoading) {
    return (
      <div className="p-12 flex justify-center">
        <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Clock className="h-5 w-5 text-indigo-600" />
            Team Daily Standup & Work Plans
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Leader oversight into member progress, accomplishments, and operational roadblocks
          </p>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-slate-400" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Member Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {memberPlans.map(({ member, role, hasSubmitted, plan }) => (
          <div
            key={member?._id}
            className={`rounded-2xl border p-6 shadow-sm transition-all bg-white ${
              hasSubmitted ? 'border-slate-200' : 'border-dashed border-slate-300 bg-slate-50/50'
            }`}
          >
            {/* Member Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <Avatar user={member} size="md" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{member?.name}</h3>
                  <span className="text-[11px] text-slate-500">{member?.title}</span>
                </div>
              </div>

              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                  hasSubmitted
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}
              >
                {hasSubmitted ? 'Submitted' : 'Pending'}
              </span>
            </div>

            {hasSubmitted && plan ? (
              <div className="mt-4 space-y-4 text-xs">
                {/* Blockers alert */}
                {plan.todayWork?.blockers && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800">
                    <span className="font-bold flex items-center gap-1.5 text-[11px] text-red-900 mb-1">
                      <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
                      Reported Blocker
                    </span>
                    <p className="text-xs leading-relaxed">{plan.todayWork.blockers}</p>
                  </div>
                )}

                {/* Today's accomplishments */}
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Today's Deliverables
                  </span>
                  <div className="space-y-1">
                    {plan.todayWork?.completedTasks?.map((t, idx) => (
                      <p key={idx} className="flex items-center gap-1.5 text-slate-700">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        <span>{t}</span>
                      </p>
                    ))}
                    {plan.todayWork?.inProgressTasks?.map((t, idx) => (
                      <p key={idx} className="flex items-center gap-1.5 text-blue-700">
                        <Clock className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                        <span>{t}</span>
                      </p>
                    ))}
                  </div>
                </div>

                {/* Tomorrow's plan */}
                {plan.tomorrowPlan?.continueTasks?.length > 0 && (
                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Tomorrow's Focus
                    </span>
                    <ul className="list-disc list-inside space-y-0.5 text-slate-600">
                      {plan.tomorrowPlan.continueTasks.map((t, idx) => (
                        <li key={idx}>{t}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-400 italic">
                No daily plan submitted for {selectedDate}.
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}


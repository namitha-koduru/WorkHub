import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { activityApi } from '../../api/features.api';
import { Avatar } from '../../components/common/Avatar';
import { History, Clock, Loader2 } from 'lucide-react';

export default function RoomActivityPage() {
  const { roomId } = useParams();

  const { data: activitiesRes, isLoading } = useQuery({
    queryKey: ['room-activities', roomId],
    queryFn: () => activityApi.get({ roomId, limit: 100 }),
  });

  const activities = activitiesRes?.data || [];

  if (isLoading) {
    return (
      <div className="p-12 flex justify-center">
        <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <History className="h-5 w-5 text-indigo-600" />
          Room Audit Trail & Activity History
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Tamper-evident operational timeline recording mutations, status transitions, and approvals
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        {activities.length === 0 ? (
          <p className="text-xs text-slate-400 italic py-6 text-center">
            No activity records logged for this room yet.
          </p>
        ) : (
          <div className="space-y-4 divide-y divide-slate-100">
            {activities.map((a) => (
              <div key={a._id} className="pt-3 first:pt-0 flex items-start gap-3">
                <Avatar user={a.actor} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">{a.actor?.name}</span>
                    <span className="text-[11px] text-slate-400">
                      {new Date(a.createdAt).toLocaleString()}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 mt-0.5">
                    Executed{' '}
                    <span className="font-mono text-[11px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                      {a.action}
                    </span>{' '}
                    on {a.entityType.toLowerCase()}
                  </p>

                  {a.details && Object.keys(a.details).length > 0 && (
                    <div className="mt-1.5 p-2 rounded bg-slate-50 border border-slate-100 text-[11px] text-slate-600 font-mono">
                      {JSON.stringify(a.details)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


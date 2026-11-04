import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { taskApi } from '../../api/task.api';
import { roomApi } from '../../api/room.api';
import { Avatar } from '../../components/common/Avatar';
import {
  Milestone,
  CheckCircle2,
  Clock,
  Check,
  AlertCircle,
  Loader2,
} from 'lucide-react';

export default function RoomMilestonesPage() {
  const { roomId } = useParams();

  const { data: tasksRes, isLoading } = useQuery({
    queryKey: ['tasks', roomId],
    queryFn: () => taskApi.getByRoom({ roomId }),
  });

  const tasks = tasksRes?.data || [];

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
          <Milestone className="h-5 w-5 text-indigo-600" />
          Task Checkpoints & Milestone Tracking
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Granular checkpoints ensuring complex deliverables advance smoothly
        </p>
      </div>

      <div className="space-y-4">
        {tasks.map((task) => (
          <div
            key={task._id}
            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">{task.title}</h3>
                <span className="text-xs text-slate-400">
                  Assigned to: {task.assignedTo?.name || 'Unassigned'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                  {task.completedCheckpointCount || 0}/{task.checkpointCount || 0} Checkpoints
                </span>
              </div>
            </div>

            {task.checkpointCount === 0 ? (
              <p className="text-xs text-slate-400 italic">No checkpoints defined for this task.</p>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-slate-600">
                  {task.completedCheckpointCount} of {task.checkpointCount} checkpoints marked completed.
                </p>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${
                        task.checkpointCount > 0
                          ? Math.round(
                              ((task.completedCheckpointCount || 0) / task.checkpointCount) * 100
                            )
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}


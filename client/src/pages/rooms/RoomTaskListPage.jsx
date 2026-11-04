import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { taskApi } from '../../api/task.api';
import { roomApi } from '../../api/room.api';
import { StatusBadge, PriorityBadge } from '../../components/common/Badge';
import { Avatar } from '../../components/common/Avatar';
import { Button } from '../../components/common/Button';
import { EmptyState } from '../../components/common/EmptyState';
import { TaskModal } from '../../components/modals/TaskModal';
import {
  ListTodo,
  Search,
  Filter,
  Plus,
  CheckCircle2,
  Clock,
  Loader2,
} from 'lucide-react';

export default function RoomTaskListPage() {
  const { workspaceId, roomId } = useParams();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const { data: tasksRes, isLoading } = useQuery({
    queryKey: ['tasks', roomId],
    queryFn: () => taskApi.getByRoom({ roomId }),
  });

  const tasks = tasksRes?.data || [];

  const filtered = tasks.filter((t) => {
    if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
    if (priorityFilter !== 'ALL' && t.priority !== priorityFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchDesc = t.description?.toLowerCase().includes(q);
      const matchAssignee = t.assignedTo?.name?.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchAssignee) return false;
    }
    return true;
  });

  if (isLoading) {
    return (
      <div className="p-12 flex justify-center">
        <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tasks..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="ALL">All Statuses</option>
            <option value="To Do">To Do</option>
            <option value="In Progress">In Progress</option>
            <option value="Under Review">Under Review</option>
            <option value="Changes Requested">Changes Requested</option>
            <option value="Completed">Completed</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="ALL">All Priorities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Urgent">Urgent</option>
          </select>
        </div>

        <Button size="sm" icon={Plus} onClick={() => setIsCreateModalOpen(true)}>
          New Task
        </Button>
      </div>

      {/* Task List Table */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={ListTodo}
          title="No tasks found"
          description="Try modifying search or filter criteria."
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-100">
            {filtered.map((t) => (
              <div
                key={t._id}
                onClick={() => setSelectedTaskId(t._id)}
                className="p-4 hover:bg-slate-50 cursor-pointer transition-colors flex items-center justify-between gap-4"
              >
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={t.status} />
                    <PriorityBadge priority={t.priority} />
                    {t.tags?.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                  <h4 className="text-sm font-semibold text-slate-900 truncate">{t.title}</h4>
                </div>

                <div className="flex items-center gap-6 shrink-0">
                  {t.checkpointCount > 0 && (
                    <span className="text-xs text-slate-500 font-medium hidden sm:inline-block">
                      {t.completedCheckpointCount}/{t.checkpointCount} checkpoints
                    </span>
                  )}

                  {t.dueDate && (
                    <span
                      className={`text-xs font-semibold ${
                        new Date(t.dueDate) < new Date() && t.status !== 'Completed'
                          ? 'text-red-600'
                          : 'text-slate-600'
                      }`}
                    >
                      {new Date(t.dueDate).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  )}

                  <Avatar user={t.assignedTo} size="sm" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Task Modal */}
      {(selectedTaskId || isCreateModalOpen) && (
        <TaskModal
          isOpen={!!selectedTaskId || isCreateModalOpen}
          onClose={() => {
            setSelectedTaskId(null);
            setIsCreateModalOpen(false);
          }}
          taskId={selectedTaskId}
          roomId={roomId}
          workspaceId={workspaceId}
        />
      )}
    </div>
  );
}


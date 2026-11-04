import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { taskApi } from '../../api/task.api';
import { StatusBadge, PriorityBadge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import { TaskModal } from '../../components/modals/TaskModal';
import {
  CheckSquare,
  Search,
  Filter,
  Calendar,
  Layers,
  DoorOpen,
  Loader2,
  CheckCircle2,
} from 'lucide-react';

export default function MyTasksPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [selectedTask, setSelectedTask] = useState(null);

  const { data: tasksRes, isLoading } = useQuery({
    queryKey: ['my-tasks'],
    queryFn: () => taskApi.getMyTasks(),
  });

  const tasks = tasksRes?.data || [];

  const filteredTasks = tasks.filter((t) => {
    if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
    if (priorityFilter !== 'ALL' && t.priority !== priorityFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchDesc = t.description?.toLowerCase().includes(q);
      const matchTags = t.tags?.some((tag) => tag.toLowerCase().includes(q));
      if (!matchTitle && !matchDesc && !matchTags) return false;
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <CheckSquare className="h-6 w-6 text-indigo-600" />
            My Assigned Tasks
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            All responsibilities allocated to you across workspaces and event rooms ({tasks.length})
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, description or tag..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full md:w-40 px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="ALL">All Statuses</option>
            <option value="To Do">To Do</option>
            <option value="In Progress">In Progress</option>
            <option value="Under Review">Under Review</option>
            <option value="Changes Requested">Changes Requested</option>
            <option value="Completed">Completed</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="w-full md:w-36 px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="ALL">All Priorities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Urgent">Urgent</option>
          </select>
        </div>
      </div>

      {/* Tasks Table / Card List */}
      {filteredTasks.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="No tasks match your criteria"
          description="Try adjusting your filters or check back when new work items are assigned."
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-100 overflow-hidden">
          {filteredTasks.map((t) => (
            <div
              key={t._id}
              onClick={() => setSelectedTask(t)}
              className="p-4 sm:p-5 hover:bg-slate-50 cursor-pointer transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <StatusBadge status={t.status} />
                  <PriorityBadge priority={t.priority} />
                  {t.workspaceId && (
                    <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 flex items-center gap-1">
                      <Layers className="h-3 w-3" />
                      {t.workspaceId.name}
                    </span>
                  )}
                  {t.roomId && (
                    <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 flex items-center gap-1">
                      <DoorOpen className="h-3 w-3" />
                      {t.roomId.name}
                    </span>
                  )}
                </div>

                <h3 className="text-sm font-semibold text-slate-900 truncate">{t.title}</h3>

                {t.description && (
                  <p className="text-xs text-slate-500 line-clamp-1">{t.description}</p>
                )}
              </div>

              {/* Due Date & Action */}
              <div className="flex items-center gap-4 shrink-0 text-right">
                {t.dueDate && (
                  <div className="text-xs">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">
                      Due Date
                    </span>
                    <span
                      className={`font-semibold ${
                        new Date(t.dueDate) < new Date() && t.status !== 'Completed'
                          ? 'text-red-600'
                          : 'text-slate-700'
                      }`}
                    >
                      {new Date(t.dueDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Task Details Modal */}
      {selectedTask && (
        <TaskModal
          isOpen={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          taskId={selectedTask._id}
          roomId={selectedTask.roomId?._id || selectedTask.roomId}
          workspaceId={selectedTask.workspaceId?._id || selectedTask.workspaceId}
        />
      )}
    </div>
  );
}


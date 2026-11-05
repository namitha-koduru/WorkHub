import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taskApi } from '../../api/task.api';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge, PriorityBadge } from '../../components/common/Badge';
import { Avatar } from '../../components/common/Avatar';
import { Button } from '../../components/common/Button';
import { TaskModal } from '../../components/modals/TaskModal';
import { ApprovalDecisionModal } from '../../components/modals/ApprovalDecisionModal';
import {
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Check,
  FileCheck,
  AlertTriangle,
  RotateCcw,
  Loader2,
} from 'lucide-react';

const COLUMNS = [
  { id: 'To Do', label: 'To Do', bg: 'bg-slate-50', dot: 'bg-slate-400' },
  { id: 'In Progress', label: 'In Progress', bg: 'bg-blue-50/40', dot: 'bg-blue-500' },
  { id: 'Under Review', label: 'Under Review', bg: 'bg-amber-50/40', dot: 'bg-amber-500' },
  { id: 'Changes Requested', label: 'Changes Requested', bg: 'bg-pink-50/40', dot: 'bg-pink-500' },
  { id: 'Completed', label: 'Completed', bg: 'bg-emerald-50/40', dot: 'bg-emerald-500' },
];

export default function RoomKanbanBoardPage() {
  const { workspaceId, roomId } = useParams();
  const queryClient = useQueryClient();
  const { socket } = useSocket();
  const { user } = useAuth();

  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeApproval, setActiveApproval] = useState(null);

  // Drag and Drop state
  const [draggingTaskId, setDraggingTaskId] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);

  // Fetch Room Tasks
  const { data: tasksRes, isLoading } = useQuery({
    queryKey: ['tasks', roomId],
    queryFn: () => taskApi.getByRoom({ roomId }),
  });

  const tasks = tasksRes?.data || [];

  // Update Status Mutation (Drag and drop)
  const updateStatusMutation = useMutation({
    mutationFn: ({ taskId, status }) => taskApi.updateStatus(taskId, status),
    onMutate: async ({ taskId, status }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['tasks', roomId] });
      const previousTasks = queryClient.getQueryData(['tasks', roomId]);

      queryClient.setQueryData(['tasks', roomId], (old) => {
        if (!old?.data) return old;
        return {
          ...old,
          data: old.data.map((t) => (t._id === taskId ? { ...t, status } : t)),
        };
      });

      return { previousTasks };
    },
    onError: (err, newTodo, context) => {
      queryClient.setQueryData(['tasks', roomId], context.previousTasks);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', roomId] });
      queryClient.invalidateQueries({ queryKey: ['room', roomId] });
    },
  });

  // Socket.IO real-time collaboration updates
  useEffect(() => {
    if (!socket || !roomId) return;
    socket.emit('join_room', roomId);

    const handleTaskCreated = () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', roomId] });
    };
    const handleTaskUpdated = () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', roomId] });
    };
    const handleStatusChanged = () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', roomId] });
    };

    socket.on('task_created', handleTaskCreated);
    socket.on('task_updated', handleTaskUpdated);
    socket.on('task_status_changed', handleStatusChanged);

    return () => {
      socket.emit('leave_room', roomId);
      socket.off('task_created', handleTaskCreated);
      socket.off('task_updated', handleTaskUpdated);
      socket.off('task_status_changed', handleStatusChanged);
    };
  }, [socket, roomId, queryClient]);

  // Drag Event Handlers
  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggingTaskId(taskId);
  };

  const handleDragOver = (e, colId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverCol !== colId) {
      setDragOverCol(colId);
    }
  };

  const handleDragLeave = (e, colId) => {
    if (dragOverCol === colId) {
      setDragOverCol(null);
    }
  };

  const handleDrop = (e, colId) => {
    e.preventDefault();
    setDragOverCol(null);
    const taskId = e.dataTransfer.getData('text/plain') || draggingTaskId;
    if (taskId) {
      updateStatusMutation.mutate({ taskId, status: colId });
    }
    setDraggingTaskId(null);
  };

  const filteredTasks = tasks.filter((t) => {
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
      {/* Kanban Filter & Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3 flex-1">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-sm">
            <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tasks, descriptions..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Priority Filter */}
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

        {/* Action Button */}
        <Button size="sm" icon={Plus} onClick={() => setIsCreateModalOpen(true)}>
          Add Task
        </Button>
      </div>

      {/* 5-Column Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-start min-h-[600px] pb-12 overflow-x-auto">
        {COLUMNS.map((col) => {
          const colTasks = filteredTasks.filter((t) => t.status === col.id);
          const isOver = dragOverCol === col.id;

          return (
            <div
              key={col.id}
              onDragOver={(e) => handleDragOver(e, col.id)}
              onDragLeave={(e) => handleDragLeave(e, col.id)}
              onDrop={(e) => handleDrop(e, col.id)}
              className={`rounded-2xl border p-3 flex flex-col min-h-[500px] transition-all ${
                isOver
                  ? 'border-indigo-400 bg-indigo-50/40 ring-2 ring-indigo-400/30'
                  : `border-slate-200/90 ${col.bg}`
              }`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 px-1 border-b border-slate-200/60 mb-3">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${col.dot}`} />
                  <span className="text-xs font-bold text-slate-800">{col.label}</span>
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-600 shadow-xs">
                  {colTasks.length}
                </span>
              </div>

              {/* Column Tasks */}
              <div className="space-y-3 flex-1">
                {colTasks.map((t) => (
                  <div
                    key={t._id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, t._id)}
                    onClick={() => setSelectedTaskId(t._id)}
                    className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-slate-300 transition-all cursor-grab active:cursor-grabbing select-none group"
                  >
                    {/* Priority & Tags */}
                    <div className="flex items-center justify-between gap-1 mb-2">
                      <PriorityBadge priority={t.priority} />
                      {t.checkpoints?.length > 0 && (
                        <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                          <Check className="h-3 w-3 text-emerald-600" />
                          {t.completedCheckpointCount || 0}/{t.checkpointCount || 0}
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug">
                      {t.title}
                    </h4>

                    {/* Description snippet */}
                    {t.description && (
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        {t.description}
                      </p>
                    )}

                    {/* Card Footer: Due date + Assignee */}
                    <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100">
                      {t.dueDate ? (
                        <span
                          className={`text-[10px] font-semibold flex items-center gap-1 ${
                            new Date(t.dueDate) < new Date() && t.status !== 'Completed'
                              ? 'text-red-600'
                              : 'text-slate-400'
                          }`}
                        >
                          <Clock className="h-3 w-3" />
                          {new Date(t.dueDate).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      ) : (
                        <span />
                      )}

                      <Avatar user={t.assignedTo} size="xs" />
                    </div>
                  </div>
                ))}

                {colTasks.length === 0 && (
                  <div className="h-32 border border-dashed border-slate-300/80 rounded-xl flex items-center justify-center text-[11px] text-slate-400 italic">
                    Drop tasks here
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Task Modal (Create & Edit) */}
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


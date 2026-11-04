import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { StatusBadge, PriorityBadge } from '../common/Badge';
import { Avatar } from '../common/Avatar';
import { taskApi } from '../../api/task.api';
import { roomApi } from '../../api/room.api';
import { commentApi, approvalApi } from '../../api/features.api';
import { useAuth } from '../../context/AuthContext';
import {
  CheckCircle2,
  Clock,
  Send,
  Trash2,
  Plus,
  AlertCircle,
  FileCheck,
  Check,
} from 'lucide-react';

export function TaskModal({ isOpen, onClose, taskId, roomId, workspaceId }) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [status, setStatus] = useState('To Do');
  const [assignedTo, setAssignedTo] = useState('');
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [tags, setTags] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Checkpoints state
  const [newCheckpointTitle, setNewCheckpointTitle] = useState('');

  // Comment state
  const [newComment, setNewComment] = useState('');

  // Review submission state
  const [reviewComment, setReviewComment] = useState('');
  const [showReviewPrompt, setShowReviewPrompt] = useState(false);

  // Fetch Room Members for Assignment selection
  const { data: membersRes } = useQuery({
    queryKey: ['room-members', roomId],
    queryFn: () => roomApi.getMembers(roomId),
    enabled: isOpen && !!roomId,
  });
  const roomMembers = membersRes?.data || [];

  // Fetch Task Details if Editing
  const { data: taskRes, isLoading: taskLoading } = useQuery({
    queryKey: ['task', taskId],
    queryFn: () => taskApi.getById(taskId),
    enabled: isOpen && !!taskId,
  });
  const task = taskRes?.data;

  // Fetch Task Comments
  const { data: commentsRes } = useQuery({
    queryKey: ['comments', taskId],
    queryFn: () => commentApi.get(taskId, 'TASK'),
    enabled: isOpen && !!taskId,
  });
  const comments = commentsRes?.data || [];

  // Fetch Task Approvals
  const { data: approvalsRes } = useQuery({
    queryKey: ['approvals', taskId],
    queryFn: () => approvalApi.getHistory(taskId),
    enabled: isOpen && !!taskId,
  });
  const approvals = approvalsRes?.data || [];

  // Hydrate fields when task data arrives
  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setPriority(task.priority || 'Medium');
      setStatus(task.status || 'To Do');
      setAssignedTo(task.assignedTo?._id || '');
      setStartDate(task.startDate ? task.startDate.split('T')[0] : '');
      setDueDate(task.dueDate ? task.dueDate.split('T')[0] : '');
      setTags(task.tags ? task.tags.join(', ') : '');
    } else {
      setTitle('');
      setDescription('');
      setPriority('Medium');
      setStatus('To Do');
      setAssignedTo('');
      setStartDate('');
      setDueDate('');
      setTags('');
    }
    setErrorMsg('');
    setShowReviewPrompt(false);
  }, [task, isOpen]);

  // Create Task Mutation
  const createMutation = useMutation({
    mutationFn: (data) => taskApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      onClose();
    },
    onError: (err) => setErrorMsg(err.message || 'Failed to create task'),
  });

  // Update Task Mutation
  const updateMutation = useMutation({
    mutationFn: (data) => taskApi.update(taskId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      onClose();
    },
    onError: (err) => setErrorMsg(err.message || 'Failed to update task'),
  });

  // Checkpoint Mutations
  const addCheckpointMutation = useMutation({
    mutationFn: (title) =>
      taskApi.createCheckpoint({
        taskId,
        title,
        responsibleMember: assignedTo || null,
        targetDate: dueDate || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      setNewCheckpointTitle('');
    },
  });

  const toggleCheckpointMutation = useMutation({
    mutationFn: ({ cpId, status }) =>
      taskApi.updateCheckpoint(cpId, {
        status: status === 'COMPLETED' ? 'PENDING' : 'COMPLETED',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const deleteCheckpointMutation = useMutation({
    mutationFn: (cpId) => taskApi.deleteCheckpoint(cpId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
    },
  });

  // Add Comment Mutation
  const addCommentMutation = useMutation({
    mutationFn: (content) =>
      commentApi.create({
        targetType: 'TASK',
        targetId: taskId,
        organizationId: task.organizationId,
        workspaceId: task.workspaceId,
        roomId: task.roomId,
        content,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', taskId] });
      setNewComment('');
    },
  });

  // Submit for Review Mutation
  const submitReviewMutation = useMutation({
    mutationFn: (comments) => approvalApi.submit({ taskId, comments }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['approvals', taskId] });
      setShowReviewPrompt(false);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Task title is required');
      return;
    }

    const payload = {
      title,
      description,
      priority,
      status,
      assignedTo: assignedTo || null,
      startDate: startDate || null,
      dueDate: dueDate || null,
      tags: tags
        ? tags
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean)
        : [],
      workspaceId,
      roomId,
    };

    if (taskId) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={taskId ? 'Task Details & Collaboration' : 'Create New Task'}
      maxWidth="max-w-3xl"
    >
      {errorMsg && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Title */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Task Title *</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Set up stage acoustic baffles"
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Priority, Status & Assignee */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Urgent">Urgent</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="To Do">To Do</option>
              <option value="In Progress">In Progress</option>
              <option value="Under Review">Under Review</option>
              <option value="Changes Requested">Changes Requested</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Assigned Member
            </label>
            <select
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="">Unassigned</option>
              {roomMembers.map((m) => (
                <option key={m.user?._id} value={m.user?._id}>
                  {m.user?.name} ({m.role})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Dates & Tags */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Stage, Audio, Security"
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detailed task instructions, requirements, and deliverables..."
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Form Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>

          <div className="flex items-center gap-2">
            {taskId && task?.status !== 'Under Review' && task?.status !== 'Completed' && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                icon={FileCheck}
                onClick={() => setShowReviewPrompt(!showReviewPrompt)}
              >
                Submit for Leader Review
              </Button>
            )}

            <Button
              type="submit"
              size="sm"
              isLoading={createMutation.isPending || updateMutation.isPending}
            >
              {taskId ? 'Save Changes' : 'Create Task'}
            </Button>
          </div>
        </div>
      </form>

      {/* Review Submission Accordion */}
      {showReviewPrompt && (
        <div className="mt-4 p-4 rounded-xl bg-amber-50 border border-amber-200 animate-in fade-in duration-200">
          <h4 className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
            <FileCheck className="h-4 w-4" />
            Submit Task for Leader Approval
          </h4>
          <p className="text-xs text-amber-700 mt-1">
            This will transition the task to <strong>"Under Review"</strong> and notify your room
            leader.
          </p>
          <textarea
            rows={2}
            value={reviewComment}
            onChange={(e) => setReviewComment(e.target.value)}
            placeholder="Add completion notes for the leader..."
            className="w-full mt-2 p-2 text-xs rounded border border-amber-300 bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
          <div className="flex justify-end gap-2 mt-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowReviewPrompt(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="primary"
              isLoading={submitReviewMutation.isPending}
              onClick={() => submitReviewMutation.mutate(reviewComment)}
            >
              Confirm Submission
            </Button>
          </div>
        </div>
      )}

      {/* Checkpoints & Milestones Section (Only for existing task) */}
      {taskId && (
        <div className="mt-8 pt-6 border-t border-slate-200">
          <h4 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-indigo-600" />
            Checkpoints & Milestones ({task?.checkpoints?.length || 0})
          </h4>

          {/* Checkpoint list */}
          <div className="space-y-2 mb-3">
            {task?.checkpoints?.map((cp) => (
              <div
                key={cp._id}
                className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs"
              >
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <button
                    type="button"
                    onClick={() =>
                      toggleCheckpointMutation.mutate({ cpId: cp._id, status: cp.status })
                    }
                    className={`h-4 w-4 rounded flex items-center justify-center border transition-colors ${
                      cp.status === 'COMPLETED'
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'border-slate-300 hover:border-indigo-500'
                    }`}
                  >
                    {cp.status === 'COMPLETED' && <Check className="h-3 w-3" />}
                  </button>
                  <span
                    className={`truncate ${
                      cp.status === 'COMPLETED' ? 'line-through text-slate-400' : 'text-slate-800'
                    }`}
                  >
                    {cp.title}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {cp.responsibleMember && (
                    <Avatar user={cp.responsibleMember} size="xs" />
                  )}
                  <button
                    type="button"
                    onClick={() => deleteCheckpointMutation.mutate(cp._id)}
                    className="text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add Checkpoint Input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newCheckpointTitle}
              onChange={(e) => setNewCheckpointTitle(e.target.value)}
              placeholder="Add next checkpoint..."
              className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <Button
              type="button"
              size="sm"
              variant="secondary"
              icon={Plus}
              disabled={!newCheckpointTitle.trim()}
              isLoading={addCheckpointMutation.isPending}
              onClick={() => addCheckpointMutation.mutate(newCheckpointTitle)}
            >
              Add
            </Button>
          </div>
        </div>
      )}

      {/* Discussion & Comments Thread (Only for existing task) */}
      {taskId && (
        <div className="mt-8 pt-6 border-t border-slate-200">
          <h4 className="text-sm font-semibold text-slate-800 mb-3">
            Task Discussion ({comments.length})
          </h4>

          {/* Comments list */}
          <div className="space-y-3 max-h-48 overflow-y-auto mb-3 pr-1">
            {comments.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No comments yet. Start the conversation.</p>
            ) : (
              comments.map((c) => (
                <div key={c._id} className="flex items-start gap-2.5 text-xs">
                  <Avatar user={c.author} size="xs" />
                  <div className="flex-1 bg-slate-50 border border-slate-200/80 rounded-xl p-2.5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-slate-800">{c.author?.name}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(c.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-slate-600">{c.content}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Comment Input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment or update..."
              className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newComment.trim()) {
                  e.preventDefault();
                  addCommentMutation.mutate(newComment);
                }
              }}
            />
            <Button
              type="button"
              size="sm"
              icon={Send}
              disabled={!newComment.trim()}
              isLoading={addCommentMutation.isPending}
              onClick={() => addCommentMutation.mutate(newComment)}
            >
              Post
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}


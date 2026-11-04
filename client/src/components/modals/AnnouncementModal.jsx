import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { announcementApi } from '../../api/announcement.api';
import { AlertCircle, Pin, AlertTriangle } from 'lucide-react';

export function AnnouncementModal({
  isOpen,
  onClose,
  workspaceId,
  organizationId,
  teamId = null,
  teams = [],
  defaultScope = 'WORKSPACE',
}) {
  const queryClient = useQueryClient();
  const [scope, setScope] = useState(defaultScope);
  const [selectedTeamId, setSelectedTeamId] = useState(teamId || '');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState('NORMAL');
  const [isPinned, setIsPinned] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const createMutation = useMutation({
    mutationFn: (data) => announcementApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      setTitle('');
      setContent('');
      setIsPinned(false);
      setPriority('NORMAL');
      onClose();
    },
    onError: (err) => setErrorMsg(err.message || 'Failed to post announcement'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Announcement title is required');
      return;
    }
    if (!content.trim()) {
      setErrorMsg('Announcement content is required');
      return;
    }
    if (scope === 'TEAM' && !selectedTeamId) {
      setErrorMsg('Please select a team for team-scoped announcement');
      return;
    }

    createMutation.mutate({
      scope,
      organizationId,
      workspaceId,
      teamId: scope === 'TEAM' ? selectedTeamId : null,
      title,
      content,
      priority,
      isPinned,
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Publish Announcement">
      {errorMsg && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Target Audience & Scope</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setScope('WORKSPACE')}
              className={`p-2.5 rounded-lg border text-left font-medium transition-all ${
                scope === 'WORKSPACE'
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div className="text-xs font-semibold">Entire Workspace</div>
              <div className="text-[11px] text-slate-500 font-normal mt-0.5">
                All event staff & teams
              </div>
            </button>
            <button
              type="button"
              onClick={() => setScope('TEAM')}
              className={`p-2.5 rounded-lg border text-left font-medium transition-all ${
                scope === 'TEAM'
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div className="text-xs font-semibold">Specific Team</div>
              <div className="text-[11px] text-slate-500 font-normal mt-0.5">
                Targeted department only
              </div>
            </button>
          </div>
        </div>

        {scope === 'TEAM' && (
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Select Team *</label>
            <select
              required
              value={selectedTeamId}
              onChange={(e) => setSelectedTeamId(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select a team</option>
              {teams.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block font-semibold text-slate-700 mb-1">Announcement Title *</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Stage Truss Assembly Starts at 2 PM, All Hands Briefing"
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">Announcement Content *</label>
          <textarea
            rows={4}
            required
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Provide operational directives, schedules, safety alerts, or general instructions..."
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
          <div className="flex items-center gap-3">
            <label className="font-semibold text-slate-700">Priority:</label>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 cursor-pointer text-slate-700">
                <input
                  type="radio"
                  name="priority"
                  value="NORMAL"
                  checked={priority === 'NORMAL'}
                  onChange={() => setPriority('NORMAL')}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                <span>Normal</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer text-red-700 font-medium">
                <input
                  type="radio"
                  name="priority"
                  value="URGENT"
                  checked={priority === 'URGENT'}
                  onChange={() => setPriority('URGENT')}
                  className="text-red-600 focus:ring-red-500"
                />
                <span className="flex items-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5" /> Urgent Alert
                </span>
              </label>
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
            <input
              type="checkbox"
              checked={isPinned}
              onChange={(e) => setIsPinned(e.target.checked)}
              className="rounded text-indigo-600 focus:ring-indigo-500"
            />
            <span className="flex items-center gap-1">
              <Pin className="h-3.5 w-3.5 text-indigo-600" /> Pin to Top
            </span>
          </label>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={createMutation.isPending}>
            Publish Announcement
          </Button>
        </div>
      </form>
    </Modal>
  );
}


import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { roomApi } from '../../api/room.api';
import { teamApi } from '../../api/team.api';
import { workspaceApi } from '../../api/workspace.api';
import { AlertCircle } from 'lucide-react';

export function RoomModal({ isOpen, onClose, workspaceId, organizationId, teamId: initialTeamId = null }) {
  const queryClient = useQueryClient();
  const [selectedTeamId, setSelectedTeamId] = useState(initialTeamId || '');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [leader, setLeader] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch teams in this workspace
  const { data: teamsRes } = useQuery({
    queryKey: ['teams', workspaceId],
    queryFn: () => teamApi.getAll(workspaceId),
    enabled: isOpen && !!workspaceId,
  });
  const teams = teamsRes?.data || [];

  // Fetch workspace members to select a room leader
  const { data: membersRes } = useQuery({
    queryKey: ['workspace-members', workspaceId],
    queryFn: () => workspaceApi.getMembers(workspaceId),
    enabled: isOpen && !!workspaceId,
  });
  const members = membersRes?.data || [];

  useEffect(() => {
    if (initialTeamId) {
      setSelectedTeamId(initialTeamId);
    } else if (teams.length > 0 && !selectedTeamId) {
      setSelectedTeamId(teams[0]._id);
    }
  }, [initialTeamId, teams, isOpen]);

  const createMutation = useMutation({
    mutationFn: (data) => roomApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ['team'] });
      setName('');
      setDescription('');
      setLeader('');
      onClose();
    },
    onError: (err) => setErrorMsg(err.message || 'Failed to create room'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedTeamId) {
      setErrorMsg('Please select a parent team for this collaborative room.');
      return;
    }
    if (!name.trim() || !leader) {
      setErrorMsg('Room name and a designated Room Leader are required');
      return;
    }

    createMutation.mutate({
      teamId: selectedTeamId,
      workspaceId,
      organizationId,
      name,
      description,
      leader,
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Collaborative Room / Channel">
      {errorMsg && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Parent Team / Department *</label>
          <select
            required
            value={selectedTeamId}
            onChange={(e) => setSelectedTeamId(e.target.value)}
            disabled={!!initialTeamId}
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white disabled:bg-slate-50 disabled:text-slate-500"
          >
            <option value="">Select a Parent Team...</option>
            {teams.map((t) => (
              <option key={t._id} value={t._id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">Room / Channel Name *</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Social Media Campaigns, Stage AV & Lighting"
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">Designated Room Leader *</label>
          <select
            required
            value={leader}
            onChange={(e) => setLeader(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="">Select a Room Leader...</option>
            {members.map((m) => (
              <option key={m.user?._id} value={m.user?._id}>
                {m.user?.name} ({m.user?.email}) - {m.role}
              </option>
            ))}
          </select>
          <p className="text-[11px] text-slate-400 mt-1">
            Room leaders have authority over room task approvals, member allocation, and daily work oversight.
          </p>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">Description</label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Specific area of focus, channels, deliverable scope..."
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={createMutation.isPending}>
            Create Room
          </Button>
        </div>
      </form>
    </Modal>
  );
}

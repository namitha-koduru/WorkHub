import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { roomApi } from '../../api/room.api';
import { workspaceApi } from '../../api/workspace.api';
import { AlertCircle } from 'lucide-react';

export function RoomModal({ isOpen, onClose, workspaceId, organizationId }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [leader, setLeader] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch workspace members to select a room leader
  const { data: membersRes } = useQuery({
    queryKey: ['workspace-members', workspaceId],
    queryFn: () => workspaceApi.getMembers(workspaceId),
    enabled: isOpen && !!workspaceId,
  });
  const members = membersRes?.data || [];

  const createMutation = useMutation({
    mutationFn: (data) => roomApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms', workspaceId] });
      setName('');
      setDescription('');
      setLeader('');
      onClose();
    },
    onError: (err) => setErrorMsg(err.message || 'Failed to create room'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !leader) {
      setErrorMsg('Room name and a designated Room Leader are required');
      return;
    }

    createMutation.mutate({
      workspaceId,
      organizationId,
      name,
      description,
      leader,
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Department / Room">
      {errorMsg && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Room Name *</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Public Relations, Digital Marketing, Technical Team"
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
            Room leaders have authority over room task approvals, member allocation, and daily plan oversight.
          </p>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">Description</label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Key responsibilities and operational scope for this room..."
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="sm" isLoading={createMutation.isPending}>
            Create Room
          </Button>
        </div>
      </form>
    </Modal>
  );
}


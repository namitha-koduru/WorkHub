import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { teamApi } from '../../api/team.api';
import { workspaceApi } from '../../api/workspace.api';
import { AlertCircle, Plus, X } from 'lucide-react';

export function TeamModal({ isOpen, onClose, workspaceId, organizationId, teamToEdit = null }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [responsibilities, setResponsibilities] = useState([]);
  const [respInput, setRespInput] = useState('');
  const [leader, setLeader] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch workspace members to choose a leader
  const { data: membersRes } = useQuery({
    queryKey: ['workspace-members', workspaceId],
    queryFn: () => workspaceApi.getMembers(workspaceId),
    enabled: isOpen && !!workspaceId,
  });

  const members = membersRes?.data || [];

  useEffect(() => {
    if (teamToEdit) {
      setName(teamToEdit.name || '');
      setDescription(teamToEdit.description || '');
      setResponsibilities(teamToEdit.responsibilities || []);
      setLeader(teamToEdit.leader?._id || teamToEdit.leader || '');
    } else {
      setName('');
      setDescription('');
      setResponsibilities([]);
      setLeader(members[0]?.user?._id || '');
    }
    setErrorMsg('');
  }, [teamToEdit, isOpen, members.length]);

  const saveMutation = useMutation({
    mutationFn: (data) =>
      teamToEdit ? teamApi.update(teamToEdit._id, data) : teamApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceId] });
      onClose();
    },
    onError: (err) => setErrorMsg(err.message || 'Failed to save team'),
  });

  const handleAddResp = () => {
    if (respInput.trim() && !responsibilities.includes(respInput.trim())) {
      setResponsibilities([...responsibilities, respInput.trim()]);
      setRespInput('');
    }
  };

  const handleRemoveResp = (idx) => {
    setResponsibilities(responsibilities.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Team name is required');
      return;
    }
    if (!leader) {
      setErrorMsg('Please select a team leader');
      return;
    }

    const payload = {
      workspaceId,
      organizationId,
      name,
      description,
      responsibilities,
      leader,
    };

    saveMutation.mutate(payload);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={teamToEdit ? 'Edit Team / Department' : 'Create Team / Department'}
    >
      {errorMsg && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Team / Department Name *</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. PR & Digital Marketing, Technical Team, Hospitality"
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">Description</label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Scope of this team, core mandate, operational expectations..."
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">Team Leader *</label>
          <select
            required
            value={leader}
            onChange={(e) => setLeader(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Select a leader from workspace members</option>
            {members.map((m) => (
              <option key={m.user?._id || m._id} value={m.user?._id || m._id}>
                {m.user?.name || 'Member'} ({m.user?.email}) - {m.role}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">
            Responsibilities & Areas of Ownership
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={respInput}
              onChange={(e) => setRespInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddResp();
                }
              }}
              placeholder="e.g. Stage AV & Lighting, Campus Outreach..."
              className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <Button type="button" variant="secondary" size="sm" onClick={handleAddResp}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Add
            </Button>
          </div>
          {responsibilities.length > 0 && (
            <div className="flex flex-wrap gap-1.5 p-2 rounded-lg bg-slate-50 border border-slate-200">
              {responsibilities.map((r, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-white text-slate-700 border border-slate-200 shadow-sm"
                >
                  <span>{r}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveResp(idx)}
                    className="text-slate-400 hover:text-red-500"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saveMutation.isPending}>
            {teamToEdit ? 'Save Changes' : 'Create Team'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}


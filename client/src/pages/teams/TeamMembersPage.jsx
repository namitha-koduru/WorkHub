import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teamApi } from '../../api/team.api';
import { workspaceApi } from '../../api/workspace.api';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../../components/common/Avatar';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import {
  Users,
  UserPlus,
  Shield,
  Trash2,
  Loader2,
  AlertCircle,
  Mail,
  Phone,
} from 'lucide-react';

export default function TeamMembersPage() {
  const { workspaceId, teamId } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState('TEAM_MEMBER');
  const [errorMsg, setErrorMsg] = useState('');

  // Team details
  const { data: teamRes } = useQuery({
    queryKey: ['team', teamId],
    queryFn: () => teamApi.getById(teamId),
    enabled: !!teamId,
  });
  const team = teamRes?.data;
  const isLeader =
    String(team?.leader?._id || team?.leader) === String(user?._id) ||
    user?.role === 'ORGANIZATION_OWNER';

  // Team members
  const { data: membersRes, isLoading } = useQuery({
    queryKey: ['team-members', teamId],
    queryFn: () => teamApi.getMembers(teamId),
    enabled: !!teamId,
  });
  const teamMembers = membersRes?.data || [];

  // Workspace members (eligible pool to add)
  const { data: wsMembersRes } = useQuery({
    queryKey: ['workspace-members', workspaceId],
    queryFn: () => workspaceApi.getMembers(workspaceId),
    enabled: isAddModalOpen && !!workspaceId,
  });
  const wsMembers = wsMembersRes?.data || [];

  // Filter out members already in the team
  const existingUserIds = teamMembers.map((m) => m.user?._id);
  const eligibleMembers = wsMembers.filter((m) => !existingUserIds.includes(m.user?._id));

  // Add Member Mutation
  const addMutation = useMutation({
    mutationFn: (data) => teamApi.addMember(teamId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members', teamId] });
      queryClient.invalidateQueries({ queryKey: ['team', teamId] });
      setIsAddModalOpen(false);
      setSelectedUserId('');
      setErrorMsg('');
    },
    onError: (err) => setErrorMsg(err.message || 'Failed to add member'),
  });

  // Remove Member Mutation
  const removeMutation = useMutation({
    mutationFn: (userId) => teamApi.removeMember(teamId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members', teamId] });
      queryClient.invalidateQueries({ queryKey: ['team', teamId] });
    },
    onError: (err) => alert(err.message || 'Failed to remove member'),
  });

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!selectedUserId) {
      setErrorMsg('Please select a workspace member');
      return;
    }
    addMutation.mutate({ userId: selectedUserId, role: selectedRole });
  };

  if (isLoading) {
    return (
      <div className="p-12 flex justify-center">
        <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Department Roster</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Active members assigned to {team?.name} authorized to collaborate on department tasks and rooms.
          </p>
        </div>

        {isLeader && (
          <Button size="sm" onClick={() => setIsAddModalOpen(true)}>
            <UserPlus className="h-4 w-4 mr-1.5" /> Add Member to Team
          </Button>
        )}
      </div>

      {/* Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {teamMembers.map((m) => {
          const isTeamLeader = m.role === 'TEAM_LEADER';
          return (
            <div
              key={m._id}
              className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between gap-4"
            >
              <div className="flex items-start gap-3">
                <Avatar user={m.user} size="md" />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900">{m.user?.name}</h3>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isTeamLeader
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {isTeamLeader ? 'Team Leader' : 'Team Member'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500">{m.user?.title || 'Staff'}</p>

                  <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3" /> {m.user?.email}
                    </span>
                    {m.user?.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" /> {m.user?.phone}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Remove button (leaders only, not on leader) */}
              {isLeader && !isTeamLeader && (
                <button
                  onClick={() => {
                    if (confirm(`Remove ${m.user?.name} from this team?`)) {
                      removeMutation.mutate(m.user?._id);
                    }
                  }}
                  className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                  title="Remove from Team"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Member Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Member to Department"
      >
        {errorMsg && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Select Workspace Member *
            </label>
            <select
              required
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select a member...</option>
              {eligibleMembers.map((m) => (
                <option key={m.user?._id} value={m.user?._id}>
                  {m.user?.name} ({m.user?.email}) - {m.user?.title || 'Member'}
                </option>
              ))}
            </select>
            {eligibleMembers.length === 0 && (
              <p className="text-[11px] text-amber-600 mt-1">
                All workspace members are already assigned to this team.
              </p>
            )}
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Department Role</label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="TEAM_MEMBER">Team Member</option>
              <option value="TEAM_LEADER">Team Leader (Co-Lead)</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsAddModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={addMutation.isPending}
              disabled={eligibleMembers.length === 0}
            >
              Add to Team
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}


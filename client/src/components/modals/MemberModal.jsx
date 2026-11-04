import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { orgApi } from '../../api/org.api';
import { workspaceApi } from '../../api/workspace.api';
import { roomApi } from '../../api/room.api';
import { authApi } from '../../api/auth.api';
import { Avatar } from '../common/Avatar';
import { AlertCircle, UserPlus, Search, Hash, Users, Mail } from 'lucide-react';

export function MemberModal({
  isOpen,
  onClose,
  type = 'org', // 'org' | 'workspace' | 'room'
  targetId, // orgId, workspaceId, or roomId
  workspaceId, // required if type === 'room'
  orgId, // required if type === 'workspace'
}) {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState('');
  const [manualIdentifier, setManualIdentifier] = useState('');
  const [addMode, setAddMode] = useState('byId'); // 'byId' | 'roster'
  const [selectedUserId, setSelectedUserId] = useState('');
  const [role, setRole] = useState(
    type === 'org' ? 'ORG_MEMBER' : type === 'workspace' ? 'WORKSPACE_MEMBER' : 'ROOM_MEMBER'
  );
  const [errorMsg, setErrorMsg] = useState('');

  // Search users if type === 'org'
  const [searchQuery, setSearchQuery] = useState('');
  const { data: searchRes } = useQuery({
    queryKey: ['user-search', searchQuery],
    queryFn: () => authApi.searchUsers(searchQuery),
    enabled: type === 'org' && searchQuery.length >= 2,
  });
  const searchResults = searchRes?.data || [];

  // If type === 'workspace', fetch org members
  const { data: orgMembersRes } = useQuery({
    queryKey: ['org-members', orgId],
    queryFn: () => orgApi.getMembers(orgId),
    enabled: type === 'workspace' && !!orgId && isOpen,
  });
  const orgMembers = orgMembersRes?.data || [];

  // If type === 'room', fetch workspace members
  const { data: wsMembersRes } = useQuery({
    queryKey: ['workspace-members', workspaceId],
    queryFn: () => workspaceApi.getMembers(workspaceId),
    enabled: type === 'room' && !!workspaceId && isOpen,
  });
  const wsMembers = wsMembersRes?.data || [];

  const addMutation = useMutation({
    mutationFn: async () => {
      if (type === 'org') {
        return orgApi.addMember(targetId, { email, role });
      } else if (type === 'workspace') {
        const identifier = addMode === 'byId' ? manualIdentifier.trim() : selectedUserId;
        return workspaceApi.addMember(targetId, { identifier, role });
      } else {
        return roomApi.addMember(targetId, { userId: selectedUserId, role });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`${type}-members`] });
      setEmail('');
      setManualIdentifier('');
      setSelectedUserId('');
      setSearchQuery('');
      onClose();
    },
    onError: (err) => setErrorMsg(err.message || 'Failed to add member'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (type === 'org' && !email.trim()) {
      setErrorMsg('User email is required');
      return;
    }

    if (type === 'workspace') {
      if (addMode === 'byId' && !manualIdentifier.trim()) {
        setErrorMsg('Please enter a Member Unique ID (e.g. WH-XXXXXX) or user email.');
        return;
      }
      if (addMode === 'roster' && !selectedUserId) {
        setErrorMsg('Please select a member from the organization roster.');
        return;
      }
    }

    if (type === 'room' && !selectedUserId) {
      setErrorMsg('Please select a workspace member to add.');
      return;
    }

    addMutation.mutate();
  };

  const getTitle = () => {
    if (type === 'org') return 'Invite Member to Organization';
    if (type === 'workspace') return 'Add Member to Workspace';
    return 'Add Member to Room';
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={getTitle()}>
      {errorMsg && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {type === 'org' ? (
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Member Email Address *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setSearchQuery(e.target.value);
              }}
              placeholder="e.g. colleague@example.com"
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            {searchResults.length > 0 && (
              <div className="mt-2 border border-slate-200 rounded-lg p-2 bg-slate-50 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">
                  Matching Registered Users:
                </span>
                {searchResults.map((u) => (
                  <div
                    key={u._id}
                    onClick={() => {
                      setEmail(u.email);
                      setSearchQuery('');
                    }}
                    className="p-1.5 rounded hover:bg-white cursor-pointer flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <Avatar user={u} size="xs" />
                      <span className="font-medium text-slate-800">{u.name}</span>
                    </div>
                    <span className="text-slate-400">{u.email}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : type === 'workspace' ? (
          <div className="space-y-3">
            {/* Mode selection tabs */}
            <div className="flex rounded-lg bg-slate-100 p-1 text-xs">
              <button
                type="button"
                onClick={() => setAddMode('byId')}
                className={`flex-1 py-1.5 rounded-md font-semibold transition-colors flex items-center justify-center gap-1.5 ${
                  addMode === 'byId'
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Hash className="h-3.5 w-3.5" />
                <span>By Unique ID / Email</span>
              </button>

              <button
                type="button"
                onClick={() => setAddMode('roster')}
                className={`flex-1 py-1.5 rounded-md font-semibold transition-colors flex items-center justify-center gap-1.5 ${
                  addMode === 'roster'
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Users className="h-3.5 w-3.5" />
                <span>From Org Roster</span>
              </button>
            </div>

            {addMode === 'byId' ? (
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Member Unique ID or Email *
                </label>
                <input
                  type="text"
                  value={manualIdentifier}
                  onChange={(e) => setManualIdentifier(e.target.value)}
                  placeholder="e.g. WH-DEV004 or name@domain.com"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Enter the member's unique WorkHub ID (found in their profile/header) or their registered email address.
                </p>
              </div>
            ) : (
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Select Organization Member *
                </label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="">Select a member...</option>
                  {orgMembers.map((m) => (
                    <option key={m.user?._id} value={m.user?._id}>
                      {m.user?.name} ({m.user?.memberId || m.user?.email}) - {m.role}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        ) : (
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Select Workspace Member *
            </label>
            <select
              required
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="">Select a member...</option>
              {wsMembers.map((m) => (
                <option key={m.user?._id} value={m.user?._id}>
                  {m.user?.name} ({m.user?.memberId || m.user?.email}) - {m.role}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Role Selection */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Assign Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            {type === 'org' ? (
              <>
                <option value="ORG_MEMBER">Organization Member</option>
                <option value="ORG_ADMIN">Organization Admin</option>
              </>
            ) : type === 'workspace' ? (
              <>
                <option value="WORKSPACE_MEMBER">Workspace Member</option>
                <option value="WORKSPACE_MANAGER">Workspace Manager</option>
              </>
            ) : (
              <>
                <option value="ROOM_MEMBER">Room Member</option>
                <option value="ROOM_LEADER">Room Leader</option>
              </>
            )}
          </select>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="sm" isLoading={addMutation.isPending} icon={UserPlus}>
            Add Member
          </Button>
        </div>
      </form>
    </Modal>
  );
}

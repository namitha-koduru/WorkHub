import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workspaceApi } from '../../api/workspace.api';
import { useAuth } from '../../context/AuthContext';
import { MemberModal } from '../../components/modals/MemberModal';
import { Button } from '../../components/common/Button';
import { Avatar } from '../../components/common/Avatar';
import { Users, UserPlus, Trash2, Loader2 } from 'lucide-react';

export default function WorkspaceMembersPage() {
  const { workspaceId } = useParams();
  const { activeOrg } = useAuth();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: membersRes, isLoading } = useQuery({
    queryKey: ['workspace-members', workspaceId],
    queryFn: () => workspaceApi.getMembers(workspaceId),
  });

  const removeMemberMutation = useMutation({
    mutationFn: (userId) => workspaceApi.removeMember(workspaceId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-members', workspaceId] });
    },
  });

  const members = membersRes?.data || [];

  if (isLoading) {
    return (
      <div className="p-12 flex justify-center">
        <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Users className="h-5 w-5 text-indigo-600" />
            Workspace Staff Allocation ({members.length})
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Personnel authorized to operate within this workspace and its rooms
          </p>
        </div>

        <Button size="sm" icon={UserPlus} onClick={() => setIsModalOpen(true)}>
          Assign Member
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="divide-y divide-slate-100">
          {members.map((m) => (
            <div
              key={m._id}
              className="p-4 sm:p-5 flex items-center justify-between hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Avatar user={m.user} size="md" />
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">{m.user?.name}</h4>
                  <p className="text-xs text-slate-500">{m.user?.email}</p>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">{m.user?.title}</span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                    m.role === 'WORKSPACE_MANAGER'
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                      : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  {m.role === 'WORKSPACE_MANAGER' ? 'Workspace Manager' : 'Team Member'}
                </span>

                <button
                  onClick={() => removeMemberMutation.mutate(m.user?._id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  title="Remove from Workspace"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {isModalOpen && (
        <MemberModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          type="workspace"
          targetId={workspaceId}
          orgId={activeOrg?._id}
        />
      )}
    </div>
  );
}


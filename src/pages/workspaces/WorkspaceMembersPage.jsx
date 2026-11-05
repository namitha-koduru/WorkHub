import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workspaceApi } from '../../api/workspace.api';
import { useAuth } from '../../context/AuthContext';
import { MemberModal } from '../../components/modals/MemberModal';
import { Button } from '../../components/common/Button';
import { Avatar } from '../../components/common/Avatar';
import { EmptyState } from '../../components/common/EmptyState';
import {
  Users,
  UserPlus,
  Trash2,
  Loader2,
  Link as LinkIcon,
  Copy,
  Check,
  Clock,
  CheckCircle,
  XCircle,
  ShieldCheck,
  Mail,
  Hash,
  AlertCircle,
} from 'lucide-react';

export default function WorkspaceMembersPage() {
  const { workspaceId } = useParams();
  const { activeOrg } = useAuth();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState('members'); // 'members' | 'requests'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [actionFeedback, setActionFeedback] = useState('');

  // 1. Fetch workspace details (for invite code)
  const { data: wsRes } = useQuery({
    queryKey: ['workspace', workspaceId],
    queryFn: () => workspaceApi.getById(workspaceId),
  });
  const workspace = wsRes?.data?.workspace || wsRes?.data;

  // 2. Fetch active members
  const { data: membersRes, isLoading: membersLoading } = useQuery({
    queryKey: ['workspace-members', workspaceId],
    queryFn: () => workspaceApi.getMembers(workspaceId),
  });
  const members = membersRes?.data || [];

  // 3. Fetch pending join requests
  const { data: requestsRes, isLoading: requestsLoading } = useQuery({
    queryKey: ['workspace-join-requests', workspaceId],
    queryFn: () => workspaceApi.getJoinRequests(workspaceId, 'PENDING'),
  });
  const joinRequests = requestsRes?.data || [];

  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: (userId) => workspaceApi.removeMember(workspaceId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-members', workspaceId] });
      setActionFeedback('Member removed from workspace.');
      setTimeout(() => setActionFeedback(''), 3000);
    },
  });

  // Decide join request mutation (Approve / Reject)
  const decideMutation = useMutation({
    mutationFn: ({ requestId, status }) =>
      workspaceApi.decideJoinRequest(workspaceId, requestId, { status }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['workspace-join-requests', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['workspace-members', workspaceId] });
      setActionFeedback(
        vars.status === 'APPROVED'
          ? 'Join request approved! Member added to workspace.'
          : 'Join request declined.'
      );
      setTimeout(() => setActionFeedback(''), 4000);
    },
  });

  const inviteCode = workspace?.inviteCode || 'INVITE';
  const shareableUrl = `${window.location.origin}/join-workspace/${inviteCode}`;

  const copyToClipboard = (text, setCopied) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (membersLoading || requestsLoading) {
    return (
      <div className="p-12 flex justify-center">
        <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Users className="h-5 w-5 text-indigo-600" />
            Workspace Personnel & Access Control
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage active team members, unique member additions, and pending join requests
          </p>
        </div>

        <Button size="sm" icon={UserPlus} onClick={() => setIsModalOpen(true)}>
          Add Member Directly
        </Button>
      </div>

      {/* Action feedback alert */}
      {actionFeedback && (
        <div className="p-3.5 rounded-xl bg-indigo-50 border border-indigo-200 text-xs font-semibold text-indigo-900 flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-indigo-600 shrink-0" />
          <span>{actionFeedback}</span>
        </div>
      )}

      {/* Shareable Invite Link Banner */}
      <div className="bg-gradient-to-r from-indigo-50 via-white to-indigo-50/50 border border-indigo-100 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                <LinkIcon className="h-3.5 w-3.5 text-indigo-600" />
                Shareable Workspace Join Link
              </span>
              <span className="font-mono text-[11px] bg-indigo-100/70 text-indigo-800 px-2 py-0.5 rounded font-bold">
                Code: {inviteCode}
              </span>
            </div>
            <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
              Anyone with this link can visit the workspace landing page and request to join. As workspace owner or manager, you can review and approve their request below.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-600 font-mono truncate max-w-xs select-all">
              {shareableUrl}
            </div>

            <Button
              size="xs"
              variant="outline"
              icon={copiedLink ? Check : Copy}
              onClick={() => copyToClipboard(shareableUrl, setCopiedLink)}
            >
              {copiedLink ? 'Copied Link' : 'Copy Link'}
            </Button>

            <Button
              size="xs"
              variant="secondary"
              icon={copiedCode ? Check : Hash}
              onClick={() => copyToClipboard(inviteCode, setCopiedCode)}
            >
              {copiedCode ? 'Copied' : 'Copy Code'}
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('members')}
          className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'members'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Active Staff ({members.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('requests')}
          className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'requests'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="h-4 w-4" />
          <span>Join Requests</span>
          {joinRequests.length > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-indigo-600 text-white">
              {joinRequests.length}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: ACTIVE MEMBERS */}
      {activeTab === 'members' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {members.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No members assigned yet. Add members directly or share the invite link above.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {members.map((m) => (
                <div
                  key={m._id}
                  className="p-4 sm:p-5 flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Avatar user={m.user} size="md" />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-slate-900">{m.user?.name}</h4>
                        {m.user?.memberId && (
                          <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                            {m.user.memberId}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">{m.user?.email}</p>
                      <span className="text-[10px] text-slate-400 mt-0.5 block">
                        {m.user?.title || 'Team Member'}
                      </span>
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
          )}
        </div>
      )}

      {/* TAB 2: PENDING JOIN REQUESTS */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          {joinRequests.length === 0 ? (
            <EmptyState
              icon={Clock}
              title="No pending join requests"
              description="When individuals use your workspace invite link or search for this workspace, their join requests will appear here for review."
            />
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
              {joinRequests.map((req) => (
                <div
                  key={req._id}
                  className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors"
                >
                  <div className="flex items-start gap-3.5">
                    <Avatar user={req.userId} size="md" />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">
                          {req.userId?.name}
                        </span>
                        {req.userId?.memberId && (
                          <span className="font-mono text-[10px] bg-indigo-50 text-indigo-700 font-semibold px-2 py-0.5 rounded border border-indigo-200">
                            {req.userId.memberId}
                          </span>
                        )}
                        <span className="text-[11px] text-slate-400">
                          {new Date(req.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3.5 w-3.5 text-slate-400" />
                          {req.userId?.email}
                        </span>
                        {req.userId?.title && <span>• {req.userId.title}</span>}
                      </div>

                      {req.message ? (
                        <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200 mt-2 italic max-w-lg">
                          "{req.message}"
                        </p>
                      ) : (
                        <p className="text-[11px] text-slate-400 mt-1 italic">
                          No intro message provided.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                    <Button
                      size="xs"
                      variant="outline"
                      icon={XCircle}
                      disabled={decideMutation.isPending}
                      onClick={() =>
                        decideMutation.mutate({ requestId: req._id, status: 'REJECTED' })
                      }
                    >
                      Decline
                    </Button>
                    <Button
                      size="xs"
                      icon={CheckCircle}
                      disabled={decideMutation.isPending}
                      onClick={() =>
                        decideMutation.mutate({ requestId: req._id, status: 'APPROVED' })
                      }
                    >
                      Approve & Add
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Direct Add Member Modal */}
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

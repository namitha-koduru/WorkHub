import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workspaceApi } from '../../api/workspace.api';
import { useAuth } from '../../context/AuthContext';
import { WorkspaceModal } from '../../components/modals/WorkspaceModal';
import { Button } from '../../components/common/Button';
import { Avatar } from '../../components/common/Avatar';
import { EmptyState } from '../../components/common/EmptyState';
import { Modal } from '../../components/common/Modal';
import {
  Layers,
  Plus,
  DoorOpen,
  CheckCircle2,
  ChevronRight,
  Archive,
  Search,
  Loader2,
  Compass,
  Link as LinkIcon,
  Clock,
  Send,
  Building,
  Users,
  AlertCircle,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function WorkspaceListPage() {
  const { activeOrg, user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState('my-workspaces'); // 'my-workspaces' | 'explore'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [exploreSearch, setExploreSearch] = useState('');

  // Code invite quick jump modal
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
  const [inviteInput, setInviteInput] = useState('');

  // Request to join modal
  const [selectedWorkspace, setSelectedWorkspace] = useState(null);
  const [requestNote, setRequestNote] = useState('');
  const [requestSuccess, setRequestSuccess] = useState('');
  const [requestError, setRequestError] = useState('');

  // My Workspaces Query
  const { data: workspacesRes, isLoading: myLoading } = useQuery({
    queryKey: ['workspaces', activeOrg?._id],
    queryFn: () => workspaceApi.getAll(activeOrg?._id),
    enabled: !!activeOrg?._id,
  });

  // Explore Workspaces Query
  const { data: exploreRes, isLoading: exploreLoading, refetch: refetchExplore } = useQuery({
    queryKey: ['workspaces-search', activeOrg?._id, exploreSearch],
    queryFn: () => workspaceApi.search({ q: exploreSearch, orgId: activeOrg?._id }),
    enabled: activeTab === 'explore' && !!activeOrg?._id,
  });

  const joinMutation = useMutation({
    mutationFn: ({ workspaceId, message }) =>
      workspaceApi.submitJoinRequest(workspaceId, { message }),
    onSuccess: () => {
      setRequestSuccess('Join request submitted to workspace owner!');
      setRequestError('');
      refetchExplore();
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      setTimeout(() => {
        setSelectedWorkspace(null);
        setRequestSuccess('');
        setRequestNote('');
      }, 1500);
    },
    onError: (err) => {
      setRequestError(err.message || 'Failed to submit join request.');
    },
  });

  const workspaces = workspacesRes?.data || [];
  const exploreWorkspaces = exploreRes?.data || [];

  const filteredMyWorkspaces = workspaces.filter((ws) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      ws.name.toLowerCase().includes(q) ||
      ws.category?.toLowerCase().includes(q) ||
      ws.description?.toLowerCase().includes(q)
    );
  });

  const handleQuickJumpByCode = (e) => {
    e.preventDefault();
    if (!inviteInput.trim()) return;
    let code = inviteInput.trim();
    if (code.includes('/join-workspace/')) {
      code = code.split('/join-workspace/')[1].split('/')[0];
    }
    navigate(`/join-workspace/${code}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Layers className="h-6 w-6 text-indigo-600" />
            Workspaces & Event Portfolios
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Collaborative environments, projects, and operational initiatives under {activeOrg?.name}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            variant="outline"
            icon={LinkIcon}
            onClick={() => setIsCodeModalOpen(true)}
          >
            Enter Invite Code
          </Button>
          <Button size="sm" icon={Plus} onClick={() => setIsModalOpen(true)}>
            New Workspace
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('my-workspaces')}
          className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'my-workspaces'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>My Workspaces ({workspaces.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('explore')}
          className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'explore'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Compass className="h-4 w-4" />
          <span>Explore & Search All Workspaces</span>
        </button>
      </div>

      {/* TAB 1: MY WORKSPACES */}
      {activeTab === 'my-workspaces' && (
        <div className="space-y-6">
          {/* Search Input */}
          <div className="relative max-w-md">
            <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter your workspaces by name or category..."
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            />
          </div>

          {myLoading ? (
            <div className="p-12 flex justify-center">
              <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
            </div>
          ) : filteredMyWorkspaces.length === 0 ? (
            <EmptyState
              icon={Layers}
              title="No workspaces found"
              description="Create your first event or department workspace, or explore existing workspaces to join."
              actionLabel="Create Workspace"
              onAction={() => setIsModalOpen(true)}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMyWorkspaces.map((ws) => (
                <div
                  key={ws._id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200">
                        {ws.category || 'Event Operations'}
                      </span>
                      {ws.status === 'ARCHIVED' && (
                        <span className="text-[10px] font-bold uppercase text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          Archived
                        </span>
                      )}
                    </div>

                    <Link
                      to={`/app/workspaces/${ws._id}/overview`}
                      className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors block"
                    >
                      {ws.name}
                    </Link>

                    <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                      {ws.description || 'No description provided.'}
                    </p>

                    {/* Progress bar */}
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <div className="flex items-center justify-between text-xs text-slate-600 mb-1.5">
                        <span className="font-medium">Operational Progress</span>
                        <span className="font-bold text-slate-800">{ws.progress || 0}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2">
                        <div
                          className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${ws.progress || 0}%` }}
                        />
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-2 mt-4 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <DoorOpen className="h-3.5 w-3.5 text-slate-400" />
                        <span>{ws.roomCount || 0} Rooms</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-slate-400" />
                        <span>
                          {ws.completedTaskCount || 0}/{ws.taskCount || 0} Tasks
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="px-6 py-3.5 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-slate-400">Managers:</span>
                      <div className="flex -space-x-1.5">
                        {ws.managers?.map((m) => (
                          <Avatar key={m._id} user={m} size="xs" className="ring-1 ring-white" />
                        ))}
                      </div>
                    </div>

                    <Link
                      to={`/app/workspaces/${ws._id}/overview`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                    >
                      <span>Open</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: EXPLORE & SEARCH ALL WORKSPACES */}
      {activeTab === 'explore' && (
        <div className="space-y-6">
          <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-indigo-950 flex items-center gap-2">
                <Compass className="h-4 w-4 text-indigo-600" />
                Discover Workspaces & Join Collaborations
              </h3>
              <p className="text-xs text-indigo-800/80 mt-1 max-w-2xl">
                Search through active workspaces within your organization. If you are not yet a member, click "Request to Join" to send a notification directly to the workspace owner.
              </p>
            </div>
            <div className="relative min-w-[280px]">
              <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={exploreSearch}
                onChange={(e) => setExploreSearch(e.target.value)}
                placeholder="Search by name, category, or code..."
                className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              />
            </div>
          </div>

          {exploreLoading ? (
            <div className="p-12 flex justify-center">
              <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
            </div>
          ) : exploreWorkspaces.length === 0 ? (
            <EmptyState
              icon={Compass}
              title="No matching workspaces found"
              description="Try adjusting your search keywords or invite code."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {exploreWorkspaces.map((ws) => (
                <div
                  key={ws._id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200">
                        {ws.category || 'Event Operations'}
                      </span>
                      <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                        {ws.inviteCode}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900">{ws.name}</h3>

                    <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                      {ws.description || 'No description provided.'}
                    </p>

                    <div className="grid grid-cols-2 gap-2 mt-4 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-slate-400" />
                        <span>{ws.memberCount || 0} Members</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Layers className="h-3.5 w-3.5 text-slate-400" />
                        <span>{ws.teamCount || 0} Teams</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Action Footer */}
                  <div className="px-6 py-3.5 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-slate-400">Owner/Lead:</span>
                      {ws.managers?.[0] ? (
                        <div className="flex items-center gap-1.5">
                          <Avatar user={ws.managers[0]} size="xs" />
                          <span className="text-xs font-medium text-slate-700 max-w-[90px] truncate">
                            {ws.managers[0].name}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">Admin</span>
                      )}
                    </div>

                    {ws.isMember ? (
                      <Link
                        to={`/app/workspaces/${ws._id}/overview`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-800"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Open</span>
                      </Link>
                    ) : ws.hasPendingRequest ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200">
                        <Clock className="h-3 w-3" />
                        <span>Pending</span>
                      </span>
                    ) : (
                      <Button
                        size="xs"
                        icon={Send}
                        onClick={() => {
                          setSelectedWorkspace(ws);
                          setRequestNote('');
                          setRequestError('');
                          setRequestSuccess('');
                        }}
                      >
                        Request to Join
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: ENTER INVITE CODE / LINK */}
      {isCodeModalOpen && (
        <Modal
          isOpen={isCodeModalOpen}
          onClose={() => setIsCodeModalOpen(false)}
          title="Join Workspace via Invite Code / Link"
        >
          <form onSubmit={handleQuickJumpByCode} className="space-y-4 text-xs">
            <p className="text-slate-500 leading-relaxed">
              Enter the unique invite code (e.g. <span className="font-mono font-bold text-indigo-600">MAHOTSAV27</span>) or paste the full invitation link sent to you by the workspace owner.
            </p>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Workspace Invite Code or Link
              </label>
              <input
                type="text"
                required
                value={inviteInput}
                onChange={(e) => setInviteInput(e.target.value)}
                placeholder="e.g. INV-A9B2C4 or /join-workspace/INV-A9B2C4"
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsCodeModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" icon={ChevronRight}>
                Proceed to Workspace
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL 2: SEND JOIN REQUEST */}
      {selectedWorkspace && (
        <Modal
          isOpen={!!selectedWorkspace}
          onClose={() => setSelectedWorkspace(null)}
          title={`Join "${selectedWorkspace.name}"`}
        >
          <div className="space-y-4 text-xs">
            {requestSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>{requestSuccess}</span>
              </div>
            )}

            {requestError && (
              <div className="p-3 rounded-xl bg-red-50 text-red-800 font-semibold flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span>{requestError}</span>
              </div>
            )}

            <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-100">
              <p className="font-semibold text-indigo-900">
                Submitting Request as: {user?.name} ({user?.memberId})
              </p>
              <p className="text-slate-500 text-[11px] mt-0.5">
                Workspace managers will review and approve your membership request.
              </p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Message to Managers (Optional)
              </label>
              <textarea
                rows={3}
                value={requestNote}
                onChange={(e) => setRequestNote(e.target.value)}
                placeholder="e.g. Requesting access to help with the Digital Marketing and Event Logistics."
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedWorkspace(null)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                icon={Send}
                isLoading={joinMutation.isPending}
                onClick={() =>
                  joinMutation.mutate({
                    workspaceId: selectedWorkspace._id,
                    message: requestNote,
                  })
                }
              >
                Send Request
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Create Workspace Modal */}
      {isModalOpen && (
        <WorkspaceModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          organizationId={activeOrg?._id}
        />
      )}
    </div>
  );
}

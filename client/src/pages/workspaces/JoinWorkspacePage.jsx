import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workspaceApi } from '../../api/workspace.api';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/common/Button';
import { Avatar } from '../../components/common/Avatar';
import {
  Layers,
  Users,
  CheckCircle2,
  Clock,
  ArrowRight,
  Send,
  Building,
  AlertCircle,
  Loader2,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

export default function JoinWorkspacePage() {
  const { codeOrId } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  const [message, setMessage] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const {
    data: wsRes,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['workspace-invite', codeOrId],
    queryFn: () => workspaceApi.getByInvite(codeOrId),
    enabled: !!codeOrId && !!user,
    retry: 1,
  });

  const joinMutation = useMutation({
    mutationFn: (workspaceId) =>
      workspaceApi.submitJoinRequest(workspaceId, { message }),
    onSuccess: (res) => {
      setSuccessMsg(
        res.message || 'Your join request was successfully submitted to the workspace managers!'
      );
      setErrorMsg('');
      refetch();
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
    onError: (err) => {
      setErrorMsg(err.message || 'Failed to submit join request. Please try again.');
      setSuccessMsg('');
    },
  });

  // If auth is still checking
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  // If user is not logged in, show sign-in prompt with redirect
  if (!user) {
    const redirectUrl = `/join-workspace/${codeOrId}`;
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-2xl text-center space-y-6">
          <div className="h-16 w-16 mx-auto rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <Layers className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Workspace Invitation</h1>
            <p className="text-xs text-slate-500 mt-2">
              You received an invite link to collaborate in WorkHub. Please sign in or register with your account to proceed.
            </p>
          </div>
          <div className="space-y-3 pt-2">
            <Button
              className="w-full justify-center"
              onClick={() => navigate(`/login?redirect=${encodeURIComponent(redirectUrl)}`)}
            >
              Sign In with Existing Account
            </Button>
            <Button
              variant="outline"
              className="w-full justify-center"
              onClick={() => navigate(`/register?redirect=${encodeURIComponent(redirectUrl)}`)}
            >
              Create New Account
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 text-indigo-600 animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Resolving workspace invite...</p>
        </div>
      </div>
    );
  }

  if (error || !wsRes?.data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-sm border border-slate-200 text-center space-y-5">
          <div className="h-14 w-14 mx-auto rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center text-red-600">
            <AlertCircle className="h-7 w-7" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Workspace Not Found</h2>
            <p className="text-xs text-slate-500 mt-1.5">
              The invite code or link <span className="font-mono font-semibold text-slate-700">{codeOrId}</span> is invalid or has expired.
            </p>
          </div>
          <Button variant="outline" className="w-full justify-center" onClick={() => navigate('/app/workspaces')}>
            Go to Workspaces Directory
          </Button>
        </div>
      </div>
    );
  }

  const workspace = wsRes.data;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 py-12">
      <div className="max-w-xl w-full bg-white rounded-3xl shadow-xl border border-slate-200/80 overflow-hidden">
        {/* Banner */}
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 sm:px-8 py-8 text-white">
          <div className="flex items-center justify-between mb-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-md text-white border border-white/20">
              <Building className="h-3.5 w-3.5" />
              {workspace.organizationId?.name || 'Organization'}
            </span>
            <span className="text-xs font-mono bg-black/25 px-2.5 py-1 rounded-lg text-indigo-100">
              Code: {workspace.inviteCode}
            </span>
          </div>

          <h1 className="text-2xl font-black tracking-tight">{workspace.name}</h1>
          <p className="text-xs text-indigo-100 mt-1.5 line-clamp-2 leading-relaxed">
            {workspace.description || 'Collaborative team workspace on WorkHub.'}
          </p>

          <div className="flex items-center gap-6 mt-6 pt-6 border-t border-white/15 text-xs text-indigo-100">
            <div className="flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              <span>{workspace.memberCount || 0} Members</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Layers className="h-4 w-4" />
              <span>{workspace.teamCount || 0} Teams</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4" />
              <span>{workspace.category || 'Operations'}</span>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Managers info */}
          {workspace.managers && workspace.managers.length > 0 && (
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                Workspace Managers
              </span>
              <div className="flex flex-wrap gap-2">
                {workspace.managers.map((m) => (
                  <div
                    key={m._id}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                  >
                    <Avatar user={m} size="xs" />
                    <div>
                      <p className="font-semibold text-slate-800">{m.name}</p>
                      <p className="text-[10px] text-slate-400">{m.title || 'Manager'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Feedback banners */}
          {successMsg && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Request Submitted</p>
                <p className="mt-0.5">{successMsg}</p>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Notice</p>
                <p className="mt-0.5">{errorMsg}</p>
              </div>
            </div>
          )}

          {/* State 1: User is already an active member */}
          {workspace.isMember ? (
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-6 text-center space-y-4">
              <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">You Are Already a Member</h3>
                <p className="text-xs text-slate-600 mt-1">
                  You are registered as an active participant of this workspace.
                </p>
              </div>
              <Button
                className="mx-auto"
                icon={ArrowRight}
                onClick={() => navigate(`/app/workspaces/${workspace._id}/overview`)}
              >
                Go to Workspace Overview
              </Button>
            </div>
          ) : workspace.hasPendingRequest ? (
            /* State 2: Request is pending */
            <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-6 text-center space-y-3">
              <div className="h-12 w-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Join Request Pending</h3>
                <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto">
                  Your request to join this workspace has been sent to the workspace managers. You will have full access once approved.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mx-auto mt-2"
                onClick={() => navigate('/app/workspaces')}
              >
                Back to All Workspaces
              </Button>
            </div>
          ) : (
            /* State 3: Can send request to workspace owner */
            <div className="space-y-4 pt-2">
              <div className="rounded-2xl bg-indigo-50/50 border border-indigo-100 p-4">
                <div className="flex items-center gap-2 text-indigo-900 font-semibold text-xs mb-1">
                  <Sparkles className="h-4 w-4 text-indigo-600" />
                  Request Access as {user.name} ({user.memberId})
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Send a join request to the workspace owner and managers to be assigned roles, teams, and rooms within this project.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Optional Note / Introduction for Managers
                </label>
                <textarea
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="e.g. Hi, I am joining the Logistics and PR teams for Mahotsav."
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <Link
                  to="/app/workspaces"
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </Link>
                <Button
                  icon={Send}
                  isLoading={joinMutation.isPending}
                  onClick={() => joinMutation.mutate(workspace._id)}
                >
                  Send Request to Workspace Owner
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


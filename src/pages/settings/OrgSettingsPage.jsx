import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orgApi } from '../../api/org.api';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../../components/common/Avatar';
import { Button } from '../../components/common/Button';
import { MemberModal } from '../../components/modals/MemberModal';
import {
  Building,
  Users,
  UserPlus,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Loader2,
} from 'lucide-react';

export default function OrgSettingsPage() {
  const { activeOrg, setActiveOrg } = useAuth();
  const queryClient = useQueryClient();

  const [name, setName] = useState(activeOrg?.name || '');
  const [description, setDescription] = useState(activeOrg?.description || '');
  const [logoUrl, setLogoUrl] = useState(activeOrg?.logoUrl || '');
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const { data: orgRes, isLoading: orgLoading } = useQuery({
    queryKey: ['organization', activeOrg?._id],
    queryFn: () => orgApi.getById(activeOrg?._id),
    enabled: !!activeOrg?._id,
  });

  const { data: membersRes, isLoading: membersLoading } = useQuery({
    queryKey: ['org-members', activeOrg?._id],
    queryFn: () => orgApi.getMembers(activeOrg?._id),
    enabled: !!activeOrg?._id,
  });

  const members = membersRes?.data || [];
  const org = orgRes?.data;

  useEffect(() => {
    if (org) {
      setName(org.name || '');
      setDescription(org.description || '');
      setLogoUrl(org.logoUrl || '');
    }
  }, [org]);

  const updateMutation = useMutation({
    mutationFn: (data) => orgApi.update(activeOrg._id, data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['organization', activeOrg._id] });
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      setActiveOrg(res.data);
      setSuccessMsg('Organization metadata updated.');
      setTimeout(() => setSuccessMsg(''), 4000);
    },
    onError: (err) => setErrorMsg(err.message || 'Failed to update organization'),
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }) => orgApi.updateMemberRole(activeOrg._id, userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-members', activeOrg._id] });
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: (userId) => orgApi.removeMember(activeOrg._id, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-members', activeOrg._id] });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate({ name, description, logoUrl });
  };

  if (orgLoading || membersLoading) {
    return (
      <div className="p-12 flex justify-center">
        <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
          <Building className="h-6 w-6 text-indigo-600" />
          Organization Governance & Access
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage organizational metadata, administrative access, and member rosters
        </p>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-red-50 text-red-800 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Organization Info Form */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900">General Information</h2>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Organization Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" size="sm" isLoading={updateMutation.isPending}>
              Save Changes
            </Button>
          </div>
        </form>
      </div>

      {/* Organization Members Directory */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Users className="h-5 w-5 text-indigo-600" />
              Organization Members ({members.length})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Users with authenticated access to this organization and its projects
            </p>
          </div>

          <Button size="sm" icon={UserPlus} onClick={() => setIsMemberModalOpen(true)}>
            Invite User
          </Button>
        </div>

        <div className="divide-y divide-slate-100">
          {members.map((m) => (
            <div
              key={m._id}
              className="py-3.5 flex items-center justify-between gap-4 hover:bg-slate-50 px-2 rounded-xl transition-colors"
            >
              <div className="flex items-center gap-3">
                <Avatar user={m.user} size="md" />
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{m.user?.name}</h4>
                  <p className="text-[11px] text-slate-500">{m.user?.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={m.role}
                  onChange={(e) =>
                    updateRoleMutation.mutate({ userId: m.user?._id, role: e.target.value })
                  }
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="ORG_OWNER">Owner</option>
                  <option value="ORG_ADMIN">Admin</option>
                  <option value="ORG_MEMBER">Member</option>
                </select>

                <button
                  onClick={() => removeMemberMutation.mutate(m.user?._id)}
                  className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                  title="Remove from Organization"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {isMemberModalOpen && (
        <MemberModal
          isOpen={isMemberModalOpen}
          onClose={() => setIsMemberModalOpen(false)}
          type="org"
          targetId={activeOrg?._id}
        />
      )}
    </div>
  );
}


import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { announcementApi } from '../../api/announcement.api';
import { teamApi } from '../../api/team.api';
import { workspaceApi } from '../../api/workspace.api';
import { useAuth } from '../../context/AuthContext';
import { AnnouncementModal } from '../../components/modals/AnnouncementModal';
import { Avatar } from '../../components/common/Avatar';
import { Button } from '../../components/common/Button';
import { EmptyState } from '../../components/common/EmptyState';
import {
  Megaphone,
  Pin,
  AlertTriangle,
  Plus,
  Trash2,
  Filter,
  Loader2,
  Calendar,
} from 'lucide-react';

export default function WorkspaceAnnouncementsPage() {
  const { workspaceId } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterScope, setFilterScope] = useState('ALL'); // 'ALL' | 'WORKSPACE' | 'TEAM'
  const [selectedTeamFilter, setSelectedTeamFilter] = useState('');

  const { data: wsRes } = useQuery({
    queryKey: ['workspace', workspaceId],
    queryFn: () => workspaceApi.getById(workspaceId),
    enabled: !!workspaceId,
  });
  const workspace = wsRes?.data;

  const { data: teamsRes } = useQuery({
    queryKey: ['teams', workspaceId],
    queryFn: () => teamApi.getAll(workspaceId),
    enabled: !!workspaceId,
  });
  const teams = teamsRes?.data || [];

  const { data: annRes, isLoading } = useQuery({
    queryKey: ['announcements', workspaceId, selectedTeamFilter, filterScope],
    queryFn: () =>
      announcementApi.getAll(
        workspaceId,
        selectedTeamFilter || undefined,
        filterScope === 'ALL' ? undefined : filterScope
      ),
    enabled: !!workspaceId,
  });
  const announcements = annRes?.data || [];

  const deleteMutation = useMutation({
    mutationFn: (annId) => announcementApi.delete(annId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
    },
    onError: (err) => alert(err.message || 'Failed to delete announcement'),
  });

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
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Event Announcements & Directives
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Official operational broadcasts, security alerts, and coordination updates for {workspace?.name}.
          </p>
        </div>

        <Button onClick={() => setIsModalOpen(true)} size="sm">
          <Plus className="h-4 w-4 mr-1.5" /> Publish Notice
        </Button>
      </div>

      {/* Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
        <div className="flex items-center gap-1.5 font-semibold text-slate-600">
          <Filter className="h-3.5 w-3.5 text-slate-400" /> Filter:
          <button
            onClick={() => {
              setFilterScope('ALL');
              setSelectedTeamFilter('');
            }}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              filterScope === 'ALL'
                ? 'bg-white text-indigo-600 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Notices
          </button>
          <button
            onClick={() => {
              setFilterScope('WORKSPACE');
              setSelectedTeamFilter('');
            }}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              filterScope === 'WORKSPACE'
                ? 'bg-white text-indigo-600 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Workspace-Wide Only
          </button>
          <button
            onClick={() => setFilterScope('TEAM')}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              filterScope === 'TEAM'
                ? 'bg-white text-indigo-600 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Team-Specific
          </button>
        </div>

        {filterScope === 'TEAM' && (
          <select
            value={selectedTeamFilter}
            onChange={(e) => setSelectedTeamFilter(e.target.value)}
            className="px-2.5 py-1 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-700"
          >
            <option value="">All Teams</option>
            {teams.map((t) => (
              <option key={t._id} value={t._id}>
                {t.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Announcements List */}
      {announcements.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="No announcements published"
          description="Workspace managers and team leads can publish broadcast notices here."
          actionLabel="Publish First Notice"
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div className="space-y-4">
          {announcements.map((ann) => {
            const isUrgent = ann.priority === 'URGENT';
            const canDelete =
              String(ann.author?._id || ann.author) === String(user?._id) ||
              user?.role === 'ORGANIZATION_OWNER';

            return (
              <div
                key={ann._id}
                className={`p-5 rounded-2xl border transition-all ${
                  isUrgent
                    ? 'bg-red-50/70 border-red-200 shadow-sm'
                    : ann.isPinned
                    ? 'bg-amber-50/30 border-amber-200/80 shadow-sm'
                    : 'bg-white border-slate-200/90 shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {ann.isPinned && (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-amber-600 bg-amber-100/70 px-2 py-0.5 rounded-md">
                          <Pin className="h-3 w-3 fill-amber-600" /> Pinned
                        </span>
                      )}
                      {isUrgent && (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-white bg-red-600 px-2 py-0.5 rounded-md">
                          <AlertTriangle className="h-3 w-3" /> URGENT ALERT
                        </span>
                      )}
                      <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                        {ann.scope === 'TEAM' && ann.teamId
                          ? `Team: ${ann.teamId.name}`
                          : 'Workspace-Wide'}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 pt-1">{ann.title}</h3>
                  </div>

                  {canDelete && (
                    <button
                      onClick={() => {
                        if (confirm('Delete this announcement?')) {
                          deleteMutation.mutate(ann._id);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                      title="Delete announcement"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <p className="text-xs text-slate-700 mt-2.5 leading-relaxed whitespace-pre-wrap">
                  {ann.content}
                </p>

                <div className="pt-3 mt-3 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <Avatar user={ann.author} size="xs" />
                    <span className="font-medium text-slate-700">
                      {ann.author?.name || 'Authorized Lead'}
                    </span>
                    <span>({ann.author?.title || 'Coordinator'})</span>
                  </div>

                  <span className="flex items-center gap-1 text-[11px]">
                    <Calendar className="h-3 w-3" />
                    {new Date(ann.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <AnnouncementModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        workspaceId={workspaceId}
        organizationId={workspace?.organizationId}
        teams={teams}
        defaultScope="WORKSPACE"
      />
    </div>
  );
}


import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { teamApi } from '../../api/team.api';
import { workspaceApi } from '../../api/workspace.api';
import { TeamModal } from '../../components/modals/TeamModal';
import { Avatar } from '../../components/common/Avatar';
import { Button } from '../../components/common/Button';
import { EmptyState } from '../../components/common/EmptyState';
import {
  Users,
  DoorOpen,
  CheckCircle2,
  Plus,
  ArrowRight,
  Shield,
  Loader2,
  FolderKanban,
} from 'lucide-react';

export default function TeamListPage() {
  const { workspaceId } = useParams();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [teamToEdit, setTeamToEdit] = useState(null);

  const { data: wsRes } = useQuery({
    queryKey: ['workspace', workspaceId],
    queryFn: () => workspaceApi.getById(workspaceId),
    enabled: !!workspaceId,
  });
  const workspace = wsRes?.data;

  const { data: teamsRes, isLoading } = useQuery({
    queryKey: ['teams', workspaceId],
    queryFn: () => teamApi.getAll(workspaceId),
    enabled: !!workspaceId,
  });

  const teams = teamsRes?.data || [];

  if (isLoading) {
    return (
      <div className="p-12 flex justify-center">
        <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Teams & Departments</h2>
          <p className="text-xs text-slate-500 mt-1">
            Autonomous departmental units organizing dedicated responsibilities, channels, and workflows for {workspace?.name}.
          </p>
        </div>

        <Button
          onClick={() => {
            setTeamToEdit(null);
            setIsModalOpen(true);
          }}
          size="sm"
          className="shrink-0"
        >
          <Plus className="h-4 w-4 mr-1.5" /> Create Team / Department
        </Button>
      </div>

      {/* Teams Grid */}
      {teams.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No teams established yet"
          description="Create your first departmental team (e.g. PR & Marketing, Technical Team, Hospitality) to distribute responsibilities."
          actionLabel="Create Team"
          onAction={() => {
            setTeamToEdit(null);
            setIsModalOpen(true);
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {teams.map((team) => (
            <div
              key={team._id}
              className="bg-white rounded-xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
            >
              <div className="p-5 space-y-4">
                {/* Team Title & Progress */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <Link
                      to={`/app/workspaces/${workspaceId}/teams/${team._id}/overview`}
                      className="text-base font-bold text-slate-900 hover:text-indigo-600 transition-colors line-clamp-1"
                    >
                      {team.name}
                    </Link>
                    {team.description && (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        {team.description}
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {team.progress || 0}% Done
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                    style={{ width: `${team.progress || 0}%` }}
                  />
                </div>

                {/* Responsibilities tags */}
                {team.responsibilities && team.responsibilities.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Core Responsibilities
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {team.responsibilities.slice(0, 3).map((resp, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-600 truncate max-w-[200px]"
                        >
                          {resp}
                        </span>
                      ))}
                      {team.responsibilities.length > 3 && (
                        <span className="px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-500">
                          +{team.responsibilities.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Leader & Stats */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <Avatar user={team.leader} size="xs" />
                    <div>
                      <span className="block text-[10px] text-slate-400 font-medium">Team Leader</span>
                      <span className="text-xs font-semibold text-slate-800 line-clamp-1">
                        {team.leader?.name || 'Unassigned'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1 font-medium text-slate-600" title="Rooms / Channels">
                      <DoorOpen className="h-3.5 w-3.5 text-slate-400" />
                      {team.roomCount || 0}
                    </span>
                    <span className="flex items-center gap-1 font-medium text-slate-600" title="Team Members">
                      <Users className="h-3.5 w-3.5 text-slate-400" />
                      {team.memberCount || 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer Button */}
              <Link
                to={`/app/workspaces/${workspaceId}/teams/${team._id}/overview`}
                className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-indigo-600 group-hover:bg-indigo-50 group-hover:text-indigo-700 transition-colors"
              >
                <span>Enter Team Workspace</span>
                <ArrowRight className="h-4 w-4 transform group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <TeamModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        workspaceId={workspaceId}
        organizationId={workspace?.organizationId}
        teamToEdit={teamToEdit}
      />
    </div>
  );
}


import React from 'react';
import { NavLink, Outlet, useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { teamApi } from '../api/team.api';
import { Avatar } from '../components/common/Avatar';
import {
  LayoutDashboard,
  DoorOpen,
  Calendar,
  Clock,
  MessageSquare,
  Users,
  ChevronRight,
  Shield,
  Loader2,
} from 'lucide-react';

export function TeamLayout() {
  const { workspaceId, teamId } = useParams();

  const { data: teamRes, isLoading, isError, error } = useQuery({
    queryKey: ['team', teamId],
    queryFn: () => teamApi.getById(teamId),
  });

  const team = teamRes?.data;

  if (isLoading) {
    return (
      <div className="p-12 flex justify-center">
        <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (isError || !team) {
    return (
      <div className="p-8 text-center max-w-md mx-auto">
        <h2 className="text-lg font-semibold text-slate-800">Team not found or access restricted</h2>
        <p className="text-sm text-slate-500 mt-1">
          {error?.message || 'You may not have permission to access this departmental team.'}
        </p>
        <Link
          to={`/app/workspaces/${workspaceId}/teams`}
          className="text-xs font-semibold text-indigo-600 underline mt-4 block"
        >
          Return to Teams Directory
        </Link>
      </div>
    );
  }

  const tabs = [
    { to: `/app/workspaces/${workspaceId}/teams/${teamId}/overview`, label: 'Overview', icon: LayoutDashboard },
    { to: `/app/workspaces/${workspaceId}/teams/${teamId}/rooms`, label: 'Rooms & Channels', icon: DoorOpen },
    { to: `/app/workspaces/${workspaceId}/teams/${teamId}/calendar`, label: 'Team Calendar', icon: Calendar },
    { to: `/app/workspaces/${workspaceId}/teams/${teamId}/daily-updates`, label: 'Daily Updates', icon: Clock },
    { to: `/app/workspaces/${workspaceId}/teams/${teamId}/discussions`, label: 'Discussions & Ideas', icon: MessageSquare },
    { to: `/app/workspaces/${workspaceId}/teams/${teamId}/members`, label: 'Team Roster', icon: Users },
  ];

  return (
    <div className="min-h-full">
      {/* Team Header Banner */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-8 pt-6 pb-0">
        {/* Breadcrumb Hierarchy */}
        <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-2">
          <Link to="/app/workspaces" className="hover:text-slate-600 transition-colors">
            Workspaces
          </Link>
          <ChevronRight className="h-3 w-3" />
          <Link
            to={`/app/workspaces/${workspaceId}/overview`}
            className="hover:text-slate-600 transition-colors"
          >
            {team.workspaceId?.name || 'Workspace'}
          </Link>
          <ChevronRight className="h-3 w-3" />
          <Link
            to={`/app/workspaces/${workspaceId}/teams`}
            className="hover:text-slate-600 transition-colors"
          >
            Teams
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-slate-700 font-semibold">{team.name}</span>
        </div>

        {/* Team Title & Info */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{team.name}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                Team / Department
              </span>
            </div>
            {team.description && (
              <p className="text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
                {team.description}
              </p>
            )}
          </div>

          {/* Team Leader Profile Card */}
          <div className="flex items-center gap-3 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200/80 shrink-0">
            <Avatar user={team.leader} size="sm" />
            <div>
              <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Team Leader
              </span>
              <span className="text-xs font-bold text-slate-800">
                {team.leader?.name || 'Unassigned'}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 border-t border-slate-100 pt-1 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <NavLink
                key={tab.to}
                to={tab.to}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
                    isActive
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
                  }`
                }
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </NavLink>
            );
          })}
        </div>
      </div>

      {/* Sub-view Content */}
      <main>
        <Outlet />
      </main>
    </div>
  );
}


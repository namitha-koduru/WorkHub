import React from 'react';
import { NavLink, Outlet, useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { workspaceApi } from '../api/workspace.api';
import { Avatar } from '../components/common/Avatar';
import {
  LayoutDashboard,
  Calendar,
  BarChart3,
  Users,
  ChevronRight,
  FolderKanban,
  DoorOpen,
  Megaphone,
  Clock,
  Loader2,
} from 'lucide-react';

export function WorkspaceLayout() {
  const { workspaceId } = useParams();

  const { data: wsRes, isLoading } = useQuery({
    queryKey: ['workspace', workspaceId],
    queryFn: () => workspaceApi.getById(workspaceId),
  });

  const workspace = wsRes?.data;

  if (isLoading) {
    return (
      <div className="p-12 flex justify-center">
        <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-lg font-semibold text-slate-800">Workspace not found</h2>
        <Link to="/app/workspaces" className="text-sm text-indigo-600 underline mt-2 block">
          Back to Workspaces
        </Link>
      </div>
    );
  }

  const tabs = [
    { to: `/app/workspaces/${workspaceId}/overview`, label: 'Dashboard', icon: LayoutDashboard },
    { to: `/app/workspaces/${workspaceId}/teams`, label: 'Teams & Departments', icon: Users },
    { to: `/app/workspaces/${workspaceId}/announcements`, label: 'Announcements', icon: Megaphone },
    { to: `/app/workspaces/${workspaceId}/calendar`, label: 'Master Calendar', icon: Calendar },
    { to: `/app/workspaces/${workspaceId}/daily-standups`, label: 'Daily Standups', icon: Clock },
    { to: `/app/workspaces/${workspaceId}/reports`, label: 'Analytics & Reports', icon: BarChart3 },
    { to: `/app/workspaces/${workspaceId}/members`, label: 'Members', icon: Users },
  ];

  return (
    <div className="min-h-full">
      {/* Workspace Banner */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-8 pt-6 pb-0">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-2">
          <Link to="/app/workspaces" className="hover:text-slate-600 transition-colors">
            Workspaces
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-slate-700 font-medium">{workspace.name}</span>
        </div>

        {/* Workspace Title & Info */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                {workspace.name}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                {workspace.category || 'Event Operations'}
              </span>
              {workspace.status === 'ARCHIVED' && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                  Archived
                </span>
              )}
            </div>
            {workspace.description && (
              <p className="text-sm text-slate-500 mt-1 max-w-2xl">{workspace.description}</p>
            )}
          </div>

          {/* Managers List */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Managers:</span>
            <div className="flex -space-x-2">
              {workspace.managers?.map((m) => (
                <Avatar key={m._id} user={m} size="sm" className="ring-2 ring-white" />
              ))}
            </div>
          </div>
        </div>

        {/* Workspace Navigation Tabs */}
        <div className="flex items-center gap-1 border-t border-slate-100 pt-1 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <NavLink
                key={tab.to}
                to={tab.to}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
                    isActive
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
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

      {/* Child Content */}
      <div className="p-4 sm:p-8">
        <Outlet />
      </div>
    </div>
  );
}


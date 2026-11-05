import React from 'react';
import { NavLink, Outlet, useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { roomApi } from '../api/room.api';
import { Avatar } from '../components/common/Avatar';
import {
  LayoutDashboard,
  Kanban,
  ListTodo,
  Calendar,
  Milestone,
  Clock,
  MessageSquare,
  History,
  ChevronRight,
  Loader2,
  ShieldAlert,
} from 'lucide-react';

export function RoomLayout() {
  const { workspaceId, roomId } = useParams();

  const { data: roomRes, isLoading, isError, error } = useQuery({
    queryKey: ['room', roomId],
    queryFn: () => roomApi.getById(roomId),
  });

  const room = roomRes?.data;

  if (isLoading) {
    return (
      <div className="p-12 flex justify-center">
        <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (isError || !room) {
    return (
      <div className="p-8 text-center max-w-md mx-auto">
        <div className="h-12 w-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-3">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-semibold text-slate-800">Room Access Restricted</h2>
        <p className="text-sm text-slate-500 mt-1">
          {error?.message || 'You do not have permission to access this room.'}
        </p>
        <Link
          to={`/app/workspaces/${workspaceId}/overview`}
          className="text-xs font-semibold text-indigo-600 underline mt-4 block"
        >
          Return to Workspace Overview
        </Link>
      </div>
    );
  }

  const roomTabs = [
    { to: `/app/workspaces/${workspaceId}/rooms/${roomId}/overview`, label: 'Overview', icon: LayoutDashboard },
    { to: `/app/workspaces/${workspaceId}/rooms/${roomId}/board`, label: 'Kanban Board', icon: Kanban },
    { to: `/app/workspaces/${workspaceId}/rooms/${roomId}/list`, label: 'Task List', icon: ListTodo },
    { to: `/app/workspaces/${workspaceId}/rooms/${roomId}/calendar`, label: 'Calendar', icon: Calendar },
    { to: `/app/workspaces/${workspaceId}/rooms/${roomId}/milestones`, label: 'Milestones', icon: Milestone },
    { to: `/app/workspaces/${workspaceId}/rooms/${roomId}/daily-plans`, label: 'Daily Plans', icon: Clock },
    { to: `/app/workspaces/${workspaceId}/rooms/${roomId}/discussions`, label: 'Discussions', icon: MessageSquare },
    { to: `/app/workspaces/${workspaceId}/rooms/${roomId}/activity`, label: 'Activity', icon: History },
  ];

  return (
    <div className="min-h-full">
      {/* Room Header Banner */}
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
            {room.workspaceId?.name || 'Workspace'}
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-slate-700 font-semibold">{room.name}</span>
        </div>

        {/* Room Header & Leader */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{room.name}</h1>
            {room.description && (
              <p className="text-sm text-slate-500 mt-1 max-w-2xl">{room.description}</p>
            )}
          </div>

          {/* Room Leader Profile Pill */}
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <Avatar user={room.leader} size="sm" />
            <div>
              <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400 block leading-none">
                Room Leader
              </span>
              <span className="text-xs font-semibold text-slate-800 leading-tight">
                {room.leader?.name || 'Unassigned'}
              </span>
            </div>
          </div>
        </div>

        {/* 8 Required Room Navigation Tabs */}
        <div className="flex items-center gap-1 border-t border-slate-100 pt-1 overflow-x-auto">
          {roomTabs.map((tab) => {
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

      {/* Tab View Outlet */}
      <div className="p-4 sm:p-8">
        <Outlet />
      </div>
    </div>
  );
}


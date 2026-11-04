import React, { useState } from 'react';
import { NavLink, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { workspaceApi } from '../../api/workspace.api';
import { teamApi } from '../../api/team.api';
import { roomApi } from '../../api/room.api';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  CheckSquare,
  Calendar,
  Clock,
  Layers,
  ChevronRight,
  ChevronDown,
  Settings,
  FolderKanban,
  DoorOpen,
  Users,
  Megaphone,
  X,
} from 'lucide-react';

function TeamTreeItem({ workspaceId, team, activeRoomId }) {
  const [isOpen, setIsOpen] = useState(false);

  const { data: roomsRes } = useQuery({
    queryKey: ['rooms', workspaceId, team._id],
    queryFn: () => roomApi.getAll(workspaceId, team._id),
    enabled: isOpen,
  });

  const rooms = roomsRes?.data || [];

  return (
    <div className="space-y-0.5">
      <div className="flex items-center justify-between rounded-md hover:bg-slate-100 group px-2 py-1 text-xs">
        <NavLink
          to={`/app/workspaces/${workspaceId}/teams/${team._id}/overview`}
          className={({ isActive }) =>
            `flex items-center gap-1.5 flex-1 truncate font-medium ${
              isActive ? 'text-indigo-600 font-bold' : 'text-slate-600'
            }`
          }
        >
          <Users className="h-3 w-3 text-slate-400 group-hover:text-indigo-600 shrink-0" />
          <span className="truncate">{team.name}</span>
        </NavLink>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-0.5 rounded hover:bg-slate-200/60 text-slate-400 hover:text-slate-600"
        >
          {isOpen ? <ChevronDown className="h-2.5 w-2.5" /> : <ChevronRight className="h-2.5 w-2.5" />}
        </button>
      </div>

      {isOpen && (
        <div className="pl-3.5 space-y-0.5 border-l border-slate-200 ml-2 my-0.5">
          {rooms.length === 0 ? (
            <p className="text-[10px] text-slate-400 py-0.5 pl-1 italic">No rooms yet</p>
          ) : (
            rooms.map((room) => (
              <NavLink
                key={room._id}
                to={`/app/workspaces/${workspaceId}/rooms/${room._id}/board`}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-2 py-1 text-[11px] rounded transition-colors ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 font-semibold'
                      : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                  }`
                }
              >
                <DoorOpen className="h-2.5 w-2.5 text-slate-400 shrink-0" />
                <span className="truncate">{room.name}</span>
              </NavLink>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function WorkspaceTreeItem({ workspace, activeWorkspaceId, activeRoomId }) {
  const [isOpen, setIsOpen] = useState(workspace._id === activeWorkspaceId);

  const { data: teamsRes } = useQuery({
    queryKey: ['teams', workspace._id],
    queryFn: () => teamApi.getAll(workspace._id),
    enabled: isOpen,
  });

  const teams = teamsRes?.data || [];

  return (
    <div className="space-y-0.5">
      <div className="flex items-center justify-between rounded-lg hover:bg-slate-100 group px-2 py-1.5 transition-colors">
        <NavLink
          to={`/app/workspaces/${workspace._id}/overview`}
          className={({ isActive }) =>
            `flex items-center gap-2 text-xs font-semibold flex-1 truncate ${
              isActive ? 'text-indigo-600 font-bold' : 'text-slate-700'
            }`
          }
        >
          <FolderKanban className="h-3.5 w-3.5 shrink-0 text-slate-400 group-hover:text-indigo-600" />
          <span className="truncate">{workspace.name}</span>
        </NavLink>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-1 rounded hover:bg-slate-200/60 text-slate-400 hover:text-slate-600"
        >
          {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        </button>
      </div>

      {isOpen && (
        <div className="pl-4 space-y-1 border-l border-slate-200 ml-3.5 my-1">
          {/* Quick links */}
          <div className="space-y-0.5 pb-1 mb-1 border-b border-slate-100">
            <NavLink
              to={`/app/workspaces/${workspace._id}/overview`}
              className={({ isActive }) =>
                `flex items-center gap-2 px-2 py-1 text-[11px] rounded transition-colors ${
                  isActive
                    ? 'text-indigo-600 font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`
              }
            >
              <LayoutDashboard className="h-3 w-3" />
              <span>Event Dashboard</span>
            </NavLink>
            <NavLink
              to={`/app/workspaces/${workspace._id}/teams`}
              className={({ isActive }) =>
                `flex items-center gap-2 px-2 py-1 text-[11px] rounded transition-colors ${
                  isActive
                    ? 'text-indigo-600 font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`
              }
            >
              <Users className="h-3 w-3" />
              <span>All Teams ({teams.length})</span>
            </NavLink>
            <NavLink
              to={`/app/workspaces/${workspace._id}/announcements`}
              className={({ isActive }) =>
                `flex items-center gap-2 px-2 py-1 text-[11px] rounded transition-colors ${
                  isActive
                    ? 'text-indigo-600 font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`
              }
            >
              <Megaphone className="h-3 w-3" />
              <span>Announcements</span>
            </NavLink>
          </div>

          {/* Department Teams List */}
          <div className="space-y-0.5">
            <span className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 block pb-0.5">
              Departments
            </span>
            {teams.length === 0 ? (
              <p className="text-[11px] text-slate-400 py-1 pl-2 italic">No teams established</p>
            ) : (
              teams.map((team) => (
                <TeamTreeItem
                  key={team._id}
                  workspaceId={workspace._id}
                  team={team}
                  activeRoomId={activeRoomId}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function Sidebar({ isOpen, onClose }) {
  const { activeOrg } = useAuth();
  const { workspaceId, roomId } = useParams();

  const { data: workspacesRes } = useQuery({
    queryKey: ['workspaces', activeOrg?._id],
    queryFn: () => workspaceApi.getAll(activeOrg?._id),
    enabled: !!activeOrg?._id,
  });

  const workspaces = workspacesRes?.data || [];

  const navLinks = [
    { to: '/app/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/app/my-tasks', icon: CheckSquare, label: 'My Tasks' },
    { to: '/app/my-calendar', icon: Calendar, label: 'My Calendar' },
    { to: '/app/daily-planner', icon: Clock, label: 'Daily Planner' },
    { to: '/app/workspaces', icon: Layers, label: 'All Workspaces' },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-base shadow-sm">
              W
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900">
              Work<span className="text-indigo-600">Hub</span>
            </span>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Navigation */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {/* Main Navigation */}
          <div>
            <span className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Personal Workspace
            </span>
            <div className="mt-2 space-y-1">
              {navLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => onClose?.()}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                        isActive
                          ? 'bg-indigo-50 text-indigo-700 font-semibold'
                          : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                      }`
                    }
                  >
                    <Icon className="h-4 w-4 shrink-0 text-slate-500" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>

          {/* Workspaces & Rooms Tree */}
          <div>
            <div className="flex items-center justify-between px-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Workspaces & Rooms
              </span>
            </div>

            <div className="mt-2 space-y-1">
              {workspaces.length === 0 ? (
                <p className="text-xs text-slate-400 px-3 py-2 italic">No active workspaces</p>
              ) : (
                workspaces.map((ws) => (
                  <WorkspaceTreeItem
                    key={ws._id}
                    workspace={ws}
                    activeWorkspaceId={workspaceId}
                    activeRoomId={roomId}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer info & Settings link */}
        <div className="p-3 border-t border-slate-200 bg-slate-50/50">
          <NavLink
            to="/app/settings"
            className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <Settings className="h-4 w-4 text-slate-400" />
            <span>Settings & Preferences</span>
          </NavLink>
        </div>
      </aside>
    </>
  );
}


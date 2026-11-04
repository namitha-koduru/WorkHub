import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { roomApi } from '../../api/room.api';
import { workspaceApi } from '../../api/workspace.api';
import { useAuth } from '../../context/AuthContext';
import { RoomModal } from '../../components/modals/RoomModal';
import { Button } from '../../components/common/Button';
import { Avatar } from '../../components/common/Avatar';
import { EmptyState } from '../../components/common/EmptyState';
import {
  DoorOpen,
  Plus,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronRight,
  TrendingUp,
  Loader2,
} from 'lucide-react';

export default function WorkspaceOverviewPage() {
  const { workspaceId } = useParams();
  const { activeOrg } = useAuth();
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);

  // Fetch workspace details & metrics
  const { data: wsRes } = useQuery({
    queryKey: ['workspace', workspaceId],
    queryFn: () => workspaceApi.getById(workspaceId),
  });

  // Fetch rooms inside this workspace
  const { data: roomsRes, isLoading: roomsLoading } = useQuery({
    queryKey: ['rooms', workspaceId],
    queryFn: () => roomApi.getAll(workspaceId),
  });

  const workspace = wsRes?.data;
  const metrics = workspace?.metrics || {};
  const rooms = roomsRes?.data || [];

  if (roomsLoading) {
    return (
      <div className="p-12 flex justify-center">
        <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* KPI Metrics Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Rooms
            </span>
            <DoorOpen className="h-4 w-4" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{metrics.roomCount || 0}</div>
          <span className="text-[11px] text-slate-400">Working departments</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-blue-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Tasks
            </span>
            <Clock className="h-4 w-4" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{metrics.totalTasks || 0}</div>
          <span className="text-[11px] text-slate-400">
            {metrics.completedTasks || 0} completed
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-red-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Overdue Tasks
            </span>
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div className="text-2xl font-bold text-red-600">{metrics.overdueTasks || 0}</div>
          <span className="text-[11px] text-slate-400">Requires attention</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-indigo-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Progress
            </span>
            <TrendingUp className="h-4 w-4" />
          </div>
          <div className="text-2xl font-bold text-indigo-600">{metrics.progress || 0}%</div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
            <div
              className="bg-indigo-600 h-1.5 rounded-full"
              style={{ width: `${metrics.progress || 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Rooms Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Workspace Rooms & Departments</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Isolated working environments with dedicated tasks, calendars, and team leaders
            </p>
          </div>

          <Button size="sm" icon={Plus} onClick={() => setIsRoomModalOpen(true)}>
            Create Room
          </Button>
        </div>

        {rooms.length === 0 ? (
          <EmptyState
            icon={DoorOpen}
            title="No rooms created yet"
            description="Create your first department room (e.g. Public Relations, Technical Team, Logistics) to assign tasks and leaders."
            actionLabel="Create Room"
            onAction={() => setIsRoomModalOpen(true)}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.map((room) => (
              <div
                key={room._id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
              >
                <div className="p-6">
                  {/* Room Leader Pill */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <Avatar user={room.leader} size="xs" />
                      <span className="text-xs font-semibold text-slate-700">
                        {room.leader?.name || 'No Leader'}
                      </span>
                    </div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                      Room Leader
                    </span>
                  </div>

                  <Link
                    to={`/app/workspaces/${workspaceId}/rooms/${room._id}/board`}
                    className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors block"
                  >
                    {room.name}
                  </Link>

                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {room.description || 'No description provided.'}
                  </p>

                  {/* Room Progress */}
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs text-slate-600 mb-1.5">
                      <span className="font-medium">Room Progress</span>
                      <span className="font-bold text-slate-800">{room.progress || 0}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                      <div
                        className="bg-indigo-600 h-1.5 rounded-full"
                        style={{ width: `${room.progress || 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Room Stats */}
                  <div className="grid grid-cols-2 gap-2 mt-4 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-slate-400" />
                      <span>{room.memberCount || 0} Members</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-slate-400" />
                      <span>
                        {room.completedTasks || 0}/{room.totalTasks || 0} Tasks
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer action */}
                <div className="px-6 py-3.5 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">Board & Collaborations</span>
                  <Link
                    to={`/app/workspaces/${workspaceId}/rooms/${room._id}/board`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                  >
                    <span>Open Room Board</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Room Modal */}
      {isRoomModalOpen && (
        <RoomModal
          isOpen={isRoomModalOpen}
          onClose={() => setIsRoomModalOpen(false)}
          workspaceId={workspaceId}
          organizationId={activeOrg?._id}
        />
      )}
    </div>
  );
}


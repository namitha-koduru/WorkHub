import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { roomApi } from '../../api/room.api';
import { teamApi } from '../../api/team.api';
import { RoomModal } from '../../components/modals/RoomModal';
import { Avatar } from '../../components/common/Avatar';
import { Button } from '../../components/common/Button';
import { EmptyState } from '../../components/common/EmptyState';
import {
  DoorOpen,
  Users,
  CheckCircle2,
  Plus,
  ArrowRight,
  Loader2,
  Kanban,
} from 'lucide-react';

export default function TeamRoomsPage() {
  const { workspaceId, teamId } = useParams();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: teamRes } = useQuery({
    queryKey: ['team', teamId],
    queryFn: () => teamApi.getById(teamId),
    enabled: !!teamId,
  });
  const team = teamRes?.data;

  const { data: roomsRes, isLoading } = useQuery({
    queryKey: ['rooms', workspaceId, teamId],
    queryFn: () => roomApi.getAll(workspaceId, teamId),
    enabled: !!workspaceId && !!teamId,
  });
  const rooms = roomsRes?.data || [];

  if (isLoading) {
    return (
      <div className="p-12 flex justify-center">
        <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Collaborative Rooms & Work Channels
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Dedicated working spaces inside {team?.name} equipped with independent task boards, daily logs, and calendars.
          </p>
        </div>

        <Button onClick={() => setIsModalOpen(true)} size="sm">
          <Plus className="h-4 w-4 mr-1.5" /> Create Room / Channel
        </Button>
      </div>

      {rooms.length === 0 ? (
        <EmptyState
          icon={DoorOpen}
          title="No rooms created yet"
          description="Rooms divide team work into manageable channels (e.g. Email Comms, Social Media Campaigns, Stage Lighting)."
          actionLabel="Create Room"
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {rooms.map((room) => (
            <div
              key={room._id}
              className="bg-white rounded-xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
            >
              <div className="p-5 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                      {room.name}
                    </h3>
                    {room.description && (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        {room.description}
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {room.progress || 0}%
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                    style={{ width: `${room.progress || 0}%` }}
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <Avatar user={room.leader} size="xs" />
                    <div>
                      <span className="block text-[10px] text-slate-400 font-medium">Room Leader</span>
                      <span className="text-xs font-semibold text-slate-800 line-clamp-1">
                        {room.leader?.name || 'Unassigned'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1 font-medium text-slate-600" title="Tasks">
                      <Kanban className="h-3.5 w-3.5 text-slate-400" />
                      {room.completedTasks || 0} / {room.totalTasks || 0}
                    </span>
                    <span className="flex items-center gap-1 font-medium text-slate-600" title="Members">
                      <Users className="h-3.5 w-3.5 text-slate-400" />
                      {room.memberCount || 0}
                    </span>
                  </div>
                </div>
              </div>

              <Link
                to={`/app/workspaces/${workspaceId}/rooms/${room._id}/board`}
                className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-indigo-600 group-hover:bg-indigo-50 group-hover:text-indigo-700 transition-colors"
              >
                <span>Open Kanban Board</span>
                <ArrowRight className="h-4 w-4 transform group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          ))}
        </div>
      )}

      <RoomModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        workspaceId={workspaceId}
        organizationId={team?.organizationId}
        teamId={teamId}
      />
    </div>
  );
}


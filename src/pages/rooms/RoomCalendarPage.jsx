import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { roomApi } from '../../api/room.api';
import { useAuth } from '../../context/AuthContext';
import { ScheduleModal } from '../../components/modals/ScheduleModal';
import { Button } from '../../components/common/Button';
import { Plus, Calendar, Loader2 } from 'lucide-react';

export default function RoomCalendarPage() {
  const { workspaceId, roomId } = useParams();
  const { activeOrg } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: eventsRes, isLoading } = useQuery({
    queryKey: ['room-calendar', roomId],
    queryFn: () => roomApi.getCalendar(roomId),
  });

  const events = eventsRes?.data || [];

  if (isLoading) {
    return (
      <div className="p-12 flex justify-center">
        <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Room Operational Calendar</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Deadlines, staging milestones, and team briefings scoped exclusively to this room
          </p>
        </div>

        <Button size="sm" icon={Plus} onClick={() => setIsModalOpen(true)}>
          Add Schedule
        </Button>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay',
          }}
          events={events}
          height="auto"
          dayMaxEvents={3}
        />
      </div>

      {isModalOpen && (
        <ScheduleModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          organizationId={activeOrg?._id}
          workspaceId={workspaceId}
          roomId={roomId}
        />
      )}
    </div>
  );
}


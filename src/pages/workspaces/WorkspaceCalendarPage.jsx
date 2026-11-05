import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { workspaceApi } from '../../api/workspace.api';
import { useAuth } from '../../context/AuthContext';
import { ScheduleModal } from '../../components/modals/ScheduleModal';
import { Button } from '../../components/common/Button';
import { Plus, Loader2 } from 'lucide-react';

export default function WorkspaceCalendarPage() {
  const { workspaceId } = useParams();
  const { activeOrg } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: eventsRes, isLoading } = useQuery({
    queryKey: ['workspace-calendar', workspaceId],
    queryFn: () => workspaceApi.getCalendar(workspaceId),
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
          <h2 className="text-lg font-bold text-slate-900">Workspace Master Schedule</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Aggregated timeline of room deadlines, milestones, and planning meetings
          </p>
        </div>

        <Button size="sm" icon={Plus} onClick={() => setIsModalOpen(true)}>
          Add Schedule / Milestone
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
        />
      )}
    </div>
  );
}


import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { scheduleApi } from '../../api/features.api';
import { useAuth } from '../../context/AuthContext';
import { ScheduleModal } from '../../components/modals/ScheduleModal';
import { Button } from '../../components/common/Button';
import { Calendar as CalendarIcon, Plus, Loader2 } from 'lucide-react';

export default function PersonalCalendarPage() {
  const { activeOrg } = useAuth();
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const { data: eventsRes, isLoading } = useQuery({
    queryKey: ['personal-calendar'],
    queryFn: () => scheduleApi.getPersonal(),
  });

  const events = eventsRes?.data || [];

  const handleEventClick = (info) => {
    const event = info.event;
    setSelectedEvent({
      id: event.id,
      title: event.title,
      start: event.start,
      end: event.end,
      extendedProps: event.extendedProps,
    });
  };

  if (isLoading) {
    return (
      <div className="p-12 flex justify-center">
        <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <CalendarIcon className="h-6 w-6 text-indigo-600" />
            My Personal Calendar
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Aggregated schedule of all your meetings, milestones, and task deadlines
          </p>
        </div>

        <Button
          size="sm"
          icon={Plus}
          onClick={() => setIsScheduleModalOpen(true)}
        >
          Add Meeting / Milestone
        </Button>
      </div>

      {/* FullCalendar Container */}
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
          eventClick={handleEventClick}
          height="auto"
          editable={false}
          selectable={true}
          dayMaxEvents={3}
        />
      </div>

      {/* Schedule Modal */}
      {isScheduleModalOpen && (
        <ScheduleModal
          isOpen={isScheduleModalOpen}
          onClose={() => setIsScheduleModalOpen(false)}
          organizationId={activeOrg?._id}
          workspaceId={activeOrg?._id} // Fallback or active workspace
        />
      )}
    </div>
  );
}


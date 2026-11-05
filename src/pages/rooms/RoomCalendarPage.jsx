import React, { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { roomApi } from '../../api/room.api';
import { useAuth } from '../../context/AuthContext';
import { ScheduleModal } from '../../components/modals/ScheduleModal';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { Plus, Loader2, Calendar as CalendarIcon, Clock, MapPin } from 'lucide-react';

export default function RoomCalendarPage() {
  const { workspaceId, roomId } = useParams();
  const { activeOrg } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [filterType, setFilterType] = useState('ALL');

  const { data: roomRes } = useQuery({
    queryKey: ['room', roomId],
    queryFn: () => roomApi.getById(roomId),
    enabled: !!roomId,
  });
  const room = roomRes?.data;

  const { data: eventsRes, isLoading } = useQuery({
    queryKey: ['room-calendar', roomId],
    queryFn: () => roomApi.getCalendar(roomId),
    enabled: !!roomId,
  });

  const rawEvents = eventsRes?.data || [];

  // Normalize room calendar events
  const normalizedEvents = useMemo(() => {
    return rawEvents.map((ev) => {
      const isTask = ev.type === 'TASK' || ev.type === 'TASK_DEADLINE' || !!ev.task;
      const isMilestone = ev.type === 'MILESTONE' || ev.scheduleType === 'MILESTONE';
      const isMeeting = ev.type === 'MEETING' || ev.scheduleType === 'MEETING';
      const isActivity = ev.type === 'ACTIVITY';

      let color = '#4f46e5';
      if (isTask) color = '#e11d48';
      else if (isMilestone) color = '#d97706';
      else if (isActivity) color = '#059669';

      const startDate = ev.start || ev.startTime || ev.dueDate || ev.date || new Date().toISOString();
      const endDate = ev.end || ev.endTime || startDate;
      const allDay = ev.allDay !== undefined ? ev.allDay : (ev.isAllDay || isTask || isMilestone);

      return {
        id: ev.id || ev._id || 'evt-' + Math.random().toString(36).substr(2, 6),
        _id: ev._id || ev.id,
        title: ev.title,
        start: startDate,
        end: endDate,
        allDay: !!allDay,
        backgroundColor: color,
        borderColor: color,
        textColor: '#ffffff',
        extendedProps: {
          ...ev,
          originalType: isTask ? 'TASK' : isMilestone ? 'MILESTONE' : isMeeting ? 'MEETING' : 'ACTIVITY',
          description: ev.description || (ev.task?.description) || '',
          location: ev.location || '',
        },
      };
    });
  }, [rawEvents]);

  const filteredEvents = useMemo(() => {
    if (filterType === 'ALL') return normalizedEvents;
    return normalizedEvents.filter((ev) => {
      const type = ev.extendedProps?.originalType;
      if (filterType === 'TASKS') return type === 'TASK';
      if (filterType === 'MEETINGS') return type === 'MEETING';
      if (filterType === 'MILESTONES') return type === 'MILESTONE';
      return true;
    });
  }, [normalizedEvents, filterType]);

  const handleEventClick = (info) => {
    const event = info.event;
    setSelectedEvent({
      id: event.id,
      title: event.title,
      start: event.start,
      end: event.end,
      allDay: event.allDay,
      backgroundColor: event.backgroundColor,
      extendedProps: event.extendedProps || {},
    });
  };

  if (isLoading) {
    return (
      <div className="p-16 flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
        <span className="text-sm font-medium text-slate-500">Loading room calendar...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-indigo-600" />
            {room?.name || 'Room'} Operational Calendar
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Deadlines, staging milestones, and team briefings scoped exclusively to this room
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Filter Pills */}
          <div className="flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold">
            {[
              { id: 'ALL', label: 'All' },
              { id: 'MEETINGS', label: 'Meetings' },
              { id: 'TASKS', label: 'Tasks' },
              { id: 'MILESTONES', label: 'Milestones' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilterType(f.id)}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  filterType === f.id
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <Button size="sm" icon={Plus} onClick={() => setIsModalOpen(true)}>
            Add Event / Milestone
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
        <span className="font-semibold text-slate-700">Categories:</span>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-indigo-600" />
          <span>Meetings</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-600" />
          <span>Milestones</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-600" />
          <span>Task Deadlines</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-600" />
          <span>Activities</span>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm min-h-[600px]">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay',
          }}
          events={filteredEvents}
          eventClick={handleEventClick}
          height="auto"
          dayMaxEvents={3}
        />
      </div>

      {/* Event Details Modal */}
      {selectedEvent && (
        <Modal
          isOpen={!!selectedEvent}
          onClose={() => setSelectedEvent(null)}
          title={selectedEvent.title}
        >
          <div className="space-y-4 py-2 text-sm">
            <div className="flex items-center gap-2">
              <span
                className="px-2.5 py-1 rounded-full text-xs font-semibold text-white uppercase tracking-wider"
                style={{ backgroundColor: selectedEvent.backgroundColor || '#4f46e5' }}
              >
                {selectedEvent.extendedProps?.originalType || 'SCHEDULE'}
              </span>
              {selectedEvent.allDay && (
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">
                  All Day
                </span>
              )}
            </div>

            <div className="space-y-2 text-xs text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-slate-400 shrink-0" />
                <span>
                  <strong>Time:</strong>{' '}
                  {selectedEvent.start
                    ? new Date(selectedEvent.start).toLocaleString(undefined, {
                        dateStyle: 'medium',
                        timeStyle: selectedEvent.allDay ? undefined : 'short',
                      })
                    : 'Scheduled'}
                  {selectedEvent.end && !selectedEvent.allDay && ` – ${new Date(selectedEvent.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                </span>
              </div>

              {selectedEvent.extendedProps?.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
                  <span>
                    <strong>Location:</strong> {selectedEvent.extendedProps.location}
                  </span>
                </div>
              )}
            </div>

            {selectedEvent.extendedProps?.description && (
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Description / Agenda
                </h4>
                <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100 whitespace-pre-wrap">
                  {selectedEvent.extendedProps.description}
                </p>
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <Button size="sm" variant="outline" onClick={() => setSelectedEvent(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

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

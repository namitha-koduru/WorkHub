import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { teamApi } from '../../api/team.api';
import { useAuth } from '../../context/AuthContext';
import { ScheduleModal } from '../../components/modals/ScheduleModal';
import { Button } from '../../components/common/Button';
import { Plus, Loader2, Calendar as CalendarIcon, Filter } from 'lucide-react';

export default function TeamCalendarPage() {
  const { workspaceId, teamId } = useParams();
  const { activeOrg } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterType, setFilterType] = useState('ALL');

  const { data: teamRes } = useQuery({
    queryKey: ['team', teamId],
    queryFn: () => teamApi.getById(teamId),
    enabled: !!teamId,
  });
  const team = teamRes?.data;

  const { data: eventsRes, isLoading } = useQuery({
    queryKey: ['team-calendar', teamId],
    queryFn: () => teamApi.getCalendar(teamId),
    enabled: !!teamId,
  });

  const rawEvents = eventsRes?.data || [];

  const filteredEvents = rawEvents.filter((ev) => {
    if (filterType === 'ALL') return true;
    if (filterType === 'TASKS') return ev.type === 'TASK';
    if (filterType === 'SCHEDULES') return ev.type === 'SCHEDULE';
    if (filterType === 'MILESTONES') return ev.scheduleType === 'MILESTONE';
    return true;
  });

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
            {team?.name || 'Department'} Calendar
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Synchronized schedule of department meetings, room milestones, and critical task deadlines.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Filter Pills */}
          <div className="flex items-center p-1 rounded-lg bg-slate-100 border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filterType === 'ALL'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Events
            </button>
            <button
              onClick={() => setFilterType('TASKS')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filterType === 'TASKS'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tasks
            </button>
            <button
              onClick={() => setFilterType('SCHEDULES')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filterType === 'SCHEDULES'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Meetings
            </button>
            <button
              onClick={() => setFilterType('MILESTONES')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filterType === 'MILESTONES'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Milestones
            </button>
          </div>

          <Button size="sm" onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" /> Add Meeting / Milestone
          </Button>
        </div>
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
          events={filteredEvents}
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
          teamId={teamId}
        />
      )}
    </div>
  );
}


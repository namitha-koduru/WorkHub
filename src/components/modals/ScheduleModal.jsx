import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { scheduleApi } from '../../api/features.api';
import { Calendar, AlertCircle } from 'lucide-react';

export function ScheduleModal({ isOpen, onClose, organizationId, workspaceId, roomId }) {
  const queryClient = useQueryClient();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('MEETING');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [location, setLocation] = useState('');
  const [isAllDay, setIsAllDay] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const createMutation = useMutation({
    mutationFn: (data) => scheduleApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personal-calendar'] });
      queryClient.invalidateQueries({ queryKey: ['workspace-calendar'] });
      queryClient.invalidateQueries({ queryKey: ['team-calendar'] });
      queryClient.invalidateQueries({ queryKey: ['room-calendar'] });
      onClose();
    },
    onError: (err) => setErrorMsg(err.message || 'Failed to create schedule event'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !startTime) {
      setErrorMsg('Title and start time are required');
      return;
    }

    createMutation.mutate({
      title,
      description,
      type,
      startTime: new Date(startTime).toISOString(),
      endTime: endTime ? new Date(endTime).toISOString() : new Date(startTime).toISOString(),
      location,
      isAllDay,
      organizationId,
      workspaceId,
      roomId: roomId || null,
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Calendar Event / Milestone">
      {errorMsg && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Event Title *</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Stage Sound Rigging Verification"
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Event Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="MEETING">Meeting</option>
              <option value="ACTIVITY">Planned Activity</option>
              <option value="MILESTONE">Milestone</option>
              <option value="REMINDER">Important Reminder</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Location / Link</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Room 204 or Meet Link"
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Start Time *</label>
            <input
              type="datetime-local"
              required
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">End Time</label>
            <input
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="allDay"
            checked={isAllDay}
            onChange={(e) => setIsAllDay(e.target.checked)}
            className="rounded text-indigo-600 focus:ring-indigo-500"
          />
          <label htmlFor="allDay" className="text-xs text-slate-700 select-none">
            All-day event or deadline
          </label>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">Description</label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Agenda, objectives, or instructions..."
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="sm" isLoading={createMutation.isPending}>
            Add to Calendar
          </Button>
        </div>
      </form>
    </Modal>
  );
}


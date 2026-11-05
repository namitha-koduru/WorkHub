import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dailyPlanApi } from '../../api/features.api';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/common/Button';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Save,
  Plus,
  Trash2,
  History,
  Loader2,
} from 'lucide-react';

export default function DailyPlannerPage() {
  const queryClient = useQueryClient();
  const { activeOrg } = useAuth();
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);

  // Today's Work State
  const [plannedTasks, setPlannedTasks] = useState([]);
  const [newPlanned, setNewPlanned] = useState('');
  const [inProgressTasks, setInProgressTasks] = useState([]);
  const [newInProgress, setNewInProgress] = useState('');
  const [completedTasks, setCompletedTasks] = useState([]);
  const [newCompleted, setNewCompleted] = useState('');
  const [pendingTasks, setPendingTasks] = useState([]);
  const [newPending, setNewPending] = useState('');
  const [blockers, setBlockers] = useState('');

  // Tomorrow's Plan State
  const [continueTasks, setContinueTasks] = useState([]);
  const [newContinue, setNewContinue] = useState('');
  const [newTasks, setNewTasks] = useState([]);
  const [newNewTask, setNewNewTask] = useState('');
  const [expectedCompletion, setExpectedCompletion] = useState('');
  const [notes, setNotes] = useState('');

  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch plan for selected date
  const { data: planRes, isLoading } = useQuery({
    queryKey: ['daily-plan', selectedDate],
    queryFn: () => dailyPlanApi.getMyPlan(selectedDate),
  });

  // Fetch plan history
  const { data: historyRes } = useQuery({
    queryKey: ['daily-plan-history'],
    queryFn: () => dailyPlanApi.getHistory(7),
  });

  const plan = planRes?.data;
  const history = historyRes?.data || [];

  // Hydrate fields
  useEffect(() => {
    if (plan) {
      setPlannedTasks(plan.todayWork?.plannedTasks || []);
      setInProgressTasks(plan.todayWork?.inProgressTasks || []);
      setCompletedTasks(plan.todayWork?.completedTasks || []);
      setPendingTasks(plan.todayWork?.pendingTasks || []);
      setBlockers(plan.todayWork?.blockers || '');

      setContinueTasks(plan.tomorrowPlan?.continueTasks || []);
      setNewTasks(plan.tomorrowPlan?.newTasks || []);
      setExpectedCompletion(plan.tomorrowPlan?.expectedCompletion || '');
      setNotes(plan.tomorrowPlan?.notes || '');
    } else {
      setPlannedTasks([]);
      setInProgressTasks([]);
      setCompletedTasks([]);
      setPendingTasks([]);
      setBlockers('');
      setContinueTasks([]);
      setNewTasks([]);
      setExpectedCompletion('');
      setNotes('');
    }
    setSuccessMsg('');
    setErrorMsg('');
  }, [plan, selectedDate]);

  // Save Plan Mutation
  const saveMutation = useMutation({
    mutationFn: (data) => dailyPlanApi.save(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-plan', selectedDate] });
      queryClient.invalidateQueries({ queryKey: ['daily-plan-history'] });
      setSuccessMsg('Daily work plan successfully recorded!');
      setTimeout(() => setSuccessMsg(''), 4000);
    },
    onError: (err) => setErrorMsg(err.message || 'Failed to save daily work plan'),
  });

  const handleSave = (e) => {
    e.preventDefault();
    if (!activeOrg?._id) {
      setErrorMsg('Active organization required');
      return;
    }

    saveMutation.mutate({
      date: selectedDate,
      organizationId: activeOrg._id,
      todayWork: {
        plannedTasks,
        inProgressTasks,
        completedTasks,
        pendingTasks,
        blockers,
      },
      tomorrowPlan: {
        continueTasks,
        newTasks,
        expectedCompletion,
        notes,
      },
    });
  };

  const addItem = (list, setList, text, setText) => {
    if (!text.trim()) return;
    setList([...list, text.trim()]);
    setText('');
  };

  const removeItem = (list, setList, index) => {
    setList(list.filter((_, i) => i !== index));
  };

  if (isLoading) {
    return (
      <div className="p-12 flex justify-center">
        <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Clock className="h-6 w-6 text-indigo-600" />
            Daily Work Planner & Standup
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track daily accomplishments, unblock dependencies, and plan tomorrow's deliverables
          </p>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-slate-400" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-8">
        {/* SECTION 1: TODAY'S WORK */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">
              Section 1
            </span>
            <h2 className="text-lg font-bold text-slate-900">Today's Work Log ({selectedDate})</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Record deliverables completed, ongoing tasks, and operational blockers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Planned Tasks */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700">Planned Tasks</label>
              <div className="space-y-1.5 mb-2">
                {plannedTasks.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800"
                  >
                    <span>{item}</span>
                    <button
                      type="button"
                      onClick={() => removeItem(plannedTasks, setPlannedTasks, idx)}
                      className="text-slate-400 hover:text-red-500"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newPlanned}
                  onChange={(e) => setNewPlanned(e.target.value)}
                  placeholder="e.g. Calibrate stage lights..."
                  className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addItem(plannedTasks, setPlannedTasks, newPlanned, setNewPlanned);
                    }
                  }}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  icon={Plus}
                  onClick={() => addItem(plannedTasks, setPlannedTasks, newPlanned, setNewPlanned)}
                >
                  Add
                </Button>
              </div>
            </div>

            {/* In Progress Tasks */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700">
                Work In Progress (WIP)
              </label>
              <div className="space-y-1.5 mb-2">
                {inProgressTasks.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-lg bg-blue-50/50 border border-blue-200/60 text-xs text-blue-900"
                  >
                    <span>{item}</span>
                    <button
                      type="button"
                      onClick={() => removeItem(inProgressTasks, setInProgressTasks, idx)}
                      className="text-slate-400 hover:text-red-500"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newInProgress}
                  onChange={(e) => setNewInProgress(e.target.value)}
                  placeholder="e.g. Splicing fiber cables..."
                  className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addItem(inProgressTasks, setInProgressTasks, newInProgress, setNewInProgress);
                    }
                  }}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  icon={Plus}
                  onClick={() =>
                    addItem(inProgressTasks, setInProgressTasks, newInProgress, setNewInProgress)
                  }
                >
                  Add
                </Button>
              </div>
            </div>

            {/* Completed Tasks */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700">Completed Work</label>
              <div className="space-y-1.5 mb-2">
                {completedTasks.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-lg bg-emerald-50/50 border border-emerald-200/60 text-xs text-emerald-900"
                  >
                    <span>{item}</span>
                    <button
                      type="button"
                      onClick={() => removeItem(completedTasks, setCompletedTasks, idx)}
                      className="text-slate-400 hover:text-red-500"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCompleted}
                  onChange={(e) => setNewCompleted(e.target.value)}
                  placeholder="e.g. VIP seating arrangement signed off..."
                  className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addItem(completedTasks, setCompletedTasks, newCompleted, setNewCompleted);
                    }
                  }}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  icon={Plus}
                  onClick={() =>
                    addItem(completedTasks, setCompletedTasks, newCompleted, setNewCompleted)
                  }
                >
                  Add
                </Button>
              </div>
            </div>

            {/* Blockers & Roadblocks */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700">
                Blockers & Roadblocks (Critical for Leaders)
              </label>
              <textarea
                rows={3}
                value={blockers}
                onChange={(e) => setBlockers(e.target.value)}
                placeholder="Mention any vendor delays, missing equipment, or approvals needed..."
                className="w-full px-3 py-2 text-xs rounded-lg border border-red-200 bg-red-50/30 focus:outline-none focus:ring-1 focus:ring-red-500"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: TOMORROW'S PLAN */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">
              Section 2
            </span>
            <h2 className="text-lg font-bold text-slate-900">Tomorrow's Forward Plan</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Prepare next-day velocity and projected milestones for leadership transparency.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Continue Tasks */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700">
                Tasks to Continue
              </label>
              <div className="space-y-1.5 mb-2">
                {continueTasks.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800"
                  >
                    <span>{item}</span>
                    <button
                      type="button"
                      onClick={() => removeItem(continueTasks, setContinueTasks, idx)}
                      className="text-slate-400 hover:text-red-500"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newContinue}
                  onChange={(e) => setNewContinue(e.target.value)}
                  placeholder="e.g. Finish arena sound check..."
                  className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addItem(continueTasks, setContinueTasks, newContinue, setNewContinue);
                    }
                  }}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  icon={Plus}
                  onClick={() =>
                    addItem(continueTasks, setContinueTasks, newContinue, setNewContinue)
                  }
                >
                  Add
                </Button>
              </div>
            </div>

            {/* New Tasks to Start */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700">
                New Tasks to Kickoff
              </label>
              <div className="space-y-1.5 mb-2">
                {newTasks.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800"
                  >
                    <span>{item}</span>
                    <button
                      type="button"
                      onClick={() => removeItem(newTasks, setNewTasks, idx)}
                      className="text-slate-400 hover:text-red-500"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newNewTask}
                  onChange={(e) => setNewNewTask(e.target.value)}
                  placeholder="e.g. Test backup generator..."
                  className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addItem(newTasks, setNewTasks, newNewTask, setNewNewTask);
                    }
                  }}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  icon={Plus}
                  onClick={() => addItem(newTasks, setNewTasks, newNewTask, setNewNewTask)}
                >
                  Add
                </Button>
              </div>
            </div>

            {/* Expected Completion */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Expected Completion Target
              </label>
              <input
                type="text"
                value={expectedCompletion}
                onChange={(e) => setExpectedCompletion(e.target.value)}
                placeholder="e.g. Tomorrow by 6:00 PM before dress rehearsal"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Additional Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Additional Notes
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Equipment needed, shift handoff, etc."
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button
            type="submit"
            size="md"
            icon={Save}
            isLoading={saveMutation.isPending}
            className="px-6 py-2.5 shadow-md"
          >
            Save Daily Plan ({selectedDate})
          </Button>
        </div>
      </form>

      {/* Historical Plan Submissions */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
          <History className="h-4 w-4 text-indigo-600" />
          Recent Daily Plan History
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {history.map((h) => (
            <div
              key={h._id}
              onClick={() => setSelectedDate(h.date)}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                h.date === selectedDate
                  ? 'border-indigo-600 bg-indigo-50/50 shadow-sm'
                  : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
              }`}
            >
              <span className="text-xs font-bold text-slate-800">{h.date}</span>
              <p className="text-[11px] text-slate-500 mt-1">
                Completed: {h.todayWork?.completedTasks?.length || 0} tasks
              </p>
              {h.todayWork?.blockers && (
                <span className="inline-block mt-1.5 text-[10px] font-semibold text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
                  Had Blockers
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


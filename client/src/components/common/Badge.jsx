import React from 'react';

export function StatusBadge({ status }) {
  const styles = {
    'To Do': 'bg-slate-100 text-slate-700 border-slate-200',
    'In Progress': 'bg-blue-50 text-blue-700 border-blue-200',
    'Under Review': 'bg-amber-50 text-amber-700 border-amber-200',
    'Changes Requested': 'bg-pink-50 text-pink-700 border-pink-200',
    'Completed': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };

  const dots = {
    'To Do': 'bg-slate-400',
    'In Progress': 'bg-blue-500',
    'Under Review': 'bg-amber-500',
    'Changes Requested': 'bg-pink-500',
    'Completed': 'bg-emerald-500',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
        styles[status] || 'bg-slate-100 text-slate-700 border-slate-200'
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dots[status] || 'bg-slate-400'}`} />
      {status}
    </span>
  );
}

export function PriorityBadge({ priority }) {
  const styles = {
    Low: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Medium: 'bg-blue-50 text-blue-700 border-blue-200',
    High: 'bg-amber-50 text-amber-700 border-amber-200',
    Urgent: 'bg-red-50 text-red-700 border-red-200',
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider border ${
        styles[priority] || 'bg-slate-100 text-slate-700 border-slate-200'
      }`}
    >
      {priority}
    </span>
  );
}


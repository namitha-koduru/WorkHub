import React from 'react';

export function Avatar({ user, size = 'md', className = '' }) {
  const sizeClasses = {
    xs: 'h-6 w-6 text-[10px]',
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
    xl: 'h-16 w-16 text-lg',
  };

  const name = user?.name || 'User';
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  if (user?.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt={name}
        className={`rounded-full object-cover border border-slate-200 shrink-0 ${sizeClasses[size]} ${className}`}
      />
    );
  }

  // Consistent background color based on name hash
  const colors = [
    'bg-indigo-600 text-white',
    'bg-blue-600 text-white',
    'bg-emerald-600 text-white',
    'bg-violet-600 text-white',
    'bg-amber-600 text-white',
    'bg-rose-600 text-white',
  ];
  const charCodeSum = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const colorClass = colors[charCodeSum % colors.length];

  return (
    <div
      className={`rounded-full flex items-center justify-center font-semibold shrink-0 shadow-sm ${sizeClasses[size]} ${colorClass} ${className}`}
    >
      {initials}
    </div>
  );
}


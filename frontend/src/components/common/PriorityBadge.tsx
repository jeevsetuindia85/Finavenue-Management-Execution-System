import React from 'react';

interface Props {
  priority: 'low' | 'medium' | 'high' | 'critical' | string;
  className?: string;
}

export const PriorityBadge: React.FC<Props> = ({ priority, className = '' }) => {
  const p = (priority || 'medium').toLowerCase();

  let styles = 'bg-slate-100 text-slate-700 border-slate-200';
  if (p === 'critical') {
    styles = 'bg-purple-50 text-purple-700 border-purple-200';
  } else if (p === 'high') {
    styles = 'bg-rose-50 text-rose-700 border-rose-200';
  } else if (p === 'medium') {
    styles = 'bg-sky-50 text-sky-700 border-sky-200';
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider border ${styles} ${className}`}
    >
      {p}
    </span>
  );
};

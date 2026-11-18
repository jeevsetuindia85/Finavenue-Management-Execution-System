import React from 'react';
import { RAGStatus } from '../../types';

interface Props {
  status: RAGStatus | string;
  showDot?: boolean;
  className?: string;
}

export const RAGBadge: React.FC<Props> = ({ status, showDot = true, className = '' }) => {
  const s = (status || 'grey').toLowerCase();

  let bg = 'bg-slate-100 text-slate-700 border-slate-200';
  let dotBg = 'bg-slate-400';
  let label = 'Not Due';

  if (s === 'green') {
    bg = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    dotBg = 'bg-emerald-500 animate-pulse';
    label = 'On Track';
  } else if (s === 'amber') {
    bg = 'bg-amber-50 text-amber-700 border-amber-200';
    dotBg = 'bg-amber-500';
    label = 'Attention';
  } else if (s === 'red') {
    bg = 'bg-rose-50 text-rose-700 border-rose-200';
    dotBg = 'bg-rose-500';
    label = 'Overdue / Risk';
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${bg} ${className}`}
    >
      {showDot && <span className={`w-1.5 h-1.5 rounded-full ${dotBg}`} />}
      {label}
    </span>
  );
};

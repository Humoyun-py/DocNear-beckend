import React from 'react';
import { AppointmentStatus } from '../../types';
import { Clock, CheckCircle2, AlertCircle, Play, XCircle, UserX, AlertTriangle } from 'lucide-react';

interface StatusBadgeProps {
  status: AppointmentStatus;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const config: Partial<
    Record<
      AppointmentStatus,
      { label: string; bg: string; text: string; border: string; icon: React.ReactNode }
    >
  > = {
    pending: {
      label: 'Pending',
      bg: 'bg-amber-50 dark:bg-amber-950/40',
      text: 'text-amber-700 dark:text-amber-400',
      border: 'border-amber-200 dark:border-amber-800/40',
      icon: <Clock className="w-3.5 h-3.5" />,
    },
    PENDING: {
      label: 'Pending',
      bg: 'bg-amber-50 dark:bg-amber-950/40',
      text: 'text-amber-700 dark:text-amber-400',
      border: 'border-amber-200 dark:border-amber-800/40',
      icon: <Clock className="w-3.5 h-3.5" />,
    },
    confirmed: {
      label: 'Confirmed',
      bg: 'bg-blue-50 dark:bg-blue-950/40',
      text: 'text-blue-700 dark:text-blue-400',
      border: 'border-blue-200 dark:border-blue-800/40',
      icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    },
    CONFIRMED: {
      label: 'Confirmed',
      bg: 'bg-blue-50 dark:bg-blue-950/40',
      text: 'text-blue-700 dark:text-blue-400',
      border: 'border-blue-200 dark:border-blue-800/40',
      icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    },
    waiting: {
      label: 'Waiting',
      bg: 'bg-purple-50 dark:bg-purple-950/40',
      text: 'text-purple-700 dark:text-purple-400',
      border: 'border-purple-200 dark:border-purple-800/40',
      icon: <AlertCircle className="w-3.5 h-3.5" />,
    },
    in_progress: {
      label: 'In Progress',
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
      text: 'text-emerald-700 dark:text-emerald-400',
      border: 'border-emerald-200 dark:border-emerald-800/40',
      icon: <Play className="w-3.5 h-3.5 fill-current" />,
    },
    completed: {
      label: 'Completed',
      bg: 'bg-slate-100 dark:bg-slate-800/60',
      text: 'text-slate-700 dark:text-slate-300',
      border: 'border-slate-200 dark:border-slate-700',
      icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    },
    COMPLETED: {
      label: 'Completed',
      bg: 'bg-slate-100 dark:bg-slate-800/60',
      text: 'text-slate-700 dark:text-slate-300',
      border: 'border-slate-200 dark:border-slate-700',
      icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    },
    cancelled: {
      label: 'Cancelled',
      bg: 'bg-rose-50 dark:bg-rose-950/40',
      text: 'text-rose-700 dark:text-rose-400',
      border: 'border-rose-200 dark:border-rose-800/40',
      icon: <XCircle className="w-3.5 h-3.5" />,
    },
    CANCELLED: {
      label: 'Cancelled',
      bg: 'bg-rose-50 dark:bg-rose-950/40',
      text: 'text-rose-700 dark:text-rose-400',
      border: 'border-rose-200 dark:border-rose-800/40',
      icon: <XCircle className="w-3.5 h-3.5" />,
    },
    rejected: {
      label: 'Declined',
      bg: 'bg-rose-50 dark:bg-rose-950/40',
      text: 'text-rose-700 dark:text-rose-400',
      border: 'border-rose-200 dark:border-rose-800/40',
      icon: <XCircle className="w-3.5 h-3.5" />,
    },
    rescheduled: {
      label: 'Rescheduled',
      bg: 'bg-indigo-50 dark:bg-indigo-950/40',
      text: 'text-indigo-700 dark:text-indigo-400',
      border: 'border-indigo-200 dark:border-indigo-800/40',
      icon: <Clock className="w-3.5 h-3.5" />,
    },
    RESCHEDULED: {
      label: 'Rescheduled',
      bg: 'bg-indigo-50 dark:bg-indigo-950/40',
      text: 'text-indigo-700 dark:text-indigo-400',
      border: 'border-indigo-200 dark:border-indigo-800/40',
      icon: <Clock className="w-3.5 h-3.5" />,
    },
    no_show: {
      label: 'No-show',
      bg: 'bg-slate-100 dark:bg-slate-800/60',
      text: 'text-slate-600 dark:text-slate-400',
      border: 'border-slate-300 dark:border-slate-700',
      icon: <UserX className="w-3.5 h-3.5" />,
    },
  };

  const item = config[status] || {
    label: status,
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
    icon: <AlertTriangle className="w-3.5 h-3.5" />,
  };

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${item.bg} ${item.text} ${item.border} ${sizeClasses} whitespace-nowrap`}
    >
      {item.icon}
      <span>{item.label}</span>
    </span>
  );
};

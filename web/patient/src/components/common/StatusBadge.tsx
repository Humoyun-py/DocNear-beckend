import React from 'react';
import { AppointmentStatus } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { Clock, CheckCircle2, AlertCircle, XCircle, CalendarSync } from 'lucide-react';

interface StatusBadgeProps {
  status?: AppointmentStatus | 'open' | 'closed' | '24_7';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status = 'open', className = '' }) => {
  const { t } = useLanguage();

  const normalized = String(status).toUpperCase();

  switch (normalized) {
    case 'CONFIRMED':
      return (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 ${className}`}
        >
          <CheckCircle2 size={12} className="text-emerald-600 dark:text-emerald-400" />
          {t('statusConfirmed')}
        </span>
      );
    case 'PENDING':
      return (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 ${className}`}
        >
          <Clock size={12} className="text-amber-600 dark:text-amber-400" />
          {t('statusPending')}
        </span>
      );
    case 'COMPLETED':
      return (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 ${className}`}
        >
          <CheckCircle2 size={12} className="text-slate-500 dark:text-slate-400" />
          {t('statusCompleted')}
        </span>
      );
    case 'CANCELLED':
      return (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 ${className}`}
        >
          <XCircle size={12} className="text-rose-500 dark:text-rose-400" />
          {t('statusCancelled')}
        </span>
      );
    case 'RESCHEDULED':
      return (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 ${className}`}
        >
          <CalendarSync size={12} className="text-blue-600 dark:text-blue-400" />
          {t('statusRescheduled') || 'Rescheduled'}
        </span>
      );
    case '24_7':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"></span>
          24/7 {t('emergency24_7Badge')}
        </span>
      );
    case 'OPEN':
      return (
        <span
          className={`inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          {t('openNowBadge')}
        </span>
      );
    case 'CLOSED':
      return (
        <span
          className={`inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
          {t('closedBadge')}
        </span>
      );
    default:
      return null;
  }
};

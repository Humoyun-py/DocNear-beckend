import React from 'react';
import { Inbox, CalendarX, UserX, BellOff, BarChart2, LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  id?: string;
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  id,
  icon: Icon = Inbox,
  title,
  description,
  action,
}) => {
  return (
    <div
      id={id}
      className="flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800"
    >
      <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 mb-4">
        <Icon className="w-8 h-8 stroke-[1.5]" />
      </div>
      <h4 className="text-base font-semibold text-slate-800 dark:text-slate-200">{title}</h4>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mt-1 mb-6 leading-relaxed">
        {description}
      </p>
      {action && (
        <button
          onClick={action.onClick}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 shadow-sm transition-colors"
        >
          {action.icon}
          <span>{action.label}</span>
        </button>
      )}
    </div>
  );
};

export const CalendarEmptyState: React.FC<{ message?: string }> = ({ message }) => (
  <EmptyState
    icon={CalendarX}
    title="No appointments scheduled"
    description={message || "There are no consultation bookings for this selected period."}
  />
);

export const PatientsEmptyState: React.FC = () => (
  <EmptyState
    icon={UserX}
    title="No patient records found"
    description="Try adjusting your search criteria or filter to locate patient profiles."
  />
);

export const NotificationsEmptyState: React.FC = () => (
  <EmptyState
    icon={BellOff}
    title="You're all caught up"
    description="No pending alerts, booking notifications, or clinical announcements."
  />
);

export const AnalyticsEmptyState: React.FC = () => (
  <EmptyState
    icon={BarChart2}
    title="No analytics data available"
    description="Data will aggregate once consultation appointments are completed."
  />
);

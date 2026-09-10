import React, { useState } from 'react';
import {
  Bell,
  CheckCircle2,
  Calendar,
  XCircle,
  AlertTriangle,
  Info,
  CheckCheck,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { useNotificationStore } from '../../store/useNotificationStore';
import { useAppointmentStore } from '../../store/useAppointmentStore';
import { useToastStore } from '../../store/useToastStore';
import { EmptyState } from '../../components/common/EmptyState';
import { NotificationItem } from '../../types';

export const NotificationsPage: React.FC = () => {
  const { notifications, markAsRead, markAllAsRead, unreadCount } = useNotificationStore();
  const { setSelectedAppointmentId } = useAppointmentStore();
  const { addToast } = useToastStore();

  const [activeFilter, setActiveFilter] = useState<'all' | 'unread'>('all');

  const filtered = notifications.filter((n) => {
    if (activeFilter === 'unread') return !n.isRead;
    return true;
  });

  const getIcon = (category: NotificationItem['category']) => {
    switch (category) {
      case 'booking_request':
        return <Calendar className="w-4 h-4 text-blue-600" />;
      case 'confirmed':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case 'cancellation':
        return <XCircle className="w-4 h-4 text-rose-600" />;
      case 'conflict':
        return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      case 'reminder':
      case 'reschedule':
        return <Clock className="w-4 h-4 text-purple-600" />;
      case 'clinic_announcement':
      default:
        return <Info className="w-4 h-4 text-blue-600" />;
    }
  };

  const handleMarkAll = async () => {
    await markAllAsRead();
    addToast({
      type: 'success',
      title: 'Notifications Cleared',
      message: 'All notifications have been marked as read.',
    });
  };

  return (
    <div id="notifications-page-container" className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Clinical Notifications & Alerts
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time updates on appointment bookings, schedule conflicts, and clinic bulletins
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAll}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition-colors self-start sm:self-center"
          >
            <CheckCheck className="w-4 h-4" />
            <span>Mark all as read</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 w-fit">
        <button
          onClick={() => setActiveFilter('all')}
          className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeFilter === 'all'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setActiveFilter('unread')}
          className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeFilter === 'unread'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {/* Notifications List */}
      {filtered.length === 0 ? (
        <EmptyState
          title="No notifications to show"
          description="You are completely caught up with your clinical alerts."
        />
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
          {filtered.map((notif) => (
            <div
              key={notif.id}
              onClick={() => {
                if (!notif.isRead) markAsRead(notif.id);
                if (notif.appointmentId) {
                  setSelectedAppointmentId(notif.appointmentId);
                }
              }}
              className={`p-5 flex items-start justify-between gap-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors ${
                !notif.isRead ? 'bg-blue-50/30 dark:bg-blue-950/20' : ''
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 shrink-0 mt-0.5">
                  {getIcon(notif.category)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      {notif.title}
                    </h4>
                    {!notif.isRead && (
                      <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                    {notif.message}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-[11px] text-slate-400">
                    <span className="font-mono">{notif.timestamp}</span>
                    {notif.appointmentId && (
                      <span className="text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1">
                        <span>View booking</span>
                        <ExternalLink className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {!notif.isRead && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    markAsRead(notif.id);
                  }}
                  className="text-xs text-slate-400 hover:text-blue-600 shrink-0"
                >
                  Mark read
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

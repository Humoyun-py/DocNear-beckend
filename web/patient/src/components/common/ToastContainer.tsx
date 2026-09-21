import React from 'react';
import { useAppointments } from '../../context/AppointmentContext';
import { CheckCircle2, AlertCircle, Info, X, Bell, Calendar, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useAppointments();

  return (
    <div className="fixed top-20 right-4 md:right-6 z-50 flex flex-col gap-2.5 max-w-sm sm:max-w-md w-full pointer-events-none px-2 sm:px-0">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -20, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, y: -15 }}
            className={`pointer-events-auto flex items-start gap-3.5 p-4 rounded-2xl shadow-xl border backdrop-blur-md transition-all ${
              toast.type === 'reminder' || toast.type === 'booking'
                ? 'bg-slate-900/95 text-white border-blue-500/40 shadow-blue-900/30 ring-1 ring-blue-500/30'
                : toast.type === 'success'
                ? 'bg-slate-900/95 text-white border-emerald-500/40 shadow-emerald-900/20'
                : toast.type === 'error'
                ? 'bg-rose-950/95 text-white border-rose-800 shadow-rose-950/40'
                : 'bg-slate-900/95 text-white border-slate-800 shadow-lg'
            }`}
          >
            {/* Icon */}
            <div className="shrink-0 mt-0.5">
              {toast.type === 'reminder' ? (
                <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-400 flex items-center justify-center text-blue-400 animate-pulse">
                  <Bell size={16} />
                </div>
              ) : toast.type === 'booking' ? (
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-emerald-400">
                  <Calendar size={16} />
                </div>
              ) : toast.type === 'success' ? (
                <CheckCircle2 size={20} className="text-emerald-400" />
              ) : toast.type === 'error' ? (
                <AlertCircle size={20} className="text-rose-400" />
              ) : (
                <Info size={20} className="text-blue-400" />
              )}
            </div>

            {/* Body */}
            <div className="flex-1 min-w-0 space-y-1">
              {toast.title && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-xs md:text-sm text-white tracking-tight">
                    {toast.title}
                  </span>
                  {toast.reminderBadge ? (
                    <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded-md uppercase tracking-wider ${
                      toast.reminderBadge.includes('1h')
                        ? 'bg-amber-500 text-slate-950 animate-pulse'
                        : 'bg-blue-500/30 text-blue-300 border border-blue-400/40'
                    }`}>
                      {toast.reminderBadge}
                    </span>
                  ) : toast.type === 'reminder' ? (
                    <span className="px-1.5 py-0.2 bg-blue-500/30 text-blue-300 text-[10px] font-bold rounded-md">
                      Upcoming
                    </span>
                  ) : null}
                </div>
              )}
              <p className="text-xs text-slate-200 leading-relaxed font-medium">
                {toast.message}
              </p>

              {toast.link && (
                <div className="pt-1">
                  <Link
                    to={toast.link}
                    onClick={() => dismissToast(toast.id)}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <span>View Booking Details</span>
                    <ArrowRight size={12} />
                  </Link>
                </div>
              )}
            </div>

            {/* Dismiss */}
            <button
              onClick={() => dismissToast(toast.id)}
              className="text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0 p-1 -mr-1 -mt-1"
            >
              <X size={16} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};


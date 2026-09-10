import React, { useState, useEffect } from 'react';
import { Appointment } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import {
  Bell,
  BellRing,
  Clock,
  MapPin,
  Phone,
  Navigation,
  Sparkles,
  X,
  CheckCircle2,
  AlertTriangle,
  Volume2,
  Smartphone,
  ExternalLink,
} from 'lucide-react';

interface AppointmentReminderAlertProps {
  appointments: Appointment[];
  onDismiss?: () => void;
}

export const AppointmentReminderAlert: React.FC<AppointmentReminderAlertProps> = ({
  appointments,
}) => {
  const { t } = useLanguage();
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const [showSimulatedPush, setShowSimulatedPush] = useState<boolean>(false);
  const [isReminderEnabled, setIsReminderEnabled] = useState<boolean>(true);
  const [activeAlertAppt, setActiveAlertAppt] = useState<Appointment | null>(null);

  // Find the closest upcoming confirmed/pending appointment
  useEffect(() => {
    const upcoming = appointments.filter(
      (a) => a.status === 'Confirmed' || a.status === 'Pending'
    );
    if (upcoming.length > 0) {
      setActiveAlertAppt(upcoming[0]);
    } else {
      setActiveAlertAppt(null);
    }
  }, [appointments]);

  if (!activeAlertAppt || isDismissed) {
    return null;
  }

  const handleTestMockPushNotification = () => {
    // Play a gentle audio chime using Web Audio API if supported
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      }
    } catch {
      // Audio context might be restricted before user gesture
    }

    // Trigger mock push notification overlay
    setShowSimulatedPush(true);
  };

  // Compute 1-hour before time string
  const getOneHourBeforeTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    if (isNaN(hours)) return '1 soat oldin';
    const prevHour = hours > 0 ? hours - 1 : 23;
    return `${prevHour.toString().padStart(2, '0')}:${(minutes || 0).toString().padStart(2, '0')}`;
  };

  return (
    <>
      {/* SIMULATED MOBILE / BROWSER PUSH NOTIFICATION POPUP */}
      {showSimulatedPush && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4 animate-in fade-in slide-in-from-top-6 duration-300">
          <div className="bg-slate-900/95 backdrop-blur-xl text-white rounded-3xl p-4 shadow-2xl border border-slate-700/60 ring-1 ring-white/10 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md">
                  <BellRing size={16} className="animate-bounce" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold tracking-wide text-blue-400">
                      DocNear Medical
                    </span>
                    <span className="text-[10px] text-slate-400">1m ago</span>
                  </div>
                  <h4 className="text-sm font-bold text-white">
                    {t('appointmentReminderTitle')}
                  </h4>
                </div>
              </div>
              <button
                onClick={() => setShowSimulatedPush(false)}
                className="w-6 h-6 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
                aria-label="Close notification"
              >
                <X size={12} />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed pl-10">
              Dr. {activeAlertAppt.doctorName} bilan qabulingiz <strong>{activeAlertAppt.time}</strong> da ({activeAlertAppt.clinicName}) boshlanadi. Iltimos, 10 daqiqa oldin yetib keling.
            </p>

            <div className="flex items-center gap-2 pl-10 pt-1">
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  activeAlertAppt.clinicName
                )}`}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
              >
                <Navigation size={12} />
                <span>{t('getDirections')}</span>
              </a>
              <button
                onClick={() => setShowSimulatedPush(false)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-colors cursor-pointer"
              >
                {t('dismiss')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PROMINENT 1-HOUR REMINDER BANNER IN APPOINTMENTS VIEW */}
      <div
        id="appointment-1hr-reminder-alert"
        className="bg-gradient-to-r from-amber-500/10 via-blue-500/10 to-indigo-500/10 dark:from-amber-950/20 dark:via-blue-950/20 dark:to-indigo-950/20 border border-amber-300/80 dark:border-amber-800/60 rounded-3xl p-5 md:p-6 shadow-xs space-y-4 relative overflow-hidden transition-colors duration-200"
      >
        {/* Glow accent */}
        <div className="absolute -right-12 -bottom-12 w-40 h-40 bg-amber-400/20 dark:bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="relative shrink-0 mt-0.5">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
                <BellRing size={22} className="animate-pulse" />
              </div>
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-rose-500 border-2 border-white dark:border-slate-900"></span>
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-white text-[11px] font-extrabold uppercase tracking-wide shadow-2xs">
                  {t('appointmentReminderTitle')}
                </span>
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                  <Clock size={12} className="text-amber-600 dark:text-amber-400" />
                  <span>Qabul vaqti: {activeAlertAppt.date} — {activeAlertAppt.time}</span>
                </span>
              </div>

              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                Dr. {activeAlertAppt.doctorName} — {activeAlertAppt.clinicName}
              </h3>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
                Tizim qabulingizdan <strong>1 soat oldin ({getOneHourBeforeTime(activeAlertAppt.time)})</strong> eslatma bildirishnomasini yuboradi. Shifokor qabuliga kechikmaslik uchun yo‘nalish va transport vaqtini oldindan hisoblang.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
            <button
              onClick={() => setIsDismissed(true)}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title={t('dismiss')}
              aria-label="Dismiss 1-hour alert"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Action bar */}
        <div className="pt-2 border-t border-amber-200/60 dark:border-amber-800/50 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            {/* Get directions button */}
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                activeAlertAppt.clinicName
              )}`}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-xs flex items-center gap-1.5"
            >
              <Navigation size={14} />
              <span>{t('getDirections')}</span>
            </a>

            {/* Test 1-hour push notification */}
            <button
              onClick={handleTestMockPushNotification}
              className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
            >
              <Smartphone size={14} className="text-indigo-600 dark:text-indigo-400" />
              <span>{t('testNotification')}</span>
            </button>
          </div>

          {/* Toggle status indicator */}
          <div className="flex items-center gap-2 bg-white/80 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-amber-200 dark:border-amber-800 text-slate-700 dark:text-slate-200 font-semibold">
            <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400" />
            <span>{t('reminderEnabled')} (SMS + Push)</span>
          </div>
        </div>
      </div>
    </>
  );
};

import React, { useEffect, useState } from 'react';
import { useAppointmentStore } from '../../store/useAppointmentStore';
import { Play, CheckCircle2, User, Clock, AlertCircle, FastForward } from 'lucide-react';
import { calculateEndTime } from '../../utils/time';

export const ActiveTimerBanner: React.FC = () => {
  const {
    activeConsultation,
    tickConsultationTimer,
    setCompleteTarget,
    appointments,
    fastForwardToEndTime,
  } = useAppointmentStore();

  const [showCountdown, setShowCountdown] = useState<boolean>(true);

  useEffect(() => {
    if (!activeConsultation?.isRunning) return;
    const interval = setInterval(() => {
      tickConsultationTimer();
    }, 1000);
    return () => clearInterval(interval);
  }, [activeConsultation?.isRunning, tickConsultationTimer]);

  if (!activeConsultation) return null;

  const activeApt = appointments.find((a) => a.id === activeConsultation.appointmentId);
  const durationMinutes = activeConsultation.durationMinutes || activeApt?.durationMinutes || 30;
  const targetTotalSeconds = durationMinutes * 60;
  const elapsedSeconds = activeConsultation.elapsedSeconds;
  const remainingSeconds = Math.max(0, targetTotalSeconds - elapsedSeconds);
  const isTimeReached = elapsedSeconds >= targetTotalSeconds;

  // Format mm:ss
  const elapsedM = Math.floor(elapsedSeconds / 60);
  const elapsedS = elapsedSeconds % 60;
  const formattedElapsed = `${String(elapsedM).padStart(2, '0')}:${String(elapsedS).padStart(2, '0')}`;

  const remainingM = Math.floor(remainingSeconds / 60);
  const remainingS = remainingSeconds % 60;
  const formattedRemaining = `${String(remainingM).padStart(2, '0')}:${String(remainingS).padStart(2, '0')}`;

  const scheduledStart = activeConsultation.scheduledTime || activeApt?.time || '09:00';
  const scheduledEnd = calculateEndTime(scheduledStart, durationMinutes);

  const progressPercent = Math.min(100, Math.round((elapsedSeconds / targetTotalSeconds) * 100));

  return (
    <div
      id="active-consultation-bar"
      className={`${
        isTimeReached
          ? 'bg-amber-600 dark:bg-amber-700 border-amber-500'
          : 'bg-emerald-600 dark:bg-emerald-700 border-emerald-500'
      } text-white px-4 py-3 shadow-md border-b transition-all duration-300 relative z-30`}
    >
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Patient & Consultation Info */}
        <div className="flex items-center gap-3">
          <span className="relative flex h-3 w-3 shrink-0">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isTimeReached ? 'bg-amber-200' : 'bg-white'
              }`}
            ></span>
            <span
              className={`relative inline-flex rounded-full h-3 w-3 ${
                isTimeReached ? 'bg-amber-100' : 'bg-white'
              }`}
            ></span>
          </span>

          <div className="flex items-center gap-2 text-sm font-semibold flex-wrap">
            <Play className="w-4 h-4 fill-white shrink-0" />
            <span>Consultation In Progress:</span>
            <span className="underline underline-offset-2 flex items-center gap-1 font-bold">
              <User className="w-3.5 h-3.5" />
              {activeConsultation.patientName}
            </span>
          </div>

          <div className="hidden md:flex items-center gap-2.5 text-xs opacity-90 border-l border-white/25 pl-3">
            <span>
              Scheduled: <strong>{scheduledStart} - {scheduledEnd}</strong> ({durationMinutes} min)
            </span>
            <span>•</span>
            <span className="truncate max-w-[150px]">{activeConsultation.type}</span>
          </div>
        </div>

        {/* Timers and Action Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          {isTimeReached ? (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-800/90 text-amber-100 text-xs font-bold animate-pulse">
              <AlertCircle className="w-4 h-4 text-amber-300 shrink-0" />
              <span>Scheduled Time Reached ({durationMinutes}m)</span>
            </div>
          ) : (
            <div
              onClick={() => setShowCountdown(!showCountdown)}
              className="flex items-center gap-2 bg-emerald-800/80 hover:bg-emerald-800 px-3 py-1 rounded-lg font-mono text-xs sm:text-sm font-bold tracking-wider cursor-pointer select-none transition-colors"
              title="Click to toggle Elapsed / Remaining time"
            >
              <Clock className="w-4 h-4 text-emerald-200 shrink-0" />
              <span>
                {showCountdown ? `Remaining: ${formattedRemaining}` : `Elapsed: ${formattedElapsed}`}
              </span>
              <span className="text-[10px] text-emerald-200/80 font-normal ml-1">
                ({progressPercent}%)
              </span>
            </div>
          )}


          <button
            id="bar-complete-appointment-btn"
            type="button"
            onClick={() => {
              if (activeApt) {
                setCompleteTarget(activeApt);
              }
            }}
            className={`flex items-center gap-1.5 px-4 py-1.5 font-bold text-xs rounded-lg shadow-sm transition-all ${
              isTimeReached
                ? 'bg-white text-amber-900 hover:bg-amber-50 ring-2 ring-white/50'
                : 'bg-white text-emerald-800 hover:bg-emerald-50'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            <span>Complete Consultation</span>
          </button>
        </div>
      </div>

      {/* Subtle Progress Bar */}
      <div className="w-full bg-black/20 h-1 absolute bottom-0 left-0">
        <div
          className={`h-full transition-all duration-1000 ${
            isTimeReached ? 'bg-amber-300' : 'bg-white'
          }`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
};

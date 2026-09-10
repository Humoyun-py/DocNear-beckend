import { today, upcomingDays } from '../../utils/calendar';
import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  Coffee,
  AlertTriangle,
  Lock,
  CheckCircle2,
  Trash2,
  Sliders,
  ChevronLeft,
  ChevronRight,
  Eye,
  ShieldCheck,
  CalendarCheck,
  Sparkles,
} from 'lucide-react';
import { useScheduleStore } from '../../store/useScheduleStore';
import { useAppointmentStore } from '../../store/useAppointmentStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useToastStore } from '../../store/useToastStore';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import { doctorScheduleService } from '../../services/doctorScheduleService';

export const SchedulePage: React.FC = () => {
  const {
    workingHours,
    blockedSlots,
    settings,
    updateWorkingHours,
    updateSettings,
    addBlockedSlot,
    removeBlockedSlot,
  } = useScheduleStore();

  const { appointments, setSelectedAppointmentId } = useAppointmentStore();
  const { profile } = useAuthStore();
  const { addToast } = useToastStore();

  const [activeView, setActiveView] = useState<'week' | 'day' | 'preview' | 'settings'>('week');
  const [selectedDate, setSelectedDate] = useState(today()); // Current Saturday
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);

  // Form states for blocking time
  const [blockDate, setBlockDate] = useState(today());
  const [blockStart, setBlockStart] = useState('14:00');
  const [blockEnd, setBlockEnd] = useState('15:30');
  const [blockReason, setBlockReason] = useState('Lunch break');
  const [customNote, setCustomNote] = useState('');

  // Preview tab states
  const [previewDate, setPreviewDate] = useState('2026-09-08');
  const [previewSlots, setPreviewSlots] = useState<string[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  // Fetch slots whenever previewDate changes or when opening preview
  useEffect(() => {
    let isMounted = true;
    async function loadSlots() {
      setIsLoadingSlots(true);
      const slots = await doctorScheduleService.getAvailableSlots(previewDate);
      if (isMounted) {
        setPreviewSlots(slots);
        setIsLoadingSlots(false);
      }
    }
    loadSlots();
    return () => {
      isMounted = false;
    };
  }, [previewDate, settings.defaultDurationMinutes, blockedSlots]);

  const handleBlockSlotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalReason = customNote ? `${blockReason}: ${customNote}` : blockReason;

    const success = await addBlockedSlot({
      date: blockDate,
      startTime: blockStart,
      endTime: blockEnd,
      reason: finalReason,
      type: 'blocked',
    });

    if (success) {
      addToast({
        type: 'success',
        title: 'Time Slot Blocked',
        message: `${blockDate} (${blockStart} - ${blockEnd}) blocked successfully.`,
      });
      setIsBlockModalOpen(false);
      setCustomNote('');
    }
  };

  const handleQuickAddLunchBreak = async () => {
    const success = await addBlockedSlot({
      date: selectedDate,
      startTime: '13:00',
      endTime: '14:00',
      reason: 'Lunch break (13:00 - 14:00)',
      type: 'break',
    });
    if (success) {
      addToast({
        type: 'success',
        title: 'Lunch Break Reserved',
        message: `Reserved 13:00 - 14:00 break on ${selectedDate}.`,
      });
    }
  };

  // Days of current reference week (Sep 1 to Sep 7, 2026)
  const weekDays = upcomingDays();

  return (
    <div id="schedule-page-container" className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Clinical Schedule Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Configure working hours, breaks, slot durations, and sync with patient bookings
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleQuickAddLunchBreak}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-semibold rounded-xl transition-colors"
          >
            <Coffee className="w-3.5 h-3.5" />
            <span>Add Lunch Break (13:00 - 14:00)</span>
          </button>
          <button
            id="block-time-button"
            onClick={() => setIsBlockModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Block Time / Date</span>
          </button>
        </div>
      </div>

      {/* Booking Acceptance Switch Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${
            settings.isAcceptingNewBookings ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60' : 'bg-rose-50 text-rose-600'
          }`}>
            <CalendarCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-slate-900 dark:text-white block text-sm">
              Accepting New Patient Bookings
            </span>
            <span className="text-slate-500">
              {settings.isAcceptingNewBookings
                ? 'Your profile is live on DocNear. Patients can book available slots in real-time.'
                : 'Bookings paused. New patient slots are hidden on the patient portal.'}
            </span>
          </div>
        </div>

        <button
          onClick={() => {
            const next = !settings.isAcceptingNewBookings;
            updateSettings({ isAcceptingNewBookings: next });
            addToast({
              type: next ? 'success' : 'warning',
              title: next ? 'Bookings Resumed' : 'Bookings Paused',
              message: next ? 'Patients can now book available slots.' : 'No new patient requests will be accepted.',
            });
          }}
          className={`px-4 py-2 rounded-xl font-bold text-xs transition-colors ${
            settings.isAcceptingNewBookings
              ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs'
              : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300'
          }`}
        >
          {settings.isAcceptingNewBookings ? 'Status: Accepting (ON)' : 'Status: Paused (OFF)'}
        </button>
      </div>

      {/* View Switcher Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setActiveView('week')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeView === 'week'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Week View
          </button>
          <button
            onClick={() => setActiveView('day')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeView === 'day'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Day View
          </button>
          <button
            onClick={() => setActiveView('preview')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeView === 'preview'
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Booking Slots Preview</span>
          </button>
          <button
            onClick={() => setActiveView('settings')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeView === 'settings'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Working Days & Hours</span>
          </button>
        </div>

        <span className="text-xs font-mono font-semibold bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
          Slot Duration: {settings.defaultDurationMinutes} mins
        </span>
      </div>

      {/* 1. WEEK VIEW */}
      {activeView === 'week' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-7 border-b border-slate-100 dark:border-slate-800 divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-slate-800">
            {weekDays.map((day) => {
              const dayApts = appointments.filter((a) => a.date === day.date);
              const dayBlocks = blockedSlots.filter((b) => b.date === day.date);
              const isToday = day.date === today();

              return (
                <div key={day.date} className="min-h-[480px] p-3 flex flex-col">
                  <div
                    className={`p-2.5 rounded-xl mb-3 text-center transition-colors ${
                      isToday
                        ? 'bg-blue-600 text-white font-bold'
                        : 'bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <div className="text-[11px] uppercase tracking-wider">{day.dayShort}</div>
                    <div className="text-lg font-mono font-black">{day.num}</div>
                    {isToday && (
                      <span className="inline-block mt-0.5 text-[9px] bg-white text-blue-700 px-1.5 rounded font-sans font-bold">
                        TODAY
                      </span>
                    )}
                  </div>

                  <div className="space-y-2 flex-1">
                    {/* Blocks / Breaks */}
                    {dayBlocks.map((blk) => (
                      <div
                        key={blk.id}
                        className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-[11px]"
                      >
                        <div className="flex items-center justify-between font-mono font-semibold">
                          <span>{blk.startTime} - {blk.endTime}</span>
                          <button
                            onClick={() => removeBlockedSlot(blk.id)}
                            className="text-amber-700 hover:text-rose-600 ml-1"
                            title="Remove block"
                          >
                            ×
                          </button>
                        </div>
                        <div className="truncate font-medium">{blk.reason}</div>
                      </div>
                    ))}

                    {/* Appointments */}
                    {dayApts.map((apt) => (
                      <div
                        key={apt.id}
                        onClick={() => setSelectedAppointmentId(apt.id)}
                        className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-500 cursor-pointer text-xs space-y-1 transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                            {apt.time}
                          </span>
                          <StatusBadge status={apt.status} size="sm" />
                        </div>
                        <div className="font-semibold text-slate-900 dark:text-white truncate">
                          {apt.patientName}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {apt.bookingCode}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. DAY VIEW */}
      {activeView === 'day' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono font-bold"
              />
              <span className="text-xs text-slate-500">Day View Schedule</span>
            </div>
            <button
              onClick={() => setIsBlockModalOpen(true)}
              className="text-xs font-semibold text-blue-600 hover:underline"
            >
              + Block Time on this Date
            </button>
          </div>

          <div className="space-y-2">
            {appointments.filter((a) => a.date === selectedDate).length === 0 &&
            blockedSlots.filter((b) => b.date === selectedDate).length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No appointments or reserved blocks on this date.
              </div>
            ) : (
              [
                ...appointments.filter((a) => a.date === selectedDate).map((a) => ({ kind: 'apt', ...a })),
                ...blockedSlots.filter((b) => b.date === selectedDate).map((b) => ({ kind: 'block', ...b })),
              ].map((item: any, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold w-16">{item.time || item.startTime}</span>
                    <span className="font-semibold">{item.patientName || item.reason}</span>
                    {item.bookingCode && (
                      <span className="font-mono text-[11px] text-blue-600 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded">
                        {item.bookingCode}
                      </span>
                    )}
                  </div>
                  {item.status && <StatusBadge status={item.status} size="sm" />}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 3. PREVIEW AVAILABLE BOOKING SLOTS VIEW (Requested Feature) */}
      {activeView === 'preview' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Live Available Booking Slots Preview
                </h3>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold">
                  Patient Portal Sync View
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Rule verified: Only completely free, non-conflicting slots within working hours are displayed to users.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Date:</label>
              <input
                type="date"
                value={previewDate}
                min="2026-09-01"
                onChange={(e) => setPreviewDate(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono font-bold text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 flex items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2 text-blue-900 dark:text-blue-200">
              <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                Availability for <strong>{previewDate}</strong> with consultation duration of <strong>{settings.defaultDurationMinutes} minutes</strong>.
              </span>
            </div>
            <span className="font-mono font-bold text-blue-700 dark:text-blue-300">
              {previewSlots.length} open slots
            </span>
          </div>

          {isLoadingSlots ? (
            <div className="p-12 text-center text-xs text-slate-400">Computing available slots...</div>
          ) : previewSlots.length === 0 ? (
            <div className="p-12 text-center bg-slate-50 dark:bg-slate-800/40 rounded-xl text-slate-500 text-xs space-y-2">
              <p className="font-semibold text-slate-700 dark:text-slate-300">No open booking slots on this date.</p>
              <p className="text-[11px]">Check if this day is marked as day off, or if all hours are occupied by appointments and breaks.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2.5">
              {previewSlots.map((slot) => (
                <div
                  key={slot}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-center font-mono font-bold text-xs text-slate-800 dark:text-slate-200 hover:border-blue-500 hover:text-blue-600 transition-colors"
                >
                  <Clock className="w-3.5 h-3.5 mx-auto mb-1 text-emerald-600" />
                  {slot}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. SETTINGS VIEW (Working Days, Hours & Parameters) */}
      {activeView === 'settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Weekly Working Days Table */}
          <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Working Days & Hours (Monday - Sunday)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Set active working days and start / end shift hours
              </p>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {workingHours.map((wh) => (
                <div
                  key={wh.dayOfWeek}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="w-32 font-bold text-slate-800 dark:text-slate-200 capitalize">
                    {wh.dayOfWeek}
                  </div>

                  <div className="flex items-center gap-4 flex-wrap">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={wh.isActive}
                        onChange={(e) => {
                          const updated = workingHours.map((w) =>
                            w.dayOfWeek === wh.dayOfWeek ? { ...w, isActive: e.target.checked } : w
                          );
                          updateWorkingHours(updated);
                        }}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span className="font-medium text-slate-600 dark:text-slate-400">
                        {wh.isActive ? 'Active Shift' : 'Day Off'}
                      </span>
                    </label>

                    {wh.isActive && (
                      <div className="flex items-center gap-2">
                        <input
                          type="time"
                          value={wh.startTime}
                          onChange={(e) => {
                            const updated = workingHours.map((w) =>
                              w.dayOfWeek === wh.dayOfWeek ? { ...w, startTime: e.target.value } : w
                            );
                            updateWorkingHours(updated);
                          }}
                          className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
                        />
                        <span>to</span>
                        <input
                          type="time"
                          value={wh.endTime}
                          onChange={(e) => {
                            const updated = workingHours.map((w) =>
                              w.dayOfWeek === wh.dayOfWeek ? { ...w, endTime: e.target.value } : w
                            );
                            updateWorkingHours(updated);
                          }}
                          className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Consultation Parameters (Duration: 15, 20, 30, 45, 60 minutes) */}
          <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Consultation Parameters
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Regulate duration (15, 20, 30, 45, 60 mins) and buffers
              </p>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Consultation Duration
                </label>
                <select
                  value={settings.defaultDurationMinutes}
                  onChange={(e) =>
                    updateSettings({ defaultDurationMinutes: Number(e.target.value) as any })
                  }
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                >
                  <option value={15}>15 Minutes</option>
                  <option value={20}>20 Minutes</option>
                  <option value={30}>30 Minutes</option>
                  <option value={45}>45 Minutes</option>
                  <option value={60}>60 Minutes</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Buffer Between Appointments
                </label>
                <select
                  value={settings.bufferMinutes}
                  onChange={(e) => updateSettings({ bufferMinutes: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                >
                  <option value={0}>0 Minutes (Immediate next)</option>
                  <option value={5}>5 Minutes (Documentation)</option>
                  <option value={10}>10 Minutes (Standard buffer)</option>
                  <option value={15}>15 Minutes (Sanitization)</option>
                </select>
              </div>

              <div className="pt-2">
                <button
                  onClick={() =>
                    addToast({
                      type: 'success',
                      title: 'Parameters Updated',
                      message: 'Schedule configuration saved.',
                    })
                  }
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors shadow-xs"
                >
                  Save Configuration
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Block Time / Add Break Modal */}
      <Modal
        isOpen={isBlockModalOpen}
        onClose={() => setIsBlockModalOpen(false)}
        title="Block Time or Add Break"
        subtitle="Prevent patient bookings during dedicated clinical commitments"
        maxWidth="md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsBlockModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="block-time-form"
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs"
            >
              Confirm Block
            </button>
          </>
        }
      >
        <form id="block-time-form" onSubmit={handleBlockSlotSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Date to Block
            </label>
            <input
              type="date"
              required
              value={blockDate}
              onChange={(e) => setBlockDate(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Start Time
              </label>
              <input
                type="time"
                required
                value={blockStart}
                onChange={(e) => setBlockStart(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                End Time
              </label>
              <input
                type="time"
                required
                value={blockEnd}
                onChange={(e) => setBlockEnd(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Category
            </label>
            <div className="grid grid-cols-2 gap-2">
              {['Lunch break', 'Surgery', 'Conference', 'Personal leave'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setBlockReason(cat)}
                  className={`p-2 rounded-xl border text-center font-medium transition-all ${
                    blockReason === cat
                      ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-600 text-blue-700 dark:text-blue-300 font-bold'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Optional Note
            </label>
            <input
              type="text"
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              placeholder="e.g. Daily staff lunch & review"
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

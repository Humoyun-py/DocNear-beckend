import { today, upcomingDays } from '../../utils/calendar';
import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useAppointmentStore } from '../../store/useAppointmentStore';
import { useToastStore } from '../../store/useToastStore';
import { Calendar, Clock } from 'lucide-react';

export const RescheduleAppointmentModal: React.FC = () => {
  const { rescheduleTarget, setRescheduleTarget, rescheduleAppointment, appointments } =
    useAppointmentStore();
  const { addToast } = useToastStore();

  const [newDate, setNewDate] = useState<string>('2026-09-07');
  const [selectedSlot, setSelectedSlot] = useState<string>('10:00');
  const [reason, setReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!rescheduleTarget) return null;

  // Potential daily slots
  const dailySlots = [
    '09:00',
    '09:45',
    '10:30',
    '11:15',
    '14:00',
    '14:45',
    '15:30',
    '16:15',
    '17:00',
  ];

  // Check if slot is taken on the selected date
  const isSlotBooked = (slotTime: string) => {
    return appointments.some(
      (a) =>
        a.date === newDate &&
        a.time === slotTime &&
        a.id !== rescheduleTarget.id &&
        a.status !== 'cancelled' &&
        a.status !== 'rejected'
    );
  };

  const handleReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) return;

    setIsSubmitting(true);
    await rescheduleAppointment(rescheduleTarget.id, newDate, selectedSlot, reason);
    addToast({
      type: 'success',
      title: 'Appointment Rescheduled',
      message: `Updated to ${newDate} at ${selectedSlot} for ${rescheduleTarget.patientName}.`,
    });
    setIsSubmitting(false);
    setRescheduleTarget(null);
  };

  return (
    <Modal
      isOpen={Boolean(rescheduleTarget)}
      onClose={() => setRescheduleTarget(null)}
      title="Reschedule Appointment"
      subtitle={`Patient: ${rescheduleTarget.patientName} (${rescheduleTarget.type})`}
      maxWidth="md"
      footer={
        <>
          <button
            type="button"
            onClick={() => setRescheduleTarget(null)}
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            id="confirm-reschedule-button"
            type="submit"
            form="reschedule-form"
            disabled={isSubmitting || !selectedSlot}
            className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl transition-colors shadow-xs"
          >
            {isSubmitting ? 'Rescheduling...' : 'Confirm Reschedule'}
          </button>
        </>
      }
    >
      <form id="reschedule-form" onSubmit={handleReschedule} className="space-y-4">
        {/* Current Info */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-1 text-xs">
          <div className="font-semibold text-slate-700 dark:text-slate-300">Current Booking:</div>
          <div className="flex items-center gap-4 text-slate-600 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {rescheduleTarget.date}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {rescheduleTarget.time} ({rescheduleTarget.durationMinutes} min)
            </span>
          </div>
        </div>

        {/* Date Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wide">
            Select New Date
          </label>
          <input
            type="date"
            min={today()}
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            className="w-full text-sm p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Available Time Slots */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wide">
            Available Consultation Times
          </label>
          <div className="grid grid-cols-3 gap-2">
            {dailySlots.map((slot) => {
              const booked = isSlotBooked(slot);
              const isSelected = selectedSlot === slot;
              return (
                <button
                  key={slot}
                  type="button"
                  disabled={booked}
                  onClick={() => setSelectedSlot(slot)}
                  className={`py-2 px-3 text-xs font-medium rounded-xl border transition-all ${
                    booked
                      ? 'bg-slate-100 dark:bg-slate-800/40 text-slate-400 border-slate-200/50 dark:border-slate-800 cursor-not-allowed line-through'
                      : isSelected
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500'
                  }`}
                >
                  {slot} {booked && '(Booked)'}
                </button>
              );
            })}
          </div>
        </div>

        {/* Optional reason */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wide">
            Rescheduling Note (Optional)
          </label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Moved to morning per patient request"
            className="w-full text-sm p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </form>
    </Modal>
  );
};

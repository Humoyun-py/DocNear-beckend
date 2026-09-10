import React from 'react';
import { Modal } from '../common/Modal';
import { useScheduleStore } from '../../store/useScheduleStore';
import { useToastStore } from '../../store/useToastStore';
import { AlertTriangle, Calendar, Clock, User } from 'lucide-react';

export const ScheduleConflictModal: React.FC = () => {
  const { conflictModalData, closeConflictModal, forceAddBlockedSlot } = useScheduleStore();
  const { addToast } = useToastStore();

  const { isOpen, slotData, affectedAppointment } = conflictModalData;

  if (!isOpen || !affectedAppointment || !slotData) return null;

  const handleForceOverride = async () => {
    await forceAddBlockedSlot(slotData);
    addToast({
      type: 'warning',
      title: 'Time Slot Blocked with Existing Booking',
      message: `Attention: ${affectedAppointment.patientName} will require clinical rescheduling.`,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeConflictModal}
      title="Schedule Conflict Detected"
      maxWidth="md"
      footer={
        <>
          <button
            type="button"
            onClick={closeConflictModal}
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            Cancel Block Request
          </button>
          <button
            id="force-block-button"
            type="button"
            onClick={handleForceOverride}
            className="px-4 py-2 text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-colors shadow-xs"
          >
            Block Anyway & Flag Overlap
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800/50 text-amber-900 dark:text-amber-200 text-xs leading-relaxed">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold block mb-0.5">Existing Patient Booking Overlap</span>
            The requested block range ({slotData.startTime} - {slotData.endTime}) conflicts with an active
            patient consultation. DocNear protects patients from silent scheduling cancellations.
          </div>
        </div>

        {/* Affected Appointment Details Card */}
        <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2.5">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Affected Appointment
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
              <User className="w-4 h-4 text-blue-600" />
              <span>{affectedAppointment.patientName}</span>
            </div>
            <span className="text-xs font-mono bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded">
              {affectedAppointment.bookingCode}
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-400 pt-1">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {affectedAppointment.time} ({affectedAppointment.durationMinutes} min)
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {affectedAppointment.date}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 italic">
            Type: {affectedAppointment.type}
          </p>
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400">
          Reason for requested block: <strong>{slotData.reason}</strong>
        </div>
      </div>
    </Modal>
  );
};

import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Appointment } from '../../types';
import { useAppointmentStore } from '../../store/useAppointmentStore';
import { useToastStore } from '../../store/useToastStore';
import { XCircle, AlertTriangle } from 'lucide-react';

interface RejectAppointmentModalProps {
  appointment: Appointment | null;
  isOpen: boolean;
  onClose: () => void;
}

export const RejectAppointmentModal: React.FC<RejectAppointmentModalProps> = ({
  appointment,
  isOpen,
  onClose,
}) => {
  const { rejectRequest } = useAppointmentStore();
  const { addToast } = useToastStore();

  const [reasonCategory, setReasonCategory] = useState('Doctor unavailable at requested time');
  const [detailedNote, setDetailedNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!appointment) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalReason = detailedNote ? `${reasonCategory}: ${detailedNote}` : reasonCategory;

    setIsSubmitting(true);
    await rejectRequest(appointment.id, finalReason);
    addToast({
      type: 'warning',
      title: 'Booking Request Declined',
      message: `Booking ${appointment.bookingCode} for ${appointment.patientName} was declined.`,
    });
    setIsSubmitting(false);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Decline Booking Request"
      subtitle={`Booking ID: ${appointment.bookingCode} • ${appointment.patientName}`}
      maxWidth="md"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            Go Back
          </button>
          <button
            type="submit"
            form="reject-booking-form"
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-xl transition-colors shadow-xs"
          >
            {isSubmitting ? 'Declining...' : 'Confirm & Decline'}
          </button>
        </>
      }
    >
      <form id="reject-booking-form" onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-900/40 flex items-start gap-2.5 text-rose-800 dark:text-rose-300">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block">A reason is required to decline this booking</span>
            The patient will receive an immediate notification in their portal with the explanation provided below.
          </div>
        </div>

        <div>
          <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
            Primary Reason:
          </label>
          <select
            value={reasonCategory}
            onChange={(e) => setReasonCategory(e.target.value)}
            className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-rose-500 focus:outline-none"
            required
          >
            <option value="Doctor unavailable at requested time">Doctor unavailable at requested time</option>
            <option value="Schedule emergency / clinical duty">Schedule emergency / clinical duty</option>
            <option value="Patient condition requires different specialty">Patient condition requires different specialty</option>
            <option value="Outside clinic operating hours">Outside clinic operating hours</option>
            <option value="Slot already reserved by prior walk-in">Slot already reserved by prior walk-in</option>
            <option value="Other administrative reason">Other administrative reason</option>
          </select>
        </div>

        <div>
          <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
            Additional Note to Patient (Optional):
          </label>
          <textarea
            rows={3}
            value={detailedNote}
            onChange={(e) => setDetailedNote(e.target.value)}
            placeholder="Please consider choosing another available slot on Wednesday afternoon..."
            className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-rose-500 focus:outline-none resize-none"
          />
        </div>
      </form>
    </Modal>
  );
};

import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useAppointmentStore } from '../../store/useAppointmentStore';
import { useToastStore } from '../../store/useToastStore';
import { AlertCircle } from 'lucide-react';

export const CancelAppointmentModal: React.FC = () => {
  const { cancelTarget, setCancelTarget, cancelAppointment } = useAppointmentStore();
  const { addToast } = useToastStore();

  const [reasonCategory, setReasonCategory] = useState<string>('Doctor unavailable');
  const [detailedReason, setDetailedReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!cancelTarget) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const finalReason = detailedReason
      ? `${reasonCategory}: ${detailedReason}`
      : reasonCategory;

    await cancelAppointment(cancelTarget.id, finalReason);
    addToast({
      type: 'warning',
      title: 'Appointment Cancelled',
      message: `Appointment with ${cancelTarget.patientName} was successfully cancelled.`,
    });
    setIsSubmitting(false);
    setCancelTarget(null);
  };

  return (
    <Modal
      isOpen={Boolean(cancelTarget)}
      onClose={() => setCancelTarget(null)}
      title="Cancel Appointment"
      subtitle={`Booking ID: ${cancelTarget.bookingCode} • ${cancelTarget.patientName}`}
      maxWidth="md"
      footer={
        <>
          <button
            type="button"
            onClick={() => setCancelTarget(null)}
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            Keep Appointment
          </button>
          <button
            id="confirm-cancellation-button"
            type="submit"
            form="cancel-appointment-form"
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-xl transition-colors shadow-xs"
          >
            {isSubmitting ? 'Cancelling...' : 'Confirm Cancellation'}
          </button>
        </>
      }
    >
      <form id="cancel-appointment-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-start gap-3 p-3.5 bg-rose-50 dark:bg-rose-950/30 rounded-xl border border-rose-100 dark:border-rose-900/40 text-rose-800 dark:text-rose-300 text-xs leading-relaxed">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
          <span>
            Please provide a clinical or operational cancellation reason. The DocNear platform will notify
            the patient and prompt them to select an alternative slot.
          </span>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wide">
            Cancellation Reason <span className="text-rose-500">*</span>
          </label>
          <div className="space-y-2">
            {['Doctor unavailable', 'Clinic schedule change', 'Emergency', 'Other'].map((reason) => (
              <label
                key={reason}
                className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
              >
                <input
                  type="radio"
                  name="cancellationReason"
                  value={reason}
                  checked={reasonCategory === reason}
                  onChange={(e) => setReasonCategory(e.target.value)}
                  className="w-4 h-4 text-rose-600 focus:ring-rose-500"
                />
                <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{reason}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wide">
            Additional Details (Optional)
          </label>
          <textarea
            rows={3}
            value={detailedReason}
            onChange={(e) => setDetailedReason(e.target.value)}
            placeholder="Brief reason or guidance for clinic reception..."
            className="w-full text-sm p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
        </div>
      </form>
    </Modal>
  );
};

import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useAppointmentStore } from '../../store/useAppointmentStore';
import { useToastStore } from '../../store/useToastStore';
import { CheckCircle2, Clock, Calendar, Check } from 'lucide-react';
import { calculateEndTime } from '../../utils/time';

export const CompleteAppointmentModal: React.FC = () => {
  const { completeTarget, setCompleteTarget, completeAppointment } = useAppointmentStore();
  const { addToast } = useToastStore();

  const [note, setNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [useScheduledEndTime, setUseScheduledEndTime] = useState<boolean>(true);

  if (!completeTarget) return null;

  const scheduledEndTime = calculateEndTime(completeTarget.time, completeTarget.durationMinutes);
  const currentTimeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const completionNote = useScheduledEndTime
      ? `${note ? `${note}\n` : ''}[Completed at scheduled time: ${scheduledEndTime}]`.trim()
      : note;

    await completeAppointment(completeTarget.id, completionNote);
    addToast({
      type: 'success',
      title: 'Appointment Completed',
      message: `Consultation with ${completeTarget.patientName} was finalized (${useScheduledEndTime ? scheduledEndTime : currentTimeStr}).`,
    });
    setIsSubmitting(false);
    setCompleteTarget(null);
    setNote('');
  };

  return (
    <Modal
      isOpen={Boolean(completeTarget)}
      onClose={() => setCompleteTarget(null)}
      title="Complete Consultation"
      subtitle={`Patient: ${completeTarget.patientName} • ${completeTarget.type}`}
      maxWidth="md"
      footer={
        <>
          <button
            type="button"
            onClick={() => setCompleteTarget(null)}
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            id="confirm-complete-button"
            type="submit"
            form="complete-form"
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl transition-colors shadow-xs flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isSubmitting ? 'Finalizing...' : 'Complete & Finish'}</span>
          </button>
        </>
      }
    >
      <form id="complete-form" onSubmit={handleComplete} className="space-y-4">
        {/* Scheduled Time Banner */}
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-100 dark:border-emerald-900/40 space-y-3">
          <div className="flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300">
            <span className="flex items-center gap-1.5 font-medium">
              <Calendar className="w-3.5 h-3.5" />
              <span>Scheduled Window:</span>
            </span>
            <span className="font-mono font-bold text-sm">
              {completeTarget.time} — {scheduledEndTime} ({completeTarget.durationMinutes} min)
            </span>
          </div>

          <div className="pt-2 border-t border-emerald-200/60 dark:border-emerald-800/60">
            <label className="flex items-center gap-2.5 text-xs text-emerald-900 dark:text-emerald-200 cursor-pointer font-medium select-none">
              <input
                type="checkbox"
                checked={useScheduledEndTime}
                onChange={(e) => setUseScheduledEndTime(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
              />
              <span>
                Finish at designated scheduled end time (<strong>{scheduledEndTime}</strong>)
              </span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wide">
            Internal Consultation Notes (Optional)
          </label>
          <textarea
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Clinical checkup summary, prescriptions remarks, or follow-up notes..."
            className="w-full text-sm p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Notes will be saved to the patient's record and consultation history.
          </p>
        </div>
      </form>
    </Modal>
  );
};

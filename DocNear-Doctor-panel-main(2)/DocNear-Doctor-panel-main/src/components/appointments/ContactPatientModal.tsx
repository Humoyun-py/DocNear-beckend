import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Appointment } from '../../types';
import { Phone, Mail, MessageSquare, Send, Check } from 'lucide-react';
import { useToastStore } from '../../store/useToastStore';

interface ContactPatientModalProps {
  appointment: Appointment | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ContactPatientModal: React.FC<ContactPatientModalProps> = ({
  appointment,
  isOpen,
  onClose,
}) => {
  const { addToast } = useToastStore();
  const [message, setMessage] = useState('');
  const [isSent, setIsSent] = useState(false);

  if (!appointment) return null;

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsSent(true);
    addToast({
      type: 'success',
      title: 'Message Dispatched',
      message: `Direct SMS sent to ${appointment.patientName} (${appointment.patientPhone}).`,
    });

    setTimeout(() => {
      setIsSent(false);
      setMessage('');
      onClose();
    }, 1200);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Contact Patient"
      subtitle={`Booking ID: ${appointment.bookingCode} • ${appointment.patientName}`}
      maxWidth="md"
    >
      <div className="space-y-6 text-xs">
        {/* Quick Contact Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <a
            href={`tel:${appointment.patientPhone}`}
            className="flex items-center justify-center gap-2 p-3 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold hover:bg-blue-100 transition-colors text-xs"
          >
            <Phone className="w-4 h-4" />
            <span>Call {appointment.patientPhone}</span>
          </a>

          <a
            href={`mailto:${appointment.patientEmail || 'patient@docnear.uz'}?subject=DocNear Appointment ${appointment.bookingCode}&body=Dear ${appointment.patientName}, regarding your appointment on ${appointment.date} at ${appointment.time}...`}
            className="flex items-center justify-center gap-2 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-xs"
          >
            <Mail className="w-4 h-4" />
            <span>Send Direct Email</span>
          </a>
        </div>

        {/* In-App Direct SMS / Alert Form */}
        <form onSubmit={handleSendMessage} className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
            <span>Send Direct SMS / Portal Notification</span>
          </label>
          <textarea
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={`Dear ${appointment.patientName}, your doctor has sent an update regarding your consultation on ${appointment.date}...`}
            className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs resize-none"
            required
          />

          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400">
              Notification will arrive via SMS and in patient's DocNear Portal.
            </span>
            <button
              type="submit"
              disabled={isSent || !message.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl transition-colors shadow-xs"
            >
              {isSent ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Sent!
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  Send Notification
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

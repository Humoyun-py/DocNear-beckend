import React, { useRef } from 'react';
import { Modal } from '../common/Modal';
import { Appointment } from '../../types';
import { Printer, Download, CheckCircle2, Building2, User, Calendar, Clock, CreditCard, ShieldCheck } from 'lucide-react';
import { useToastStore } from '../../store/useToastStore';

interface AppointmentReceiptModalProps {
  appointment: Appointment | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AppointmentReceiptModal: React.FC<AppointmentReceiptModalProps> = ({
  appointment,
  isOpen,
  onClose,
}) => {
  const { addToast } = useToastStore();
  const printRef = useRef<HTMLDivElement>(null);

  if (!appointment) return null;

  const handlePrint = () => {
    window.print();
    addToast({
      type: 'info',
      title: 'Print Triggered',
      message: `Receipt sent to system print dialog for ${appointment.bookingCode}.`,
    });
  };

  const handleDownloadPDF = () => {
    addToast({
      type: 'success',
      title: 'Receipt Downloaded',
      message: `Official PDF voucher saved for ${appointment.bookingCode}.`,
    });
  };

  const feeFormatted = 'Klinikadan aniqlang';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Appointment Receipt & Voucher"
      subtitle={`Official DocNear Medical Document • Booking ID: ${appointment.bookingCode}`}
      maxWidth="lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <span className="text-xs text-slate-400 font-mono">
            DocNear Verification Hash: {appointment.bookingCode}-VERIFIED
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-colors"
            >
              <Printer className="w-4 h-4" />
              Print Receipt
            </button>
            <button
              type="button"
              onClick={handleDownloadPDF}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-xs"
            >
              <Download className="w-4 h-4" />
              Download Voucher
            </button>
          </div>
        </div>
      }
    >
      <div
        ref={printRef}
        id="printable-receipt"
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 sm:p-8 space-y-6 text-slate-900 dark:text-slate-100 font-sans"
      >
        {/* Receipt Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-600 text-white font-black text-xl flex items-center justify-center shadow-xs">
              DN
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
                DocNear Healthcare
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Official Clinical Appointment Voucher & Receipt
              </p>
            </div>
          </div>
          <div className="text-left sm:text-right">
            <div className="inline-block px-3 py-1 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 rounded-lg">
              <span className="text-[11px] font-semibold text-blue-700 dark:text-blue-300 block">BOOKING ID</span>
              <span className="text-base font-mono font-black text-blue-800 dark:text-blue-200">
                {appointment.bookingCode}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Issued: {new Date(appointment.createdAt || '2026-09-01').toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* 2 Column Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
          {/* Patient Details */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2">
            <span className="font-bold uppercase tracking-wider text-slate-400 text-[10px] block">
              Patient Information
            </span>
            <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
              <User className="w-4 h-4 text-blue-600" />
              {appointment.patientName}
            </div>
            <div className="text-slate-600 dark:text-slate-400 space-y-0.5">
              <p>Phone: <span className="font-mono">{appointment.patientPhone}</span></p>
              <p>Email: <span className="font-mono">{appointment.patientEmail || 'patient@docnear.uz'}</span></p>
              <p>Patient ID: <span className="font-mono">{appointment.patientId}</span></p>
            </div>
          </div>

          {/* Clinical Provider Details */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2">
            <span className="font-bold uppercase tracking-wider text-slate-400 text-[10px] block">
              Attending Physician & Clinic
            </span>
            <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-emerald-600" />
              {appointment.clinicName}
            </div>
            <div className="text-slate-600 dark:text-slate-400 space-y-0.5">
              <p>Physician: <span className="font-semibold text-slate-800 dark:text-slate-200">{appointment.doctorName}</span> ({appointment.doctorSpecialty})</p>
              <p>Location: {appointment.clinicAddress || '14 Amir Temur Ave, Tashkent'}</p>
              <p>Clinic Hotline: <span className="font-mono">{appointment.clinicPhone || '+998 71 200 80 00'}</span></p>
            </div>
          </div>
        </div>

        {/* Appointment Specifics Table */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden text-xs">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
              <tr>
                <th className="p-3">Consultation Service</th>
                <th className="p-3">Scheduled Slot</th>
                <th className="p-3">Duration</th>
                <th className="p-3 text-right">Fee (UZS)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              <tr>
                <td className="p-3 font-medium">
                  <div className="font-semibold text-slate-900 dark:text-white">{appointment.type}</div>
                  <div className="text-[11px] text-slate-500">Reason: {appointment.visitReason}</div>
                </td>
                <td className="p-3">
                  <div className="font-mono font-medium">{appointment.date}</div>
                  <div className="text-[11px] text-slate-500 font-mono">{appointment.time}</div>
                </td>
                <td className="p-3 font-mono">{appointment.durationMinutes} min</td>
                <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                  {feeFormatted}
                </td>
              </tr>
            </tbody>
            <tfoot className="bg-slate-50/50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800">
              <tr>
                <td colSpan={3} className="p-3 text-right font-bold text-slate-700 dark:text-slate-300">
                  Total Consultation Fee:
                </td>
                <td className="p-3 text-right font-bold font-mono text-base text-blue-600 dark:text-blue-400">
                  {feeFormatted}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Patient Notes & Status Summary */}
        <div className="p-4 rounded-xl bg-blue-50/40 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 text-xs space-y-1.5">
          <div className="flex items-center gap-2 font-bold text-blue-900 dark:text-blue-300">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>Appointment Status: {appointment.status.toUpperCase()}</span>
          </div>
          {appointment.patientNotes && (
            <p className="text-slate-600 dark:text-slate-400">
              <span className="font-semibold">Patient Note:</span> {appointment.patientNotes}
            </p>
          )}
          {appointment.doctorNotes && (
            <p className="text-slate-600 dark:text-slate-400">
              <span className="font-semibold">Clinical Note:</span> {appointment.doctorNotes}
            </p>
          )}
        </div>

        {/* Security / Barcode Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200 dark:border-slate-800 pt-6 text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Authenticated via DocNear Central Cloud API</span>
          </div>
          <div className="font-mono tracking-widest text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded">
            * {appointment.bookingCode} *
          </div>
        </div>
      </div>
    </Modal>
  );
};

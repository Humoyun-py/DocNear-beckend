import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  Building2,
  MapPin,
  FileText,
  DollarSign,
  Printer,
  CheckCircle2,
  XCircle,
  CalendarClock,
  Play,
  Navigation,
  MessageSquare,
  AlertCircle,
  History,
  ShieldCheck,
  Award,
} from 'lucide-react';
import { useAppointmentStore } from '../../store/useAppointmentStore';
import { useToastStore } from '../../store/useToastStore';
import { StatusBadge } from '../../components/common/StatusBadge';
import { AppointmentReceiptModal } from '../../components/appointments/AppointmentReceiptModal';
import { ContactPatientModal } from '../../components/appointments/ContactPatientModal';
import { ClinicLocationModal } from '../../components/appointments/ClinicLocationModal';
import { RejectAppointmentModal } from '../../components/appointments/RejectAppointmentModal';

export const AppointmentDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    appointments,
    confirmAppointment,
    setCancelTarget,
    setRescheduleTarget,
    setCompleteTarget,
    startAppointment,
  } = useAppointmentStore();
  const { addToast } = useToastStore();

  // Modals state
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);

  // Find appointment by id or booking code
  const appointment = useMemo(() => {
    return appointments.find(
      (a) => a.id === id || a.bookingCode.toLowerCase() === id?.toLowerCase()
    );
  }, [appointments, id]);

  if (!appointment) {
    return (
      <div className="p-8 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
          Appointment Not Found
        </h2>
        <p className="text-xs text-slate-500">
          The requested appointment record could not be found or has been removed.
        </p>
        <button
          onClick={() => navigate('/appointments')}
          className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-xl text-xs hover:bg-blue-700 transition-colors"
        >
          Return to Appointments
        </button>
      </div>
    );
  }

  const handleConfirm = async () => {
    await confirmAppointment(appointment.id);
    addToast({
      type: 'success',
      title: 'Booking Confirmed',
      message: `Booking ${appointment.bookingCode} for ${appointment.patientName} has been confirmed.`,
    });
  };

  const handleStart = async () => {
    await startAppointment(appointment.id);
    addToast({
      type: 'info',
      title: 'Consultation Commenced',
      message: `Timer running for ${appointment.patientName}.`,
    });
  };

  const feeFormatted = 'Klinikadan aniqlang';
  const isPending = appointment.status === 'pending' || appointment.status === 'PENDING';
  const isConfirmed = appointment.status === 'confirmed' || appointment.status === 'CONFIRMED' || appointment.status === 'waiting';
  const isCompleted = appointment.status === 'completed' || appointment.status === 'COMPLETED';
  const isCancelled = appointment.status === 'cancelled' || appointment.status === 'CANCELLED' || appointment.status === 'rejected';

  return (
    <div id="appointment-details-page" className="space-y-6 pb-16 animate-in fade-in duration-300">
      {/* Back Navigation & Breadcrumb */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/appointments')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Appointments</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsReceiptOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg shadow-2xs transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Receipt</span>
          </button>
        </div>
      </div>

      {/* Main Header Banner Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <div className="px-3 py-1 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 rounded-lg font-mono font-black text-sm text-blue-700 dark:text-blue-300">
                {appointment.bookingCode}
              </div>
              <StatusBadge status={appointment.status} size="md" />
              <span className="text-xs text-slate-400 font-mono">
                ID: {appointment.id}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {appointment.patientName}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-4">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span className="font-semibold text-slate-700 dark:text-slate-300">{appointment.date}</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-600" />
                <span className="font-semibold text-slate-700 dark:text-slate-300">{appointment.time}</span> ({appointment.durationMinutes} min)
              </span>
              <span>•</span>
              <span>Created on: {new Date(appointment.createdAt || '2026-09-01').toLocaleDateString()}</span>
            </p>
          </div>

          {/* Primary Action Buttons Ribbon */}
          <div className="flex flex-wrap items-center gap-2.5">
            {isPending && (
              <>
                <button
                  id="confirm-booking-btn"
                  onClick={handleConfirm}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm Booking</span>
                </button>
                <button
                  id="reject-booking-btn"
                  onClick={() => setIsRejectOpen(true)}
                  className="inline-flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 hover:bg-rose-100 rounded-xl transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Reject Booking</span>
                </button>
              </>
            )}

            {isConfirmed && (
              <>
                <button
                  onClick={handleStart}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Start Consultation</span>
                </button>
                <button
                  onClick={() => setCompleteTarget(appointment)}
                  className="inline-flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Mark as Completed</span>
                </button>
                <button
                  onClick={() => setRescheduleTarget(appointment)}
                  className="inline-flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900 hover:bg-blue-100 rounded-xl transition-colors"
                >
                  <CalendarClock className="w-4 h-4" />
                  <span>Reschedule</span>
                </button>
                <button
                  onClick={() => setCancelTarget(appointment)}
                  className="inline-flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 hover:bg-rose-100 rounded-xl transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Cancel</span>
                </button>
              </>
            )}

            {isCompleted && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                Visit Finalized
              </span>
            )}

            {isCancelled && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs font-semibold">
                <XCircle className="w-4 h-4" />
                Cancelled
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Grid: Left Column Details & Right Column Info */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Reason & Patient Notes */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
              Consultation Reason & Patient Notes
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                <span className="font-semibold text-slate-800 dark:text-slate-200 block mb-1">
                  Primary Visit Reason:
                </span>
                <p className="text-slate-700 dark:text-slate-300 text-sm font-medium">
                  {appointment.visitReason || appointment.type}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                <span className="font-semibold text-slate-800 dark:text-slate-200 block mb-1">
                  Patient Pre-visit Notes:
                </span>
                <p className="text-slate-600 dark:text-slate-400 italic">
                  "{appointment.patientNotes || appointment.patientNote || 'No additional notes provided by patient at booking.'}"
                </p>
              </div>

              {(appointment.doctorNotes || appointment.doctorNote) && (
                <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40">
                  <span className="font-semibold text-blue-900 dark:text-blue-300 block mb-1">
                    Doctor Clinical Notes:
                  </span>
                  <p className="text-blue-800 dark:text-blue-200">
                    {appointment.doctorNotes || appointment.doctorNote}
                  </p>
                </div>
              )}

              {appointment.cancellationReason && (
                <div className="p-4 rounded-xl bg-rose-50/50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40">
                  <span className="font-semibold text-rose-900 dark:text-rose-300 block mb-1">
                    Cancellation / Rejection Reason:
                  </span>
                  <p className="text-rose-800 dark:text-rose-200">
                    {appointment.cancellationReason}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Status History Timeline */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <History className="w-4 h-4 text-blue-600" />
              <span>Status History & Audit Trail</span>
            </h3>

            <div className="space-y-4 text-xs">
              <div className="relative pl-6 border-l-2 border-blue-500 space-y-1">
                <div className="absolute -left-1.5 top-0.5 w-3 h-3 rounded-full bg-blue-600 ring-4 ring-blue-100 dark:ring-blue-950" />
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 dark:text-white uppercase">
                    {appointment.status}
                  </span>
                  <span className="text-slate-400 font-mono text-[11px]">
                    {new Date(appointment.updatedAt || appointment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-slate-500 dark:text-slate-400">
                  Current state verified in DocNear registry.
                </p>
              </div>

              <div className="relative pl-6 border-l-2 border-slate-200 dark:border-slate-700 space-y-1">
                <div className="absolute -left-1.5 top-0.5 w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-600" />
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-700 dark:text-slate-300 uppercase">
                    BOOKING CREATED (PENDING)
                  </span>
                  <span className="text-slate-400 font-mono text-[11px]">
                    {new Date(appointment.createdAt || '2026-09-01T09:00:00Z').toLocaleDateString()}
                  </span>
                </div>
                <p className="text-slate-500">
                  Submitted via patient booking interface with Booking ID {appointment.bookingCode}.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): Patient & Clinic Info */}
        <div className="lg:col-span-4 space-y-6">
          {/* Patient Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                Patient Info
              </h3>
              <Link
                to={`/patients/${appointment.patientId}`}
                className="text-xs text-blue-600 hover:text-blue-700 font-semibold"
              >
                View Profile →
              </Link>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center">
                  {appointment.patientName.charAt(0)}
                </div>
                <div>
                  <div className="font-bold text-sm text-slate-900 dark:text-white">
                    {appointment.patientName}
                  </div>
                  <div className="text-slate-400 font-mono text-[11px]">
                    ID: {appointment.patientId}
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <Phone className="w-3.5 h-3.5 text-blue-600" />
                  <span className="font-mono">{appointment.patientPhone}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-mono">{appointment.patientEmail || 'patient@docnear.uz'}</span>
                </div>
              </div>

              <button
                onClick={() => setIsContactOpen(true)}
                className="w-full mt-2 inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900 hover:bg-blue-100 rounded-xl transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Contact Patient Directly</span>
              </button>
            </div>
          </div>

          {/* Clinic & Location Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
              Assigned Clinic
            </h3>

            <div className="space-y-3 text-xs">
              <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-600" />
                {appointment.clinicName}
              </div>

              <p className="text-slate-600 dark:text-slate-400 flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <span>{appointment.clinicAddress || '14 Amir Temur Avenue, Tashkent'}</span>
              </p>

              <button
                onClick={() => setIsLocationOpen(true)}
                className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-colors"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Open Clinic Location & Map</span>
              </button>
            </div>
          </div>

          {/* Fee & Financial Summary */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>Billing & Fee</span>
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </h3>

            <div className="flex items-baseline justify-between pt-1">
              <span className="text-xs text-slate-500">Consultation Fee</span>
              <span className="text-lg font-bold font-mono text-slate-900 dark:text-white">
                {feeFormatted}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              <span>Payment Status:</span>
              <span>Paid at reception / Portal</span>
            </div>

            <button
              onClick={() => setIsReceiptOpen(true)}
              className="w-full mt-2 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Download / Print Receipt</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AppointmentReceiptModal
        appointment={appointment}
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
      />
      <ContactPatientModal
        appointment={appointment}
        isOpen={isContactOpen}
        onClose={() => setIsContactOpen(false)}
      />
      <ClinicLocationModal
        appointment={appointment}
        isOpen={isLocationOpen}
        onClose={() => setIsLocationOpen(false)}
      />
      <RejectAppointmentModal
        appointment={appointment}
        isOpen={isRejectOpen}
        onClose={() => setIsRejectOpen(false)}
      />
    </div>
  );
};

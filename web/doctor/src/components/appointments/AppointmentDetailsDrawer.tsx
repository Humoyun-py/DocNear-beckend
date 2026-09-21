import React from 'react';
import { Drawer } from '../common/Drawer';
import { StatusBadge } from '../common/StatusBadge';
import { useAppointmentStore } from '../../store/useAppointmentStore';
import { useToastStore } from '../../store/useToastStore';
import { calculateEndTime } from '../../utils/time';
import {
  Calendar,
  Clock,
  MapPin,
  FileText,
  User,
  Phone,
  Play,
  CheckCircle2,
  XCircle,
  CalendarClock,
  UserX,
  ExternalLink,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const AppointmentDetailsDrawer: React.FC = () => {
  const {
    selectedAppointmentId,
    isDrawerOpen,
    setDrawerOpen,
    appointments,
    activeConsultation,
    acceptRequest,
    rejectRequest,
    startAppointment,
    setCancelTarget,
    setRescheduleTarget,
    setCompleteTarget,
    setNoShowTarget,
  } = useAppointmentStore();

  const { addToast } = useToastStore();

  const appointment = appointments.find((a) => a.id === selectedAppointmentId);

  if (!appointment) return null;

  const handleAccept = async () => {
    await acceptRequest(appointment.id);
    addToast({
      type: 'success',
      title: 'Appointment Accepted',
      message: `Booking for ${appointment.patientName} on ${appointment.date} confirmed.`,
    });
  };

  const handleReject = async () => {
    await rejectRequest(appointment.id);
    addToast({
      type: 'warning',
      title: 'Appointment Declined',
      message: `Booking request for ${appointment.patientName} was declined.`,
    });
  };

  const handleStart = async () => {
    await startAppointment(appointment.id);
    addToast({
      type: 'info',
      title: 'Consultation Started',
      message: `Live consultation with ${appointment.patientName} is now in progress.`,
    });
  };

  return (
    <Drawer
      isOpen={isDrawerOpen}
      onClose={() => setDrawerOpen(false)}
      title="Appointment Details"
      subtitle={`Ref: ${appointment.bookingCode}`}
      width="lg"
      footer={
        <div className="flex flex-wrap items-center justify-end gap-2.5 w-full">
          {/* Status-driven dynamic action buttons */}
          {appointment.status === 'pending' && (
            <>
              <button
                type="button"
                onClick={handleReject}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 rounded-xl transition-colors"
              >
                <XCircle className="w-4 h-4" />
                <span>Decline Request</span>
              </button>
              <button
                type="button"
                onClick={handleAccept}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Accept & Confirm</span>
              </button>
            </>
          )}

          {(appointment.status === 'confirmed' || appointment.status === 'waiting') && (
            <>
              <button
                type="button"
                onClick={() => setCancelTarget(appointment)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                <XCircle className="w-4 h-4 text-rose-500" />
                <span>Cancel</span>
              </button>
              <button
                type="button"
                onClick={() => setRescheduleTarget(appointment)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors"
              >
                <CalendarClock className="w-4 h-4" />
                <span>Reschedule</span>
              </button>
              <button
                type="button"
                onClick={() => setNoShowTarget(appointment)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                <UserX className="w-4 h-4" />
                <span>No-Show</span>
              </button>
              <button
                id="drawer-start-appointment-btn"
                type="button"
                onClick={handleStart}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Start Consultation</span>
              </button>
            </>
          )}

          {appointment.status === 'in_progress' && (
            <button
              id="drawer-complete-appointment-btn"
              type="button"
              onClick={() => setCompleteTarget(appointment)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Complete Consultation</span>
            </button>
          )}

          {(appointment.status === 'completed' ||
            appointment.status === 'cancelled' ||
            appointment.status === 'rejected' ||
            appointment.status === 'no_show') && (
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Close
            </button>
          )}
        </div>
      }
    >
      <div className="space-y-6">
        {/* Status header banner */}
        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-800">
          <div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              Status
            </div>
            <div className="mt-1">
              <StatusBadge status={appointment.status} />
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              Duration
            </div>
            <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 font-mono mt-0.5">
              {appointment.durationMinutes} minutes
            </div>
          </div>
        </div>

        {/* Patient Profile Snapshot */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-sm">
                {appointment.patientName
                  .split(' ')
                  .map((n) => n[0])
                  .join('')}
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {appointment.patientName}
                </h4>
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <Phone className="w-3 h-3" />
                  <span>{appointment.patientPhone}</span>
                </div>
              </div>
            </div>
            <Link
              to={`/patients/${appointment.patientId}`}
              onClick={() => setDrawerOpen(false)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline"
            >
              <span>View History</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Consultation Schedule Info */}
        <div className="space-y-3">
          <h5 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Consultation Schedule
          </h5>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-800">
              <div className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-1">
                <Calendar className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                <span>Date</span>
              </div>
              <div className="font-semibold text-slate-800 dark:text-slate-200">{appointment.date}</div>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-800">
              <div className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-1">
                <Clock className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                <span>Time Slot & End</span>
              </div>
              <div className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
                {appointment.time} - {calculateEndTime(appointment.time, appointment.durationMinutes)}
              </div>
            </div>
          </div>
        </div>

        {/* Service and Clinic */}
        <div className="space-y-3">
          <h5 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Clinical Service & Location
          </h5>
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-800 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400">Appointment Type:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{appointment.type}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400">Clinic:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-emerald-600" />
                {appointment.clinicName}
              </span>
            </div>
          </div>
        </div>

        {/* Patient Note */}
        {appointment.patientNote && (
          <div className="space-y-2">
            <h5 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              <span>Patient Pre-consultation Note</span>
            </h5>
            <div className="p-3.5 bg-blue-50/70 dark:bg-blue-950/30 rounded-xl border border-blue-100 dark:border-blue-900/40 text-xs text-blue-950 dark:text-blue-200 leading-relaxed">
              "{appointment.patientNote}"
            </div>
          </div>
        )}

        {/* Doctor Note */}
        {appointment.doctorNote && (
          <div className="space-y-2">
            <h5 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              <span>Doctor Clinical Record</span>
            </h5>
            <div className="p-3.5 bg-slate-100 dark:bg-slate-800/70 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 leading-relaxed">
              {appointment.doctorNote}
            </div>
          </div>
        )}

        {/* Cancellation Reason if cancelled */}
        {appointment.cancellationReason && (
          <div className="space-y-2">
            <h5 className="text-xs font-bold text-rose-600 uppercase tracking-wider flex items-center gap-1.5">
              <XCircle className="w-3.5 h-3.5" />
              <span>Cancellation Reason</span>
            </h5>
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/30 rounded-xl border border-rose-200 dark:border-rose-900/50 text-xs text-rose-900 dark:text-rose-200 leading-relaxed">
              {appointment.cancellationReason}
            </div>
          </div>
        )}
      </div>
    </Drawer>
  );
};

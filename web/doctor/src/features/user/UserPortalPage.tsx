import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  User,
  Plus,
  Building2,
  Phone,
  FileText,
  CheckCircle2,
  AlertCircle,
  Printer,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Bell,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { useAppointmentStore } from '../../store/useAppointmentStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useToastStore } from '../../store/useToastStore';
import { StatusBadge } from '../../components/common/StatusBadge';
import { AppointmentReceiptModal } from '../../components/appointments/AppointmentReceiptModal';
import { doctorScheduleService } from '../../services/doctorScheduleService';
import { Appointment } from '../../types';

export const UserPortalPage: React.FC = () => {
  const { appointments, bookNewAppointment } = useAppointmentStore();
  const { user, switchPersona } = useAuthStore();
  const { addToast } = useToastStore();
  const navigate = useNavigate();

  // Selected receipt
  const [selectedReceiptApt, setSelectedReceiptApt] = useState<Appointment | null>(null);

  // New Booking Modal state
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [bookDate, setBookDate] = useState('2026-09-08');
  const [bookTime, setBookTime] = useState('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [visitReason, setVisitReason] = useState('Routine Cardiovascular Checkup');
  const [patientNotes, setPatientNotes] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState('doctor_001');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter appointments for the current user
  // Ali Karimov has patientId: 'pat-001' or 'patient_001'
  const userAppointments = appointments.filter(
    (a) => a.patientId === 'pat-001' || a.patientId === 'patient_001' || a.patientName === 'Ali Karimov'
  );

  // Fetch available slots when bookDate or selectedDoctorId changes
  useEffect(() => {
    let isMounted = true;
    async function loadSlots() {
      const slots = await doctorScheduleService.getAvailableSlots(bookDate);
      if (isMounted) {
        setAvailableSlots(slots);
        if (slots.length > 0) {
          setBookTime(slots[0]);
        } else {
          setBookTime('');
        }
      }
    }
    loadSlots();
    return () => {
      isMounted = false;
    };
  }, [bookDate, selectedDoctorId]);

  const handleBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookTime) {
      addToast({
        type: 'warning',
        title: 'No Slot Selected',
        message: 'Please choose an available consultation time slot.',
      });
      return;
    }

    setIsSubmitting(true);
    const newApt = await bookNewAppointment({
      patientId: 'pat-001',
      patientName: 'Ali Karimov',
      patientPhone: '+998 90 123 45 67',
      patientEmail: 'ali.karimov@gmail.com',
      doctorId: selectedDoctorId,
      doctorName: selectedDoctorId === 'doctor_001' ? 'Dr. Akmal Karimov' : 'Dr. Nilufar Saidova',
      doctorSpecialty: selectedDoctorId === 'doctor_001' ? 'Cardiologist' : 'Neurologist',
      clinicId: selectedDoctorId === 'doctor_001' ? 'clinic_001' : 'clinic_002',
      clinicName: selectedDoctorId === 'doctor_001' ? 'MedLife Central Clinic' : 'City Neurology Center',
      date: bookDate,
      time: bookTime,
      visitReason,
      patientNotes,
      consultationFee: 450000,
      type: 'Cardiology Consultation',
    });

    setIsSubmitting(false);
    setIsBookModalOpen(false);
    setPatientNotes('');

    addToast({
      type: 'success',
      title: 'Booking Request Submitted!',
      message: `Your booking ID is ${newApt.bookingCode}. Awaiting doctor confirmation.`,
    });
  };

  return (
    <div id="user-portal-page" className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-300">
      {/* Top Banner & Persona Toggle */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 text-white rounded-2xl p-6 sm:p-8 shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-xs font-semibold text-blue-100">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
              <span>DocNear Connected Patient Portal</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Patient Consultation Portal
            </h1>
            <p className="text-xs sm:text-sm text-blue-100/90 max-w-xl">
              Real-time synchronization between patient appointments and the physician clinical schedule.
              Every booking shares the identical Booking ID (<span className="font-mono font-bold">DN-XXXXX</span>).
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={() => setIsBookModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 text-xs font-bold text-blue-900 bg-white hover:bg-blue-50 rounded-xl shadow-md transition-all active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Book New Appointment</span>
            </button>
            <button
              onClick={() => {
                switchPersona('DOCTOR');
                navigate('/dashboard');
              }}
              className="inline-flex items-center justify-center gap-2 px-4 py-3 text-xs font-semibold text-white bg-blue-600/60 hover:bg-blue-600 rounded-xl border border-white/20 backdrop-blur-xs transition-colors"
            >
              <span>Switch to Doctor View</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Synchronized ID Notice */}
      <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
            <RefreshCw className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-slate-900 dark:text-white block">
              Active Synchronization Verified
            </span>
            <span className="text-slate-600 dark:text-slate-400">
              When a doctor confirms, reschedules, or completes a visit in the Doctor Panel, the status updates here instantly.
            </span>
          </div>
        </div>
        <span className="font-mono font-bold text-blue-700 dark:text-blue-300 px-3 py-1 rounded bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-900 shrink-0">
          User: Ali Karimov (pat-001)
        </span>
      </div>

      {/* Bookings Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              My Booked Consultations
            </h2>
            <p className="text-xs text-slate-500">
              Showing all appointments booked under Ali Karimov
            </p>
          </div>
          <span className="text-xs font-bold font-mono px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            {userAppointments.length} Total Bookings
          </span>
        </div>

        {userAppointments.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
              No appointments found for this account.
            </p>
            <button
              onClick={() => setIsBookModalOpen(true)}
              className="mt-4 px-4 py-2 text-xs font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700"
            >
              Book Your First Appointment
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {userAppointments.map((apt) => (
              <div
                key={apt.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4 hover:border-blue-300 dark:hover:border-blue-800 transition-all"
              >
                {/* Header Row */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-black px-2.5 py-1 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                        {apt.bookingCode}
                      </span>
                      <StatusBadge status={apt.status} size="sm" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white mt-2">
                      {apt.doctorName}
                    </h3>
                    <p className="text-xs text-slate-500">{apt.doctorSpecialty}</p>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-bold font-mono text-slate-800 dark:text-slate-200 block">
                      {apt.date}
                    </span>
                    <span className="text-xs font-mono text-slate-500">
                      {apt.time}
                    </span>
                  </div>
                </div>

                {/* Clinic & Reason */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-xs space-y-1.5">
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="font-medium">{apt.clinicName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    <span>Reason: {apt.visitReason || apt.type}</span>
                  </div>
                  {apt.patientNotes && (
                    <p className="text-slate-500 italic">"{apt.patientNotes}"</p>
                  )}
                  {apt.doctorNotes && (
                    <div className="p-2 rounded bg-blue-50/50 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300 text-[11px]">
                      <span className="font-bold">Doctor Notes:</span> {apt.doctorNotes}
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <button
                    onClick={() => setSelectedReceiptApt(apt)}
                    className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-400 hover:text-blue-600 font-semibold"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>View Receipt</span>
                  </button>

                  <button
                    onClick={() => {
                      switchPersona('DOCTOR');
                      navigate(`/appointments/${apt.id}`);
                    }}
                    className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                  >
                    <span>View in Doctor Panel</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Book New Appointment Modal */}
      {isBookModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 max-w-lg w-full space-y-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Book a Consultation
                </h3>
                <p className="text-xs text-slate-500">
                  Select available slot directly synced with physician schedule
                </p>
              </div>
              <button
                onClick={() => setIsBookModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg font-bold"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleBookSubmit} className="space-y-4 text-xs">
              {/* Doctor Select */}
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Choose Attending Doctor:
                </label>
                <select
                  value={selectedDoctorId}
                  onChange={(e) => setSelectedDoctorId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                >
                  <option value="doctor_001">Dr. Akmal Karimov - Cardiologist (MedLife Central)</option>
                  <option value="doctor_002">Dr. Nilufar Saidova - Neurologist (City Neurology Center)</option>
                </select>
              </div>

              {/* Date Input */}
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Appointment Date (YYYY-MM-DD):
                </label>
                <input
                  type="date"
                  value={bookDate}
                  min="2026-09-06"
                  onChange={(e) => setBookDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-600 focus:outline-none font-mono"
                  required
                />
              </div>

              {/* Time Slots (Only Free slots!) */}
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Available Doctor Slots for {bookDate}:
                </label>
                {availableSlots.length === 0 ? (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-rose-700 dark:text-rose-300 text-xs">
                    No open slots available on this date. Please pick another working day.
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-2 max-h-36 overflow-y-auto p-1">
                    {availableSlots.map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setBookTime(slot)}
                        className={`p-2 rounded-lg font-mono text-xs font-semibold border transition-all ${
                          bookTime === slot
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-blue-50'
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Visit Reason */}
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Visit Reason:
                </label>
                <input
                  type="text"
                  value={visitReason}
                  onChange={(e) => setVisitReason(e.target.value)}
                  placeholder="e.g. Blood pressure review, Holter test interpretation"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  required
                />
              </div>

              {/* Patient Notes */}
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Notes for Doctor:
                </label>
                <textarea
                  rows={2}
                  value={patientNotes}
                  onChange={(e) => setPatientNotes(e.target.value)}
                  placeholder="Any symptoms, current medications, or notes..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-600 focus:outline-none resize-none"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsBookModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !bookTime}
                  className="px-5 py-2.5 font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl shadow-xs"
                >
                  {isSubmitting ? 'Submitting...' : 'Confirm & Request Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      <AppointmentReceiptModal
        appointment={selectedReceiptApt}
        isOpen={Boolean(selectedReceiptApt)}
        onClose={() => setSelectedReceiptApt(null)}
      />
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { useAppointments } from '../context/AppointmentContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Appointment } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { EmptyState } from '../components/common/EmptyState';
import { AppointmentReminderAlert } from '../components/appointments/AppointmentReminderAlert';
import { ExportCalendarMenu } from '../components/appointments/ExportCalendarMenu';
import { doctorService } from '../services/doctorService';
import { clinicService } from '../services/clinicService';
import { generateAppointmentReceiptPDF } from '../utils/pdfReceipt';
import { getGoogleCalendarUrl, downloadICalendarFile } from '../utils/calendarExport';
import {
  Calendar,
  Clock,
  MapPin,
  CalendarPlus,
  Navigation,
  RotateCcw,
  Phone,
  AlertTriangle,
  History,
  Building2,
  CheckCircle2,
  FileCheck,
  Star,
  Receipt,
  Download,
  Share2,
  Check,
  Lock,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const AppointmentsPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { appointments, cancelAppointment, openBookingModal, showToast } = useAppointments();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'Upcoming' | 'History' | 'Cancelled'>('Upcoming');

  // Cancel confirmation state
  const [cancellingAppt, setCancellingAppt] = useState<Appointment | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('Schedule conflict');
  const [isRebookingId, setIsRebookingId] = useState<string | null>(null);

  const filteredAppointments = appointments.filter((a) => {
    const s = (a.status || '').toUpperCase();
    if (activeTab === 'Upcoming') return s === 'CONFIRMED' || s === 'PENDING' || s === 'RESCHEDULED' || s === 'WAITING' || s === 'IN_PROGRESS';
    if (activeTab === 'History') return s === 'COMPLETED';
    if (activeTab === 'Cancelled') return ['CANCELLED', 'REJECTED', 'NO_SHOW'].includes(s);
    return true;
  });

  const handleConfirmCancel = async () => {
    if (!cancellingAppt) return;
    try {
      await cancelAppointment(cancellingAppt.id, cancelReason);
      setCancellingAppt(null);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Qabul bekor qilinmadi', 'error');
    }
  };

  const handleRescheduleAppointment = async (appt: Appointment) => {
    try {
      const [doc, clinic] = await Promise.all([
        doctorService.getDoctorById(appt.doctorId),
        clinicService.getClinicById(appt.clinicId),
      ]);
      if (doc) {
        openBookingModal({ doctor: doc, clinic: clinic || null, rescheduleId: appt.id });
        showToast(
          `${t('reschedule')}: ${doc.name} — ${t('step3')}`,
          'info',
          'Vaqtni o‘zgartirish'
        );
      }
    } catch (err) {
      console.error('Failed to open reschedule modal:', err);
    }
  };

  const handleRebookDoctor = async (appt: Appointment) => {
    setIsRebookingId(appt.id);
    try {
      const [doc, clinic] = await Promise.all([
        doctorService.getDoctorById(appt.doctorId),
        clinicService.getClinicById(appt.clinicId),
      ]);
      if (doc) {
        openBookingModal({ doctor: doc, clinic: clinic || null });
        showToast(
          `${t('rebookDoctor')}: ${doc.name} (${doc.specialty})`,
          'info',
          t('quickRebook')
        );
      } else {
        navigate(`/search?query=${encodeURIComponent(appt.doctorName)}`);
      }
    } catch (err) {
      console.error('Failed to rebook doctor:', err);
    } finally {
      setIsRebookingId(null);
    }
  };

  const handleRebookClinic = async (appt: Appointment) => {
    setIsRebookingId(appt.id);
    try {
      const clinic = await clinicService.getClinicById(appt.clinicId);
      if (clinic) {
        openBookingModal({ clinic });
        showToast(
          `${t('rebookClinic')}: ${clinic.name}`,
          'info',
          t('quickRebook')
        );
      } else {
        navigate(`/clinics/${appt.clinicId}`);
      }
    } catch (err) {
      console.error('Failed to rebook clinic:', err);
    } finally {
      setIsRebookingId(null);
    }
  };

  const completedVisits = appointments.filter((a) => a.status === 'Completed');

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-24 transition-colors duration-200">
      {/* Guest info banner if not logged in */}
      {!isAuthenticated && (
        <div className="bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-blue-900 dark:text-blue-200">
          <div className="flex items-center gap-2.5">
            <Lock size={16} className="text-blue-600 dark:text-blue-400 shrink-0" />
            <span>Qabullaringiz ushbu qurilmada saqlanadi. Barcha qurilmalarda sinxronlash va to'liq boshqarish uchun profilingizga kiring.</span>
          </div>
          <Link
            to="/login"
            state={{ from: '/appointments' }}
            className="px-4 py-1.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition-colors shrink-0"
          >
            Tizimga kirish
          </Link>
        </div>
      )}

      {/* Page Title & Subtitle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {t('myAppointmentsTitle')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t('myAppointmentsSub')}
          </p>
        </div>

        <Link
          to="/search"
          className="px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all shadow-xs shrink-0 self-start sm:self-auto"
        >
          + {t('bookAnother')}
        </Link>
      </div>

      {/* 1-Hour Appointment Reminder Alert & Push Notification Simulation */}
      <AppointmentReminderAlert appointments={appointments} />

      {/* Filter Tabs */}
      <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl w-fit flex-wrap gap-1 border border-slate-200/60 dark:border-slate-700">
        {(['Upcoming', 'History', 'Cancelled'] as const).map((tab) => {
          const count = appointments.filter((a) => {
            if (tab === 'Upcoming') return a.status === 'Confirmed' || a.status === 'Pending';
            if (tab === 'History') return a.status === 'Completed';
            if (tab === 'Cancelled') return a.status === 'Cancelled';
            return true;
          }).length;

          const tabLabel =
            tab === 'Upcoming'
              ? t('upcomingTab')
              : tab === 'History'
              ? t('historyTab')
              : t('cancelledTab');

          const TabIcon =
            tab === 'Upcoming'
              ? Calendar
              : tab === 'History'
              ? History
              : AlertTriangle;

          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === tab
                  ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <TabIcon size={14} className={activeTab === tab ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'} />
              <span>{tabLabel}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  activeTab === tab
                    ? 'bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Appointment History Summary Banner (Shown in History Tab) */}
      {activeTab === 'History' && completedVisits.length > 0 && (
        <div className="bg-gradient-to-r from-blue-900 via-slate-900 to-indigo-900 text-white rounded-3xl p-5 sm:p-6 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-extrabold text-blue-300 uppercase tracking-wider">
              <FileCheck size={14} />
              <span>{t('historyStatsTitle')}</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-white">
              {completedVisits.length} {t('pastConsultationsCount')}
            </h3>
            <p className="text-xs text-slate-300">
              Quickly rebook your trusted medical specialists or book another consultation at partner clinics.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 text-xs font-bold text-slate-200 border border-white/15">
              <CheckCircle2 size={14} className="text-emerald-400" />
              <span>100% Verified Records</span>
            </span>
          </div>
        </div>
      )}

      {/* Upcoming Tab Booking Policy Note */}
      {activeTab === 'Upcoming' && filteredAppointments.some((a) => a.status === 'Confirmed') && (
        <div className="bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/90 dark:border-amber-800/60 rounded-2xl p-4 flex items-start gap-3 text-xs text-amber-900 dark:text-amber-200 shadow-2xs">
          <Lock size={16} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold block">{t('confirmedBookingLocked')}</span>
            <p className="text-amber-800/90 dark:text-amber-300/90 text-[11px] leading-relaxed">
              {t('confirmedBookingLockedNotice')}
            </p>
          </div>
        </div>
      )}

      {/* Appointments List */}
      {filteredAppointments.length === 0 ? (
        <EmptyState
          title={t('noAppointments')}
          description={t('noAppointmentsDesc')}
          actionText={t('findDoctorsBtn')}
          linkTo="/search"
        />
      ) : (
        <div className="space-y-4">
          {filteredAppointments.map((appt) => (
            <div
              key={appt.id}
              data-appointment-id={appt.id}
              className={`rounded-3xl p-5 sm:p-6 border shadow-xs hover:shadow-md transition-all space-y-4 ${
                appt.status === 'Completed'
                  ? 'border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900'
                  : appt.status === 'Cancelled'
                  ? 'border-slate-200/70 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 opacity-90'
                  : 'border-blue-200/70 dark:border-blue-900/50 bg-white dark:bg-slate-900'
              }`}
            >
              {/* Header row: Status, Booking ID, and Date stamp */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 flex-wrap">
                  <StatusBadge status={appt.status} />
                  <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-md">
                    ID: {appt.bookingCode}
                  </span>
                  {(appt.status === 'Confirmed' || appt.status === 'Pending') && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-[10px] font-bold">
                      <Clock size={10} className="text-amber-600 dark:text-amber-400" />
                      <span>{t('reminderEnabled')}</span>
                    </span>
                  )}
                </div>
                <span className="text-xs text-slate-400 dark:text-slate-500">
                  {appt.createdAt.includes('T')
                    ? new Date(appt.createdAt).toLocaleDateString()
                    : appt.createdAt}
                </span>
              </div>

              {/* Doctor & Clinic Details */}
              <div className="flex flex-col sm:flex-row items-start gap-4">
                <img
                  src={appt.doctorPhoto}
                  alt={appt.doctorName}
                  referrerPolicy="no-referrer"
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                />

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white">
                      {appt.doctorName}
                    </h3>
                    <Link
                      to={`/doctors/${appt.doctorId}`}
                      className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Profile &rarr;
                    </Link>
                  </div>
                  <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                    {appt.doctorSpecialty}
                  </p>
                  <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">{appt.clinicName}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 pt-0.5">
                    <MapPin size={13} className="text-slate-400 dark:text-slate-500 shrink-0" />
                    <span>{appt.clinicAddress}</span>
                  </p>
                </div>

                {/* Date & Time Highlight Box */}
                <div
                  className={`w-full sm:w-auto p-3.5 rounded-2xl border text-center sm:text-right shrink-0 ${
                    appt.status === 'Completed'
                      ? 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700'
                      : 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-100 dark:border-blue-900'
                  }`}
                >
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-1">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                      <Calendar size={13} className="text-blue-600 dark:text-blue-400" />
                      {appt.date}
                    </span>
                    <span className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1">
                      <Clock size={14} className="text-blue-600 dark:text-blue-400" />
                      {appt.time}
                    </span>
                  </div>
                  <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold block mt-1">
                    {t('consultationFee')}: {appt.price}
                  </span>
                </div>
              </div>

              {/* Patient info & Visit Reason */}
              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-3 text-xs text-slate-600 dark:text-slate-300 grid grid-cols-1 sm:grid-cols-2 gap-2 border border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-slate-400 dark:text-slate-500">{t('fullName')}: </span>
                  <strong className="text-slate-800 dark:text-slate-200">{appt.patientName}</strong> ({appt.patientPhone})
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500">{t('reasonForVisit')}: </span>
                  <strong className="text-slate-800 dark:text-slate-200">{appt.visitReason || 'General Consultation'}</strong>
                </div>
                {appt.notes && (
                  <div className="sm:col-span-2 text-slate-600 dark:text-slate-300 bg-white/80 dark:bg-slate-900/80 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60 mt-1">
                    <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-0.5">
                      {t('consultationNotes')}:
                    </span>
                    <span className="italic text-slate-600 dark:text-slate-400">"{appt.notes}"</span>
                  </div>
                )}
              </div>

              {/* Action Buttons Row */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex flex-wrap items-center gap-2">
                  {/* Export to Calendar Dropdown (.ics & Google Calendar) */}
                  {(appt.status === 'Confirmed' || appt.status === 'Pending') && (
                    <ExportCalendarMenu
                      appointment={appt}
                      onToast={showToast}
                    />
                  )}

                  {/* Directions */}
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                      appt.clinicAddress
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Navigation size={14} />
                    <span>{t('directions')}</span>
                  </a>

                  {/* Call Clinic */}
                  <a
                    href={`tel:${appt.clinicPhone}`}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Phone size={14} />
                    <span>{appt.clinicPhone}</span>
                  </a>

                  {/* Download PDF Receipt */}
                  <button
                    type="button"
                    onClick={() => {
                      generateAppointmentReceiptPDF(appt);
                      showToast(
                        `${appt.bookingCode || 'DocNear'}: PDF chek yuklab olindi`,
                        'success',
                        t('downloadReceipt') || 'PDF Chek'
                      );
                    }}
                    className="px-3.5 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-blue-200/80 dark:border-blue-800/80"
                    title={t('downloadReceipt') || 'Download PDF Receipt'}
                  >
                    <Download size={14} className="text-blue-600 dark:text-blue-400" />
                    <span>{t('downloadPDF') || 'PDF Chek'}</span>
                  </button>

                  {/* Leave a review for completed appointments */}
                  {appt.status === 'Completed' && (
                    <Link
                      to={`/clinics/${appt.clinicId}#reviews`}
                      className="px-3.5 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-800 dark:text-amber-300 text-xs font-bold flex items-center gap-1.5 transition-colors border border-amber-200/80 dark:border-amber-800/80"
                    >
                      <Star size={13} className="text-amber-600 dark:text-amber-400 fill-amber-500" />
                      <span>{t('writeAReview')}</span>
                    </Link>
                  )}
                </div>

                {/* Primary Action Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  {(appt.status === 'Confirmed' || appt.status === 'Pending') ? (
                    <>
                      <button
                        onClick={() => handleRescheduleAppointment(appt)}
                        className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <Clock size={13} className="text-slate-500 dark:text-slate-400" />
                        <span>{t('reschedule')}</span>
                      </button>
                      <button
                        onClick={() => setCancellingAppt(appt)}
                        className="px-4 py-2 rounded-xl border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        {t('cancelAppointment')}
                      </button>
                    </>
                  ) : (
                    /* History & Past Completed Appointment Rebook Actions */
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRebookClinic(appt)}
                        disabled={isRebookingId === appt.id}
                        className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                        title={t('rebookClinic')}
                      >
                        <Building2 size={13} />
                        <span>{t('rebookClinic')}</span>
                      </button>

                      <button
                        onClick={() => handleRebookDoctor(appt)}
                        disabled={isRebookingId === appt.id}
                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                        title={t('rebookDoctor')}
                      >
                        <RotateCcw size={13} className={isRebookingId === appt.id ? 'animate-spin' : ''} />
                        <span>{t('rebookDoctor')}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cancellation Modal */}
      {cancellingAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full space-y-4">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/60 flex items-center justify-center">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">{t('cancelAppointment')}?</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{t('bookingCode')}: {cancellingAppt.bookingCode}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              {t('cancelPrompt')} ({cancellingAppt.doctorName} - {cancellingAppt.date} {cancellingAppt.time})
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {t('cancelReason')}
              </label>
              <div className="space-y-2">
                {[
                  { id: 'Schedule conflict', label: 'Jadval mos kelmadi / Boshqa vaqtga rejalashtirish (Schedule conflict)' },
                  { id: 'Found earlier appointment', label: 'Boshqa joydan ertaroq qabul topdim (Found an earlier slot)' },
                  { id: 'Symptoms resolved / No longer needed', label: 'Tuzalib ketdim / Zarurat qolmadi (Symptoms resolved)' },
                  { id: 'Transport / Location issue', label: 'Yo‘l yoki joylashuv noqulayligi (Transport / Location issue)' },
                  { id: 'Financial / Cost reason', label: 'Narx yoki to‘lov masalasi (Cost / Financial reason)' },
                  { id: 'Other reason', label: 'Boshqa sabab (Other reason)' },
                ].map((option) => (
                  <label
                    key={option.id}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                      cancelReason === option.id
                        ? 'border-rose-500 bg-rose-50/60 dark:bg-rose-950/40 font-semibold text-rose-900 dark:text-rose-200'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="cancel_reason"
                      value={option.id}
                      checked={cancelReason === option.id}
                      onChange={(e) => setCancelReason(e.target.value)}
                      className="text-rose-600 focus:ring-rose-500"
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setCancellingAppt(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleConfirmCancel}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                {t('confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

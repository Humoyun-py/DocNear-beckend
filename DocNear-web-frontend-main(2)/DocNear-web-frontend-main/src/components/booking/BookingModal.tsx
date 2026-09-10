import React, { useState, useEffect, useRef } from 'react';
import { Clinic, Doctor, DaySchedule } from '../../types';
import { useAppointments } from '../../context/AppointmentContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { clinicService } from '../../services/clinicService';
import { doctorService } from '../../services/doctorService';
import { telegramAuthService } from '../../services/telegramAuthService';
import { authService } from '../../services/authService';
import { TelegramBotSimulator } from '../auth/TelegramBotSimulator';
import { generateAppointmentReceiptPDF } from '../../utils/pdfReceipt';
import { getGoogleCalendarUrl, downloadICalendarFile } from '../../utils/calendarExport';
import { PartnerBadge } from '../common/PartnerBadge';
import { RatingBadge } from '../common/RatingBadge';
import { DistanceBadge } from '../common/DistanceBadge';
import {
  X,
  Check,
  ChevronRight,
  ChevronLeft,
  Building2,
  User,
  Calendar,
  Clock,
  FileText,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  CalendarPlus,
  ShieldCheck,
  Lock,
  Bot,
  Sparkles,
  ExternalLink,
  AlertCircle,
  RefreshCw,
  Eye,
  EyeOff,
  LogIn,
  UserPlus,
  ArrowRight,
  Download,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { triggerHaptic } from '../../utils/haptics';
import {
  formatScheduleDay,
  isTimeSlotInPast,
  getTodayDateString,
  areAllDaySlotsPassed,
} from '../../utils/dateTimeUtils';

export const BookingModal: React.FC = () => {
  const { bookingModal, closeBookingModal, bookAppointment, rescheduleAppointment, showToast } = useAppointments();
  const { user, login, register, openAuthModal } = useAuth();
  const { t, language } = useLanguage();

  const [step, setStep] = useState<number>(1);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(() => getTodayDateString(0));
  const [selectedDateLabel, setSelectedDateLabel] = useState<string>(() => formatScheduleDay(getTodayDateString(0), 'uz').displayLabel);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const submittingRef = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [confirmedBookingCode, setConfirmedBookingCode] = useState<string | null>(null);
  const [remoteSchedule, setRemoteSchedule] = useState<DaySchedule[]>([]);
  useEffect(() => {
    let active = true;
    setRemoteSchedule([]);
    setSelectedTime('');
    if (bookingModal.isOpen && selectedDoctor && selectedClinic) {
      doctorService.getSchedule(selectedDoctor.id, selectedClinic.id)
        .then(days => { if (active) setRemoteSchedule(days); })
        .catch(error => { if (active) showToast(error.message, 'error'); });
    }
    return () => { active = false; };
  }, [bookingModal.isOpen, selectedDoctor?.id, selectedClinic?.id]);

  // Sync localized date label on date or language change
  useEffect(() => {
    if (selectedDate) {
      const formatted = formatScheduleDay(selectedDate, language);
      setSelectedDateLabel(formatted.displayLabel);
    }
  }, [selectedDate, language]);

  // Reset selected time if it has passed on the current date
  useEffect(() => {
    if (selectedTime && isTimeSlotInPast(selectedDate, selectedTime)) {
      setSelectedTime('');
    }
  }, [selectedDate, selectedTime]);

  // Patient Info Form
  const [patientName, setPatientName] = useState<string>('');
  const [patientPhone, setPatientPhone] = useState<string>('');
  const [patientEmail, setPatientEmail] = useState<string>('');
  const [visitReason, setVisitReason] = useState<string>('General Consultation');
  const [patientNotes, setPatientNotes] = useState<string>('');

  // Step 5 In-Modal Auth State when !user
  const [authTab, setAuthTab] = useState<'register' | 'login'>('register');
  const [authStep, setAuthStep] = useState<'form' | 'telegram_verify'>('form');
  const [authFirstName, setAuthFirstName] = useState<string>('');
  const [authLastName, setAuthLastName] = useState<string>('');
  const [authPhone, setAuthPhone] = useState<string>('+998 ');
  const [authPassword, setAuthPassword] = useState<string>('');
  const [authConfirmPassword, setAuthConfirmPassword] = useState<string>('');
  const [showAuthPassword, setShowAuthPassword] = useState<boolean>(false);
  const [showAuthConfirmPassword, setShowAuthConfirmPassword] = useState<boolean>(false);

  // Login inputs (empty by default so user logs in from 0)
  const [loginIdentifier, setLoginIdentifier] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [showLoginPassword, setShowLoginPassword] = useState<boolean>(false);

  // Telegram verification inputs
  const [verificationCode, setVerificationCode] = useState<string>('');
  const [authCountdown, setAuthCountdown] = useState<number>(300);
  const [isBotSimulatorOpen, setIsBotSimulatorOpen] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const botUsername = telegramAuthService.getBotUsername();

  // Sync user profile if logged in
  useEffect(() => {
    if (user) {
      setPatientName(user.name);
      setPatientPhone(user.phone);
      setPatientEmail(user.email);
    }
  }, [user]);

  // Telegram countdown
  useEffect(() => {
    let timer: any;
    if (authStep === 'telegram_verify' && authCountdown > 0) {
      timer = setInterval(() => {
        setAuthCountdown((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [authStep, authCountdown]);

  // Initial load
  useEffect(() => {
    if (bookingModal.isOpen) {
      clinicService.getPartnerClinics().then(setClinics);

      if (user) {
        setPatientName(user.name);
        setPatientPhone(user.phone);
        setPatientEmail(user.email);
      }

      // Initialize preselected data
      if (bookingModal.preselectedClinic) {
        setSelectedClinic(bookingModal.preselectedClinic);
      }
      if (bookingModal.preselectedDoctor) {
        setSelectedDoctor(bookingModal.preselectedDoctor);
        if (!bookingModal.preselectedClinic) {
          clinicService.getClinicById(bookingModal.preselectedDoctor.clinicId).then((c) => {
            if (c) setSelectedClinic(c);
          });
        }
      }
      if (bookingModal.preselectedDate) {
        setSelectedDate(bookingModal.preselectedDate);
      }
      if (bookingModal.preselectedTime) {
        setSelectedTime(bookingModal.preselectedTime);
      }

      // Automatically jump to appropriate step
      if (bookingModal.preselectedDoctor) {
        setStep(3); // Go to date & time selection
      } else if (bookingModal.preselectedClinic) {
        setStep(2); // Go to doctor selection
      } else {
        setStep(1); // Start from clinic selection
      }

      setConfirmedBookingCode(null);
      setAuthError(null);
      setAuthStep('form');
    }
  }, [bookingModal.isOpen, bookingModal.preselectedClinic, bookingModal.preselectedDoctor, bookingModal.preselectedTime]);

  useEffect(() => {
    let active = true;
    setDoctors([]);
    if (selectedClinic && bookingModal.isOpen) doctorService.getDoctorsByClinic(selectedClinic.id)
      .then(items => { if (active) setDoctors(items); }).catch(error => showToast(error.message,'error'));
    return () => { active = false; };
  }, [selectedClinic?.id, bookingModal.isOpen]);

  if (!bookingModal.isOpen) return null;

  // Filter doctors for the selected clinic
  const availableDoctors = selectedClinic
    ? doctors.filter((d) => d.clinicId === selectedClinic.id)
    : doctors;

  // Working schedule for the selected doctor
  const currentSchedule: DaySchedule[] = remoteSchedule;
  const currentDaySlots =
    currentSchedule.find((s) => s.date === selectedDate)?.slots ||
    [];

  const handleNext = () => {
    if (step === 1 && !selectedClinic) return;
    if (step === 2 && !selectedDoctor) return;
    if (step === 3 && !selectedDate) return;
    if (step === 4) {
      if (!selectedTime) return;
      if (isTimeSlotInPast(selectedDate, selectedTime)) {
        showToast(t('slotPassedError'), 'error');
        triggerHaptic('error');
        setSelectedTime('');
        return;
      }
    }
    if (step === 5 && (!user || !patientName)) {
      showToast('Iltimos, avval tizimga kiring yoki ro‘yxatdan o‘ting.', 'error');
      triggerHaptic('error');
      return;
    }
    triggerHaptic('light');
    setStep((prev) => prev + 1);
  };

  const handleBack = () => {
    triggerHaptic('light');
    setStep((prev) => Math.max(1, prev - 1));
  };

  const handleConfirmBooking = async () => {
    if (submittingRef.current) return;
    if (!selectedClinic || !selectedDoctor || !selectedDate || !selectedTime) return;

    if (isTimeSlotInPast(selectedDate, selectedTime)) {
      showToast(t('slotPassedError'), 'error');
      triggerHaptic('error');
      setStep(4);
      return;
    }

    submittingRef.current = true;
    setIsSubmitting(true);
    try {
      const created = bookingModal.rescheduleId
        ? await rescheduleAppointment(bookingModal.rescheduleId, selectedDate, selectedTime)
        : await bookAppointment({
        clinicId: selectedClinic.id,
        clinicName: selectedClinic.name,
        clinicAddress: selectedClinic.address,
        clinicPhone: selectedClinic.phone,
        clinicImage: selectedClinic.image,
        doctorId: selectedDoctor.id,
        doctorName: selectedDoctor.name,
        doctorSpecialty: selectedDoctor.specialty,
        doctorPhoto: selectedDoctor.photo,
        patientName,
        patientPhone,
        patientEmail,
        notes: patientNotes,
        date: selectedDate,
        time: selectedTime,
        price: selectedDoctor.consultationFee,
        visitReason,
      });

      triggerHaptic('success');
      if (!created) throw new Error('Qabul yangilanmadi');
      setConfirmedBookingCode(created.bookingCode);
    } catch (err) {
      console.error('Booking failed:', err);
      showToast(err instanceof Error ? err.message : 'Qabul yaratilmadi', 'error');
      setSelectedTime('');
      setStep(4);
      doctorService.getSchedule(selectedDoctor.id, selectedClinic.id).then(setRemoteSchedule).catch(console.error);
      triggerHaptic('error');
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  // Step names for stepper
  const stepTitles = [
    t('step1'),
    t('step2'),
    t('step3'),
    t('step4'),
    t('step5'),
    t('step6'),
  ];

  return (
    <div
      id="booking-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col transition-colors duration-200"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-850">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              {confirmedBookingCode ? t('bookingConfirmed') : `${t('step1').split(' ')[0]} ${step} / 6`}
            </span>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {confirmedBookingCode ? t('bookingSuccess') : stepTitles[step - 1]}
            </h2>
          </div>

          <button
            onClick={closeBookingModal}
            className="w-9 h-9 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Stepper Progress Bar (Hide on success) */}
        {!confirmedBookingCode && (
          <div className="px-6 py-2.5 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1">
            {[1, 2, 3, 4, 5, 6].map((num) => (
              <div key={num} className="flex-1 flex items-center gap-1.5">
                <div
                  className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                    num <= step ? 'bg-blue-600 dark:bg-blue-500' : 'bg-slate-100 dark:bg-slate-800'
                  }`}
                />
              </div>
            ))}
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* SUCCESS SCREEN */}
          {confirmedBookingCode ? (
            <div className="text-center py-4 space-y-5 animate-in fade-in zoom-in-95 duration-300">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 size={36} />
              </div>

              <div>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  {t('bookingSuccess')}!
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Qabul so‘rovi serverga yuborildi. Holatini “Qabullarim” bo‘limida kuzating.
                </p>
              </div>

              {/* Receipt Summary Card */}
              <div className="bg-slate-50 dark:bg-slate-800/80 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 text-left space-y-3 max-w-md mx-auto">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200/80 dark:border-slate-700">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t('bookingCode')}</span>
                  <span className="text-sm font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-0.5 rounded-md border border-blue-100 dark:border-blue-800">
                    {confirmedBookingCode}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block">{t('clinicName')}</span>
                    <strong className="text-slate-900 dark:text-white">{selectedClinic?.name}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block">{t('doctorName')}</span>
                    <strong className="text-slate-900 dark:text-white">{selectedDoctor?.name}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block">{t('dateAndTime')}</span>
                    <strong className="text-emerald-700 dark:text-emerald-400 font-bold">
                      {selectedDateLabel} • {selectedTime}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block">{t('fullName')}</span>
                    <strong className="text-slate-900 dark:text-white">{patientName}</strong>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/80 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                  <MapPin size={13} className="text-slate-400 dark:text-slate-500 shrink-0" />
                  <span className="truncate">{selectedClinic?.address}</span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    if (selectedDoctor && selectedClinic) {
                      generateAppointmentReceiptPDF({
                        id: 'confirmed-now',
                        bookingCode: confirmedBookingCode,
                        doctorId: selectedDoctor.id,
                        doctorName: selectedDoctor.name,
                        doctorSpecialty: selectedDoctor.specialty,
                        doctorPhoto: selectedDoctor.photo,
                        clinicId: selectedClinic.id,
                        clinicName: selectedClinic.name,
                        clinicAddress: selectedClinic.address,
                        clinicPhone: selectedClinic.phone,
                        date: selectedDate,
                        time: selectedTime,
                        patientName,
                        patientPhone,
                        reasonForVisit: visitReason,
                        notes: patientNotes,
                        status: 'Confirmed',
                        consultationFee: selectedDoctor.consultationFee,
                        createdAt: new Date().toISOString(),
                      });
                      showToast('PDF qabul cheki muvaffaqiyatli yuklab olindi!', 'success', 'PDF Chek');
                    }
                  }}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-bold text-xs border border-emerald-300 dark:border-emerald-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Download size={14} className="text-emerald-600 dark:text-emerald-400" />
                  <span>{t('downloadPDF') || 'PDF Chek'}</span>
                </button>

                {/* Google Calendar */}
                <a
                  href={getGoogleCalendarUrl({
                    title: `DocNear: ${selectedDoctor?.name || 'Doctor'} - ${selectedClinic?.name || 'Clinic'}`,
                    doctorName: selectedDoctor?.name || 'Doctor',
                    doctorSpecialty: selectedDoctor?.specialty,
                    clinicName: selectedClinic?.name || 'Clinic',
                    clinicAddress: selectedClinic?.address || '',
                    clinicPhone: selectedClinic?.phone,
                    date: selectedDate,
                    time: selectedTime,
                    bookingCode: confirmedBookingCode || undefined,
                    patientName,
                  })}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold text-xs border border-blue-200 dark:border-blue-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <CalendarPlus size={14} className="text-blue-600 dark:text-blue-400" />
                  <span>Google Calendar</span>
                </a>

                {/* Apple / iCal .ics file */}
                <button
                  type="button"
                  onClick={() => {
                    downloadICalendarFile({
                      title: `DocNear: ${selectedDoctor?.name || 'Doctor'} - ${selectedClinic?.name || 'Clinic'}`,
                      doctorName: selectedDoctor?.name || 'Doctor',
                      doctorSpecialty: selectedDoctor?.specialty,
                      clinicName: selectedClinic?.name || 'Clinic',
                      clinicAddress: selectedClinic?.address || '',
                      clinicPhone: selectedClinic?.phone,
                      date: selectedDate,
                      time: selectedTime,
                      bookingCode: confirmedBookingCode || undefined,
                      patientName,
                    });
                    showToast('iCal (.ics) taqvim fayli yuklab olindi!', 'success', 'Taqvimga saqlash');
                  }}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs border border-slate-200 dark:border-slate-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Calendar size={14} className="text-slate-600 dark:text-slate-400" />
                  <span>iCal (.ics)</span>
                </button>

                <Link
                  to="/appointments"
                  onClick={closeBookingModal}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <span>{t('viewAppointments')}</span>
                  <ChevronRight size={14} />
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* STEP 1: SELECT CLINIC */}
              {step === 1 && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {t('choosePartnerClinic')}:
                  </p>
                  <div className="grid grid-cols-1 gap-2.5 max-h-96 overflow-y-auto pr-1">
                    {clinics.map((c) => {
                      const isChosen = selectedClinic?.id === c.id;
                      return (
                        <div
                          key={c.id}
                          onClick={() => setSelectedClinic(c)}
                          className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center gap-3.5 ${
                            isChosen
                              ? 'border-blue-600 dark:border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 shadow-xs'
                              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60 bg-white dark:bg-slate-900/60'
                          }`}
                        >
                          <img
                            src={c.image}
                            alt={c.name}
                            referrerPolicy="no-referrer"
                            className="w-14 h-14 rounded-xl object-cover shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                                {c.name}
                              </h4>
                              <PartnerBadge size="sm" showText={false} />
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{c.address}</p>
                            <div className="flex items-center gap-2 mt-1 text-xs">
                              <DistanceBadge distanceKm={c.distanceKm} size="sm" />
                              <RatingBadge rating={c.rating} size="sm" showCount={false} />
                              <span className="text-slate-400 dark:text-slate-500">• {c.doctorCount} {t('doctorsCount')}</span>
                            </div>
                          </div>
                          <div
                            className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                              isChosen
                                ? 'bg-blue-600 border-blue-600 text-white'
                                : 'border-slate-300 dark:border-slate-600'
                            }`}
                          >
                            {isChosen && <Check size={12} />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* STEP 2: SELECT DOCTOR */}
              {step === 2 && (
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50/70 dark:bg-blue-950/40 rounded-2xl border border-blue-100 dark:border-blue-800 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-blue-600 dark:text-blue-400 font-medium">{t('clinicName')}:</span>{' '}
                      <strong className="text-slate-900 dark:text-white">{selectedClinic?.name}</strong>
                    </div>
                    <button
                      onClick={() => setStep(1)}
                      className="text-blue-700 dark:text-blue-400 underline font-medium cursor-pointer"
                    >
                      {t('changeClinic')}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-2.5 max-h-96 overflow-y-auto pr-1">
                    {availableDoctors.map((doc) => {
                      const isChosen = selectedDoctor?.id === doc.id;
                      return (
                        <div
                          key={doc.id}
                          onClick={() => setSelectedDoctor(doc)}
                          className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center gap-3.5 ${
                            isChosen
                              ? 'border-blue-600 dark:border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 shadow-xs'
                              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60 bg-white dark:bg-slate-900/60'
                          }`}
                        >
                          <img
                            src={doc.photo}
                            alt={doc.name}
                            referrerPolicy="no-referrer"
                            className="w-14 h-14 rounded-full object-cover shrink-0 border border-slate-100 dark:border-slate-800"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                              {doc.name}
                            </h4>
                            <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">{doc.specialty}</p>
                            <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 dark:text-slate-400">
                              <span>{doc.experienceYears} {t('yearsExp')}</span>
                              <span>•</span>
                              <RatingBadge rating={doc.rating} size="sm" showCount={false} />
                              <span className="text-emerald-700 dark:text-emerald-400 font-bold ml-auto">
                                {doc.consultationFee}
                              </span>
                            </div>
                          </div>
                          <div
                            className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                              isChosen
                                ? 'bg-blue-600 border-blue-600 text-white'
                                : 'border-slate-300 dark:border-slate-600'
                            }`}
                          >
                            {isChosen && <Check size={12} />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* STEP 3: SELECT DATE */}
              {step === 3 && (
                <div className="space-y-4">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-100 dark:border-slate-700 text-xs flex items-center gap-3">
                    <img
                      src={selectedDoctor?.photo}
                      alt={selectedDoctor?.name}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-full object-cover shrink-0"
                    />
                    <div>
                      <strong className="text-slate-900 dark:text-white block">{selectedDoctor?.name}</strong>
                      <span className="text-slate-500 dark:text-slate-400">
                        {selectedDoctor?.specialty} • {selectedClinic?.name}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5">
                      {t('step3')}
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {currentSchedule.map((day) => {
                        const isChosen = selectedDate === day.date;
                        const localized = formatScheduleDay(day.date, language);
                        return (
                          <button
                            key={day.date}
                            data-date={day.date}
                            onClick={() => {
                              setSelectedDate(day.date);
                              setSelectedDateLabel(localized.displayLabel);
                            }}
                            className={`p-3.5 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                              isChosen
                                ? 'border-blue-600 bg-blue-600 text-white shadow-md'
                                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 text-slate-800 dark:text-slate-200'
                            }`}
                          >
                            <Calendar size={16} className={isChosen ? 'text-blue-100 mb-1' : 'text-slate-400 dark:text-slate-500 mb-1'} />
                            <span className="font-bold text-xs">{localized.displayLabel}</span>
                            {day.isToday && (
                              <span
                                className={`text-[10px] font-semibold mt-1 px-2 py-0.5 rounded-full ${
                                  isChosen ? 'bg-blue-500 text-white' : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                                }`}
                              >
                                {t('today')}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: SELECT TIME */}
              {step === 4 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-blue-50/70 dark:bg-blue-950/40 rounded-2xl border border-blue-100 dark:border-blue-800 text-xs">
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">{t('step3')}:</span>{' '}
                      <strong className="text-blue-700 dark:text-blue-400">{selectedDateLabel}</strong>
                    </div>
                    <button
                      onClick={() => setStep(3)}
                      className="text-blue-700 dark:text-blue-400 underline font-medium cursor-pointer"
                    >
                      {t('changeDay')}
                    </button>
                  </div>

                  {areAllDaySlotsPassed(selectedDate, currentDaySlots) && (
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-2xl text-xs text-amber-800 dark:text-amber-200 flex items-center justify-between gap-2">
                      <span>{t('noAvailableSlotsToday')}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const nextDay = currentSchedule[1];
                          if (nextDay) {
                            setSelectedDate(nextDay.date);
                            setSelectedDateLabel(formatScheduleDay(nextDay.date, language).displayLabel);
                          }
                        }}
                        className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] shrink-0 cursor-pointer"
                      >
                        {t('tomorrow')}
                      </button>
                    </div>
                  )}

                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5">
                      {t('step4')}
                    </h4>

                    <div className="space-y-3">
                      <div>
                        <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 block mb-1.5">
                          {t('morningSlots')}
                        </span>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                          {currentDaySlots
                            .filter((s) => s.period === 'morning')
                            .map((slot) => {
                              const isChosen = selectedTime === slot.time;
                              const isPast = isTimeSlotInPast(selectedDate, slot.time);
                              const isAvailable = slot.isAvailable && !isPast;
                              return (
                                <button
                                  key={slot.time}
                                  data-slot={slot.time}
                                  disabled={!isAvailable}
                                  onClick={() => isAvailable && setSelectedTime(slot.time)}
                                  className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all text-center flex flex-col items-center justify-center ${
                                    !isAvailable
                                      ? 'bg-slate-100 dark:bg-slate-800/40 text-slate-400 dark:text-slate-600 border border-slate-200/50 dark:border-slate-800 cursor-not-allowed opacity-50'
                                      : isChosen
                                      ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-600/30'
                                      : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-500 text-slate-800 dark:text-slate-200 hover:bg-blue-50/40 dark:hover:bg-slate-750 cursor-pointer'
                                  }`}
                                >
                                  <span className={isPast ? 'line-through' : ''}>{slot.time}</span>
                                  {isPast && (
                                    <span className="text-[9px] font-normal text-slate-400 dark:text-slate-500 mt-0.5">
                                      {t('slotPassed')}
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                        </div>
                      </div>

                      <div>
                        <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 block mb-1.5">
                          {t('afternoonSlots')}
                        </span>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                          {currentDaySlots
                            .filter((s) => s.period === 'afternoon' || s.period === 'evening')
                            .map((slot) => {
                              const isChosen = selectedTime === slot.time;
                              const isPast = isTimeSlotInPast(selectedDate, slot.time);
                              const isAvailable = slot.isAvailable && !isPast;
                              return (
                                <button
                                  key={slot.time}
                                  disabled={!isAvailable}
                                  onClick={() => isAvailable && setSelectedTime(slot.time)}
                                  className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all text-center flex flex-col items-center justify-center ${
                                    !isAvailable
                                      ? 'bg-slate-100 dark:bg-slate-800/40 text-slate-400 dark:text-slate-600 border border-slate-200/50 dark:border-slate-800 cursor-not-allowed opacity-50'
                                      : isChosen
                                      ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-600/30'
                                      : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-500 text-slate-800 dark:text-slate-200 hover:bg-blue-50/40 dark:hover:bg-slate-750 cursor-pointer'
                                  }`}
                                >
                                  <span className={isPast ? 'line-through' : ''}>{slot.time}</span>
                                  {isPast && (
                                    <span className="text-[9px] font-normal text-slate-400 dark:text-slate-500 mt-0.5">
                                      {t('slotPassed')}
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 5: PATIENT DETAILS & MANDATORY AUTHENTICATION */}
              {step === 5 && (
                <div className="space-y-4">
                  {!user ? (
                    /* User is NOT logged in: Must log in or register with Telegram verification */
                    <div className="space-y-4">
                      <div className="p-4 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-200/80 dark:border-amber-900/60 text-amber-900 dark:text-amber-200 flex items-start gap-3">
                        <AlertCircle size={20} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                        <div className="text-xs">
                          <strong className="block text-amber-950 dark:text-amber-100 font-bold text-[13px] mb-0.5">
                            Qabulni band qilish uchun hisobingizga kiring
                          </strong>
                          <span>
                            Uchrashuvni rasmiylashtirish va shifokor bilan bog‘lanish uchun avval tizimga kiring yoki yangi hisob oching.
                          </span>
                        </div>
                      </div>

                      {/* Mode switch tabs: Register vs Login */}
                      <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
                        <button
                          type="button"
                          onClick={() => {
                            setAuthError(null);
                            setAuthTab('register');
                            setAuthStep('form');
                          }}
                          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                            authTab === 'register'
                              ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          <UserPlus size={14} />
                          <span>Ro‘yxatdan o‘tish</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setAuthError(null);
                            setAuthTab('login');
                          }}
                          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                            authTab === 'login'
                              ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          <LogIn size={14} />
                          <span>Tizimga kirish</span>
                        </button>
                      </div>

                      {authError && (
                        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-300 text-xs flex items-start gap-2">
                          <AlertCircle size={15} className="text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                          <span>{authError}</span>
                        </div>
                      )}

                      {/* --- REGISTER SUB-FLOW --- */}
                      {authTab === 'register' && (
                        <>
                          {authStep === 'form' ? (
                            <form
                              onSubmit={async (e) => {
                                e.preventDefault();
                                setAuthError(null);
                                const fName = authFirstName.trim();
                                const lName = authLastName.trim();
                                const pNum = authPhone.trim();

                                if (!fName) {
                                  setAuthError('Iltimos, ismingizni kiriting.');
                                  return;
                                }
                                if (!lName) {
                                  setAuthError('Iltimos, familiyangizni kiriting.');
                                  return;
                                }
                                if (pNum.length < 9) {
                                  setAuthError('Iltimos, to‘liq telefon raqamingizni kiriting.');
                                  return;
                                }
                                if (!authPassword || authPassword.length < 6) {
                                  setAuthError('Parol kamida 6 ta belgidan iborat bo‘lishi kerak.');
                                  return;
                                }
                                if (authPassword !== authConfirmPassword) {
                                  setAuthError('Parol va parolni tasdiqlash mos kelmadi.');
                                  return;
                                }

                                setAuthLoading(true);
                                try { await register({firstName:fName,lastName:lName,phone:pNum,password:authPassword}); }
                                catch(error) { setAuthError(error instanceof Error ? error.message : 'Ro‘yxatdan o‘tish bajarilmadi'); }
                                finally { setAuthLoading(false); }
                              }}
                              className="space-y-3.5"
                            >
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {/* Ism */}
                                <div>
                                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                    Ism <span className="text-rose-500">*</span>
                                  </label>
                                  <div className="relative">
                                    <User size={15} className="absolute left-3.5 top-3 text-slate-400 dark:text-slate-500" />
                                    <input
                                      type="text"
                                      required
                                      value={authFirstName}
                                      onChange={(e) => setAuthFirstName(e.target.value)}
                                      placeholder="Aziza"
                                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
                                    />
                                  </div>
                                </div>

                                {/* Familiya */}
                                <div>
                                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                    Familiya <span className="text-rose-500">*</span>
                                  </label>
                                  <div className="relative">
                                    <User size={15} className="absolute left-3.5 top-3 text-slate-400 dark:text-slate-500" />
                                    <input
                                      type="text"
                                      required
                                      value={authLastName}
                                      onChange={(e) => setAuthLastName(e.target.value)}
                                      placeholder="Rakhimova"
                                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Telefon nomer */}
                              <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                  Telefon raqam (Telegram ulangan) <span className="text-rose-500">*</span>
                                </label>
                                <div className="relative">
                                  <Phone size={15} className="absolute left-3.5 top-3 text-slate-400 dark:text-slate-500" />
                                  <input
                                    type="tel"
                                    required
                                    value={authPhone}
                                    onChange={(e) => setAuthPhone(e.target.value)}
                                    placeholder="+998 90 123 45 67"
                                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
                                  />
                                </div>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                                  <Bot size={12} className="text-blue-600 dark:text-blue-400" />
                                  <span>Tasdiqlash kodi @{botUsername} orqali beriladi</span>
                                </p>
                              </div>

                              {/* Parol & Parolni tasdiqlash */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                    Parol <span className="text-rose-500">*</span>
                                  </label>
                                  <div className="relative">
                                    <Lock size={15} className="absolute left-3.5 top-3 text-slate-400 dark:text-slate-500" />
                                    <input
                                      type={showAuthPassword ? 'text' : 'password'}
                                      required
                                      value={authPassword}
                                      onChange={(e) => setAuthPassword(e.target.value)}
                                      placeholder="Kamida 6 belgi"
                                      className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => setShowAuthPassword(!showAuthPassword)}
                                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                    >
                                      {showAuthPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                                    </button>
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                    Parolni tasdiqlash <span className="text-rose-500">*</span>
                                  </label>
                                  <div className="relative">
                                    <Lock size={15} className="absolute left-3.5 top-3 text-slate-400 dark:text-slate-500" />
                                    <input
                                      type={showAuthConfirmPassword ? 'text' : 'password'}
                                      required
                                      value={authConfirmPassword}
                                      onChange={(e) => setAuthConfirmPassword(e.target.value)}
                                      placeholder="Parolni qaytaring"
                                      className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => setShowAuthConfirmPassword(!showAuthConfirmPassword)}
                                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                    >
                                      {showAuthConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                                    </button>
                                  </div>
                                </div>
                              </div>

                              <button
                                type="submit"
                                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                              >
                                <span>Telegram orqali tasdiqlash</span>
                                <ArrowRight size={14} />
                              </button>
                            </form>
                          ) : (
                            /* Telegram Verification Step in Register */
                            <div className="space-y-4">
                              <div className="p-3.5 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 text-slate-800 dark:text-slate-200 space-y-2">
                                <div className="flex items-center gap-1.5 text-sky-900 dark:text-sky-300 font-bold text-xs">
                                  <Bot size={16} className="text-sky-600 dark:text-sky-400" />
                                  <span>Telegram Bot orqali tasdiqlash:</span>
                                </div>
                                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                                  Telegram'da <strong>@{botUsername}</strong> botiga kiring, <strong>/start</strong> tugmasini bosing va <strong>{authPhone}</strong> raqamini yuboring.
                                </p>

                                <div className="flex gap-2 pt-1">
                                  <button
                                    type="button"
                                    onClick={() => setIsBotSimulatorOpen(true)}
                                    className="flex-1 py-1.5 px-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 text-white text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer hover:bg-slate-800 dark:hover:bg-slate-700"
                                  >
                                    <Sparkles size={12} className="text-sky-400" />
                                    <span>Bot Simulyatori</span>
                                  </button>
                                  <a
                                    href={`https://t.me/${botUsername}?start=auth_${authPhone.replace(/[^0-9]/g, '')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 py-1.5 px-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-[11px] font-bold flex items-center justify-center gap-1 text-center"
                                  >
                                    <ExternalLink size={12} />
                                    <span>Telegram'da ochish</span>
                                  </a>
                                </div>
                              </div>

                              {isBotSimulatorOpen && (
                                <div className="p-3 bg-slate-950/5 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
                                  <div className="flex items-center justify-between mb-2 px-1">
                                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                      Telegram Bot Simulyatori
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => setIsBotSimulatorOpen(false)}
                                      className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                                    >
                                      Yopish
                                    </button>
                                  </div>
                                  <TelegramBotSimulator
                                    phone={authPhone}
                                    firstName={authFirstName}
                                    lastName={authLastName}
                                    onCodeReceived={(code) => {
                                      setVerificationCode(code);
                                      setIsBotSimulatorOpen(false);
                                    }}
                                    onClose={() => setIsBotSimulatorOpen(false)}
                                  />
                                </div>
                              )}

                              <form
                                onSubmit={async (e) => {
                                  e.preventDefault();
                                  setAuthError(null);
                                  if (!verificationCode || verificationCode.length < 6) {
                                    setAuthError('Iltimos, 6 xonali tasdiqlash kodini kiriting.');
                                    return;
                                  }

                                  setAuthLoading(true);
                                  try {
                                    const verifyRes = telegramAuthService.verifyCode(authPhone, verificationCode);
                                    if (!verifyRes.success) {
                                      setAuthError(verifyRes.message);
                                      setAuthLoading(false);
                                      return;
                                    }

                                    await register({
                                      firstName: authFirstName,
                                      lastName: authLastName,
                                      phone: authPhone,
                                      password: authPassword,
                                    });

                                    setPatientName(`${authFirstName} ${authLastName}`.trim());
                                    setPatientPhone(authPhone);
                                    showToast('Hisobingiz muvaffaqiyatli tasdiqlandi!', 'success');
                                    triggerHaptic('success');
                                    setStep(6);
                                  } catch (err: any) {
                                    setAuthError(err.message || 'Tasdiqlashda xatolik yuz berdi.');
                                  } finally {
                                    setAuthLoading(false);
                                  }
                                }}
                                className="space-y-3"
                              >
                                <div>
                                  <div className="flex items-center justify-between mb-1">
                                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                      6 xonali tasdiqlash kodi
                                    </label>
                                    <span className="text-[11px] font-mono text-blue-600 dark:text-blue-400 font-bold">
                                      {Math.floor(authCountdown / 60)}:
                                      {(authCountdown % 60 < 10 ? '0' : '') + (authCountdown % 60)}
                                    </span>
                                  </div>
                                  <input
                                    type="text"
                                    maxLength={6}
                                    required
                                    value={verificationCode}
                                    onChange={(e) => setVerificationCode(e.target.value.replace(/[^0-9]/g, ''))}
                                    placeholder="849201"
                                    className="w-full text-center py-2.5 rounded-xl border-2 border-blue-600 bg-white dark:bg-slate-800 text-lg font-mono font-bold tracking-widest text-slate-900 dark:text-white focus:outline-none"
                                  />
                                </div>

                                <button
                                  type="submit"
                                  disabled={authLoading || verificationCode.length < 6}
                                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                                >
                                  {authLoading ? (
                                    <>
                                      <RefreshCw size={14} className="animate-spin" />
                                      <span>Tekshirilmoqda...</span>
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle2 size={15} />
                                      <span>Tasdiqlash va Davom etish</span>
                                    </>
                                  )}
                                </button>

                                <div className="flex items-center justify-between text-xs pt-1">
                                  <button
                                    type="button"
                                    onClick={() => setAuthStep('form')}
                                    className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                                  >
                                    ← Ma‘lumotlarni o‘zgartirish
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      telegramAuthService.resendCode(authPhone, authFirstName, authLastName);
                                      setAuthCountdown(300);
                                      setVerificationCode('');
                                      showToast('Yangi kod tayyorlandi.', 'info');
                                    }}
                                    className="text-blue-600 dark:text-blue-400 font-bold hover:underline"
                                  >
                                    Qayta yuborish
                                  </button>
                                </div>
                              </form>
                            </div>
                          )}
                        </>
                      )}

                      {/* --- LOGIN SUB-FLOW --- */}
                      {authTab === 'login' && (
                        <div className="space-y-3.5">
                          <form
                            onSubmit={async (e) => {
                              e.preventDefault();
                              setAuthError(null);
                              setAuthLoading(true);
                              try {
                                await login(loginIdentifier, loginPassword);
                                const currentUser = authService.getCurrentUser();
                                if (currentUser) {
                                  setPatientName(currentUser.name);
                                  setPatientPhone(currentUser.phone || loginIdentifier);
                                  if (currentUser.email) setPatientEmail(currentUser.email);
                                }

                                showToast('Tizimga muvaffaqiyatli kirdingiz!', 'success');
                                triggerHaptic('success');
                                setStep(6);
                              } catch (err: any) {
                                setAuthError(err.message || 'Kirishda xatolik yuz berdi.');
                              } finally {
                                setAuthLoading(false);
                              }
                            }}
                            className="space-y-3"
                          >
                            <div>
                              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                {language === 'ru'
                                  ? 'Имя, номер телефона или Email'
                                  : language === 'en'
                                  ? 'Name, Phone number or Email'
                                  : 'Ism, telefon raqam yoki email'}
                              </label>
                              <div className="relative">
                                <User size={15} className="absolute left-3.5 top-3 text-slate-400 dark:text-slate-500" />
                                <input
                                  type="text"
                                  required
                                  value={loginIdentifier}
                                  onChange={(e) => setLoginIdentifier(e.target.value)}
                                  placeholder={
                                    language === 'ru'
                                      ? 'Ваше имя, телефон или email'
                                      : language === 'en'
                                      ? 'Your name, phone or email'
                                      : 'Ismingiz, telefon yoki email (Masalan: Aziza)'
                                  }
                                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                Parol
                              </label>
                              <div className="relative">
                                <Lock size={15} className="absolute left-3.5 top-3 text-slate-400 dark:text-slate-500" />
                                <input
                                  type={showLoginPassword ? 'text' : 'password'}
                                  required
                                  value={loginPassword}
                                  onChange={(e) => setLoginPassword(e.target.value)}
                                  placeholder="••••••••"
                                  className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                >
                                  {showLoginPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                                </button>
                              </div>
                            </div>

                            <button
                              type="submit"
                              disabled={authLoading}
                              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                            >
                              {authLoading ? (
                                <>
                                  <RefreshCw size={14} className="animate-spin" />
                                  <span>Kirilmoqda...</span>
                                </>
                              ) : (
                                <>
                                  <span>Tizimga kirish va Davom etish</span>
                                  <ArrowRight size={14} />
                                </>
                              )}
                            </button>
                          </form>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* User IS logged in: Display verified user badge, reason for visit, and notes */
                    <div className="space-y-4">
                      <div className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/90 dark:border-emerald-800/80 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
                            {user.name.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h4 className="font-bold text-sm text-slate-900 dark:text-white">{user.name}</h4>
                              <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold flex items-center gap-0.5">
                                <CheckCircle2 size={11} className="text-emerald-600 dark:text-emerald-400" />
                                Tasdiqlangan
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                              <Phone size={12} className="text-slate-400 dark:text-slate-500" />
                              <span>{user.phone}</span>
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            {t('fullName')} *
                          </label>
                          <div className="relative">
                            <User size={15} className="absolute left-3 top-3 text-slate-400 dark:text-slate-500" />
                            <input
                              type="text"
                              required
                              value={patientName}
                              onChange={(e) => setPatientName(e.target.value)}
                              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            {t('phoneNumber')} *
                          </label>
                          <div className="relative">
                            <Phone size={15} className="absolute left-3 top-3 text-slate-400 dark:text-slate-500" />
                            <input
                              type="tel"
                              required
                              value={patientPhone}
                              onChange={(e) => setPatientPhone(e.target.value)}
                              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          {t('reasonForVisit')}
                        </label>
                        <select
                          value={visitReason}
                          onChange={(e) => setVisitReason(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
                        >
                          <option value="General Consultation" className="dark:bg-slate-800">General Consultation / First Visit</option>
                          <option value="Follow-up Checkup" className="dark:bg-slate-800">Follow-up Checkup</option>
                          <option value="Acute Pain or Discomfort" className="dark:bg-slate-800">Acute Pain or Discomfort</option>
                          <option value="Lab & ECG Analysis" className="dark:bg-slate-800">Lab & Diagnostic Review</option>
                          <option value="Routine Preventive Screening" className="dark:bg-slate-800">Routine Preventive Screening</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          {t('additionalNotes')}
                        </label>
                        <textarea
                          rows={2}
                          value={patientNotes}
                          onChange={(e) => setPatientNotes(e.target.value)}
                          placeholder="Shifokorga yetkazilishi kerak bo‘lgan qo‘shimcha ma‘lumotlar..."
                          className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={handleNext}
                        disabled={!patientName.trim() || !patientPhone.trim()}
                        className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        <span>Davom etish (Tasdiqlashga o‘tish)</span>
                        <ChevronRight size={15} />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 6: FINAL BOOKING SUMMARY */}
              {step === 6 && (
                <div className="space-y-4">
                  <div className="bg-slate-50 dark:bg-slate-800/80 rounded-2xl p-4 border border-slate-200/90 dark:border-slate-700 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        {t('step6')}
                      </span>
                      <PartnerBadge size="sm" />
                    </div>

                    <div className="flex items-center gap-3">
                      <img
                        src={selectedDoctor?.photo}
                        alt={selectedDoctor?.name}
                        referrerPolicy="no-referrer"
                        className="w-14 h-14 rounded-2xl object-cover shrink-0 border border-white dark:border-slate-700 shadow-xs"
                      />
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                          {selectedDoctor?.name}
                        </h4>
                        <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                          {selectedDoctor?.specialty}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{selectedClinic?.name}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-200 dark:border-slate-700">
                      <div>
                        <span className="text-slate-400 dark:text-slate-500 block">{t('dateAndTime')}:</span>
                        <strong className="text-slate-900 dark:text-white font-semibold">
                          {selectedDateLabel} • {selectedTime}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-400 dark:text-slate-500 block">{t('consultationFee')}:</span>
                        <strong className="text-emerald-700 dark:text-emerald-400 font-bold text-sm">
                          {selectedDoctor?.consultationFee}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-400 dark:text-slate-500 block">{t('fullName')}:</span>
                        <strong className="text-slate-900 dark:text-white">{patientName}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 dark:text-slate-500 block">{t('phoneNumber')}:</span>
                        <strong className="text-slate-900 dark:text-white">{patientPhone}</strong>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <MapPin size={13} className="text-slate-400 dark:text-slate-500 shrink-0" />
                      <span>{selectedClinic?.address}</span>
                    </div>
                  </div>

                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800/80 flex items-start gap-2.5 text-xs text-emerald-800 dark:text-emerald-300">
                    <ShieldCheck size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <p>
                      <strong>{t('noPrepayment')}.</strong> {t('payAtClinic')}
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Navigation Buttons */}
        {!confirmedBookingCode && (
          <div className="px-6 py-4 bg-slate-50 dark:bg-slate-850 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            {step > 1 ? (
              <button
                onClick={handleBack}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft size={14} />
                <span>{t('back')}</span>
              </button>
            ) : (
              <div />
            )}

            {step < 6 ? (
              <button
                onClick={handleNext}
                data-testid="booking-continue"
                disabled={
                  (step === 1 && !selectedClinic) ||
                  (step === 2 && !selectedDoctor) ||
                  (step === 3 && !selectedDate) ||
                  (step === 4 && !selectedTime) ||
                  (step === 5 && (!user || !patientName))
                }
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-all shadow-xs hover:shadow-md flex items-center gap-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>{t('continue')}</span>
                <ChevronRight size={14} />
              </button>
            ) : (
              <button
                onClick={handleConfirmBooking}
                data-testid="booking-confirm"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs hover:shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>{t('confirmBooking')}...</span>
                ) : (
                  <>
                    <Check size={15} />
                    <span>{t('confirmBooking')}</span>
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Appointment, WaitlistEntry } from '../../types';
import { useAppointments } from '../../context/AppointmentContext';
import { useLanguage } from '../../context/LanguageContext';
import { waitlistService } from '../../services/waitlistService';
import { doctorService } from '../../services/doctorService';
import { clinicService } from '../../services/clinicService';
import {
  Calendar,
  Building2,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Bell,
  Stethoscope,
  ArrowRight,
  Sparkles,
  Zap,
  RotateCcw,
  CalendarDays,
  UserCheck,
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface BookingDashboardProps {
  appointments: Appointment[];
}

export const BookingDashboard: React.FC<BookingDashboardProps> = ({ appointments }) => {
  const { t, language } = useLanguage();
  const {
    openBookingModal,
    trigger24HourReminder,
    trigger1HourReminder,
    showToast,
  } = useAppointments();

  const [waitlists, setWaitlists] = useState<WaitlistEntry[]>([]);
  const [isCheckingSlot, setIsCheckingSlot] = useState<string | null>(null);

  const loadWaitlists = async () => {
    const data = await waitlistService.getWaitlists();
    setWaitlists(data);
  };

  useEffect(() => {
    loadWaitlists();
  }, []);

  // 1. Calculate stats
  const totalCount = appointments.length;

  const currentMonthYear = '2026-08'; // August 2026
  const thisMonthAppointments = appointments.filter((a) =>
    a.date ? a.date.startsWith(currentMonthYear) : true
  );
  const thisMonthCount = thisMonthAppointments.length;

  const confirmedCount = appointments.filter((a) => a.status === 'Confirmed').length;
  const pendingCount = appointments.filter((a) => a.status === 'Pending').length;
  const completedCount = appointments.filter((a) => a.status === 'Completed').length;
  const cancelledCount = appointments.filter((a) => a.status === 'Cancelled').length;

  // 2. Most Visited Clinics calculation
  const clinicVisitMap: Record<
    string,
    { id: string; name: string; address: string; image: string; count: number }
  > = {};

  appointments.forEach((apt) => {
    const clinicId = apt.clinicId || 'clinic-1';
    if (!clinicVisitMap[clinicId]) {
      clinicVisitMap[clinicId] = {
        id: clinicId,
        name: apt.clinicName,
        address: apt.clinicAddress || '',
        image: apt.clinicImage || 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=600&q=80',
        count: 0,
      };
    }
    clinicVisitMap[clinicId].count += 1;
  });

  const mostVisitedClinics = Object.values(clinicVisitMap).sort((a, b) => b.count - a.count);

  // 3. Top Visited Doctors calculation
  const doctorVisitMap: Record<
    string,
    { id: string; name: string; specialty: string; photo: string; clinicName: string; count: number }
  > = {};

  appointments.forEach((apt) => {
    const docId = apt.doctorId || 'doc-1';
    if (!doctorVisitMap[docId]) {
      doctorVisitMap[docId] = {
        id: docId,
        name: apt.doctorName,
        specialty: apt.doctorSpecialty || 'General Specialist',
        photo: apt.doctorPhoto || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=400&q=80',
        clinicName: apt.clinicName,
        count: 0,
      };
    }
    doctorVisitMap[docId].count += 1;
  });

  const topDoctors = Object.values(doctorVisitMap).sort((a, b) => b.count - a.count);

  // 4. Specialty Breakdown
  const specialtyMap: Record<string, number> = {};
  appointments.forEach((apt) => {
    const spec = apt.doctorSpecialty || 'General Medicine';
    specialtyMap[spec] = (specialtyMap[spec] || 0) + 1;
  });
  const topSpecialties = Object.entries(specialtyMap)
    .map(([name, count]) => ({ name, count, percent: totalCount > 0 ? Math.round((count / totalCount) * 100) : 0 }))
    .sort((a, b) => b.count - a.count);

  // Handle Waitlist slot simulation
  const handleCheckSlot = async (waitlistId: string) => {
    setIsCheckingSlot(waitlistId);
    try {
      const updated = await waitlistService.checkAvailability(waitlistId);
      if (updated.availableSlot) {
        await loadWaitlists();
        showToast(
          `Bo‘sh o‘rin ochildi! ${updated.doctorName || updated.clinicName} qabuliga (${updated.availableSlot?.date}, soat ${updated.availableSlot?.time}) band qilish imkoniyati paydo bo‘ldi.`,
          'booking',
          'Kutish ro‘yxatida bo‘sh o‘rin topildi!',
          { link: '/appointments', time: `${updated.availableSlot?.date} • ${updated.availableSlot?.time}` }
        );
      } else { showToast('Hozircha bo‘sh vaqt topilmadi', 'info'); }
    } finally {
      setIsCheckingSlot(null);
    }
  };

  const handleBookFromWaitlist = async (entry: WaitlistEntry) => {
    if (!entry.doctorId || !entry.availableSlot) return;
    try {
      const [doctor,clinic] = await Promise.all([doctorService.getDoctorById(entry.doctorId),clinicService.getClinicById(entry.clinicId)]);
      openBookingModal({doctor,clinic,date:entry.availableSlot.date,time:entry.availableSlot.time});
    } catch(error) { showToast(error instanceof Error ? error.message : 'Yuklanmadi','error'); }
  };

  return (
    <div className="space-y-6" id="booking-insights-dashboard">
      {/* Top Banner & Header */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-700 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-blue-100 text-xs font-semibold mb-1">
              <TrendingUp size={14} className="text-amber-300" />
              <span>{t('dashboardTitle') || 'Qabullar tahlili va ko‘rsatkichlar'}</span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-white">
              {language === 'uz' ? 'Shaxsiy qabullar monitoringi' : language === 'ru' ? 'Сводка и паттерны записей' : 'Booking Activity & Insights'}
            </h2>
            <p className="text-xs md:text-sm text-blue-100 max-w-xl">
              {t('dashboardSub') || 'Sizning shifokor va klinikalarga tashriflaringiz xulosasi va vaqt tahlili'}
            </p>
          </div>

          {/* Quick Reminder Test Pill */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => trigger24HourReminder()}
              className="py-2 px-3 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition-all border border-white/20 flex items-center gap-1.5 cursor-pointer backdrop-blur-md shadow-xs"
              title="Test 24-hour pre-appointment toast"
            >
              <Bell size={13} className="text-amber-300" />
              <span>24h Eslatma</span>
            </button>
            <button
              onClick={() => trigger1HourReminder()}
              className="py-2 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Test 1-hour pre-appointment alert toast"
            >
              <Zap size={13} className="fill-slate-950" />
              <span>1h Alert</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Stat 1: Total Bookings */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs hover:shadow-sm transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t('totalAppointments') || 'Jami qabullar'}</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Calendar size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">{totalCount}</span>
            <span className="text-[11px] font-semibold text-slate-400">barcha vaqt</span>
          </div>
        </div>

        {/* Stat 2: This Month */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs hover:shadow-sm transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t('thisMonthAppointments') || 'Shu oyda (Avgust)'}</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CalendarDays size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{thisMonthCount}</span>
            <span className="text-[11px] font-semibold text-emerald-600/80 dark:text-emerald-400/80">ta tashrif</span>
          </div>
        </div>

        {/* Stat 3: Completed Visits */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs hover:shadow-sm transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t('completedVisits') || 'Yakunlangan'}</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{completedCount}</span>
            <span className="text-[11px] font-semibold text-slate-400">konsultatsiya</span>
          </div>
        </div>

        {/* Stat 4: Active / Waitlist */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs hover:shadow-sm transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Faol / Kutishda</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-600 dark:text-amber-400">{confirmedCount + pendingCount}</span>
            <span className="text-[11px] font-semibold text-slate-400">({waitlists.length} kutish ro‘yxatida)</span>
          </div>
        </div>
      </div>

      {/* Main Analysis Section: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Most Visited Clinics & Top Doctors (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Most Visited Clinics Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
                  <Building2 size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {t('mostVisitedClinics') || 'Eng ko‘p tashrif buyurilgan klinikalar'}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Tashriflar soni va foiz ko‘rsatkichi</p>
                </div>
              </div>
            </div>

            {mostVisitedClinics.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs">Hozircha klinikalar tarixi yo‘q</div>
            ) : (
              <div className="space-y-3.5">
                {mostVisitedClinics.slice(0, 4).map((clinic, idx) => {
                  const percent = totalCount > 0 ? Math.round((clinic.count / totalCount) * 100) : 0;
                  return (
                    <div
                      key={clinic.id}
                      className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-800 transition-all space-y-2"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="w-5 h-5 rounded-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-[11px] font-black text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <img
                            src={clinic.image}
                            alt={clinic.name}
                            className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                            referrerPolicy="no-referrer"
                          />
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">{clinic.name}</h4>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{clinic.address}</p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-xs font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md">
                            {clinic.count} {t('visits') || 'tashrif'}
                          </span>
                        </div>
                      </div>

                      {/* Percentage Bar */}
                      <div className="space-y-1">
                        <div className="w-full bg-slate-200/80 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-blue-600 h-1.5 rounded-full transition-all duration-500"
                            style={{ width: `${Math.max(percent, 10)}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                          <span>Umumiy qabullarning {percent}% qismi</span>
                          <Link
                            to={`/clinics/${clinic.id}`}
                            className="text-blue-600 dark:text-blue-400 hover:underline font-semibold flex items-center gap-0.5"
                          >
                            <span>Klinikani ko‘rish</span>
                            <ArrowRight size={10} />
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Top Doctors Consulted */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                  <Stethoscope size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {t('topDoctorsConsulted') || 'Eng ko‘p murojaat qilingan shifokorlar'}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Siz ishonch bildirgan mutaxassislar</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {topDoctors.slice(0, 4).map((doc) => (
                <div
                  key={doc.id}
                  className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2.5"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={doc.photo}
                      alt={doc.name}
                      className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">{doc.name}</h4>
                      <p className="text-[11px] text-blue-600 dark:text-blue-400 font-medium truncate">{doc.specialty}</p>
                      <p className="text-[10px] text-slate-400 truncate">{doc.clinicName}</p>
                    </div>
                  </div>
                  <span className="shrink-0 px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 font-bold text-xs">
                    {doc.count}x
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Status Breakdown, Patterns & Waitlists (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Booking Status Breakdown Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {t('bookingStatusBreakdown') || 'Qabullar holati taqsimoti'}
              </h3>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{totalCount} jami</span>
            </div>

            {/* Visual Colored Bar */}
            <div className="w-full h-3 rounded-full overflow-hidden flex bg-slate-100 dark:bg-slate-800 mb-3">
              {confirmedCount > 0 && (
                <div
                  style={{ width: `${(confirmedCount / totalCount) * 100}%` }}
                  className="bg-emerald-500 transition-all"
                  title={`Confirmed: ${confirmedCount}`}
                />
              )}
              {pendingCount > 0 && (
                <div
                  style={{ width: `${(pendingCount / totalCount) * 100}%` }}
                  className="bg-amber-400 transition-all"
                  title={`Pending: ${pendingCount}`}
                />
              )}
              {completedCount > 0 && (
                <div
                  style={{ width: `${(completedCount / totalCount) * 100}%` }}
                  className="bg-blue-500 transition-all"
                  title={`Completed: ${completedCount}`}
                />
              )}
              {cancelledCount > 0 && (
                <div
                  style={{ width: `${(cancelledCount / totalCount) * 100}%` }}
                  className="bg-rose-400 transition-all"
                  title={`Cancelled: ${cancelledCount}`}
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300">
                <span className="flex items-center gap-1.5 text-[11px] font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Tasdiqlangan
                </span>
                <span className="font-bold">{confirmedCount}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300">
                <span className="flex items-center gap-1.5 text-[11px] font-semibold">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  Kutilmoqda
                </span>
                <span className="font-bold">{pendingCount}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-300">
                <span className="flex items-center gap-1.5 text-[11px] font-semibold">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  Bajarildi
                </span>
                <span className="font-bold">{completedCount}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-300">
                <span className="flex items-center gap-1.5 text-[11px] font-semibold">
                  <span className="w-2 h-2 rounded-full bg-rose-400" />
                  Bekor qilingan
                </span>
                <span className="font-bold">{cancelledCount}</span>
              </div>
            </div>
          </div>

          {/* Specialty Categories */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Tibbiy yo‘nalishlar taqsimoti</h3>
            <div className="space-y-2.5">
              {topSpecialties.slice(0, 4).map((spec) => (
                <div key={spec.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <span>{spec.name}</span>
                    <span className="text-slate-500 dark:text-slate-400">{spec.count} ta ({spec.percent}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-indigo-500 h-1.5 rounded-full"
                      style={{ width: `${Math.max(spec.percent, 12)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active Waitlists Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Bell size={16} className="text-amber-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {t('myWaitlists') || 'Mening kutish ro‘yxatlarim'}
                </h3>
              </div>
              <span className="text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-md">
                {waitlists.length} faol
              </span>
            </div>

            {waitlists.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-3">Faol kutish ro‘yxati mavjud emas.</p>
            ) : (
              <div className="space-y-2.5">
                {waitlists.map((entry) => (
                  <div
                    key={entry.id}
                    className={`p-3 rounded-2xl border transition-all text-xs space-y-2 ${
                      entry.status === 'slot_available'
                        ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700 ring-1 ring-emerald-400/30'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <strong className="block font-bold text-slate-900 dark:text-white">
                          {entry.doctorName || entry.clinicName}
                        </strong>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                          Sana: {entry.preferredDate} ({entry.preferredTimeRange})
                        </span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                          entry.status === 'slot_available'
                            ? 'bg-emerald-600 text-white animate-pulse'
                            : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-400'
                        }`}
                      >
                        {entry.status === 'slot_available' ? 'Bo‘sh o‘rin ochildi' : 'Kutilmoqda'}
                      </span>
                    </div>

                    {/* Action buttons for waitlist */}
                    <div className="flex items-center gap-2 pt-1">
                      {entry.status === 'slot_available' ? (
                        <button
                          onClick={() => handleBookFromWaitlist(entry)}
                          className="flex-1 py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <CheckCircle2 size={13} />
                          <span>Band qilish ({entry.availableSlot?.time})</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleCheckSlot(entry.id)}
                          disabled={isCheckingSlot === entry.id}
                          className="flex-1 py-1.5 px-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-semibold text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                          title="Check doctor availability alert"
                        >
                          <Sparkles size={12} className="text-blue-600 dark:text-blue-400" />
                          <span>{isCheckingSlot === entry.id ? 'Tekshirilmoqda...' : 'Bo‘sh vaqtni tekshirish'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

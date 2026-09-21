import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Doctor, Clinic } from '../types';
import { doctorService } from '../services/doctorService';
import { clinicService } from '../services/clinicService';
import { useLocation } from '../context/LocationContext';
import { useAuth } from '../context/AuthContext';
import { useAppointments } from '../context/AppointmentContext';
import { useLanguage } from '../context/LanguageContext';
import { formatScheduleDay, isTimeSlotInPast } from '../utils/dateTimeUtils';
import { RatingBadge } from '../components/common/RatingBadge';
import { DistanceBadge } from '../components/common/DistanceBadge';
import { PartnerBadge } from '../components/common/PartnerBadge';
import { WaitlistModal } from '../components/waitlist/WaitlistModal';
import { DoctorCardSkeleton, DoctorDetailsSkeleton } from '../components/common/SkeletonCard';
import { ReviewsSection } from '../components/reviews/ReviewsSection';
import { DoctorAvailabilityHeatmap } from '../components/doctors/DoctorAvailabilityHeatmap';
import { ErrorState } from '../components/common/ErrorState';
import { ShareButton } from '../components/common/ShareButton';
import { getDoctorSpecialtyLabel } from '../utils/specialtyTranslations';
import {
  Heart,
  Calendar,
  Clock,
  Award,
  GraduationCap,
  FileCheck,
  Languages,
  Building2,
  MapPin,
  CheckCircle2,
  ArrowLeft,
  Users,
  ChevronRight,
  ShieldCheck,
  Bell,
} from 'lucide-react';

export const DoctorDetailsPage: React.FC = () => {
  const { doctorId } = useParams<{ doctorId: string }>();
  const { userLocation } = useLocation();
  const { isDoctorSaved, toggleFavoriteDoctor } = useAuth();
  const { openBookingModal, showToast } = useAppointments();
  const { language, t } = useLanguage();

  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedDateLabel, setSelectedDateLabel] = useState<string>('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isWaitlistOpen, setIsWaitlistOpen] = useState<boolean>(false);

  // Sync localized date label on date or language change
  useEffect(() => {
    if (selectedDate) {
      const formatted = formatScheduleDay(selectedDate, language);
      setSelectedDateLabel(formatted.displayLabel);
    }
  }, [selectedDate, language]);

  useEffect(() => {
    async function loadDoctor() {
      if (!doctorId) return;
      setIsLoading(true);
      try {
        const found = await doctorService.getDoctorById(doctorId, userLocation);
        setDoctor(found);
        if (found) {
          const foundClinic = await clinicService.getClinicById(found.clinicId, userLocation);
          setClinic(foundClinic);
          if (found.weeklySchedule.length > 0) {
            setSelectedDate(found.weeklySchedule[0].date);
            setSelectedDateLabel(formatScheduleDay(found.weeklySchedule[0].date, language).displayLabel);
          }
        }
      } catch (err) {
        console.error('Failed to load doctor details:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadDoctor();
  }, [doctorId, userLocation, language]);

  if (isLoading) {
    return <DoctorDetailsSkeleton />;
  }

  if (!doctor) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <ErrorState
          title={t('noDoctorsFound')}
          message={t('noDoctorsFoundDesc')}
        />
      </div>
    );
  }

  const isSaved = isDoctorSaved(doctor.id);
  const currentDaySchedule =
    doctor.weeklySchedule.find((s) => s.date === selectedDate) || doctor.weeklySchedule[0];

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      showToast('Doctor link copied to clipboard!', 'info');
    }
  };

  const handleProceedBooking = () => {
    if (selectedTimeSlot && isTimeSlotInPast(selectedDate, selectedTimeSlot)) {
      showToast(t('slotPassedError'), 'error');
      setSelectedTimeSlot(null);
      return;
    }

    const firstValidSlot = currentDaySchedule.slots.find(
      (s) => s.isAvailable && !isTimeSlotInPast(selectedDate, s.time)
    )?.time;

    openBookingModal({
      doctor,
      clinic,
      date: selectedDate,
      time: selectedTimeSlot || firstValidSlot || '',
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 pb-20">
      {/* Back Button */}
      <div>
        <Link
          to="/search"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft size={14} />
          <span>{t('back')}</span>
        </Link>
      </div>

      {/* Main Profile Header Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/90 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col md:flex-row gap-6 items-start justify-between">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
            <div className="relative">
              <img
                src={doctor.photo}
                alt={doctor.name}
                referrerPolicy="no-referrer"
                className="w-28 h-28 sm:w-36 sm:h-36 rounded-3xl object-cover border-4 border-slate-100 dark:border-slate-800 shadow-md"
              />
              {doctor.availableToday && (
                <span
                  className="absolute bottom-1 right-1 w-5 h-5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full"
                  title={t('today')}
                />
              )}
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 text-xs font-bold border border-blue-100 dark:border-blue-900/50">
                  {getDoctorSpecialtyLabel(doctor.specialty, language)}
                </span>
                <PartnerBadge size="sm" />
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">{doctor.name}</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{doctor.title}</p>

              {/* Clinic Affiliation Link */}
              <Link
                to={`/clinics/${doctor.clinicId}`}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
              >
                <Building2 size={14} />
                <span>{doctor.clinicName}</span>
                <ChevronRight size={12} />
              </Link>
            </div>
          </div>

          {/* Top Actions */}
          <div className="flex items-center gap-2 self-center md:self-start">
            <button
              onClick={() => toggleFavoriteDoctor(doctor.id)}
              className="p-2.5 rounded-2xl border border-slate-200 dark:border-slate-750 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
              aria-label="Save doctor to favorites"
            >
              <Heart
                size={18}
                className={isSaved ? 'fill-rose-500 text-rose-500' : 'text-slate-500 dark:text-slate-400'}
              />
            </button>
            <ShareButton
              title={doctor.name}
              text={`${doctor.name} - ${doctor.specialty} (${doctor.clinicName})`}
              variant="outline"
            />
          </div>
        </div>

        {/* Doctor Key Metric Badges Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 mt-6 border-t border-slate-100 dark:border-slate-800">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl text-center">
            <span className="text-[11px] text-slate-400 dark:text-slate-500 block font-medium">{t('yearsExp')}</span>
            <span className="text-sm font-bold text-slate-900 dark:text-white">{doctor.experienceYears} {t('yearsExp')}</span>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl text-center">
            <span className="text-[11px] text-slate-400 dark:text-slate-500 block font-medium">{t('rating')}</span>
            <RatingBadge rating={doctor.rating} reviewCount={doctor.reviewCount} size="md" />
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl text-center">
            <span className="text-[11px] text-slate-400 dark:text-slate-500 block font-medium">{t('reviews')}</span>
            <span className="text-sm font-bold text-slate-900 dark:text-white">{doctor.patientCount.toLocaleString()}+</span>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl text-center">
            <span className="text-[11px] text-slate-400 dark:text-slate-500 block font-medium">{t('consultationFee')}</span>
            <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">{doctor.consultationFee}</span>
          </div>
        </div>
      </div>

      {/* Grid: 2 Columns (Left: Bio, Education, Certs | Right: Interactive Schedule & Slot Picker) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Col: Biography & Credentials */}
        <div className="lg:col-span-2 space-y-6">
          {/* Biography */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{t('viewDetails')}</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{doctor.biography}</p>
          </div>

          {/* Subspecialties */}
          {doctor.subSpecialties && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">{t('specialties')}</h2>
              <div className="flex flex-wrap gap-2">
                {doctor.subSpecialties.map((sub) => (
                  <span
                    key={sub}
                    className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold"
                  >
                    {sub}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Education & Academic Credentials */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <GraduationCap size={20} className="text-blue-600 dark:text-blue-400" />
              <span>{t('stepDoctor')}</span>
            </h2>
            <ul className="space-y-2.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              {doctor.education.map((edu, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="text-blue-500 shrink-0 mt-0.5" />
                  <span>{edu}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Certifications & Memberships */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileCheck size={20} className="text-emerald-600 dark:text-emerald-400" />
              <span>{t('verifiedPartnerFull')}</span>
            </h2>
            <ul className="space-y-2.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              {doctor.certifications.map((cert, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <ShieldCheck size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                  <span>{cert}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Languages */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3">
            <Languages size={20} className="text-blue-600 dark:text-blue-400 shrink-0" />
            <div className="text-xs">
              <strong className="text-slate-900 dark:text-white block">Tillar:</strong>
              <span className="text-slate-600 dark:text-slate-300">{doctor.languages.join(', ')}</span>
            </div>
          </div>

          {/* VISUAL WEEKLY AVAILABILITY & RUSH HOUR HEAT-MAP */}
          <DoctorAvailabilityHeatmap
            doctor={doctor}
            selectedDate={selectedDate}
            onSelectDate={(date, dayLabel, initialSlot) => {
              setSelectedDate(date);
              setSelectedDateLabel(dayLabel);
              if (initialSlot) {
                setSelectedTimeSlot(initialSlot);
              }
            }}
          />

          {/* PATIENT REVIEWS & RATINGS SECTION */}
          <ReviewsSection
            targetId={doctor.id}
            targetType="doctor"
            targetName={doctor.name}
            baseRating={doctor.rating}
            baseReviewCount={doctor.reviewCount}
            onRatingUpdated={(newAvg, newCount) => {
              setDoctor((prev) =>
                prev ? { ...prev, rating: newAvg, reviewCount: newCount } : null
              );
            }}
          />
        </div>

        {/* Right Col: BEAUTIFUL SCHEDULE & TIME SLOTS INTERFACE (Section 7) */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-md space-y-5 sticky top-24">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                {t('bookNow')}
              </span>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">
                {t('nextAvailable')}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {t('selectSlotPrompt')}
              </p>
            </div>

            {/* Day Selector Carousel / Grid */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                {t('stepDate')}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {doctor.weeklySchedule.map((day) => {
                  const isSelected = selectedDate === day.date;
                  const localized = formatScheduleDay(day.date, language);
                  return (
                    <button
                      key={day.date}
                      onClick={() => {
                        setSelectedDate(day.date);
                        setSelectedDateLabel(localized.displayLabel);
                        setSelectedTimeSlot(null);
                      }}
                      className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                        isSelected
                          ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                          : 'border-slate-200 dark:border-slate-750 bg-white dark:bg-slate-800/70 hover:border-slate-300 dark:hover:border-slate-600 text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      <span className="text-xs font-bold block">{localized.displayLabel}</span>
                      {day.isToday && (
                        <span
                          className={`text-[10px] font-semibold mt-1 px-2 py-0.5 rounded-full inline-block ${
                            isSelected ? 'bg-blue-500 text-white' : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
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

            {/* Time Slot Picker (Available vs Disabled) */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between text-xs">
                <label className="font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  {t('stepSlot')} ({selectedDateLabel})
                </label>
                {selectedTimeSlot && (
                  <span className="font-bold text-blue-600 dark:text-blue-400">{selectedTimeSlot}</span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2">
                {currentDaySchedule.slots.map((slot) => {
                  const isChosen = selectedTimeSlot === slot.time;
                  const isPast = isTimeSlotInPast(selectedDate, slot.time);
                  const isAvailable = slot.isAvailable && !isPast;
                  return (
                    <button
                      key={slot.time}
                      disabled={!isAvailable}
                      onClick={() => isAvailable && setSelectedTimeSlot(slot.time)}
                      className={`py-2 px-1 text-xs font-semibold rounded-xl transition-all text-center flex flex-col items-center justify-center ${
                        !isAvailable
                          ? 'bg-slate-100 dark:bg-slate-800/40 text-slate-400 dark:text-slate-600 border border-slate-200/50 dark:border-slate-800 cursor-not-allowed opacity-50'
                          : isChosen
                          ? 'bg-blue-600 text-white ring-2 ring-blue-600/30 shadow-xs'
                          : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-500 text-slate-800 dark:text-slate-200 hover:bg-blue-50/40 dark:hover:bg-slate-750 cursor-pointer'
                      }`}
                    >
                      <span className={isPast ? 'line-through' : ''}>{slot.time}</span>
                      {isPast && (
                        <span className="text-[9px] font-normal text-slate-400 dark:text-slate-500">
                          {t('slotPassed')}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Direct Booking CTA */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">{t('consultationFee')}:</span>
                <span className="font-bold text-emerald-700 dark:text-emerald-400 text-sm">
                  {doctor.consultationFee}
                </span>
              </div>

              <div className="space-y-2">
                <button
                  onClick={handleProceedBooking}
                  className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Calendar size={16} />
                  <span>
                    {selectedTimeSlot ? `${t('bookNow')} (${selectedTimeSlot})` : t('instantBook')}
                  </span>
                </button>

                <button
                  onClick={() => setIsWaitlistOpen(true)}
                  className="w-full py-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Bell size={14} className="text-amber-600 dark:text-amber-400" />
                  <span>{t('joinWaitlist') || 'Kutish ro‘yxatiga yozilish'}</span>
                </button>
              </div>

              <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center">
                {t('freeBookingFee')} • SMS
              </p>
            </div>
          </div>
        </div>
      </div>

      {isWaitlistOpen && (
        <WaitlistModal
          isOpen={isWaitlistOpen}
          onClose={() => setIsWaitlistOpen(false)}
          doctor={doctor}
        />
      )}
    </div>
  );
};

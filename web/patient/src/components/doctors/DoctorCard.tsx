import React, { useState } from 'react';
import { Doctor } from '../../types';
import { RatingBadge } from '../common/RatingBadge';
import { DistanceBadge } from '../common/DistanceBadge';
import { WaitlistModal } from '../waitlist/WaitlistModal';
import { Heart, Clock, Award, Building2, Calendar, ArrowRight, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAppointments } from '../../context/AppointmentContext';
import { useLanguage } from '../../context/LanguageContext';
import { getDoctorSpecialtyLabel } from '../../utils/specialtyTranslations';
import { getTodayDateString, isTimeSlotInPast, formatScheduleDay } from '../../utils/dateTimeUtils';

interface DoctorCardProps {
  doctor: Doctor;
  showSlots?: boolean;
  className?: string;
}

export const DoctorCard: React.FC<DoctorCardProps> = ({
  doctor,
  showSlots = true,
  className = '',
}) => {
  const { isDoctorSaved, toggleFavoriteDoctor } = useAuth();
  const { openBookingModal } = useAppointments();
  const { language, t } = useLanguage();
  const [isWaitlistOpen, setIsWaitlistOpen] = useState(false);
  const isSaved = isDoctorSaved(doctor.id);

  const specialtyLabel = getDoctorSpecialtyLabel(doctor.specialty, language);

  return (
    <>
      <div
        id={`doctor-card-${doctor.id}`}
        className={`group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs hover:shadow-md transition-all duration-200 p-4 flex flex-col justify-between hover:border-blue-200 dark:hover:border-blue-800 ${className}`}
      >
        <div>
          {/* Doctor Header */}
          <div className="flex items-start gap-3.5 mb-3.5">
            <div className="relative shrink-0">
              <img
                src={doctor.photo}
                alt={doctor.name}
                referrerPolicy="no-referrer"
                className="w-16 h-16 rounded-xl object-cover border border-slate-100 dark:border-slate-800 shadow-2xs group-hover:scale-105 transition-transform duration-300"
              />
              {doctor.availableToday && (
                <span
                  className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full"
                  title={t('availableToday')}
                />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-1">
                <div>
                  <Link
                    to={`/doctors/${doctor.id}`}
                    className="font-bold text-slate-900 dark:text-white text-sm hover:text-blue-600 dark:hover:text-blue-400 transition-colors line-clamp-1"
                  >
                    {doctor.name}
                  </Link>
                  <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">{specialtyLabel}</p>
                </div>

                <button
                  onClick={() => toggleFavoriteDoctor(doctor.id)}
                  title={isSaved ? 'Remove favorite' : 'Save doctor'}
                  className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-rose-500 dark:hover:text-rose-400 transition-colors cursor-pointer"
                >
                  <Heart
                    size={16}
                    className={isSaved ? 'fill-rose-500 text-rose-500' : 'text-slate-400 dark:text-slate-500'}
                  />
                </button>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1 font-medium">
                  <Award size={12} className="text-amber-500" />
                  {doctor.experienceYears} {t('yearsExp')}
                </span>
                <span>•</span>
                <RatingBadge rating={doctor.rating} reviewCount={doctor.reviewCount} size="sm" />
              </div>
            </div>
          </div>

          {/* Clinic & Distance */}
          <div className="mb-3 p-2.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-100 dark:border-slate-750 flex items-center justify-between text-xs">
            <Link
              to={`/clinics/${doctor.clinicId}`}
              className="flex items-center gap-1.5 min-w-0 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 group/clinic cursor-pointer"
              title={doctor.clinicName}
            >
              <Building2 size={13} className="text-slate-400 dark:text-slate-500 shrink-0 group-hover/clinic:text-blue-600 dark:group-hover/clinic:text-blue-400 transition-colors" />
              <span className="font-medium truncate group-hover/clinic:underline">{doctor.clinicName}</span>
            </Link>
            <DistanceBadge distanceKm={doctor.distanceKm} size="sm" />
          </div>

          {/* Today Available Slots Buttons (Fast 1-click booking) */}
          {showSlots && (
            <div className="space-y-1.5 mb-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1 text-[11px]">
                  <Clock size={11} className="text-emerald-600 dark:text-emerald-400" />
                  {doctor.availableToday ? t('availableToday') + ':' : t('nextAvailable') + ':'}
                </span>
                <span className="text-emerald-700 dark:text-emerald-400 font-semibold text-[11px]">
                  {doctor.availableToday && doctor.todaySlots.some((s) => !isTimeSlotInPast(getTodayDateString(0), s))
                    ? t('today')
                    : doctor.nextFreeTime}
                </span>
              </div>

              {doctor.availableToday && doctor.todaySlots.filter((s) => !isTimeSlotInPast(getTodayDateString(0), s)).length > 0 ? (
                <div className="flex items-center gap-1.5 flex-wrap">
                  {doctor.todaySlots
                    .filter((s) => !isTimeSlotInPast(getTodayDateString(0), s))
                    .slice(0, 3)
                    .map((slot) => (
                      <button
                        key={slot}
                        onClick={() =>
                          openBookingModal({
                            doctor,
                            time: slot,
                            date: getTodayDateString(0),
                          })
                        }
                        className="flex-1 py-1 px-1.5 text-xs font-semibold rounded-lg bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-600 hover:text-white text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 transition-colors text-center cursor-pointer"
                      >
                        {slot}
                      </button>
                    ))}
                </div>
              ) : (
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 py-1 px-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                  <span>
                    {t('nextAvailable')}:{' '}
                    {doctor.weeklySchedule[1]
                      ? formatScheduleDay(doctor.weeklySchedule[1].date, language).displayLabel
                      : t('tomorrow') || 'Tomorrow'}
                  </span>
                  <button
                    onClick={() => setIsWaitlistOpen(true)}
                    className="text-amber-700 dark:text-amber-400 hover:underline font-bold flex items-center gap-0.5 cursor-pointer"
                  >
                    <Bell size={10} />
                    <span>Kutish ro‘yxati</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Action Buttons */}
        <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
          <Link
            to={`/doctors/${doctor.id}`}
            className="flex-1 py-2 px-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold text-center transition-colors flex items-center justify-center gap-1"
          >
            <span>{t('viewProfile')}</span>
            <ArrowRight size={12} />
          </Link>
          <button
            onClick={() => setIsWaitlistOpen(true)}
            title={t('joinWaitlist') || 'Kutish ro‘yxatiga yozilish'}
            className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 text-xs font-bold transition-all cursor-pointer"
          >
            <Bell size={14} />
          </button>
          <button
            onClick={() => openBookingModal({ doctor })}
            className="flex-1 py-2 px-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold text-center transition-all shadow-xs hover:shadow-md cursor-pointer"
          >
            {t('bookAppointment')}
          </button>
        </div>
      </div>

      {isWaitlistOpen && (
        <WaitlistModal
          isOpen={isWaitlistOpen}
          onClose={() => setIsWaitlistOpen(false)}
          doctor={doctor}
        />
      )}
    </>
  );
};

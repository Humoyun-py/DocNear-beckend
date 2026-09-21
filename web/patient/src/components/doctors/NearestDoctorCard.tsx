import React from 'react';
import { Doctor } from '../../types';
import { RatingBadge } from '../common/RatingBadge';
import { DistanceBadge } from '../common/DistanceBadge';
import { Zap, Clock, Calendar, ArrowRight, Building } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAppointments } from '../../context/AppointmentContext';
import { useLanguage } from '../../context/LanguageContext';
import { getDoctorSpecialtyLabel } from '../../utils/specialtyTranslations';

interface NearestDoctorCardProps {
  doctor: Doctor;
  rank?: number;
  className?: string;
}

export const NearestDoctorCard: React.FC<NearestDoctorCardProps> = ({
  doctor,
  rank,
  className = '',
}) => {
  const { openBookingModal } = useAppointments();
  const { language, t } = useLanguage();

  const specialtyLabel = getDoctorSpecialtyLabel(doctor.specialty, language);

  return (
    <div
      className={`relative bg-white dark:bg-slate-900 rounded-2xl border border-blue-100/90 dark:border-slate-800 shadow-2xs hover:shadow-md transition-all duration-300 p-4 flex flex-col justify-between group ${className}`}
    >
      {/* Nearest Badge */}
      {rank === 1 && (
        <div className="absolute -top-2.5 left-4 z-10 bg-blue-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-xs flex items-center gap-1">
          <Zap size={10} className="fill-amber-300 text-amber-300" />
          <span>{language === 'uz' ? '#1 Eng yaqin & Bo‘sh vaqt' : language === 'ru' ? '#1 Ближайший прием' : '#1 Closest & Earliest Slot'}</span>
        </div>
      )}

      <div>
        <div className="flex items-start gap-3 mb-3">
          <img
            src={doctor.photo}
            alt={doctor.name}
            referrerPolicy="no-referrer"
            className="w-14 h-14 rounded-xl object-cover border border-slate-100 dark:border-slate-800 shadow-2xs shrink-0"
          />
          <div className="flex-1 min-w-0">
            <Link
              to={`/doctors/${doctor.id}`}
              className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1"
            >
              {doctor.name}
            </Link>
            <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">{specialtyLabel}</p>
            <div className="flex items-center gap-2 text-xs">
              <DistanceBadge distanceKm={doctor.distanceKm} size="sm" />
              <RatingBadge rating={doctor.rating} showCount={false} size="sm" />
            </div>
          </div>
        </div>

        {/* Earliest time slot banner */}
        <div className="p-2.5 bg-emerald-50/90 dark:bg-emerald-950/40 rounded-xl border border-emerald-100 dark:border-emerald-800/80 mb-2.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 font-medium text-[11px]">
            <Clock size={13} className="text-emerald-600 dark:text-emerald-400" />
            <span>Available at: <strong>{doctor.nextFreeTime}</strong></span>
          </div>
          <span className="text-[10px] bg-emerald-600 text-white font-bold px-1.5 py-0.5 rounded">
            Today
          </span>
        </div>

        <Link
          to={`/clinics/${doctor.clinicId}`}
          className="text-xs text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1 mb-2.5 line-clamp-1 group/clinic cursor-pointer"
          title={doctor.clinicName}
        >
          <Building size={12} className="text-slate-400 dark:text-slate-500 shrink-0 group-hover/clinic:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
          <span className="group-hover/clinic:underline truncate">{doctor.clinicName}</span>
        </Link>
      </div>

      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
        <Link
          to={`/doctors/${doctor.id}`}
          className="py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold text-center transition-colors"
        >
          Profile
        </Link>
        <button
          onClick={() =>
            openBookingModal({
              doctor,
              time: doctor.nextFreeTime,
              date: '2026-08-25',
            })
          }
          className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold text-center transition-all shadow-xs hover:shadow-md cursor-pointer flex items-center justify-center gap-1"
        >
          <span>Instant Book {doctor.nextFreeTime}</span>
          <ArrowRight size={12} />
        </button>
      </div>
    </div>
  );
};

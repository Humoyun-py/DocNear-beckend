import React, { useState } from 'react';
import { Clinic } from '../../types';
import { PartnerBadge } from '../common/PartnerBadge';
import { RatingBadge } from '../common/RatingBadge';
import { DistanceBadge } from '../common/DistanceBadge';
import { StatusBadge } from '../common/StatusBadge';
import { TrafficBadge } from '../common/TrafficBadge';
import { WaitlistModal } from '../waitlist/WaitlistModal';
import { Users, Clock, ArrowRight, Heart, MapPin, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAppointments } from '../../context/AppointmentContext';
import { useLanguage } from '../../context/LanguageContext';
import { getDoctorSpecialtyLabel } from '../../utils/specialtyTranslations';

interface ClinicCardProps {
  clinic: Clinic;
  isSelected?: boolean;
  onHover?: () => void;
  onSelect?: () => void;
  className?: string;
}

export const ClinicCard: React.FC<ClinicCardProps> = ({
  clinic,
  isSelected = false,
  onHover,
  onSelect,
  className = '',
}) => {
  const { isClinicSaved, toggleFavoriteClinic } = useAuth();
  const { openBookingModal } = useAppointments();
  const { language, t } = useLanguage();
  const [isWaitlistOpen, setIsWaitlistOpen] = useState(false);
  const isSaved = isClinicSaved(clinic.id);

  return (
    <>
      <div
        id={`clinic-card-${clinic.id}`}
        onMouseEnter={onHover}
        onClick={onSelect}
        className={`group bg-white dark:bg-slate-900 rounded-2xl border transition-all duration-200 overflow-hidden flex flex-col justify-between hover:shadow-md ${
          isSelected
            ? 'border-blue-500 dark:border-blue-500 bg-blue-50/20 dark:bg-blue-950/30 ring-1 ring-blue-500/30'
            : 'border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-750'
        } ${className}`}
      >
        <div>
          {/* Card Header with Image and Badges */}
          <Link
            to={`/clinics/${clinic.id}`}
            className="relative h-44 w-full overflow-hidden bg-slate-100 dark:bg-slate-800 block cursor-pointer"
          >
            <img
              src={clinic.image}
              alt={clinic.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

            {/* Top Badges */}
            <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
              <PartnerBadge size="sm" />
              {clinic.isEmergency24x7 && <StatusBadge status="24_7" />}
              {clinic.trafficLevel && (
                <TrafficBadge
                  level={clinic.trafficLevel}
                  summary={clinic.trafficSummary}
                  peakHours={clinic.peakHours}
                  size="sm"
                />
              )}
            </div>

            {/* Favorite Toggle Button */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleFavoriteClinic(clinic.id);
              }}
              title={isSaved ? 'Remove from favorites' : 'Save clinic'}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 dark:bg-slate-800/90 backdrop-blur-md flex items-center justify-center text-slate-700 dark:text-slate-200 hover:text-rose-600 dark:hover:text-rose-400 transition-all shadow-xs cursor-pointer active:scale-90 z-10"
            >
              <Heart
                size={16}
                className={isSaved ? 'fill-rose-500 text-rose-500' : 'text-slate-600 dark:text-slate-300'}
              />
            </button>

            {/* Bottom Overlay Info on Image */}
            <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-white text-xs">
              <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/20 text-[11px]">
                <Users size={12} className="text-blue-300" />
                <span>{clinic.doctorCount} {t('doctorsCount')}</span>
              </div>
              <div className="bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/20">
                <StatusBadge status={clinic.isOpenNow ? 'open' : 'closed'} />
              </div>
            </div>
          </Link>

          {/* Content Body */}
          <div className="p-4 space-y-3">
            <div>
              <div className="flex items-start justify-between gap-2 mb-1">
                <Link
                  to={`/clinics/${clinic.id}`}
                  className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 hover:underline transition-colors line-clamp-1 block cursor-pointer"
                >
                  {clinic.name}
                </Link>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 line-clamp-1">
                <MapPin size={12} className="shrink-0 text-slate-400 dark:text-slate-500" />
                <span>{clinic.address}</span>
              </p>
            </div>

            {/* Rating & Distance Bar */}
            <div className="flex items-center justify-between text-xs py-1.5 px-2.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-100 dark:border-slate-750">
              <RatingBadge rating={clinic.rating} reviewCount={clinic.reviewCount} size="sm" />
              <DistanceBadge distanceKm={clinic.distanceKm} size="sm" />
            </div>

            {/* Specialties Pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {clinic.specialties.slice(0, 3).map((spec) => (
                <span
                  key={spec}
                  className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-medium"
                >
                  {getDoctorSpecialtyLabel(spec, language)}
                </span>
              ))}
              {clinic.specialties.length > 3 && (
                <span className="px-1.5 py-0.5 text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                  +{clinic.specialties.length - 3}
                </span>
              )}
            </div>

            {/* Traffic & Next free appointment info */}
            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 pt-0.5 flex-wrap gap-1">
              <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-medium text-[11px]">
                <Clock size={12} className="text-emerald-600 dark:text-emerald-400" />
                <span>{t('nextAvailable')}: <strong>{clinic.nextAvailableTime}</strong></span>
              </div>
              {clinic.peakHours && (
                <span className="text-[10px] text-slate-400 dark:text-slate-500">
                  Pik: {clinic.peakHours}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Card Actions Footer */}
        <div className="p-4 pt-0 flex items-center gap-2">
          <Link
            to={`/clinics/${clinic.id}`}
            className="flex-1 py-2 px-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold text-center transition-colors flex items-center justify-center gap-1"
          >
            <span>{t('viewProfile')}</span>
            <ArrowRight size={12} />
          </Link>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsWaitlistOpen(true);
            }}
            title={t('joinWaitlist') || 'Kutish ro‘yxatiga yozilish'}
            className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 text-xs font-bold transition-all cursor-pointer"
          >
            <Bell size={14} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              openBookingModal({ clinic });
            }}
            className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold text-center transition-all shadow-xs hover:shadow-md cursor-pointer"
          >
            {t('bookAppointment')}
          </button>
        </div>
      </div>

      {/* Waitlist Modal */}
      {isWaitlistOpen && (
        <WaitlistModal
          isOpen={isWaitlistOpen}
          onClose={() => setIsWaitlistOpen(false)}
          clinic={clinic}
        />
      )}
    </>
  );
};

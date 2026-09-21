import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Clinic, Doctor } from '../types';
import { clinicService } from '../services/clinicService';
import { doctorService } from '../services/doctorService';
import { useLocation } from '../context/LocationContext';
import { useAuth } from '../context/AuthContext';
import { useAppointments } from '../context/AppointmentContext';
import { useLanguage } from '../context/LanguageContext';
import { getDoctorSpecialtyLabel } from '../utils/specialtyTranslations';
import { PartnerBadge } from '../components/common/PartnerBadge';
import { RatingBadge } from '../components/common/RatingBadge';
import { DistanceBadge } from '../components/common/DistanceBadge';
import { StatusBadge } from '../components/common/StatusBadge';
import { TrafficBadge } from '../components/common/TrafficBadge';
import { WaitlistModal } from '../components/waitlist/WaitlistModal';
import { DoctorCard } from '../components/doctors/DoctorCard';
import { DoctorCardSkeleton, ClinicDetailsSkeleton } from '../components/common/SkeletonCard';
import { ReviewsSection } from '../components/reviews/ReviewsSection';
import { ReviewCarousel } from '../components/reviews/ReviewCarousel';
import { ClinicFAQSection } from '../components/clinics/ClinicFAQSection';
import { ClinicPhotoGallery } from '../components/clinics/ClinicPhotoGallery';
import { ClinicLightboxModal } from '../components/clinics/ClinicLightboxModal';
import { getClinicPhotos } from '../utils/clinicPhotos';
import { ShareButton } from '../components/common/ShareButton';
import { ErrorState } from '../components/common/ErrorState';
import { reviewService } from '../services/reviewService';
import {
  MapPin,
  Phone,
  Clock,
  Globe,
  ShieldCheck,
  Navigation,
  Heart,
  Calendar,
  Sparkles,
  CheckCircle2,
  Building,
  ArrowLeft,
  Users,
  Bell,
  Camera,
} from 'lucide-react';

export const ClinicDetailsPage: React.FC = () => {
  const { clinicId } = useParams<{ clinicId: string }>();
  const { userLocation } = useLocation();
  const { isClinicSaved, toggleFavoriteClinic } = useAuth();
  const { openBookingModal, showToast } = useAppointments();
  const { language, t } = useLanguage();

  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isWaitlistOpen, setIsWaitlistOpen] = useState<boolean>(false);
  const [isHeroLightboxOpen, setIsHeroLightboxOpen] = useState<boolean>(false);

  useEffect(() => {
    async function loadClinic() {
      if (!clinicId) return;
      setIsLoading(true);
      try {
        const [foundClinic, clinicDoctors] = await Promise.all([
          clinicService.getClinicById(clinicId, userLocation),
          doctorService.getDoctorsByClinic(clinicId),
        ]);
        setClinic(foundClinic);
        setDoctors(clinicDoctors);
        if (foundClinic) {
          const loadedReviews = await reviewService.getReviewsForTarget(foundClinic.id, 'clinic');
          setReviews(loadedReviews);
        }
      } catch (err) {
        console.error('Failed to load clinic details:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadClinic();
  }, [clinicId, userLocation]);

  const handleReviewUpdated = (newAvg: number, newCount: number) => {
    if (clinic) {
      setClinic((prev) => (prev ? { ...prev, rating: newAvg, reviewCount: newCount } : null));
      reviewService.getReviewsForTarget(clinic.id, 'clinic').then(setReviews).catch(console.error);
    }
  };

  if (isLoading) {
    return <ClinicDetailsSkeleton />;
  }

  if (!clinic) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <ErrorState
          title={t('noResults')}
          message={t('noResultsDesc')}
        />
      </div>
    );
  }

  const isSaved = isClinicSaved(clinic.id);

  return (
    <div className="pb-20 space-y-8">
      {/* Back breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <Link
          to="/search?searchType=clinics"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft size={14} />
          <span>{t('back')}</span>
        </Link>
      </div>

      {/* Header & Hero Cover Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl overflow-hidden bg-slate-900 border border-slate-200 shadow-lg">
          {/* Cover Photo */}
          <div
            onClick={() => setIsHeroLightboxOpen(true)}
            className="h-64 sm:h-80 w-full relative cursor-pointer group"
          >
            <img
              src={clinic.coverImage || clinic.image}
              alt={clinic.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-black/30" />
            
            {/* View Photos Pill on Cover */}
            <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/60 hover:bg-black/80 backdrop-blur-md text-white text-xs font-bold border border-white/20 transition-all">
              <Camera size={14} className="text-blue-400" />
              <span>
                {language === 'uz' ? 'Rasmlarni ko‘rish' : language === 'ru' ? 'Смотреть фото' : 'View Photos'}
              </span>
            </div>
          </div>

          {/* Floating Actions on Top Right */}
          <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
            <button
              onClick={() => toggleFavoriteClinic(clinic.id)}
              className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-slate-700 hover:text-rose-600 transition-all shadow-md cursor-pointer"
              aria-label="Save clinic to favorites"
            >
              <Heart
                size={18}
                className={isSaved ? 'fill-rose-500 text-rose-500' : 'text-slate-700'}
              />
            </button>
            <ShareButton
              title={clinic.name}
              text={`${clinic.name} - ${clinic.address}`}
              variant="circle"
            />
          </div>

          {/* Bottom Info in Hero */}
          <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 text-white flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="flex items-start gap-4">
              <img
                src={clinic.logo}
                alt={clinic.name}
                referrerPolicy="no-referrer"
                className="w-18 h-18 sm:w-22 sm:h-22 rounded-2xl object-cover border-2 border-white shadow-md bg-white shrink-0"
              />
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <PartnerBadge size="md" />
                  <StatusBadge status={clinic.isOpenNow ? 'open' : 'closed'} />
                  {clinic.isEmergency24x7 && <StatusBadge status="24_7" />}
                  {clinic.trafficLevel && (
                    <TrafficBadge
                      level={clinic.trafficLevel}
                      summary={clinic.trafficSummary}
                      peakHours={clinic.peakHours}
                      size="md"
                    />
                  )}
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  {clinic.name}
                </h1>
                <p className="text-xs sm:text-sm text-slate-200 flex items-center gap-1.5">
                  <MapPin size={14} className="text-blue-400 shrink-0" />
                  <span>{clinic.address}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <a
                href={`tel:${clinic.phone}`}
                className="px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md text-white text-xs font-semibold border border-white/20 transition-all flex items-center gap-2"
              >
                <Phone size={14} />
                <span>{t('call103').split(':')[0]}</span>
              </a>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${clinic.coordinates.lat},${clinic.coordinates.lng}`}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md flex items-center gap-2"
              >
                <Navigation size={14} />
                <span>{t('directions')}</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Main Details Layout: 2 Columns */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: About, Facilities, Services */}
        <div className="lg:col-span-2 space-y-8">
          {/* About Section */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4 transition-colors duration-200">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{t('viewClinic')}</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{clinic.description}</p>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl text-center">
                <span className="text-[11px] text-slate-400 dark:text-slate-500 block font-medium">{t('rating')}</span>
                <RatingBadge rating={clinic.rating} reviewCount={clinic.reviewCount} size="md" />
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl text-center">
                <span className="text-[11px] text-slate-400 dark:text-slate-500 block font-medium">{t('distance')}</span>
                <DistanceBadge distanceKm={clinic.distanceKm} size="md" />
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl text-center">
                <span className="text-[11px] text-slate-400 dark:text-slate-500 block font-medium">{t('doctors')}</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">{clinic.doctorCount} {t('doctors')}</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl text-center">
                <span className="text-[11px] text-slate-400 dark:text-slate-500 block font-medium">{t('today')}</span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{clinic.workingHours.open} - {clinic.workingHours.close}</span>
              </div>
            </div>
          </div>

          {/* Medical Specialties at this Clinic */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4 transition-colors duration-200">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{t('specialties')}</h2>
            <div className="flex flex-wrap gap-2">
              {clinic.specialties.map((spec) => (
                <span
                  key={spec}
                  className="px-3.5 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold text-xs border border-blue-100 dark:border-blue-800"
                >
                  {getDoctorSpecialtyLabel(spec, language)}
                </span>
              ))}
            </div>
          </div>

          {/* Popular Services & Pricing */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4 transition-colors duration-200">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{t('footerFindCare')}</h2>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {clinic.services.map((srv, idx) => (
                <div key={idx} className="py-3 flex items-center justify-between text-xs sm:text-sm">
                  <span className="font-medium text-slate-800 dark:text-slate-200">{srv.name}</span>
                  {srv.price && (
                    <span className="font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-0.5 rounded-lg border border-emerald-100 dark:border-emerald-800">
                      {srv.price}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Facilities & Amenities */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4 transition-colors duration-200">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{t('verifiedPartnerFull')}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {clinic.facilities.map((fac, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300"
                >
                  <CheckCircle2 size={15} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>{fac}</span>
                </div>
              ))}
            </div>
          </div>

          {/* HIGH RESOLUTION FACILITY PHOTO GALLERY */}
          <ClinicPhotoGallery clinic={clinic} />

          {/* DOCTORS WORKING IN THIS CLINIC */}
          <div className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  {clinic.name} {t('doctors')}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t('nearestAvailableDoctorsDesc')}
                </p>
              </div>
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-3 py-1 rounded-full border border-blue-100 dark:border-blue-800">
                {doctors.length} {t('doctors')}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {doctors.map((doc) => (
                <DoctorCard key={doc.id} doctor={doc} />
              ))}
            </div>
          </div>

          {/* HORIZONTAL PATIENT TESTIMONIALS CAROUSEL */}
          <ReviewCarousel
            reviews={reviews}
            clinicName={clinic.name}
            rating={clinic.rating}
            reviewCount={clinic.reviewCount}
          />

          {/* PATIENT REVIEWS & RATINGS DETAILED BREAKDOWN SECTION */}
          <ReviewsSection
            targetId={clinic.id}
            targetType="clinic"
            targetName={clinic.name}
            baseRating={clinic.rating}
            baseReviewCount={clinic.reviewCount}
            onRatingUpdated={handleReviewUpdated}
          />

          {/* CLINIC FAQ ACCORDION SECTION (Services, Insurance, Parking, Booking) */}
          <ClinicFAQSection clinic={clinic} />
        </div>

        {/* Right Sidebar: Contact, Map snippet, Quick Booking CTA */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5 sticky top-24 transition-colors duration-200">
            <div className="text-center space-y-1 pb-4 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                {t('instantBook')}
              </span>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">{t('bookNow')}</h3>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                {t('nextSlot')}: {clinic.nextAvailableTime}
              </p>
            </div>

            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex items-start gap-3">
                <MapPin size={16} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-800 dark:text-slate-200 block">{t('location')}</strong>
                  <span>{clinic.address}</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock size={16} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-800 dark:text-slate-200 block">{t('today')}</strong>
                  <span>{clinic.workingHours.days}: {clinic.workingHours.open} - {clinic.workingHours.close}</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone size={16} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-800 dark:text-slate-200 block">{t('patientPhone')}</strong>
                  <span>{clinic.phone}</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Globe size={16} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-800 dark:text-slate-200 block">Tillar</strong>
                  <span>{clinic.languages.join(', ')}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2.5">
              <button
                onClick={() => openBookingModal({ clinic })}
                className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Calendar size={16} />
                <span>{t('bookNow')}</span>
              </button>

              <button
                onClick={() => setIsWaitlistOpen(true)}
                className="w-full py-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-800 font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Bell size={14} className="text-amber-600 dark:text-amber-400" />
                <span>{t('joinWaitlist') || 'Kutish ro‘yxatiga yozilish'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {isWaitlistOpen && (
        <WaitlistModal
          isOpen={isWaitlistOpen}
          onClose={() => setIsWaitlistOpen(false)}
          clinic={clinic}
        />
      )}

      {/* Hero Lightbox Modal */}
      {clinic && (
        <ClinicLightboxModal
          isOpen={isHeroLightboxOpen}
          photos={getClinicPhotos(clinic)}
          clinicName={clinic.name}
          initialIndex={0}
          onClose={() => setIsHeroLightboxOpen(false)}
        />
      )}
    </div>
  );
};

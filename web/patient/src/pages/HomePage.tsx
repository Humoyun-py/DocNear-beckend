import React, { useState, useEffect } from 'react';
import { Clinic, Doctor } from '../types';
import { clinicService } from '../services/clinicService';
import { doctorService } from '../services/doctorService';
import { useLocation } from '../context/LocationContext';
import { useAppointments } from '../context/AppointmentContext';
import { useLanguage } from '../context/LanguageContext';
import { SearchBar } from '../components/search/SearchBar';
import { MapView } from '../components/map/MapView';
import { ClinicCard } from '../components/clinics/ClinicCard';
import { NearestDoctorCard } from '../components/doctors/NearestDoctorCard';
import { PartnerBadge } from '../components/common/PartnerBadge';
import { ClinicCardSkeleton, DoctorCardSkeleton } from '../components/common/SkeletonCard';
import { DailyHealthTipSection } from '../components/home/DailyHealthTipSection';
import { RecentSearchesSection } from '../components/home/RecentSearchesSection';
import { useSpecialties } from '../hooks/useSpecialties';
import { getSpecialtyName, getDoctorSpecialtyLabel } from '../utils/specialtyTranslations';
import {
  MapPin,
  Sparkles,
  ShieldCheck,
  Clock,
  ArrowRight,
  Zap,
  Building2,
  Calendar,
  AlertCircle,
  PhoneCall,
  Navigation,
  CheckCircle,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const HomePage: React.FC = () => {
  const specialties = useSpecialties();
  const { userLocation, radiusKm, detectCurrentLocation, isLocating } = useLocation();
  const { openBookingModal } = useAppointments();
  const { language, t } = useLanguage();
  const navigate = useNavigate();

  const [nearbyClinics, setNearbyClinics] = useState<Clinic[]>([]);
  const [nearestDoctors, setNearestDoctors] = useState<Doctor[]>([]);
  const [selectedClinicId, setSelectedClinicId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [clinicsData, doctorsData] = await Promise.all([
          clinicService.getNearbyClinics(userLocation, radiusKm),
          doctorService.getNearestAvailableDoctors(userLocation, 4),
        ]);
        if (clinicsData.length === 0) {
          const allClinics = await clinicService.getPartnerClinics(userLocation);
          setNearbyClinics(allClinics);
        } else {
          setNearbyClinics(clinicsData);
        }
        setNearestDoctors(doctorsData);
      } catch (err) {
        console.error('Failed to load homepage data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [userLocation, radiusKm]);

  const quickSpecialtyKeys = ['Cardiologist', 'Pediatrician', 'Dentist', 'Dermatologist', 'Neurologist'];

  return (
    <div className="space-y-16 pb-12">
      {/* 1. HERO SECTION */}
      <section className="relative pt-8 pb-12 md:pt-14 md:pb-16 overflow-hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          {/* Top verified partner tagline badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 animate-in fade-in slide-in-from-top-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>{t('verifiedPartnerFull')}</span>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <span className="text-blue-600 dark:text-blue-400 font-bold">{t('within5km')}</span>
          </div>

          {/* Large Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight max-w-4xl mx-auto leading-[1.15]">
            {t('heroTitle1')} <br className="hidden sm:inline" />
            <span className="text-blue-600 dark:text-blue-400">
              {t('heroTitle2')}
            </span>
          </h1>

          {/* Short supporting description */}
          <p className="text-sm sm:text-base md:text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            {t('heroSubtitle')}
          </p>

          {/* Main Smart Search Bar */}
          <div className="pt-2">
            <SearchBar size="large" />
          </div>

          {/* Quick CTA Actions under Search Bar */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-xs">
            <span className="text-slate-400 dark:text-slate-500 font-medium">{t('quickDiscovery')}</span>
            {quickSpecialtyKeys.map((spec) => {
              const label = getDoctorSpecialtyLabel(spec, language);
              return (
                <Link
                  key={spec}
                  to={`/search?specialty=${encodeURIComponent(spec)}`}
                  className="px-3 py-1 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg text-xs font-medium transition-all shadow-2xs cursor-pointer"
                >
                  {label}
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* 2. RECENT LOCATION SEARCHES */}
      <RecentSearchesSection />

      {/* 3. GEMINI AI DAILY HEALTH & WELLNESS TIP */}
      <DailyHealthTipSection />

      {/* 3. NEAREST AVAILABLE DOCTOR */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 mb-6">
          <div>
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider mb-1">
              <Zap size={14} className="fill-blue-600 dark:fill-blue-400" />
              <span>{t('instantBook')}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {t('nearestAvailableDoctors')}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              {t('nearestAvailableDoctorsDesc')}
            </p>
          </div>

          <Link
            to="/search?availability=today"
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 shrink-0"
          >
            <span>{t('viewAllDoctors')}</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <DoctorCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {nearestDoctors.map((doc, idx) => (
              <NearestDoctorCard key={doc.id} doctor={doc} rank={idx + 1} />
            ))}
          </div>
        )}
      </section>

      {/* 3. INTERACTIVE MAP DISCOVERY SECTION (5 km radius + list sync) */}
      <section id="interactive-map-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 text-white overflow-hidden relative shadow-2xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 text-blue-400 text-xs font-bold uppercase tracking-wider mb-1">
                <MapPin size={14} />
                <span>{t('mapView')} ({radiusKm}km)</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {t('topRatedPartners')}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                {t('topRatedPartnersDesc')}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={detectCurrentLocation}
                disabled={isLocating}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-md disabled:opacity-50"
              >
                <Navigation size={14} className={isLocating ? 'animate-spin' : ''} />
                <span>{t('currentGPS')}</span>
              </button>
              <Link
                to="/search?view=map"
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all border border-slate-700"
              >
                {t('mapView')}
              </Link>
            </div>
          </div>

          {/* Leaflet Map Embed */}
          <MapView
            clinics={nearbyClinics}
            selectedClinicId={selectedClinicId}
            onSelectClinic={(c) => setSelectedClinicId(c.id)}
            height="480px"
          />
        </div>
      </section>

      {/* 4. NEARBY PARTNERED CLINICS SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
          <div>
            <div className="flex items-center gap-1.5 text-blue-600 text-xs font-bold uppercase tracking-wider mb-1">
              <Building2 size={14} />
              <span>{t('verifiedPartner')}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {t('topRatedPartners')}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {t('topRatedPartnersDesc')}
            </p>
          </div>

          <Link
            to="/search?searchType=clinics"
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 shrink-0"
          >
            <span>{t('viewAllClinics')}</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <ClinicCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {nearbyClinics.slice(0, 6).map((clinic) => (
              <ClinicCard
                key={clinic.id}
                clinic={clinic}
                isSelected={selectedClinicId === clinic.id}
                onSelect={() => setSelectedClinicId(clinic.id)}
              />
            ))}
          </div>
        )}
      </section>

      {/* 5. POPULAR MEDICAL SPECIALTIES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {t('exploreSpecialties')}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              {t('exploreSpecialtiesDesc')}
            </p>
          </div>
          <Link
            to="/specialties"
            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1"
          >
            <span>{t('viewAllSpecialties')}</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5">
          {specialties.slice(0, 10).map((spec) => {
            const specLabel = getSpecialtyName(spec.id, language);
            return (
              <Link
                key={spec.id}
                to={`/search?specialty=${encodeURIComponent(spec.name)}`}
                className="group p-4 bg-white dark:bg-slate-900 hover:bg-blue-50/50 dark:hover:bg-slate-800/80 rounded-2xl border border-slate-200/90 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-700 shadow-2xs hover:shadow-md transition-all text-center flex flex-col items-center justify-center space-y-2"
              >
                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 group-hover:bg-blue-600 text-blue-600 dark:text-blue-400 group-hover:text-white flex items-center justify-center transition-colors">
                  <Sparkles size={20} />
                </div>
                <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                  {specLabel}
                </h3>
                <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                  {spec.doctorCount} {t('doctorsCount')}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 6. EMERGENCY 24/7 FAST ACTION BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold uppercase tracking-wider backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
              {t('emergencyHeader')}
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold">{t('call103')}</h3>
            <p className="text-xs sm:text-sm text-red-100 max-w-xl">
              {t('emergencySub')}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <a
              href="tel:103"
              className="px-5 py-3 rounded-2xl bg-white text-red-700 font-extrabold text-xs sm:text-sm shadow-md hover:bg-red-50 transition-all flex items-center gap-2"
            >
              <PhoneCall size={16} />
              <span>{t('instantCall')} (103)</span>
            </a>
            <Link
              to="/emergency"
              className="px-5 py-3 rounded-2xl bg-red-800/80 hover:bg-red-800 text-white font-bold text-xs sm:text-sm border border-white/20 transition-all"
            >
              {t('emergencyClinicsNear')}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

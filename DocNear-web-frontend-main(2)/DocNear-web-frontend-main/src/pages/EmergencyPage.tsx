import React, { useState, useEffect } from 'react';
import { Clinic } from '../types';
import { clinicService } from '../services/clinicService';
import { useLocation } from '../context/LocationContext';
import { useLanguage } from '../context/LanguageContext';
import { ClinicCard } from '../components/clinics/ClinicCard';
import { MapView } from '../components/map/MapView';
import {
  ShieldAlert,
  PhoneCall,
  Navigation,
  AlertTriangle,
  HeartPulse,
  Clock,
  Building2,
  CheckCircle2,
} from 'lucide-react';

export const EmergencyPage: React.FC = () => {
  const { userLocation } = useLocation();
  const { t } = useLanguage();
  const [emergencyClinics, setEmergencyClinics] = useState<Clinic[]>([]);
  const [selectedClinicId, setSelectedClinicId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const clinics = await clinicService.getPartnerClinics(userLocation);
        const filtered = clinics.filter((c) => c.isEmergency24x7);
        setEmergencyClinics(filtered);
      } catch (err) {
        console.error('Failed to load emergency clinics:', err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [userLocation]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-24">
      {/* Emergency Header Hero */}
      <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 rounded-3xl p-6 sm:p-10 text-white shadow-2xl space-y-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-3.5 py-1 rounded-full bg-white/20 text-white text-xs font-bold uppercase tracking-wider backdrop-blur-md flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping"></span>
            {t('emergency247')}
          </span>
        </div>

        <div className="max-w-3xl space-y-2">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
            {t('emergencyHeader')}
          </h1>
          <p className="text-sm sm:text-base text-red-100 leading-relaxed">
            {t('emergencySub')}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
          <a
            href="tel:103"
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white hover:bg-red-50 text-red-700 font-extrabold text-base sm:text-lg shadow-lg flex items-center justify-center gap-3 transition-transform active:scale-95"
          >
            <PhoneCall size={22} className="animate-bounce" />
            <span>{t('call103')}</span>
          </a>

          <div className="text-xs text-red-100 text-center sm:text-left">
            <strong className="block text-white">{t('call103Desc')}</strong>
          </div>
        </div>
      </div>

      {/* 24/7 Partnered Centers Grid + Interactive Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left List of 24/7 Centers */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 size={20} className="text-red-600 dark:text-red-400" />
              <span>{t('emergencyClinicsNear')} ({emergencyClinics.length})</span>
            </h2>
          </div>

          <div className="space-y-4">
            {emergencyClinics.map((clinic) => (
              <ClinicCard
                key={clinic.id}
                clinic={clinic}
                isSelected={selectedClinicId === clinic.id}
                onSelect={() => setSelectedClinicId(clinic.id)}
              />
            ))}
          </div>
        </div>

        {/* Right Map */}
        <div className="lg:col-span-5 sticky top-24 space-y-4">
          <div className="p-4 bg-red-50 dark:bg-red-950/40 rounded-2xl border border-red-200 dark:border-red-900/50 text-xs text-red-900 dark:text-red-200 space-y-2">
            <div className="flex items-center gap-2 font-bold text-red-800 dark:text-red-300">
              <AlertTriangle size={16} />
              <span>{t('emergency')}</span>
            </div>
            <p className="leading-relaxed text-red-700 dark:text-red-300/90">
              {t('emergencySub')}
            </p>
          </div>

          <MapView
            clinics={emergencyClinics}
            selectedClinicId={selectedClinicId}
            onSelectClinic={(c) => setSelectedClinicId(c.id)}
            height="420px"
          />
        </div>
      </div>
    </div>
  );
};

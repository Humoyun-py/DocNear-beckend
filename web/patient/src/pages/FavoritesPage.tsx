import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Doctor, Clinic } from '../types';
import { doctorService } from '../services/doctorService';
import { clinicService } from '../services/clinicService';
import { DoctorCard } from '../components/doctors/DoctorCard';
import { ClinicCard } from '../components/clinics/ClinicCard';
import { EmptyState } from '../components/common/EmptyState';
import { Heart, Building2, User, Sparkles, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const FavoritesPage: React.FC = () => {
  const { user, isLoggedIn, openAuthModal } = useAuth();
  const { t, language } = useLanguage();

  const [activeTab, setActiveTab] = useState<'doctors' | 'clinics'>('doctors');
  const [savedDoctors, setSavedDoctors] = useState<Doctor[]>([]);
  const [favoriteClinics, setFavoriteClinics] = useState<Clinic[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadSaved() {
      setIsLoading(true);
      try {
        const allDocs = await doctorService.getDoctors();
        const allClinics = await clinicService.getPartnerClinics();
        const doctorIds = user?.savedDoctorIds || [];
        const clinicIds = user?.savedClinicIds || [];

        setSavedDoctors(allDocs.filter((d) => doctorIds.includes(d.id)));
        setFavoriteClinics(allClinics.filter((c) => clinicIds.includes(c.id)));
      } finally {
        setIsLoading(false);
      }
    }
    loadSaved();
  }, [user?.savedDoctorIds, user?.savedClinicIds]);

  if (!isLoggedIn) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-500 flex items-center justify-center mx-auto">
          <Heart size={32} />
        </div>
        <h1 className="text-xl font-black text-slate-900 dark:text-white">
          {language === 'uz' ? 'Sevimli shifokor va klinikalar' : language === 'ru' ? 'Избранные врачи и клиники' : 'Favorite Doctors & Clinics'}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {language === 'uz'
            ? "O'zingizga yoqqan shifokorlar va klinikalarni saqlab qo'yish uchun tizimga kiring."
            : language === 'ru'
            ? 'Войдите в аккаунт, чтобы просматривать сохраненных врачей и клиники.'
            : 'Sign in to access and manage your saved doctors and clinics.'}
        </p>
        <button
          onClick={() => openAuthModal('login')}
          className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-md transition-all cursor-pointer"
        >
          {t('signIn')}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Heart size={26} className="text-rose-500 fill-rose-500" />
            <span>{language === 'uz' ? 'Saqlanganlar' : language === 'ru' ? 'Избранное' : 'Favorites'}</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {language === 'uz'
              ? 'Tezkor qabul band qilish uchun sevimli shifokorlaringiz va rasmiy hamkor klinikalar'
              : language === 'ru'
              ? 'Сохраненные врачи и партнерские клиники для быстрой записи'
              : 'Your bookmarked specialists and official partner clinics for instant rebooking'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
          <button
            onClick={() => setActiveTab('doctors')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'doctors'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <User size={14} />
            <span>{t('savedDoctorsTab') || 'Shifokorlar'}</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
              {savedDoctors.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('clinics')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'clinics'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Building2 size={14} />
            <span>{t('savedClinicsTab') || 'Klinikalar'}</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
              {favoriteClinics.length}
            </span>
          </button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 bg-slate-100 dark:bg-slate-800/60 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : activeTab === 'doctors' ? (
        savedDoctors.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {savedDoctors.map((doc) => (
              <DoctorCard key={doc.id} doctor={doc} />
            ))}
          </div>
        ) : (
          <EmptyState
            title={language === 'uz' ? 'Saqlangan shifokorlar yo‘q' : language === 'ru' ? 'Нет сохраненных врачей' : 'No Saved Doctors'}
            description={
              language === 'uz'
                ? 'Shifokor kartochkalaridagi yurakcha belgisini bosib, ularni bu yerda saqlab borishingiz mumkin.'
                : language === 'ru'
                ? 'Нажмите на сердечко на карточке врача, чтобы сохранить его в избранное.'
                : 'Tap the heart icon on any doctor card to save them here for quick access.'
            }
            actionLabel={language === 'uz' ? 'Shifokorlarni topish' : language === 'ru' ? 'Найти врачей' : 'Find Doctors'}
            actionHref="/search"
          />
        )
      ) : favoriteClinics.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {favoriteClinics.map((clinic) => (
            <ClinicCard key={clinic.id} clinic={clinic} />
          ))}
        </div>
      ) : (
        <EmptyState
          title={language === 'uz' ? 'Sevimli klinikalar yo‘q' : language === 'ru' ? 'Нет сохраненных клиник' : 'No Favorite Clinics'}
          description={
            language === 'uz'
              ? 'Hamkor klinikalarni saqlab qo‘ying va ularning xizmatlaridan tezkor foydalaning.'
              : language === 'ru'
              ? 'Сохраняйте партнерские клиники для быстрого доступа к специалистам.'
              : 'Bookmark partner clinics to easily book visits with their medical team.'
          }
          actionLabel={language === 'uz' ? 'Klinikalarni ko‘rish' : language === 'ru' ? 'Смотреть клиники' : 'Explore Clinics'}
          actionHref="/search"
        />
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { useSpecialties } from '../hooks/useSpecialties';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { Search, HeartPulse, ArrowRight, Activity, Users, Building2 } from 'lucide-react';
import { getSpecialtyName, getSpecialtyDescription } from '../utils/specialtyTranslations';

export const SpecialtiesPage: React.FC = () => {
  const specialties = useSpecialties();
  const { language, t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState<string>('');

  const filtered = specialties.filter((s) => {
    const localizedName = getSpecialtyName(s.id, language);
    const localizedDesc = getSpecialtyDescription(s.id, language);
    const term = searchTerm.toLowerCase().trim();
    return (
      s.name.toLowerCase().includes(term) ||
      s.description.toLowerCase().includes(term) ||
      localizedName.toLowerCase().includes(term) ||
      localizedDesc.toLowerCase().includes(term)
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-24">
      {/* Header */}
      <div className="max-w-3xl space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 text-xs font-bold border border-blue-100 dark:border-blue-900/50">
          <HeartPulse size={14} />
          <span>{t('specialtiesHeader')}</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {t('specialtiesHeader')}
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          {t('specialtiesSub')}
        </p>

        {/* Filter search */}
        <div className="relative max-w-md pt-2">
          <Search size={18} className="absolute left-3.5 top-5 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-2xs placeholder:text-slate-400 dark:placeholder:text-slate-500"
          />
        </div>
      </div>

      {/* Specialties Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((specialty) => {
          const localizedName = getSpecialtyName(specialty.id, language);
          const localizedDesc = getSpecialtyDescription(specialty.id, language);

          return (
            <div
              key={specialty.id}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center transition-colors">
                    <Activity size={24} />
                  </div>
                  <span className="text-xs font-semibold text-slate-400 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 px-2.5 py-1 rounded-full">
                    {specialty.doctorCount} {t('doctors')}
                  </span>
                </div>

                <div>
                  <h3 className="font-extrabold text-lg text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {localizedName}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed line-clamp-2">
                    {localizedDesc}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <Users size={13} className="text-blue-500 dark:text-blue-400" />
                    {specialty.doctorCount} {t('doctors')}
                  </span>
                  <span className="flex items-center gap-1">
                    <Building2 size={13} className="text-slate-400 dark:text-slate-500" />
                    {specialty.clinicCount} {t('clinics')}
                  </span>
                </div>

                <Link
                  to={`/search?specialty=${encodeURIComponent(specialty.name)}`}
                  className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-600 dark:hover:bg-blue-600 text-blue-700 dark:text-blue-300 hover:text-white dark:hover:text-white text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                >
                  <span>{t('findDoctorsBtn')}</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

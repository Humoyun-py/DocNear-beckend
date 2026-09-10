import React from 'react';
import { SearchFilterState, TimeOfDayFilter, SortByOption } from '../../types';
import { INSURANCE_PROVIDERS } from '../../data/insuranceProviders';
import { useSpecialties } from '../../hooks/useSpecialties';
import { useLanguage } from '../../context/LanguageContext';
import { getSpecialtyName } from '../../utils/specialtyTranslations';
import { DISTANCE_OPTIONS, MAX_DISTANCE_ALL } from '../../utils/geo';
import {
  SlidersHorizontal,
  MapPin,
  Star,
  Clock,
  ShieldAlert,
  ShieldCheck,
  Check,
  Sunrise,
  Sun,
  Sunset,
  ArrowDownUp,
  Compass,
  Stethoscope,
} from 'lucide-react';

interface FilterPanelProps {
  filters: SearchFilterState;
  onChange: (filters: SearchFilterState) => void;
  onReset: () => void;
  className?: string;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  onChange,
  onReset,
  className = '',
}) => {
  const specialties = useSpecialties();
  const { language, t } = useLanguage();
  const quickRadiusButtons = [1, 3, 5, 10, 15, 20, 25, MAX_DISTANCE_ALL];
  const isAllDistance = filters.maxDistanceKm >= MAX_DISTANCE_ALL;

  const currentTimeOfDay = filters.timeOfDay || 'all';
  const currentSort = filters.sortBy || 'relevance';

  const timeOfDaySlots = [
    {
      id: 'morning' as TimeOfDayFilter,
      label: language === 'uz' ? 'Ertalab' : language === 'ru' ? 'Утро' : 'Morning',
      sub: '08:00 - 12:00',
      icon: Sunrise,
    },
    {
      id: 'afternoon' as TimeOfDayFilter,
      label: language === 'uz' ? 'Tushda' : language === 'ru' ? 'День' : 'Afternoon',
      sub: '12:00 - 17:00',
      icon: Sun,
    },
    {
      id: 'evening' as TimeOfDayFilter,
      label: language === 'uz' ? 'Kechda' : language === 'ru' ? 'Вечер' : 'Evening',
      sub: '17:00 - 21:00',
      icon: Sunset,
    },
  ];

  return (
    <div
      className={`bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs p-5 space-y-5 transition-colors duration-200 ${className}`}
    >
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={17} className="text-blue-600 dark:text-blue-400" />
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">{t('filters')}</h3>
        </div>
        <button
          onClick={onReset}
          className="text-xs text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors cursor-pointer"
        >
          {t('resetAll')}
        </button>
      </div>

      {/* Sort By Dropdown */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <ArrowDownUp size={13} className="text-blue-600 dark:text-blue-400" />
            <span>{t('sortBy')}</span>
          </label>
        </div>
        <select
          value={currentSort}
          onChange={(e) => onChange({ ...filters, sortBy: e.target.value as SortByOption })}
          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer shadow-2xs"
        >
          <option value="relevance">{t('sortByRelevance')}</option>
          <option value="distance">{t('sortByDistance')}</option>
          <option value="rating">{t('sortByRating')}</option>
          <option value="availability">{t('sortByAvailability')}</option>
        </select>
      </div>

      {/* Search Target Toggle: All / Doctors / Clinics */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {t('showing')}
        </label>
        <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          {(['all', 'doctors', 'clinics'] as const).map((type) => (
            <button
              key={type}
              onClick={() => onChange({ ...filters, searchType: type })}
              className={`py-1.5 text-xs font-semibold rounded-lg capitalize transition-all cursor-pointer ${
                filters.searchType === type
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {type === 'all' ? t('all') : type === 'doctors' ? t('doctors') : t('clinics')}
            </button>
          ))}
        </div>
      </div>

      {/* Medical Specialty Filter (Dropdown & Quick Select Chips) */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Stethoscope size={13} className="text-blue-600 dark:text-blue-400" />
            <span>{t('medicalSpecialty')}</span>
          </label>
          {filters.specialty && filters.specialty !== 'all' && (
            <button
              onClick={() => onChange({ ...filters, specialty: 'all' })}
              className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            >
              {t('clearAll') || 'Clear'}
            </button>
          )}
        </div>

        {/* Specialty Dropdown */}
        <select
          value={filters.specialty || 'all'}
          onChange={(e) => onChange({ ...filters, specialty: e.target.value })}
          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer shadow-2xs"
        >
          <option value="all">{t('allSpecialties')}</option>
          {specialties.map((spec) => {
            const label = getSpecialtyName(spec.id, language);
            return (
              <option key={spec.id} value={spec.name}>
                {label} ({spec.doctorCount} {t('doctorsCount')})
              </option>
            );
          })}
        </select>

        {/* Specialty Quick Chips */}
        <div className="flex flex-wrap gap-1 pt-1">
          {specialties.slice(0, 6).map((spec) => {
            const label = getSpecialtyName(spec.id, language);
            const isSelected = filters.specialty === spec.name;
            return (
              <button
                key={spec.id}
                type="button"
                onClick={() =>
                  onChange({
                    ...filters,
                    specialty: isSelected ? 'all' : spec.name,
                  })
                }
                className={`text-[11px] px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                    : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Dynamic Maximum Search Radius */}
      <div className="space-y-3 bg-slate-50/70 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800">
        <div className="flex justify-between items-center text-xs">
          <label className="font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <MapPin size={13} className="text-blue-600 dark:text-blue-400" />
            <span>{t('distanceRadius')}</span>
          </label>
          <span className={`font-extrabold px-2 py-0.5 rounded-lg border shadow-2xs text-xs ${
            isAllDistance
              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
              : 'bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800'
          }`}>
            {isAllDistance
              ? (language === 'uz' ? '30+ km (Hammasi)' : language === 'ru' ? '30+ km (Все)' : '30+ km (All)')
              : `${filters.maxDistanceKm} km`}
          </span>
        </div>

        {/* Dynamic Select Menu for Radius */}
        <select
          value={filters.maxDistanceKm}
          onChange={(e) => onChange({ ...filters, maxDistanceKm: Number(e.target.value) })}
          aria-label="Select Maximum Radius"
          className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer shadow-2xs"
        >
          {DISTANCE_OPTIONS.map((d) => (
            <option key={d} value={d}>
              {d === MAX_DISTANCE_ALL
                ? `30+ km — ${language === 'uz' ? 'Barcha klinikalar (Hammasi)' : language === 'ru' ? 'Все клиники (Без ограничений)' : 'All clinics (No limit)'}`
                : d === 1
                ? `1 km — ${language === 'uz' ? 'Piyoda masofa' : language === 'ru' ? 'Пешая доступность' : 'Walking distance'}`
                : d === 5
                ? `5 km — ${language === 'uz' ? 'Standart mahalla (Asosiy)' : language === 'ru' ? 'Стандартный район' : 'Standard local area'}`
                : d === 10
                ? `10 km — ${language === 'uz' ? 'Shahar markazi' : language === 'ru' ? 'Городской охват' : 'City wide'}`
                : d === 20
                ? `20 km — ${language === 'uz' ? 'Keng shahar radiusi (1-20 km)' : language === 'ru' ? 'Широкий охват (1-20 км)' : 'Wide area (1-20 km)'}`
                : `${d} km`}
            </option>
          ))}
        </select>

        {/* Dynamic Range Slider */}
        <div className="space-y-1 pt-1">
          <input
            type="range"
            min="1"
            max="30"
            step="1"
            value={filters.maxDistanceKm}
            onChange={(e) => onChange({ ...filters, maxDistanceKm: Number(e.target.value) })}
            className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <div className="flex justify-between text-[10px] text-slate-400 font-bold px-0.5">
            <span className={filters.maxDistanceKm === 1 ? 'text-blue-600 dark:text-blue-400 font-extrabold' : ''}>1 km</span>
            <span className={filters.maxDistanceKm === 5 ? 'text-blue-600 dark:text-blue-400 font-extrabold' : ''}>5 km</span>
            <span className={filters.maxDistanceKm === 10 ? 'text-blue-600 dark:text-blue-400 font-extrabold' : ''}>10 km</span>
            <span className={filters.maxDistanceKm === 20 ? 'text-blue-600 dark:text-blue-400 font-extrabold' : ''}>20 km</span>
            <span className={isAllDistance ? 'text-emerald-600 dark:text-emerald-400 font-extrabold' : ''}>
              {language === 'uz' ? 'Hammasi' : language === 'ru' ? 'Все' : 'All'}
            </span>
          </div>
        </div>

        {/* Preset Quick Radius Buttons */}
        <div className="grid grid-cols-4 gap-1 pt-1">
          {quickRadiusButtons.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => onChange({ ...filters, maxDistanceKm: d })}
              className={`py-1.5 px-1 rounded-xl text-[10px] font-extrabold border transition-all cursor-pointer text-center ${
                filters.maxDistanceKm === d
                  ? d === MAX_DISTANCE_ALL
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs scale-102'
                    : 'bg-blue-600 text-white border-blue-600 shadow-xs scale-102'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              {d === MAX_DISTANCE_ALL
                ? (language === 'uz' ? 'Hammasi' : language === 'ru' ? 'Все' : 'All')
                : `${d} km`}
            </button>
          ))}
        </div>
      </div>

      {/* Insurance Provider Filter */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <ShieldCheck size={13} className="text-emerald-600 dark:text-emerald-400" />
            <span>
              {language === 'uz' ? 'Sug‘urta kompaniyasi' : language === 'ru' ? 'Страховая компания' : 'Insurance Provider'}
            </span>
          </label>
          {filters.insuranceProvider && filters.insuranceProvider !== 'all' && (
            <button
              onClick={() => onChange({ ...filters, insuranceProvider: 'all' })}
              className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            >
              {t('clearAll') || 'Clear'}
            </button>
          )}
        </div>
        <select
          value={filters.insuranceProvider || 'all'}
          onChange={(e) => onChange({ ...filters, insuranceProvider: e.target.value })}
          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer shadow-2xs"
        >
          <option value="all">
            {language === 'uz' ? 'Barcha sug‘urta turlari / To‘lovli' : language === 'ru' ? 'Все страховки / Оплата' : 'All Insurances / Self-pay'}
          </option>
          {INSURANCE_PROVIDERS.filter((p) => p.id !== 'all').map((ins) => (
            <option key={ins.id} value={ins.name}>
              {ins.name} ({ins.shortName})
            </option>
          ))}
        </select>
      </div>

      {/* Time-of-Day Filter (Morning, Afternoon, Evening) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
            {t('timeOfDay')}
          </label>
          {currentTimeOfDay !== 'all' && (
            <button
              onClick={() => onChange({ ...filters, timeOfDay: 'all' })}
              className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            >
              {t('clearAll') || 'Clear'}
            </button>
          )}
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {timeOfDaySlots.map((slot) => {
            const Icon = slot.icon;
            const isSelected = currentTimeOfDay === slot.id;
            return (
              <button
                key={slot.id}
                type="button"
                onClick={() =>
                  onChange({
                    ...filters,
                    timeOfDay: isSelected ? 'all' : slot.id,
                  })
                }
                className={`py-2 px-1.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                  isSelected
                    ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-600 dark:border-blue-500 shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <Icon size={14} className={isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'} />
                <span className="text-[11px] font-bold leading-tight">{slot.label}</span>
                <span className="text-[9px] text-slate-400 dark:text-slate-500 font-medium">{slot.sub}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Availability Filter */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
          {t('scheduleAvailability')}
        </label>
        <div className="flex flex-col gap-1.5">
          {[
            { id: 'all', label: t('anyAvailability') },
            { id: 'today', label: t('availableToday') },
            { id: 'tomorrow', label: t('availableTomorrow') },
          ].map((item) => (
            <label
              key={item.id}
              className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer hover:text-slate-900 dark:hover:text-white"
            >
              <input
                type="radio"
                name="availability"
                checked={filters.availability === item.id}
                onChange={() =>
                  onChange({ ...filters, availability: item.id as SearchFilterState['availability'] })
                }
                className="text-blue-600 focus:ring-blue-500"
              />
              <span>{item.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Minimum Rating */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
            {t('rating')}
          </label>
          {filters.minRating > 0 && (
            <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800">
                    <Star size={12} aria-hidden="true" /> {filters.minRating}+
            </span>
          )}
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {[0, 4.0, 4.5, 4.8].map((rate) => (
            <button
              key={rate}
              type="button"
              onClick={() => onChange({ ...filters, minRating: rate })}
              className={`py-2 px-1 rounded-xl text-xs font-bold border flex items-center justify-center gap-1 transition-all cursor-pointer ${
                filters.minRating === rate
                  ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              <Star size={11} className={filters.minRating === rate ? 'fill-white text-white' : 'fill-amber-400 text-amber-400'} />
              <span>{rate === 0 ? t('all') : `${rate}+`}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Emergency Toggle */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
        <label className="flex items-center justify-between cursor-pointer p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors">
          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <ShieldAlert size={14} className="text-red-500" />
            <span>{t('emergency247Only')}</span>
          </span>
          <input
            type="checkbox"
            checked={filters.isEmergencyOnly}
            onChange={(e) => onChange({ ...filters, isEmergencyOnly: e.target.checked })}
            className="w-4 h-4 rounded text-red-600 focus:ring-red-500 cursor-pointer"
          />
        </label>
      </div>
    </div>
  );
};

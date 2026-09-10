import React from 'react';
import { LucideIcon, Search, CalendarX, AlertCircle } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Search,
  title,
  description,
  actionText,
  onAction,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 md:p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xs max-w-lg mx-auto transition-colors duration-200 ${className}`}
    >
      <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
        <Icon size={32} />
      </div>
      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-6 leading-relaxed">{description}</p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-all shadow-sm hover:shadow-md cursor-pointer"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};

export const NoNearbyClinicsState: React.FC<{
  radiusKm?: number;
  specialtyName?: string;
  onExpandRadius?: () => void;
  expandActionLabel?: string;
  onClearSpecialty?: () => void;
  onShowAll?: () => void;
  nearestDistanceKm?: number;
}> = ({
  radiusKm = 5,
  specialtyName,
  onExpandRadius,
  expandActionLabel,
  onClearSpecialty,
  onShowAll,
  nearestDistanceKm,
}) => {
  const { language, t } = useLanguage();

  const title = specialtyName
    ? language === 'uz'
      ? `${specialtyName} bo‘yicha ${radiusKm} km radiusda klinika topilmadi`
      : language === 'ru'
      ? `Клиники по направлению «${specialtyName}» в радиусе ${radiusKm} км не найдены`
      : `No ${specialtyName} clinics found within ${radiusKm} km`
    : language === 'uz'
    ? `${radiusKm} km radiusda hamkor klinikalar topilmadi`
    : language === 'ru'
    ? `В радиусе ${radiusKm} км партнерских клиник не найдено`
    : `No partner clinics found within ${radiusKm} km`;

  const description = nearestDistanceKm
    ? language === 'uz'
      ? `Sizning joylashuvingizdan eng yaqin klinika taxminan ${nearestDistanceKm.toFixed(1)} km masofada joylashgan. Qidiruv radiusini kengaytirib ko‘ring.`
      : language === 'ru'
      ? `Ближайшая к вам клиника находится примерно в ${nearestDistanceKm.toFixed(1)} км. Попробуйте увеличить радиус поиска.`
      : `The nearest clinic to your location is approximately ${nearestDistanceKm.toFixed(1)} km away. Try expanding your search radius.`
    : language === 'uz'
    ? 'Biz faqat xizmat sifati va real vaqt rejimida qabulni kafolatlash uchun rasmiy tasdiqlangan hamkor klinikalarni chiqaramiz. Qidiruv radiusini kengaytiring yoki barcha hududni ko‘ring.'
    : language === 'ru'
    ? 'Мы показываем только официально подтвержденные клиники. Попробуйте увеличить радиус поиска или просмотреть все клиники Ташкента.'
    : 'We only show verified partner clinics. Try expanding your search radius or viewing all clinics across Tashkent.';

  return (
    <div className="flex flex-col items-center justify-center p-6 sm:p-10 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs max-w-lg mx-auto transition-colors duration-200">
      <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
        <Search size={28} />
      </div>
      <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-2 leading-snug">{title}</h3>
      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-6 leading-relaxed">{description}</p>
      
      <div className="flex flex-wrap items-center justify-center gap-2.5">
        {onExpandRadius && (
          <button
            onClick={onExpandRadius}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm transition-all shadow-xs hover:shadow-md cursor-pointer active:scale-95"
          >
            {expandActionLabel || (language === 'uz' ? 'Radiusni kengaytirish' : language === 'ru' ? 'Увеличить радиус' : 'Expand Radius')}
          </button>
        )}

        {onClearSpecialty && specialtyName && (
          <button
            onClick={onClearSpecialty}
            className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs sm:text-sm transition-all cursor-pointer active:scale-95 border border-slate-200 dark:border-slate-700"
          >
            {language === 'uz' ? 'Barcha mutaxassisliklar' : language === 'ru' ? 'Все специальности' : 'All Specialties'}
          </button>
        )}

        {onShowAll && (
          <button
            onClick={onShowAll}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold text-xs sm:text-sm transition-all cursor-pointer"
          >
            {language === 'uz' ? 'Barcha masofalarni ko‘rish' : language === 'ru' ? 'Показать все' : 'Show All'}
          </button>
        )}
      </div>
    </div>
  );
};

export const NoAppointmentsState: React.FC<{ onBookNow?: () => void }> = ({ onBookNow }) => {
  const { t } = useLanguage();
  return (
    <EmptyState
      icon={CalendarX}
      title={t('noAppointmentsFound')}
      description={t('noAppointmentsFoundDesc')}
      actionText={onBookNow ? t('findDoctorsNearby') : undefined}
      onAction={onBookNow}
    />
  );
};

import React, { useState, useEffect } from 'react';
import { Clock, Search, X, Trash2, ArrowRight } from 'lucide-react';
import { recentSearchService, RecentSearchItem } from '../../services/recentSearchService';
import { useLanguage } from '../../context/LanguageContext';
import { getSpecialtyName } from '../../utils/specialtyTranslations';

interface RecentSearchesProps {
  onSelectSearch: (item: RecentSearchItem) => void;
  currentQuery?: string;
  className?: string;
}

export const RecentSearches: React.FC<RecentSearchesProps> = ({
  onSelectSearch,
  currentQuery = '',
  className = '',
}) => {
  const { t, language } = useLanguage();
  const [recentSearches, setRecentSearches] = useState<RecentSearchItem[]>([]);

  const loadSearches = () => {
    // Return at most the last 5 search queries
    const searches = recentSearchService.getRecentSearches().slice(0, 5);
    setRecentSearches(searches);
  };

  useEffect(() => {
    loadSearches();

    // Listen to local storage changes
    const handleStorage = () => loadSearches();
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const handleRemove = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updated = recentSearchService.removeRecentSearch(id).slice(0, 5);
    setRecentSearches(updated);
  };

  const handleClearAll = () => {
    recentSearchService.clearRecentSearches();
    setRecentSearches([]);
  };

  if (recentSearches.length === 0) {
    return null;
  }

  const formatTimeAgo = (timestamp: number) => {
    const diffSeconds = Math.floor((Date.now() - timestamp) / 1000);
    if (diffSeconds < 60) return 'hozir';
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m`;
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h`;
    return `${Math.floor(diffSeconds / 86400)}d`;
  };

  return (
    <div
      className={`bg-white dark:bg-slate-900 rounded-2xl p-3.5 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-2.5 transition-colors duration-200 ${className}`}
      id="recent-searches-section"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200">
          <Clock size={14} className="text-blue-600 dark:text-blue-400 shrink-0" />
          <span>{t('recentSearches')}</span>
          <span className="px-1.5 py-0.2 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-[10px] font-extrabold border border-blue-100 dark:border-blue-800">
            {recentSearches.length} / 5
          </span>
        </div>

        <button
          type="button"
          onClick={handleClearAll}
          className="text-[11px] font-semibold text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors flex items-center gap-1 cursor-pointer"
          title={t('clearAllRecent')}
        >
          <Trash2 size={12} />
          <span>{t('clearAllRecent')}</span>
        </button>
      </div>

      {/* List of last 5 search query chips */}
      <div className="flex flex-wrap items-center gap-2">
        {recentSearches.map((item) => {
          const displayLabel = item.query
            ? item.query
            : item.specialty
            ? getSpecialtyName(item.specialty, language)
            : item.locationName || t('searchAgain');

          const isMatching = currentQuery.trim().toLowerCase() === (item.query || '').trim().toLowerCase();

          return (
            <div
              key={item.id}
              onClick={() => onSelectSearch(item)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  onSelectSearch(item);
                }
              }}
              className={`group inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer select-none ${
                isMatching
                  ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-300 shadow-2xs'
                  : 'bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              <Search
                size={12}
                className={isMatching ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors'}
              />

              <span className="truncate max-w-[160px] sm:max-w-[220px]">
                {displayLabel}
              </span>

              {item.specialty && item.query && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-medium">
                  {getSpecialtyName(item.specialty, language)}
                </span>
              )}

              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">
                {formatTimeAgo(item.timestamp)}
              </span>

              <button
                type="button"
                onClick={(e) => handleRemove(e, item.id)}
                className="w-4 h-4 rounded-full flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer ml-0.5"
                title="Remove this search query"
                aria-label="Remove search"
              >
                <X size={11} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

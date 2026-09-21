import React, { useState, useEffect } from 'react';
import { History, Clock, MapPin, Search, ArrowRight, Trash2, X, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { recentSearchService, RecentSearchItem } from '../../services/recentSearchService';
import { useLanguage } from '../../context/LanguageContext';
import { useLocation } from '../../context/LocationContext';
import { PRESET_LOCATIONS } from '../../utils/geo';

export const RecentSearchesSection: React.FC = () => {
  const [searches, setSearches] = useState<RecentSearchItem[]>([]);
  const { t, language } = useLanguage();
  const { setUserLocation, setRadiusKm } = useLocation();
  const navigate = useNavigate();

  const loadSearches = () => {
    const items = recentSearchService.getRecentSearches();
    setSearches(items);
  };

  useEffect(() => {
    loadSearches();
    // Listen for storage events across tabs or local updates
    window.addEventListener('storage', loadSearches);
    return () => window.removeEventListener('storage', loadSearches);
  }, []);

  const handleClearAll = () => {
    recentSearchService.clearRecentSearches();
    setSearches([]);
  };

  const handleRemove = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updated = recentSearchService.removeRecentSearch(id);
    setSearches(updated);
  };

  const handleReRunSearch = (item: RecentSearchItem) => {
    // If coordinates were saved with the search, optionally update location context
    if (item.coordinates) {
      setUserLocation(item.coordinates);
    }
    if (item.radiusKm) {
      setRadiusKm(item.radiusKm);
    }

    const params = new URLSearchParams();
    if (item.query) params.set('q', item.query);
    if (item.specialty) params.set('specialty', item.specialty);
    if (item.searchType && item.searchType !== 'all') params.set('searchType', item.searchType);
    if (item.radiusKm) params.set('radius', item.radiusKm.toString());

    // Record it as a fresh search
    recentSearchService.addRecentSearch({
      query: item.query,
      specialty: item.specialty,
      locationName: item.locationName,
      coordinates: item.coordinates,
      radiusKm: item.radiusKm,
      searchType: item.searchType,
    });

    navigate(`/search?${params.toString()}`);
  };

  const formatTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return language === 'uz' ? 'Hozirgina' : language === 'ru' ? 'Только что' : 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
      return language === 'uz' ? `${minutes} daq oldin` : language === 'ru' ? `${minutes} мин назад` : `${minutes}m ago`;
    }
    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      return language === 'uz' ? `${hours} soat oldin` : language === 'ru' ? `${hours} ч назад` : `${hours}h ago`;
    }
    const days = Math.floor(hours / 24);
    return language === 'uz' ? `${days} kun oldin` : language === 'ru' ? `${days} дн назад` : `${days}d ago`;
  };

  if (searches.length === 0) {
    return null; // Clean: Don't show empty block if user has no recent searches
  }

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="bg-gradient-to-r from-slate-50 to-blue-50/40 dark:from-slate-900 dark:to-slate-850 rounded-3xl p-5 md:p-6 border border-slate-200/90 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-100/80 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 flex items-center justify-center shrink-0">
              <History size={17} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base flex items-center gap-2">
                <span>{t('recentSearches')}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-600/10 dark:bg-blue-400/20 text-blue-700 dark:text-blue-300 font-extrabold">
                  {searches.length}
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                {t('recentSearchesDesc')}
              </p>
            </div>
          </div>

          <button
            onClick={handleClearAll}
            className="self-end sm:self-auto text-xs text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
          >
            <Trash2 size={13} />
            <span>{t('clearRecentSearches')}</span>
          </button>
        </div>

        {/* Recent Search Cards Horizontal Scroll / Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {searches.map((item) => {
            const displayTitle =
              item.query ||
              item.specialty ||
              (item.locationName ? `Near ${item.locationName}` : 'Nearby search');

            return (
              <div
                key={item.id}
                onClick={() => handleReRunSearch(item)}
                className="group relative bg-white dark:bg-slate-900 hover:bg-blue-50/40 dark:hover:bg-slate-800/80 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 shadow-2xs hover:shadow-sm transition-all duration-200 cursor-pointer flex flex-col justify-between"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 text-slate-600 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 flex items-center justify-center shrink-0 transition-colors">
                      <Search size={13} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-400 truncate transition-colors">
                        {displayTitle}
                      </h4>
                      {item.specialty && item.query && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {item.specialty}
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={(e) => handleRemove(e, item.id)}
                    title="Remove"
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-all cursor-pointer shrink-0"
                  >
                    <X size={13} />
                  </button>
                </div>

                <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100/80 dark:border-slate-800 text-[11px] text-slate-400 dark:text-slate-500">
                  <span className="flex items-center gap-1">
                    <MapPin size={11} className="text-slate-400" />
                    <span className="truncate max-w-[100px]">
                      {item.locationName || `${item.radiusKm || 5} km radius`}
                    </span>
                  </span>

                  <div className="flex items-center gap-1 text-slate-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 font-medium">
                    <Clock size={10} />
                    <span>{formatTimeAgo(item.timestamp)}</span>
                    <ArrowRight size={11} className="opacity-0 group-hover:opacity-100 transition-opacity ml-0.5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

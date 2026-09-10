import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Navigation, Sparkles, X, Clock, Trash2 } from 'lucide-react';
import { useLocation } from '../../context/LocationContext';
import { useLanguage } from '../../context/LanguageContext';
import { parseSmartSearchQuery } from '../../utils/geo';
import { useNavigate } from 'react-router-dom';
import { VoiceSearchButton } from './VoiceSearchButton';
import { recentSearchService, RecentSearchItem } from '../../services/recentSearchService';
import { triggerHaptic } from '../../utils/haptics';
import { getSpecialtyName } from '../../utils/specialtyTranslations';

interface SearchBarProps {
  initialQuery?: string;
  onSearch?: (query: string, specialty?: string | null) => void;
  className?: string;
  size?: 'normal' | 'large';
  showHistoryDropdown?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  initialQuery = '',
  onSearch,
  className = '',
  size = 'large',
  showHistoryDropdown = true,
}) => {
  const [query, setQuery] = useState<string>(initialQuery);
  const [smartSuggestion, setSmartSuggestion] = useState<{
    specialty: string | null;
    isEmergency: boolean;
  }>({ specialty: null, isEmergency: false });
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const [recentSearches, setRecentSearches] = useState<RecentSearchItem[]>([]);

  const { userLocation, radiusKm, detectCurrentLocation, isLocating } = useLocation();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  const loadRecentSearches = () => {
    const list = recentSearchService.getRecentSearches().slice(0, 6);
    setRecentSearches(list);
  };

  useEffect(() => {
    loadRecentSearches();
  }, []);

  // Handle outside click to close history dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Smart Query detection as user types
  useEffect(() => {
    if (query.trim().length >= 3) {
      const parsed = parseSmartSearchQuery(query);
      setSmartSuggestion({
        specialty: parsed.detectedSpecialty,
        isEmergency: parsed.detectedEmergency,
      });
    } else {
      setSmartSuggestion({ specialty: null, isEmergency: false });
    }
  }, [query]);

  const saveSearchToHistory = (qStr: string, specStr?: string | null) => {
    recentSearchService.addRecentSearch({
      query: qStr,
      specialty: specStr,
      locationName: userLocation.address?.split(',')[0] || userLocation.city || 'Tashkent',
      coordinates: userLocation,
      radiusKm: radiusKm || 5.0,
    });
    loadRecentSearches();
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic('light');
    setIsFocused(false);
    saveSearchToHistory(query, smartSuggestion.specialty);
    if (onSearch) {
      onSearch(query, smartSuggestion.specialty);
    } else {
      const params = new URLSearchParams();
      if (query) params.set('q', query);
      if (smartSuggestion.specialty) params.set('specialty', smartSuggestion.specialty);
      navigate(`/search?${params.toString()}`);
    }
  };

  const handleSelectRecentSearch = (item: RecentSearchItem) => {
    triggerHaptic('selection');
    const selectedQ = item.query || '';
    setQuery(selectedQ);
    setIsFocused(false);

    if (onSearch) {
      onSearch(selectedQ, item.specialty);
    } else {
      const params = new URLSearchParams();
      if (selectedQ) params.set('q', selectedQ);
      if (item.specialty) params.set('specialty', item.specialty);
      navigate(`/search?${params.toString()}`);
    }
  };

  const handleRemoveHistoryItem = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    triggerHaptic('light');
    const updated = recentSearchService.removeRecentSearch(id);
    setRecentSearches(updated.slice(0, 6));
  };

  const handleClearAllHistory = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('medium');
    recentSearchService.clearRecentSearches();
    setRecentSearches([]);
  };

  const applySpecialtySuggestion = (spec: string) => {
    triggerHaptic('light');
    saveSearchToHistory(query, spec);
    setIsFocused(false);
    if (onSearch) {
      onSearch(query, spec);
    } else {
      navigate(`/search?specialty=${encodeURIComponent(spec)}&q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <div ref={containerRef} className={`relative w-full max-w-3xl mx-auto ${className}`}>
      <form
        onSubmit={handleFormSubmit}
        className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-2 md:p-2.5 flex flex-col md:flex-row items-center gap-2 transition-all focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20`}
      >
        {/* Search text input */}
        <div className="flex-1 flex items-center gap-2.5 w-full px-3">
          <Search size={18} className="text-slate-400 shrink-0" />
          <input
            type="text"
            value={query}
            onFocus={() => {
              loadRecentSearches();
              setIsFocused(true);
            }}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="w-full text-slate-900 dark:text-slate-100 placeholder-slate-400 text-sm bg-transparent focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setQuery('');
              }}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
            >
              <X size={15} />
            </button>
          )}

          {/* Voice to text Search Button */}
          <VoiceSearchButton
            size="sm"
            onSearchQuery={(spokenText) => {
              triggerHaptic('light');
              setQuery(spokenText);
              setIsFocused(false);
              const parsed = parseSmartSearchQuery(spokenText);
              saveSearchToHistory(spokenText, parsed.detectedSpecialty);
              if (onSearch) {
                onSearch(spokenText, parsed.detectedSpecialty);
              } else {
                const params = new URLSearchParams();
                params.set('q', spokenText);
                if (parsed.detectedSpecialty) params.set('specialty', parsed.detectedSpecialty);
                navigate(`/search?${params.toString()}`);
              }
            }}
          />
        </div>

        {/* Divider for desktop */}
        <div className="hidden md:block w-px h-7 bg-slate-200 dark:bg-slate-800" />

        {/* Location & GPS Button */}
        <div className="w-full md:w-auto flex items-center justify-between md:justify-start gap-2 px-2 py-1 md:py-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              detectCurrentLocation();
            }}
            disabled={isLocating}
            title={t('currentGPS')}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/70 px-3 py-2 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
          >
            <span className="w-2 h-2 bg-emerald-500 rounded-full shrink-0"></span>
            <span className="truncate max-w-[130px]">
              {userLocation.address?.split(',')[0] || 'Tashkent'} (5km)
            </span>
          </button>

          {/* Submit Search Button */}
          <button
            type="submit"
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-semibold text-sm rounded-xl transition-all shadow-lg shadow-blue-200 dark:shadow-none hover:shadow-xl cursor-pointer shrink-0"
          >
            {t('findDoctorsBtn')}
          </button>
        </div>
      </form>

      {/* Interactive Search History Dropdown */}
      {showHistoryDropdown && isFocused && recentSearches.length > 0 && !query.trim() && (
        <div
          id="search-history-dropdown"
          className="absolute top-full mt-2 left-0 right-0 z-30 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl p-3 animate-in fade-in slide-in-from-top-2 duration-150"
        >
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-slate-600 dark:text-slate-300">
              <Clock size={13} className="text-blue-600" />
              <span>{t('recentSearches') || 'Qidiruv tarixi'}</span>
            </div>
            <button
              type="button"
              onMouseDown={handleClearAllHistory}
              className="text-[11px] font-semibold text-slate-400 hover:text-rose-600 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Trash2 size={11} />
              <span>{t('clearAllRecent') || 'Tozalash'}</span>
            </button>
          </div>

          <div className="space-y-1">
            {recentSearches.map((item) => (
              <div
                key={item.id}
                onMouseDown={() => handleSelectRecentSearch(item)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer group transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Clock size={13} className="text-slate-400 group-hover:text-blue-600 shrink-0" />
                  <span className="font-medium truncate">
                    {item.query || (item.specialty ? getSpecialtyName(item.specialty, language) : 'Tashkent')}
                  </span>
                  {item.specialty && item.query && (
                    <span className="px-1.5 py-0.2 rounded text-[10px] bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                      {getSpecialtyName(item.specialty, language)}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onMouseDown={(e) => handleRemoveHistoryItem(e, item.id)}
                  className="text-slate-300 hover:text-rose-500 p-1 rounded transition-colors opacity-0 group-hover:opacity-100"
                  title="Remove"
                >
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Smart Natural Language Intent Badge */}
      {smartSuggestion.specialty && (
        <div className="mt-2.5 flex items-center gap-2 px-3.5 py-1.5 bg-blue-50 dark:bg-slate-800 border border-blue-100 dark:border-slate-700 rounded-xl text-xs text-blue-900 dark:text-blue-300 animate-in fade-in slide-in-from-top-1">
          <Sparkles size={14} className="text-blue-600 shrink-0" />
          <span>
            {t('smartFilter')}: <strong>{smartSuggestion.specialty}</strong>
          </span>
          <button
            type="button"
            onClick={() => applySpecialtySuggestion(smartSuggestion.specialty!)}
            className="ml-auto text-xs font-bold text-blue-700 dark:text-blue-300 bg-white dark:bg-slate-900 px-2.5 py-0.5 rounded-lg border border-blue-200 dark:border-slate-700 hover:bg-blue-600 hover:text-white transition-colors cursor-pointer"
          >
            {t('findDoctorsBtn')} ({smartSuggestion.specialty})
          </button>
        </div>
      )}
    </div>
  );
};

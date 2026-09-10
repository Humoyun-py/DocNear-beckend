import { LocationCoordinates } from '../types';

export interface RecentSearchItem {
  id: string;
  query: string;
  specialty?: string | null;
  locationName?: string;
  coordinates?: LocationCoordinates;
  radiusKm?: number;
  searchType?: 'all' | 'doctors' | 'clinics';
  timestamp: number;
}

const STORAGE_KEY = 'docnear_recent_searches_v1';
const MAX_RECENT_SEARCHES = 8;

export const recentSearchService = {
  getRecentSearches(): RecentSearchItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return [];
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed.slice(0, MAX_RECENT_SEARCHES);
      }
      return [];
    } catch (err) {
      console.warn('Failed to read recent searches from localStorage:', err);
      return [];
    }
  },

  addRecentSearch(item: {
    query?: string;
    specialty?: string | null;
    locationName?: string;
    coordinates?: LocationCoordinates;
    radiusKm?: number;
    searchType?: 'all' | 'doctors' | 'clinics';
  }): void {
    const q = (item.query || '').trim();
    const spec = item.specialty && item.specialty !== 'all' ? item.specialty : null;

    // Ignore completely empty searches without specialty or location
    if (!q && !spec && !item.locationName) return;

    try {
      const current = this.getRecentSearches();
      // Filter out duplicate identical search
      const filtered = current.filter((s) => {
        const sameQuery = (s.query || '').toLowerCase() === q.toLowerCase();
        const sameSpec = (s.specialty || '') === (spec || '');
        const sameLoc = (s.locationName || '') === (item.locationName || '');
        return !(sameQuery && sameSpec && sameLoc);
      });

      const newItem: RecentSearchItem = {
        id: `search_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        query: q,
        specialty: spec,
        locationName: item.locationName,
        coordinates: item.coordinates,
        radiusKm: item.radiusKm || 5.0,
        searchType: item.searchType || 'all',
        timestamp: Date.now(),
      };

      const updated = [newItem, ...filtered].slice(0, MAX_RECENT_SEARCHES);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.warn('Failed to save recent search to localStorage:', err);
    }
  },

  removeRecentSearch(id: string): RecentSearchItem[] {
    try {
      const current = this.getRecentSearches();
      const updated = current.filter((s) => s.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    } catch (err) {
      console.warn('Failed to remove recent search:', err);
      return [];
    }
  },

  clearRecentSearches(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      console.warn('Failed to clear recent searches:', err);
    }
  },
};

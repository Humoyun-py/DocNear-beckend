import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Clinic, Doctor, SearchFilterState, SortByOption, LocationCoordinates } from '../types';
import { clinicService } from '../services/clinicService';
import { doctorService } from '../services/doctorService';
import { useLocation } from '../context/LocationContext';
import { useLanguage } from '../context/LanguageContext';
import { useAppointments } from '../context/AppointmentContext';
import { SearchBar } from '../components/search/SearchBar';
import { FilterPanel } from '../components/search/FilterPanel';
import { ClinicCard } from '../components/clinics/ClinicCard';
import { DoctorCard } from '../components/doctors/DoctorCard';
import { MapView } from '../components/map/MapView';
import {
  ClinicCardSkeleton,
  DoctorCardSkeleton,
  ClinicListSkeleton,
  DoctorListSkeleton,
} from '../components/common/SkeletonCard';
import { NoNearbyClinicsState, EmptyState } from '../components/common/EmptyState';
import { PartnerBadge } from '../components/common/PartnerBadge';
import { RatingBadge } from '../components/common/RatingBadge';
import { DistanceBadge } from '../components/common/DistanceBadge';
import { RecentSearches } from '../components/search/RecentSearches';
import { recentSearchService, RecentSearchItem } from '../services/recentSearchService';
import { calculateDistanceKm, DISTANCE_OPTIONS, MAX_DISTANCE_ALL } from '../utils/geo';
import { isMatchingSpecialty, getSpecialtyName } from '../utils/specialtyTranslations';
import { INSURANCE_PROVIDERS } from '../data/insuranceProviders';
import {
  SlidersHorizontal,
  Map as MapIcon,
  List,
  Search,
  Sparkles,
  Building2,
  Users,
  Clock,
  Star,
  Tag,
  AlertCircle,
  Calendar,
  MapPin,
  X,
  ArrowLeft,
  Navigation,
  Phone,
  ArrowRight,
  Layers,
  Check,
  Sunrise,
  Sun,
  Sunset,
  ChevronDown,
  ArrowDownUp,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { userLocation, setRadiusKm } = useLocation();
  const { openBookingModal } = useAppointments();
  const { t, language } = useLanguage();

  const queryParam = searchParams.get('q') || '';
  const specialtyParam = searchParams.get('specialty') || 'all';
  const insuranceParam = searchParams.get('insurance') || 'all';
  const typeParam = (searchParams.get('searchType') as SearchFilterState['searchType']) || 'all';
  const viewParam = (searchParams.get('view') as 'split' | 'list' | 'map') || 'split';
  const sortParam = (searchParams.get('sortBy') as SortByOption) || 'relevance';

  const [filters, setFilters] = useState<SearchFilterState>({
    query: queryParam,
    specialty: specialtyParam,
    insuranceProvider: insuranceParam,
    maxDistanceKm: 5.0,
    minRating: 0,
    availability: searchParams.get('availability') === 'today' ? 'today' : 'all',
    isEmergencyOnly: searchParams.get('emergency') === 'true',
    viewMode: viewParam,
    searchType: typeParam,
    openNowOnly: false,
    sortBy: sortParam,
  });

  // Sync radius with LocationContext
  useEffect(() => {
    setRadiusKm(filters.maxDistanceKm);
  }, [filters.maxDistanceKm, setRadiusKm]);

  // Quick toggle filter states
  const [isAffordableOnly, setIsAffordableOnly] = useState<boolean>(false);
  const [isFullscreenMap, setIsFullscreenMap] = useState<boolean>(viewParam === 'map');

  const [allClinics, setAllClinics] = useState<Clinic[]>([]);
  const [allDoctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedClinicId, setSelectedClinicId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState<boolean>(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.maxDistanceKm !== 5.0) count++;
    if (filters.specialty !== 'all' && filters.specialty) count++;
    if (filters.insuranceProvider && filters.insuranceProvider !== 'all') count++;
    if (filters.minRating > 0) count++;
    if (filters.openNowOnly) count++;
    if (filters.isEmergencyOnly) count++;
    if (filters.availability && filters.availability !== 'all') count++;
    if (filters.timeOfDay && filters.timeOfDay !== 'all') count++;
    if (isAffordableOnly) count++;
    return count;
  }, [filters, isAffordableOnly]);

  // Sync state with URL params
  useEffect(() => {
    setFilters((prev) => {
      let updated = false;
      const next = { ...prev };
      if (queryParam !== prev.query) {
        next.query = queryParam;
        updated = true;
      }
      if (specialtyParam !== prev.specialty) {
        next.specialty = specialtyParam;
        updated = true;
      }
      if (insuranceParam !== prev.insuranceProvider) {
        next.insuranceProvider = insuranceParam;
        updated = true;
      }
      if (typeParam && typeParam !== prev.searchType) {
        next.searchType = typeParam;
        updated = true;
      }
      return updated ? next : prev;
    });
  }, [queryParam, specialtyParam, insuranceParam, typeParam]);

  // Record searches in history when query or specialty changes
  useEffect(() => {
    if (filters.query || (filters.specialty && filters.specialty !== 'all')) {
      recentSearchService.addRecentSearch({
        query: filters.query,
        specialty: filters.specialty !== 'all' ? filters.specialty : undefined,
        locationName: userLocation.address?.split(',')[0] || userLocation.city || 'Tashkent',
        coordinates: userLocation,
        radiusKm: filters.maxDistanceKm,
        searchType: filters.searchType,
      });
    }
  }, [filters.query, filters.specialty, filters.maxDistanceKm]);

  // Load raw data
  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const [clinicsData, doctorsData] = await Promise.all([
          clinicService.getPartnerClinics(userLocation),
          doctorService.getDoctors(userLocation),
        ]);
        setAllClinics(clinicsData);
        setDoctors(doctorsData);
      } catch (err) {
        console.error('Search fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [userLocation]);

  // Filtered & Sorted Clinics
  const filteredClinics = useMemo(() => {
    const q = filters.query.toLowerCase().trim();

    // Filter clinics
    const result = allClinics.filter((c) => {
      const matchQuery =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.address.toLowerCase().includes(q) ||
        c.specialties.some((s) => s.toLowerCase().includes(q));

      const matchSpecialty =
        filters.specialty === 'all' || !filters.specialty
          ? true
          : c.specialties.some((s) => isMatchingSpecialty(s, filters.specialty));

      const matchInsurance =
        !filters.insuranceProvider ||
        filters.insuranceProvider === 'all' ||
        (c.acceptedInsurances &&
          c.acceptedInsurances.some(
            (ins) => ins.toLowerCase() === filters.insuranceProvider!.toLowerCase()
          ));

      // Compute dynamic distance from the user location
      const isAllDistance = filters.maxDistanceKm >= MAX_DISTANCE_ALL;
      const dynamicDist = calculateDistanceKm(userLocation, c.coordinates);
      const matchDistance = isAllDistance ? true : dynamicDist <= filters.maxDistanceKm;
      const matchRating = c.rating >= filters.minRating;
      const matchEmergency = !filters.isEmergencyOnly || c.isEmergency24x7;
      const matchOpenNow = !filters.openNowOnly || c.isOpenNow || c.isEmergency24x7;

      // Affordable: services under budget
      const matchAffordable =
        !isAffordableOnly ||
        c.services.some((s) => {
          if (!s.price) return true;
          const num = parseInt(s.price.replace(/[^\d]/g, ''), 10);
          return isNaN(num) || num <= 160000;
        });

      return (
        matchQuery &&
        matchSpecialty &&
        matchInsurance &&
        matchDistance &&
        matchRating &&
        matchEmergency &&
        matchOpenNow &&
        matchAffordable
      );
    }).map((c) => ({
      ...c,
      distanceKm: calculateDistanceKm(userLocation, c.coordinates),
    }));

    // Apply Sorting logic
    const sortBy = filters.sortBy || 'relevance';
    if (sortBy === 'distance') {
      result.sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));
    } else if (sortBy === 'rating') {
      result.sort((a, b) => b.rating - a.rating || (b.reviewCount ?? 0) - (a.reviewCount ?? 0));
    } else if (sortBy === 'availability') {
      result.sort((a, b) => {
        const aOpen = a.isOpenNow || a.isEmergency24x7 ? 1 : 0;
        const bOpen = b.isOpenNow || b.isEmergency24x7 ? 1 : 0;
        if (bOpen !== aOpen) return bOpen - aOpen;
        return (a.distanceKm ?? 999) - (b.distanceKm ?? 999);
      });
    } else {
      // Relevance
      result.sort((a, b) => {
        if (a.isPartner !== b.isPartner) return a.isPartner ? -1 : 1;
        return (a.distanceKm ?? 999) - (b.distanceKm ?? 999);
      });
    }

    return result;
  }, [allClinics, filters, isAffordableOnly, userLocation]);

  // Filtered & Sorted Doctors
  const filteredDoctors = useMemo(() => {
    const q = filters.query.toLowerCase().trim();

    // Clinic coordinate map and clinic lookup for fast doctor lookup
    const clinicCoordsMap = new Map<string, LocationCoordinates>();
    const clinicObjMap = new Map<string, Clinic>();
    allClinics.forEach((c) => {
      clinicObjMap.set(c.id, c);
      if (c.coordinates) {
        clinicCoordsMap.set(c.id, c.coordinates);
      }
    });

    const result = allDoctors.filter((d) => {
      const matchQuery =
        !q ||
        d.name.toLowerCase().includes(q) ||
        d.specialty.toLowerCase().includes(q) ||
        d.clinicName.toLowerCase().includes(q) ||
        d.biography.toLowerCase().includes(q) ||
        (d.subSpecialties && d.subSpecialties.some((s) => s.toLowerCase().includes(q)));

      const matchSpecialty =
        filters.specialty === 'all' || !filters.specialty
          ? true
          : isMatchingSpecialty(d.specialty, filters.specialty) ||
            (d.subSpecialties &&
              d.subSpecialties.some((s) => isMatchingSpecialty(s, filters.specialty)));

      const docClinic = clinicObjMap.get(d.clinicId);
      const matchInsurance =
        !filters.insuranceProvider ||
        filters.insuranceProvider === 'all' ||
        (docClinic &&
          docClinic.acceptedInsurances &&
          docClinic.acceptedInsurances.some(
            (ins) => ins.toLowerCase() === filters.insuranceProvider!.toLowerCase()
          ));

      // Dynamic distance calculation via doctor's associated clinic from userLocation
      const isAllDistance = filters.maxDistanceKm >= MAX_DISTANCE_ALL;
      const clinicCoords = clinicCoordsMap.get(d.clinicId);
      const dynamicDist = clinicCoords
        ? calculateDistanceKm(userLocation, clinicCoords)
        : (d.distanceKm ?? 999);
      const matchDistance = isAllDistance ? true : dynamicDist <= filters.maxDistanceKm;
      const matchRating = d.rating >= filters.minRating;
      const matchToday = filters.availability !== 'today' || d.availableToday;

      const matchTimeOfDay = (() => {
        if (!filters.timeOfDay || filters.timeOfDay === 'all') return true;
        const target = filters.timeOfDay;
        return d.weeklySchedule.some((day) =>
          day.slots.some((slot) => {
            if (!slot.isAvailable) return false;
            if (slot.period === target) return true;
            const hour = parseInt(slot.time.split(':')[0], 10);
            if (target === 'morning' && hour < 12) return true;
            if (target === 'afternoon' && hour >= 12 && hour < 17) return true;
            if (target === 'evening' && hour >= 17) return true;
            return false;
          })
        );
      })();

      const feeNum = parseInt(d.consultationFee.replace(/[^\d]/g, ''), 10);
      const matchAffordable = !isAffordableOnly || isNaN(feeNum) || feeNum <= 180000;

      return (
        matchQuery &&
        matchSpecialty &&
        matchInsurance &&
        matchDistance &&
        matchRating &&
        matchToday &&
        matchTimeOfDay &&
        matchAffordable
      );
    }).map((d) => {
      const clinicCoords = clinicCoordsMap.get(d.clinicId);
      const dynamicDist = clinicCoords
        ? calculateDistanceKm(userLocation, clinicCoords)
        : (d.distanceKm ?? 999);
      return {
        ...d,
        distanceKm: dynamicDist,
      };
    });

    // Apply Sorting logic
    const sortBy = filters.sortBy || 'relevance';
    if (sortBy === 'distance') {
      result.sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));
    } else if (sortBy === 'rating') {
      result.sort((a, b) => b.rating - a.rating || (b.reviewCount ?? 0) - (a.reviewCount ?? 0));
    } else if (sortBy === 'availability') {
      result.sort((a, b) => {
        const aAvail = a.availableToday ? 1 : 0;
        const bAvail = b.availableToday ? 1 : 0;
        if (bAvail !== aAvail) return bAvail - aAvail;
        return (a.distanceKm ?? 999) - (b.distanceKm ?? 999);
      });
    } else {
      // Relevance
      result.sort((a, b) => {
        return (a.distanceKm ?? 999) - (b.distanceKm ?? 999);
      });
    }

    return result;
  }, [allDoctors, allClinics, filters, isAffordableOnly, userLocation]);

  // Active clinics to display on the map (adapts if user is viewing Doctors tab or Clinics tab)
  const mapClinics = useMemo(() => {
    let list: Clinic[] = [];
    if (filters.searchType === 'clinics') {
      list = filteredClinics;
    } else if (filters.searchType === 'doctors') {
      const clinicIdSet = new Set(filteredDoctors.map((d) => d.clinicId));
      list = allClinics
        .filter((c) => clinicIdSet.has(c.id))
        .map((c) => ({
          ...c,
          distanceKm: calculateDistanceKm(userLocation, c.coordinates),
        }));
    } else {
      list = filteredClinics.length > 0 ? filteredClinics : allClinics;
    }

    if (list.length === 0 && allClinics.length > 0) {
      return allClinics.map((c) => ({
        ...c,
        distanceKm: calculateDistanceKm(userLocation, c.coordinates),
      }));
    }
    return list;
  }, [filters.searchType, filteredClinics, filteredDoctors, allClinics, userLocation]);

  const nearestClinicDistance = useMemo(() => {
    if (allClinics.length === 0) return undefined;
    let min = 999;
    allClinics.forEach((c) => {
      const d = calculateDistanceKm(userLocation, c.coordinates);
      if (d < min) min = d;
    });
    return min < 999 ? min : undefined;
  }, [allClinics, userLocation]);

  const getNextExpandRadius = (curr: number) => {
    if (curr <= 3) return 5;
    if (curr <= 5) return 10;
    if (curr <= 10) return 15;
    if (curr <= 15) return 25;
    return MAX_DISTANCE_ALL;
  };

  const handleExpandRadius = () => {
    const nextR = getNextExpandRadius(filters.maxDistanceKm);
    setFilters((p) => ({ ...p, maxDistanceKm: nextR }));
    setRadiusKm(nextR);
  };

  const handleClearSpecialty = () => {
    setFilters((p) => ({ ...p, specialty: 'all' }));
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('specialty');
      return next;
    });
  };

  const handleShowAllClinics = () => {
    setFilters((p) => ({ ...p, maxDistanceKm: MAX_DISTANCE_ALL, specialty: 'all' }));
    setRadiusKm(MAX_DISTANCE_ALL);
  };

  const activeSpecialtyName =
    filters.specialty && filters.specialty !== 'all'
      ? getSpecialtyName(filters.specialty, language)
      : undefined;

  const handleResetFilters = () => {
    setFilters({
      query: '',
      specialty: 'all',
      insuranceProvider: 'all',
      maxDistanceKm: 5.0,
      minRating: 0,
      availability: 'all',
      timeOfDay: 'all',
      isEmergencyOnly: false,
      viewMode: 'split',
      searchType: 'all',
      openNowOnly: false,
      sortBy: 'relevance',
    });
    setIsAffordableOnly(false);
    setSearchParams({});
  };

  const handleSelectRecentSearch = (item: RecentSearchItem) => {
    const nextQuery = item.query || '';
    const nextSpec = item.specialty || 'all';
    const nextRadius = item.radiusKm || 5.0;
    const nextType = item.searchType || 'all';

    setFilters((prev) => ({
      ...prev,
      query: nextQuery,
      specialty: nextSpec,
      maxDistanceKm: nextRadius,
      searchType: nextType,
    }));

    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      if (nextQuery) p.set('q', nextQuery);
      else p.delete('q');

      if (nextSpec && nextSpec !== 'all') p.set('specialty', nextSpec);
      else p.delete('specialty');

      if (nextType && nextType !== 'all') p.set('searchType', nextType);
      else p.delete('searchType');

      return p;
    });
  };

  const selectedClinic = allClinics.find((c) => c.id === selectedClinicId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-28 relative">
      {/* Top Header & Search Controls Bar */}
      <div className="space-y-4">
        {/* Subheader Banner */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {t('nearbyPartneredTitle')}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {t('nearbyPartneredSubtitle')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 rounded-full text-xs font-bold border border-emerald-200 dark:border-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>{t('activeRadiusBadge')} {filters.maxDistanceKm}km</span>
            </span>
          </div>
        </div>

        {/* Search Bar Component */}
        <SearchBar
          initialQuery={filters.query}
          onSearch={(q, spec) => {
            setFilters((prev) => ({
              ...prev,
              query: q,
              specialty: spec || prev.specialty,
            }));
          }}
        />

        {/* Recent Searches (Last 5 queries from localStorage) */}
        <RecentSearches
          onSelectSearch={handleSelectRecentSearch}
          currentQuery={filters.query}
        />

        {/* Dynamic Radius Quick Bar (1km, 5km, 10km) and Quick Filters */}
        <div className="flex flex-col gap-2.5">
          {/* RADIUS QUICK SELECTOR BAR */}
          <div className="flex items-center justify-between gap-2 bg-slate-50/90 dark:bg-slate-900/90 p-2 rounded-2xl border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 shrink-0">
              <MapPin size={14} className="text-blue-600 dark:text-blue-400" />
              <span>{t('distanceRadius')}:</span>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {[1.0, 5.0, 10.0, 15.0].map((radiusVal) => (
                <button
                  key={radiusVal}
                  onClick={() => setFilters((prev) => ({ ...prev, maxDistanceKm: radiusVal }))}
                  className={`px-3 py-1 rounded-xl text-xs font-extrabold transition-all cursor-pointer border ${
                    filters.maxDistanceKm === radiusVal
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-750'
                  }`}
                >
                  {radiusVal} km
                </button>
              ))}

              {/* Dynamic Select Menu */}
              <select
                value={filters.maxDistanceKm}
                onChange={(e) => setFilters((prev) => ({ ...prev, maxDistanceKm: Number(e.target.value) }))}
                className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                aria-label="Radius select menu"
              >
                <option value={1}>1 km</option>
                <option value={2}>2 km</option>
                <option value={3}>3 km</option>
                <option value={5}>5 km</option>
                <option value={8}>8 km</option>
                <option value={10}>10 km</option>
                <option value={12}>12 km</option>
                <option value={15}>15 km</option>
                <option value={20}>20 km</option>
                <option value={25}>25 km</option>
              </select>
            </div>
          </div>

          {/* HORIZONTAL QUICK FILTER SCROLLBAR */}
          <div className="relative">
            <div
              ref={scrollRef}
              className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 text-xs select-none"
            >
              {/* Open Now Pill */}
              <button
                onClick={() =>
                  setFilters((prev) => ({ ...prev, openNowOnly: !prev.openNowOnly }))
                }
                className={`px-3.5 py-2 rounded-xl font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer border shadow-2xs ${
                  filters.openNowOnly
                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <Clock size={14} className={filters.openNowOnly ? 'text-white' : 'text-emerald-600 dark:text-emerald-400'} />
                <span>{t('openNow')}</span>
                {filters.openNowOnly && <Check size={13} />}
              </button>

              {/* Top Rated Pill */}
              <button
                onClick={() =>
                  setFilters((prev) => ({
                    ...prev,
                    minRating: prev.minRating === 4.7 ? 0 : 4.7,
                  }))
                }
                className={`px-3.5 py-2 rounded-xl font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer border shadow-2xs ${
                  filters.minRating >= 4.7
                    ? 'bg-amber-500 border-amber-500 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <Star
                  size={14}
                  className={filters.minRating >= 4.7 ? 'text-white fill-white' : 'text-amber-500 fill-amber-500'}
                />
                <span>{t('topRated')}</span>
                {filters.minRating >= 4.7 && <Check size={13} />}
              </button>

              {/* Affordable Clinics Pill */}
              <button
                onClick={() => setIsAffordableOnly(!isAffordableOnly)}
                className={`px-3.5 py-2 rounded-xl font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer border shadow-2xs ${
                  isAffordableOnly
                    ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <Tag size={14} className={isAffordableOnly ? 'text-white' : 'text-blue-600 dark:text-blue-400'} />
                <span>{t('affordable')}</span>
                {isAffordableOnly && <Check size={13} />}
              </button>

              {/* 24/7 Emergency Pill */}
              <button
                onClick={() =>
                  setFilters((prev) => ({
                    ...prev,
                    isEmergencyOnly: !prev.isEmergencyOnly,
                  }))
                }
                className={`px-3.5 py-2 rounded-xl font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer border shadow-2xs ${
                  filters.isEmergencyOnly
                    ? 'bg-rose-600 border-rose-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <AlertCircle
                  size={14}
                  className={filters.isEmergencyOnly ? 'text-white' : 'text-rose-600 dark:text-rose-400'}
                />
                <span>{t('emergency247')}</span>
                {filters.isEmergencyOnly && <Check size={13} />}
              </button>

              {/* Available Today Pill */}
              <button
                onClick={() =>
                  setFilters((prev) => ({
                    ...prev,
                    availability: prev.availability === 'today' ? 'all' : 'today',
                  }))
                }
                className={`px-3.5 py-2 rounded-xl font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer border shadow-2xs ${
                  filters.availability === 'today'
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <Calendar size={14} className={filters.availability === 'today' ? 'text-white' : 'text-indigo-600 dark:text-indigo-400'} />
                <span>{t('availableToday')}</span>
                {filters.availability === 'today' && <Check size={13} />}
              </button>

              {/* Insurance Provider Quick Select Pill */}
              <div className="relative shrink-0">
                <select
                  value={filters.insuranceProvider || 'all'}
                  onChange={(e) => {
                    const insVal = e.target.value;
                    setFilters((prev) => ({ ...prev, insuranceProvider: insVal }));
                    setSearchParams((prev) => {
                      const p = new URLSearchParams(prev);
                      if (insVal && insVal !== 'all') p.set('insurance', insVal);
                      else p.delete('insurance');
                      return p;
                    });
                  }}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all text-xs cursor-pointer border shadow-2xs appearance-none pr-7 ${
                    filters.insuranceProvider && filters.insuranceProvider !== 'all'
                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                      : 'bg-white dark:bg-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                  aria-label="Filter by Insurance Provider"
                >
                  <option value="all" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-white">
                    {language === 'uz' ? 'Sug‘urta: Hammasi' : language === 'ru' ? 'Страховка: Все' : 'Insurance: All'}
                  </option>
                  {INSURANCE_PROVIDERS.filter((p) => p.id !== 'all').map((ins) => (
                    <option key={ins.id} value={ins.name} className="bg-white dark:bg-slate-800 text-slate-800 dark:text-white">
                      {ins.name}
                    </option>
                  ))}
                </select>
                <ShieldCheck
                  size={13}
                  className={`absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none ${
                    filters.insuranceProvider && filters.insuranceProvider !== 'all'
                      ? 'text-white'
                      : 'text-slate-400'
                  }`}
                />
              </div>

              {/* Reset / Clear Active Filters button */}
              {(filters.openNowOnly ||
                filters.minRating > 0 ||
                isAffordableOnly ||
                filters.isEmergencyOnly ||
                filters.availability === 'today' ||
                (filters.insuranceProvider && filters.insuranceProvider !== 'all') ||
                filters.maxDistanceKm !== 5.0 ||
                filters.specialty !== 'all' ||
                filters.query ||
                filters.sortBy !== 'relevance') && (
                <button
                  onClick={handleResetFilters}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
                >
                  <X size={13} />
                  <span>{t('clearFilter')}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Action summary bar & Primary Category Switcher & Sorting Dropdown */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          {/* Direct Category Tabs */}
          <div className="flex items-center gap-1 bg-slate-100/90 dark:bg-slate-800/90 p-1 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-2xs">
            <button
              onClick={() => {
                setFilters((prev) => ({ ...prev, searchType: 'all' }));
                setSearchParams((prev) => {
                  const p = new URLSearchParams(prev);
                  p.delete('searchType');
                  return p;
                });
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                filters.searchType === 'all'
                  ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-xs ring-1 ring-slate-200/70 dark:ring-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>{t('all')}</span>
              <span className="text-[11px] px-1.5 py-0.2 rounded-md bg-slate-200/70 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold">
                {filteredDoctors.length + filteredClinics.length}
              </span>
            </button>

            <button
              onClick={() => {
                setFilters((prev) => ({ ...prev, searchType: 'doctors' }));
                setSearchParams((prev) => {
                  const p = new URLSearchParams(prev);
                  p.set('searchType', 'doctors');
                  return p;
                });
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                filters.searchType === 'doctors'
                  ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-xs ring-1 ring-slate-200/70 dark:ring-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Users size={13} className={filters.searchType === 'doctors' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'} />
              <span>{t('doctors')}</span>
              <span
                className={`text-[11px] px-1.5 py-0.2 rounded-md font-semibold ${
                  filters.searchType === 'doctors'
                    ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300'
                    : 'bg-slate-200/70 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                {filteredDoctors.length}
              </span>
            </button>

            <button
              onClick={() => {
                setFilters((prev) => ({ ...prev, searchType: 'clinics' }));
                setSearchParams((prev) => {
                  const p = new URLSearchParams(prev);
                  p.set('searchType', 'clinics');
                  return p;
                });
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                filters.searchType === 'clinics'
                  ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-xs ring-1 ring-slate-200/70 dark:ring-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Building2 size={13} className={filters.searchType === 'clinics' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'} />
              <span>{t('clinics')}</span>
              <span
                className={`text-[11px] px-1.5 py-0.2 rounded-md font-semibold ${
                  filters.searchType === 'clinics'
                    ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300'
                    : 'bg-slate-200/70 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                {filteredClinics.length}
              </span>
            </button>
          </div>

          {/* Right Controls: Sort Dropdown and Mobile Filter Toggle */}
          <div className="flex items-center gap-2.5">
            {/* Sorting Dropdown Control */}
            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs">
              <ArrowDownUp size={13} className="text-blue-600 dark:text-blue-400 shrink-0" />
              <label htmlFor="search-sort-select" className="text-xs font-semibold text-slate-500 dark:text-slate-400 hidden sm:inline">
                {t('sortBy')}:
              </label>
              <select
                id="search-sort-select"
                value={filters.sortBy || 'relevance'}
                onChange={(e) => {
                  const val = e.target.value as SortByOption;
                  setFilters((prev) => ({ ...prev, sortBy: val }));
                  setSearchParams((prev) => {
                    const p = new URLSearchParams(prev);
                    if (val === 'relevance') p.delete('sortBy');
                    else p.set('sortBy', val);
                    return p;
                  });
                }}
                className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer pr-1"
                aria-label="Sort search results"
              >
                <option value="relevance" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-white">{t('sortByRelevance')}</option>
                <option value="distance" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-white">{t('sortByDistance')}</option>
                <option value="rating" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-white">{t('sortByRating')}</option>
                <option value="availability" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-white">{t('sortByAvailability')}</option>
              </select>
            </div>

            {/* Mobile Filter Button */}
            <button
              onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
              className={`lg:hidden px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all ${
                activeFilterCount > 0
                  ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-300 dark:border-blue-800 text-blue-800 dark:text-blue-300'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750'
              }`}
            >
              <SlidersHorizontal size={14} className={activeFilterCount > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400'} />
              <span>{t('filters')}</span>
              {activeFilterCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-blue-600 text-white text-[10px] font-extrabold">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Layout Area: Left Filters Sidebar, Middle Results List, Right Sticky Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Filter Sidebar */}
        <div
          className={`lg:col-span-3 ${
            isMobileFilterOpen
              ? 'block fixed inset-0 z-50 bg-white p-6 overflow-y-auto'
              : 'hidden lg:block sticky top-24'
          }`}
        >
          {isMobileFilterOpen && (
            <div className="flex justify-between items-center mb-4 pb-2 border-b">
              <h3 className="font-bold text-base text-slate-900">{t('filters')}</h3>
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="px-3 py-1 rounded-lg bg-blue-600 text-white text-xs font-bold"
              >
                {t('applyFilters')}
              </button>
            </div>
          )}

          <FilterPanel
            filters={filters}
            onChange={(newFilters) => setFilters(newFilters)}
            onReset={handleResetFilters}
          />
        </div>

        {/* Center Results List */}
        <div className="lg:col-span-5 space-y-6">
          {isLoading ? (
            filters.searchType === 'clinics' ? (
              <ClinicListSkeleton count={4} />
            ) : filters.searchType === 'doctors' ? (
              <DoctorListSkeleton count={4} />
            ) : (
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="h-5 w-32 shimmer rounded-md" />
                  <DoctorListSkeleton count={2} />
                </div>
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <div className="h-5 w-40 shimmer rounded-md" />
                  <ClinicListSkeleton count={2} />
                </div>
              </div>
            )
          ) : (
            <>
              {/* Show Doctors if searchType is 'all' or 'doctors' */}
              {(filters.searchType === 'all' || filters.searchType === 'doctors') && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                      <Users size={16} className="text-blue-600" />
                      <span>{t('doctors')} ({filteredDoctors.length})</span>
                    </h3>
                  </div>

                  {filteredDoctors.length === 0 && filters.searchType === 'doctors' ? (
                    <NoNearbyClinicsState
                      radiusKm={filters.maxDistanceKm}
                      specialtyName={activeSpecialtyName}
                      nearestDistanceKm={nearestClinicDistance}
                      expandActionLabel={
                        language === 'uz'
                          ? `Radiusni ${getNextExpandRadius(filters.maxDistanceKm)} km ga kengaytirish`
                          : language === 'ru'
                          ? `Увеличить радиус до ${getNextExpandRadius(filters.maxDistanceKm)} км`
                          : `Expand radius to ${getNextExpandRadius(filters.maxDistanceKm)} km`
                      }
                      onExpandRadius={handleExpandRadius}
                      onClearSpecialty={filters.specialty !== 'all' ? handleClearSpecialty : undefined}
                      onShowAll={handleShowAllClinics}
                    />
                  ) : (
                    filteredDoctors.map((doc) => <DoctorCard key={doc.id} doctor={doc} />)
                  )}
                </div>
              )}

              {/* Show Clinics if searchType is 'all' or 'clinics' */}
              {(filters.searchType === 'all' || filters.searchType === 'clinics') && (
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                      <Building2 size={16} className="text-blue-600" />
                      <span>{t('partnerClinics')} ({filteredClinics.length})</span>
                    </h3>
                  </div>

                  {filteredClinics.length === 0 ? (
                    <NoNearbyClinicsState
                      radiusKm={filters.maxDistanceKm}
                      specialtyName={activeSpecialtyName}
                      nearestDistanceKm={nearestClinicDistance}
                      expandActionLabel={
                        language === 'uz'
                          ? `Radiusni ${getNextExpandRadius(filters.maxDistanceKm)} km ga kengaytirish`
                          : language === 'ru'
                          ? `Увеличить радиус до ${getNextExpandRadius(filters.maxDistanceKm)} км`
                          : `Expand radius to ${getNextExpandRadius(filters.maxDistanceKm)} km`
                      }
                      onExpandRadius={handleExpandRadius}
                      onClearSpecialty={filters.specialty !== 'all' ? handleClearSpecialty : undefined}
                      onShowAll={handleShowAllClinics}
                    />
                  ) : (
                    filteredClinics.map((clinic) => (
                      <ClinicCard
                        key={clinic.id}
                        clinic={clinic}
                        isSelected={selectedClinicId === clinic.id}
                        onSelect={() => setSelectedClinicId(clinic.id)}
                      />
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Right Sticky Map */}
        <div className="lg:col-span-4 sticky top-24 hidden lg:block">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 px-1">
              <span>{t('interactiveMapView')}</span>
              <button
                onClick={() => setIsFullscreenMap(true)}
                className="text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 cursor-pointer"
              >
                <span>{t('viewFullscreenMap')}</span>
                <ArrowRight size={12} />
              </button>
            </div>

            <MapView
              clinics={mapClinics}
              selectedClinicId={selectedClinicId}
              currentRadiusKm={filters.maxDistanceKm}
              onRadiusChange={(r) => {
                setFilters((p) => ({ ...p, maxDistanceKm: r }));
                setRadiusKm(r);
              }}
              onSelectClinic={(c) => setSelectedClinicId(c.id)}
              height="calc(100vh - 180px)"
              className="min-h-[420px]"
            />
          </div>
        </div>
      </div>

      {/* FLOATING ACTION BUTTON (FAB) TO TOGGLE FULLSCREEN INTERACTIVE MAP VIEW */}
      <div className="fixed bottom-20 md:bottom-8 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
        <button
          onClick={() => setIsFullscreenMap(!isFullscreenMap)}
          className={`px-5 py-3 rounded-full font-extrabold text-xs sm:text-sm shadow-2xl flex items-center gap-2.5 transition-all transform hover:scale-105 active:scale-95 cursor-pointer border whitespace-nowrap ${
            isFullscreenMap
              ? 'bg-slate-900 text-white border-slate-700 hover:bg-slate-800'
              : 'bg-blue-600 text-white border-blue-500 hover:bg-blue-500 shadow-blue-500/25'
          }`}
          aria-label={isFullscreenMap ? t('returnToList') : t('viewFullscreenMap')}
        >
          {isFullscreenMap ? (
            <>
              <List size={18} />
              <span>{t('returnToList')}</span>
            </>
          ) : (
            <>
              <MapIcon size={18} />
              <span>{t('viewFullscreenMap')}</span>
              <span className="px-2 py-0.5 rounded-full bg-white/20 text-[11px] font-bold">
                {mapClinics.length}
              </span>
            </>
          )}
        </button>
      </div>

      {/* FULLSCREEN INTERACTIVE MAP MODAL */}
      {isFullscreenMap && (
        <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col animate-in fade-in duration-200">
          {/* Floating Top Control Bar */}
          <div className="p-3 sm:p-4 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 z-30 flex flex-col sm:flex-row items-center justify-between gap-3 text-white">
            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
              <button
                onClick={() => setIsFullscreenMap(false)}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-slate-700"
              >
                <ArrowLeft size={16} />
                <span>{t('returnToList')}</span>
              </button>

              <div className="flex items-center gap-2 text-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="font-bold text-white">
                  {mapClinics.length} {t('showingClinicsOnMap')}
                </span>
              </div>
            </div>

            {/* Quick horizontal filter chips in fullscreen map header */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full sm:w-auto pb-1 sm:pb-0">
              <button
                onClick={() =>
                  setFilters((prev) => ({ ...prev, openNowOnly: !prev.openNowOnly }))
                }
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer border ${
                  filters.openNowOnly
                    ? 'bg-emerald-600 border-emerald-500 text-white'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Clock size={13} />
                <span>{t('openNow')}</span>
              </button>

              <button
                onClick={() =>
                  setFilters((prev) => ({
                    ...prev,
                    minRating: prev.minRating === 4.7 ? 0 : 4.7,
                  }))
                }
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer border ${
                  filters.minRating >= 4.7
                    ? 'bg-amber-500 border-amber-400 text-white'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Star size={13} className="fill-amber-400 text-amber-400" />
                <span>{t('topRated')}</span>
              </button>

              <button
                onClick={() => setIsAffordableOnly(!isAffordableOnly)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer border ${
                  isAffordableOnly
                    ? 'bg-blue-600 border-blue-500 text-white'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Tag size={13} />
                <span>{t('affordable')}</span>
              </button>

              <button
                onClick={() =>
                  setFilters((prev) => ({
                    ...prev,
                    isEmergencyOnly: !prev.isEmergencyOnly,
                  }))
                }
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer border ${
                  filters.isEmergencyOnly
                    ? 'bg-rose-600 border-rose-500 text-white'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <AlertCircle size={13} />
                <span>{t('emergency247')}</span>
              </button>

              {/* Fullscreen Map Radius Select Dropdown */}
              <div className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-200 transition-colors shrink-0 shadow-xs">
                <MapPin size={13} className="text-blue-400 shrink-0" />
                <span className="text-slate-400 text-[11px] font-semibold">{t('radiusBadge') || 'Radius'}:</span>
                <select
                  value={filters.maxDistanceKm}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setFilters((prev) => ({ ...prev, maxDistanceKm: val }));
                    setRadiusKm(val);
                  }}
                  aria-label="Map Radius"
                  className="bg-transparent text-white font-extrabold text-xs focus:outline-none cursor-pointer pr-1"
                >
                  <option value={1} className="bg-slate-900 text-white">1 km</option>
                  <option value={2} className="bg-slate-900 text-white">2 km</option>
                  <option value={3} className="bg-slate-900 text-white">3 km</option>
                  <option value={5} className="bg-slate-900 text-white">5 km (Asosiy)</option>
                  <option value={8} className="bg-slate-900 text-white">8 km</option>
                  <option value={10} className="bg-slate-900 text-white">10 km</option>
                  <option value={12} className="bg-slate-900 text-white">12 km</option>
                  <option value={15} className="bg-slate-900 text-white">15 km</option>
                  <option value={20} className="bg-slate-900 text-white">20 km</option>
                  <option value={25} className="bg-slate-900 text-white">25 km</option>
                </select>
                <ChevronDown size={11} className="text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Fullscreen Map Area */}
          <div className="flex-1 relative w-full h-full">
            <MapView
              clinics={mapClinics}
              selectedClinicId={selectedClinicId}
              currentRadiusKm={filters.maxDistanceKm}
              onRadiusChange={(r) => {
                setFilters((p) => ({ ...p, maxDistanceKm: r }));
                setRadiusKm(r);
              }}
              onSelectClinic={(c) => setSelectedClinicId(c.id)}
              height="100%"
              className="rounded-none border-0"
            />

            {/* Bottom floating drawer/sheet for selected clinic in Fullscreen Map */}
            {selectedClinic && (
              <div className="absolute bottom-6 left-4 right-4 sm:left-6 sm:right-auto sm:w-[420px] z-30 animate-in fade-in slide-from-bottom-6">
                <div className="bg-white/95 backdrop-blur-md rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-2xl space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={selectedClinic.image}
                        alt={selectedClinic.name}
                        referrerPolicy="no-referrer"
                        className="w-16 h-16 rounded-2xl object-cover border border-slate-100 shrink-0 shadow-xs"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <PartnerBadge size="sm" showText={false} />
                          <h4 className="font-extrabold text-sm sm:text-base text-slate-900 truncate">
                            {selectedClinic.name}
                          </h4>
                        </div>
                        <p className="text-xs text-slate-500 truncate">{selectedClinic.address}</p>
                        <div className="flex items-center gap-2 pt-1 text-xs">
                          <RatingBadge
                            rating={selectedClinic.rating}
                            reviewCount={selectedClinic.reviewCount}
                            size="sm"
                          />
                          <DistanceBadge distanceKm={selectedClinic.distanceKm} size="sm" />
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedClinicId(null)}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  {/* Actions row */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                    <Link
                      to={`/clinics/${selectedClinic.id}`}
                      className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold text-center transition-colors"
                    >
                      {t('viewClinic')}
                    </Link>
                    <button
                      onClick={() => {
                        setIsFullscreenMap(false);
                        openBookingModal({ clinic: selectedClinic });
                      }}
                      className="py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold text-center transition-colors shadow-sm cursor-pointer"
                    >
                      {t('bookNow')}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

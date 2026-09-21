import React, { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Clinic } from '../../types';
import { useLocation } from '../../context/LocationContext';
import { useLanguage } from '../../context/LanguageContext';
import { PartnerBadge } from '../common/PartnerBadge';
import { RatingBadge } from '../common/RatingBadge';
import { DistanceBadge } from '../common/DistanceBadge';
import {
  Navigation,
  ArrowRight,
  MapPin,
  ChevronDown,
  Plus,
  Minus,
  LocateFixed,
  Eye,
  EyeOff,
  Layers,
  HelpCircle,
  X,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAppointments } from '../../context/AppointmentContext';
import { calculateDistanceKm, DISTANCE_OPTIONS, MAX_DISTANCE_ALL } from '../../utils/geo';
import { ClusteredClinicMarkers } from './ClusteredClinicMarkers';
import { triggerHaptic } from '../../utils/haptics';

// Helper component to smoothly center/fly the map when coordinates or selected clinic change
function ChangeView({
  center,
  zoom,
}: {
  center: [number, number];
  zoom: number;
}) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.0 });
  }, [center, zoom, map]);
  return null;
}

// In-map action buttons controller for Zoom In, Zoom Out, and Center to Current Location
function MapActionController({
  userLat,
  userLng,
  defaultZoom,
  onResetSelectedClinic,
}: {
  userLat: number;
  userLng: number;
  defaultZoom: number;
  onResetSelectedClinic: () => void;
}) {
  const map = useMap();
  const { detectCurrentLocation, isLocating } = useLocation();
  const { t } = useLanguage();

  const handleCenterToUserLocation = () => {
    onResetSelectedClinic();
    map.flyTo([userLat, userLng], defaultZoom, { duration: 0.9 });
  };

  const handleZoomIn = () => {
    map.zoomIn();
  };

  const handleZoomOut = () => {
    map.zoomOut();
  };

  return (
    <div className="absolute top-4 right-4 z-20 flex flex-col gap-2 pointer-events-auto">
      {/* Center to Current Location Button */}
      <button
        id="btn-center-user-location"
        onClick={handleCenterToUserLocation}
        title={t('centerToLocation') || 'Center to Current Location'}
        className="w-10 h-10 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/90 dark:border-slate-800 shadow-md text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 dark:hover:border-blue-700 flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer group"
        aria-label={t('centerToLocation') || 'Center to Current Location'}
      >
        <LocateFixed size={18} className="text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" />
      </button>

      {/* GPS Hardware Detect Button */}
      <button
        id="btn-detect-gps-location"
        onClick={detectCurrentLocation}
        disabled={isLocating}
        title="Detect Real GPS Location"
        className="w-10 h-10 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/90 dark:border-slate-800 shadow-md text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 dark:hover:border-blue-700 flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-50"
        aria-label="Detect GPS"
      >
        <Navigation size={17} className={isLocating ? 'animate-spin text-blue-600' : 'text-slate-600 dark:text-slate-300'} />
      </button>

      {/* Custom Zoom Control Buttons */}
      <div className="flex flex-col rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/90 dark:border-slate-800 shadow-md overflow-hidden">
        <button
          id="btn-map-zoom-in"
          onClick={handleZoomIn}
          title={t('zoomIn') || 'Zoom In'}
          className="w-10 h-10 text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center transition-colors border-b border-slate-100 dark:border-slate-800 cursor-pointer"
          aria-label={t('zoomIn') || 'Zoom In'}
        >
          <Plus size={18} />
        </button>
        <button
          id="btn-map-zoom-out"
          onClick={handleZoomOut}
          title={t('zoomOut') || 'Zoom Out'}
          className="w-10 h-10 text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer"
          aria-label={t('zoomOut') || 'Zoom Out'}
        >
          <Minus size={18} />
        </button>
      </div>
    </div>
  );
}

interface MapViewProps {
  clinics: Clinic[];
  selectedClinicId?: string | null;
  currentRadiusKm?: number;
  onRadiusChange?: (radius: number) => void;
  onSelectClinic?: (clinic: Clinic) => void;
  height?: string;
  showRadiusCircle?: boolean;
  className?: string;
}

export const MapView: React.FC<MapViewProps> = ({
  clinics,
  selectedClinicId,
  currentRadiusKm,
  onRadiusChange,
  onSelectClinic,
  height = '520px',
  showRadiusCircle = true,
  className = '',
}) => {
  const { userLocation, radiusKm, setRadiusKm } = useLocation();
  const { openBookingModal } = useAppointments();
  const { t, language } = useLanguage();

  const effectiveRadius = currentRadiusKm ?? radiusKm;
  const isAllRadius = effectiveRadius >= MAX_DISTANCE_ALL;

  const getZoomForRadius = (r: number) => {
    if (r <= 1.5) return 14.8;
    if (r <= 2.5) return 14.2;
    if (r <= 4) return 13.5;
    if (r <= 6) return 12.8;
    if (r <= 9) return 12.1;
    if (r <= 13) return 11.4;
    if (r <= 18) return 10.8;
    if (r <= 25) return 10.2;
    return 9.6;
  };

  // Strictly filter markers that fall within the effective radius (unless All/30+ is selected)
  const filteredMapClinics = useMemo(() => {
    if (isAllRadius) {
      return clinics;
    }
    return clinics.filter((c) => {
      const dist = c.distanceKm ?? calculateDistanceKm(userLocation, c.coordinates);
      return dist <= effectiveRadius + 0.08;
    });
  }, [clinics, userLocation, effectiveRadius, isAllRadius]);

  const [mapCenter, setMapCenter] = useState<[number, number]>([
    userLocation.lat,
    userLocation.lng,
  ]);
  const [zoomLevel, setZoomLevel] = useState<number>(() => getZoomForRadius(effectiveRadius));
  const [activeClinic, setActiveClinic] = useState<Clinic | null>(null);

  // State to clear/show search result markers
  const [showMarkers, setShowMarkers] = useState<boolean>(true);

  // State for radius slider popup/panel
  const [showRadiusSliderPanel, setShowRadiusSliderPanel] = useState<boolean>(false);

  // State to expand/collapse floating legend
  const [isLegendOpen, setIsLegendOpen] = useState<boolean>(true);

  // Sync active clinic when selectedClinicId changes externally
  useEffect(() => {
    if (selectedClinicId) {
      const match = clinics.find((c) => c.id === selectedClinicId);
      if (match) {
        setActiveClinic(match);
        setMapCenter([match.coordinates.lat, match.coordinates.lng]);
        setZoomLevel(14);
      }
    }
  }, [selectedClinicId, clinics]);

  // Update map center and auto-zoom when user location or radius changes
  useEffect(() => {
    if (!selectedClinicId) {
      setMapCenter([userLocation.lat, userLocation.lng]);
      setZoomLevel(getZoomForRadius(effectiveRadius));
    }
  }, [userLocation.lat, userLocation.lng, effectiveRadius, selectedClinicId]);

  // Custom icon for user location (pulsing radar)
  const userMarkerIcon = L.divIcon({
    className: 'custom-user-marker',
    html: `
      <div style="position: relative; width: 22px; height: 22px;">
        <div style="position: absolute; width: 44px; height: 44px; top: -11px; left: -11px; border-radius: 50%; background: rgba(37, 99, 235, 0.25); animation: pulse-ring 2s infinite;"></div>
        <div style="width: 22px; height: 22px; border-radius: 50%; background: #2563eb; border: 3px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.35);"></div>
      </div>
    `,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });

  return (
    <div
      id="interactive-leaflet-map-container"
      className={`relative w-full rounded-3xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100 ${className}`}
      style={{ height }}
    >
      <MapContainer
        center={mapCenter}
        zoom={zoomLevel}
        zoomControl={false}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <ChangeView center={mapCenter} zoom={zoomLevel} />

        {/* Action Controller for Zoom Controls and Center to User Location */}
        <MapActionController
          userLat={userLocation.lat}
          userLng={userLocation.lng}
          defaultZoom={getZoomForRadius(effectiveRadius)}
          onResetSelectedClinic={() => {
            setActiveClinic(null);
            setMapCenter([userLocation.lat, userLocation.lng]);
            setZoomLevel(getZoomForRadius(effectiveRadius));
          }}
        />

        {/* High-quality CartoDB Voyager Clean Map Tiles */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          maxZoom={19}
        />

        {/* Discovery Radius Circle around user location */}
        {showRadiusCircle && !isAllRadius && (
          <Circle
            center={[userLocation.lat, userLocation.lng]}
            radius={effectiveRadius * 1000}
            pathOptions={{
              color: '#2563eb',
              fillColor: '#3b82f6',
              fillOpacity: 0.08,
              weight: 2,
              dashArray: '5, 8',
            }}
          />
        )}

        {showRadiusCircle && isAllRadius && (
          <Circle
            center={[userLocation.lat, userLocation.lng]}
            radius={30000}
            pathOptions={{
              color: '#059669',
              fillColor: '#10b981',
              fillOpacity: 0.03,
              weight: 1.5,
              dashArray: '6, 6',
            }}
          />
        )}

        {/* User Location Marker */}
        <Marker position={[userLocation.lat, userLocation.lng]} icon={userMarkerIcon}>
          <Popup className="custom-popup">
            <div className="p-3 text-center">
              <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 mb-1">
                {t('location')}
              </span>
              <p className="text-xs font-medium text-slate-700">{userLocation.address || 'Tashkent'}</p>
              <p className="text-[11px] text-slate-500 mt-1">
                {isAllRadius
                  ? (language === 'uz' ? 'Barcha masofalar' : language === 'ru' ? 'Все расстояния' : 'All Distances')
                  : `${effectiveRadius} km ${t('radiusBadge')}`}
              </p>
            </div>
          </Popup>
        </Marker>

        {/* Clustered Partner Clinic & Doctor Location Markers (Removable via Clear Map toggle) */}
        {showMarkers && (
          <ClusteredClinicMarkers
            clinics={filteredMapClinics}
            selectedClinicId={selectedClinicId}
            activeClinic={activeClinic}
            onSelectClinic={onSelectClinic}
            setActiveClinic={setActiveClinic}
          />
        )}
      </MapContainer>

      {/* Top Map Controls Overlay */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2 pointer-events-auto max-w-[calc(100%-80px)]">
        <div className="flex flex-wrap items-center gap-2">
          {/* Clinic Count Badge */}
          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>
              <strong>{filteredMapClinics.length}</strong> {t('partnerClinics')}
            </span>
          </div>

          {/* Interactive Map Radius Slider Trigger Button */}
          <button
            id="btn-toggle-radius-slider"
            type="button"
            onClick={() => {
              triggerHaptic('medium');
              setShowRadiusSliderPanel((prev) => !prev);
            }}
            className={`px-3 py-1.5 rounded-full border shadow-sm flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
              showRadiusSliderPanel
                ? 'bg-blue-600 text-white border-blue-500 shadow-blue-500/20 ring-2 ring-blue-400/30'
                : 'bg-white/95 dark:bg-slate-900/95 backdrop-blur-md text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700'
            }`}
            title="Adjust Search Radius Slider"
          >
            <MapPin size={13} className={showRadiusSliderPanel ? 'text-white' : 'text-blue-600 dark:text-blue-400'} />
            <span>
              {isAllRadius
                ? (language === 'uz' ? 'Barcha radius' : language === 'ru' ? 'Все расстояния' : 'All Distances')
                : `${effectiveRadius} km`}
            </span>
            <ChevronDown
              size={12}
              className={`transition-transform duration-200 ${showRadiusSliderPanel ? 'rotate-180 text-white' : 'text-slate-400 dark:text-slate-500'}`}
            />
          </button>

          {/* 'Clear Map' / 'Show Markers' Button */}
          <button
            id="btn-clear-map-markers"
            onClick={() => {
              triggerHaptic('light');
              setShowMarkers((prev) => !prev);
              if (activeClinic) {
                setActiveClinic(null);
              }
            }}
            className={`px-3 py-1.5 rounded-full border text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer ${
              showMarkers
                ? 'bg-white/95 dark:bg-slate-900/95 backdrop-blur-md hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-700 dark:text-slate-200 hover:text-rose-600 dark:hover:text-rose-400 border-slate-200 dark:border-slate-800 hover:border-rose-200 dark:hover:border-rose-800'
                : 'bg-blue-600 hover:bg-blue-700 text-white border-blue-500 shadow-blue-500/25 ring-2 ring-blue-400/40'
            }`}
            title={showMarkers ? t('clearMap') || 'Clear Map' : t('showMarkers') || 'Show Markers'}
            aria-label={showMarkers ? t('clearMap') || 'Clear Map' : t('showMarkers') || 'Show Markers'}
          >
            {showMarkers ? (
              <>
                <EyeOff size={13} className="text-rose-500 shrink-0" />
                <span>{t('clearMap') || 'Clear Map'}</span>
              </>
            ) : (
              <>
                <RotateCcw size={13} className="text-white shrink-0 animate-pulse" />
                <span>{t('showMarkers') || 'Show Markers'}</span>
              </>
            )}
          </button>
        </div>

        {/* Visual Radius Slider UI Card Overlay */}
        {showRadiusSliderPanel && (
          <div
            id="map-radius-slider-card"
            className="w-72 sm:w-80 bg-white/98 dark:bg-slate-900/98 backdrop-blur-md rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xl p-3.5 animate-in fade-in slide-in-from-top-2 duration-150 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                <MapPin size={14} className="text-blue-600 dark:text-blue-400" />
                <span>{language === 'uz' ? 'Qidiruv radiusi' : language === 'ru' ? 'Радиус поиска' : 'Search Radius'}</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-extrabold text-xs border border-blue-200 dark:border-blue-800">
                {isAllRadius
                  ? (language === 'uz' ? '50+ km (Barchasi)' : '50+ km (All)')
                  : `${effectiveRadius} km`}
              </span>
            </div>

            {/* Interactive Range Slider */}
            <div className="space-y-1">
              <div className="relative flex items-center">
                <input
                  type="range"
                  id="map-interactive-radius-slider"
                  min={1}
                  max={50}
                  step={1}
                  value={effectiveRadius >= 50 ? 50 : effectiveRadius}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    triggerHaptic('selection');
                    if (onRadiusChange) {
                      onRadiusChange(val);
                    }
                    setRadiusKm(val);
                  }}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-none"
                  aria-label="Adjust radius slider"
                />
              </div>
              <div className="flex justify-between text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                <span>1 km</span>
                <span>10 km</span>
                <span>25 km</span>
                <span>50 km</span>
              </div>
            </div>

            {/* Quick Preset Radius Chips */}
            <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-100 dark:border-slate-800">
              {[1, 3, 5, 10, 25, 50].map((preset) => {
                const isSelected = effectiveRadius === preset || (preset === 50 && effectiveRadius >= 50);
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      triggerHaptic('selection');
                      if (onRadiusChange) {
                        onRadiusChange(preset);
                      }
                      setRadiusKm(preset);
                    }}
                    className={`flex-1 py-1 px-1 rounded-lg text-[11px] font-bold text-center transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {preset === 50 ? '50km' : `${preset}k`}
                  </button>
                );
              })}
            </div>

            <div className="text-[10px] text-slate-500 dark:text-slate-400 text-center font-medium flex items-center justify-center gap-1">
              <MapPin size={11} className="text-blue-600 dark:text-blue-400" />
              <span><strong>{filteredMapClinics.length}</strong> {language === 'uz' ? 'ta klinika topildi' : 'clinics found'}</span>
            </div>
          </div>
        )}
      </div>

      {/* Floating Map Legend (Bottom-Left) */}
      <div className="absolute bottom-4 left-4 z-20 pointer-events-auto max-w-[280px] sm:max-w-[320px]">
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-md p-2.5 transition-all">
          <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-slate-100 dark:border-slate-800">
            <button
              onClick={() => setIsLegendOpen((p) => !p)}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
            >
              <Layers size={13} className="text-blue-600 dark:text-blue-400" />
              <span>{t('mapLegend') || 'Map Legend'}</span>
            </button>
            <button
              onClick={() => setIsLegendOpen((p) => !p)}
              className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 p-0.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title={isLegendOpen ? 'Collapse legend' : 'Expand legend'}
              aria-label="Toggle Legend"
            >
              {isLegendOpen ? <ChevronDown size={14} /> : <ChevronDown size={14} className="rotate-180" />}
            </button>
          </div>

          {isLegendOpen && (
            <div className="mt-2 space-y-1.5 text-[11px] font-medium text-slate-600 dark:text-slate-300">
              {/* User Location */}
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 relative flex items-center justify-center shrink-0">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600 border border-white shadow-xs"></span>
                  <span className="absolute inset-0 rounded-full bg-blue-400/40 animate-ping"></span>
                </div>
                <span className="truncate">{t('legendUserLocation') || 'Your Current Location'}</span>
              </div>

              {/* Partner Clinic */}
              <div className="flex items-center gap-2">
                <div className="px-1.5 py-0.5 rounded-full bg-slate-900 dark:bg-slate-800 text-white text-[9px] font-bold border border-white/40 shrink-0">
                  + Klinika
                </div>
                <span className="truncate">{t('legendPartnerClinic') || 'Partner Clinic'}</span>
              </div>

              {/* Emergency Clinic */}
              <div className="flex items-center gap-2">
                <div className="px-1.5 py-0.5 rounded-full bg-red-600 text-white text-[9px] font-bold border border-white/40 shrink-0">
                  24/7
                </div>
                <span className="truncate">{t('legendEmergency') || '24/7 Emergency Clinic'}</span>
              </div>

              {/* Cluster Group */}
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-blue-600 text-white text-[9px] font-extrabold flex items-center justify-center border border-white/40 shrink-0">
                  3+
                </div>
                <span className="truncate">{t('legendCluster') || 'Clinic Group Cluster'}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Selected Clinic Preview Card at the bottom of the map */}
      {activeClinic && (
        <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-16 md:w-96 z-20 animate-in fade-in slide-in-from-bottom-4 duration-300 pointer-events-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xl flex gap-3.5 items-center">
            <img
              src={activeClinic.image}
              alt={activeClinic.name}
              referrerPolicy="no-referrer"
              className="w-16 h-16 rounded-xl object-cover shrink-0 border border-slate-100 dark:border-slate-800"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                <PartnerBadge size="sm" showText={false} />
                <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">{activeClinic.name}</h4>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-2">
                <DistanceBadge distanceKm={activeClinic.distanceKm} size="sm" />
                <RatingBadge rating={activeClinic.rating} showCount={false} size="sm" />
                <span>• {activeClinic.doctorCount} {t('doctors')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  to={`/clinics/${activeClinic.id}`}
                  className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 inline-flex items-center gap-1"
                >
                  {t('viewClinic')} <ArrowRight size={12} />
                </Link>
                <span className="text-slate-300 dark:text-slate-700">|</span>
                <button
                  onClick={() => openBookingModal({ clinic: activeClinic })}
                  className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 cursor-pointer"
                >
                  {t('bookNow')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

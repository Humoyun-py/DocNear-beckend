import React, { createContext, useContext, useState, useEffect } from 'react';
import { LocationCoordinates } from '../types';
import { DEFAULT_TASHKENT_LOCATION, PRESET_LOCATIONS } from '../utils/geo';

interface LocationContextType {
  userLocation: LocationCoordinates;
  radiusKm: number;
  setRadiusKm: (radius: number) => void;
  isLocating: boolean;
  locationError: string | null;
  detectCurrentLocation: () => Promise<void>;
  setUserLocation: (coords: LocationCoordinates) => void;
  presetLocations: typeof PRESET_LOCATIONS;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userLocation, setUserLocation] = useState<LocationCoordinates>(() => {
    const saved = localStorage.getItem('docnear_user_location');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return DEFAULT_TASHKENT_LOCATION;
      }
    }
    return DEFAULT_TASHKENT_LOCATION;
  });

  const [radiusKm, setRadiusKm] = useState<number>(5.0);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('docnear_user_location', JSON.stringify(userLocation));
  }, [userLocation]);

  const detectCurrentLocation = async (): Promise<void> => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newCoords: LocationCoordinates = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            city: 'My Current Location',
            address: 'GPS Verified Location',
          };
          setUserLocation(newCoords);
          setIsLocating(false);
          resolve();
        },
        (error) => {
          console.warn('Geolocation error or denied:', error.message);
          setLocationError('Location permission denied or unavailable. Using default Tashkent Center.');
          setIsLocating(false);
          resolve();
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    });
  };

  return (
    <LocationContext.Provider
      value={{
        userLocation,
        radiusKm,
        setRadiusKm,
        isLocating,
        locationError,
        detectCurrentLocation,
        setUserLocation,
        presetLocations: PRESET_LOCATIONS,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = (): LocationContextType => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};

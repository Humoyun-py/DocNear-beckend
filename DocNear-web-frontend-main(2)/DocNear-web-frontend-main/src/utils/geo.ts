import { LocationCoordinates } from '../types';

// Central Tashkent Default Coordinate (Amir Timur Square area)
export const DEFAULT_TASHKENT_LOCATION: LocationCoordinates = {
  lat: 41.2995,
  lng: 69.2401,
  city: 'Tashkent',
  address: 'Amir Timur Square, Mirzo Ulugbek District',
};

// Alternative Preset Locations in Tashkent for user demo switching
export const PRESET_LOCATIONS: { name: string; coordinates: LocationCoordinates }[] = [
  {
    name: 'City Center (Amir Timur Square)',
    coordinates: { lat: 41.2995, lng: 69.2401, city: 'Tashkent', address: 'Amir Timur Square' },
  },
  {
    name: 'Mirzo Ulugbek (Buyuk Ipak Yuli)',
    coordinates: { lat: 41.3262, lng: 69.3275, city: 'Tashkent', address: 'Buyuk Ipak Yuli Ave' },
  },
  {
    name: 'Yunusabad (Mega Planet area)',
    coordinates: { lat: 41.3654, lng: 69.2882, city: 'Tashkent', address: 'Yunusabad District 11' },
  },
  {
    name: 'Chilanzar (Bunyodkor Ave)',
    coordinates: { lat: 41.2785, lng: 69.2067, city: 'Tashkent', address: 'Bunyodkor Ave, Chilanzar' },
  },
  {
    name: 'Yakkasaray (Shota Rustaveli)',
    coordinates: { lat: 41.2858, lng: 69.2547, city: 'Tashkent', address: 'Shota Rustaveli St' },
  },
];

/**
 * Calculate the great circle distance between two points on the earth (specified in decimal degrees)
 * using the Haversine formula. Returns distance in kilometers (km).
 */
export function calculateHaversineDistance(
  coord1?: LocationCoordinates | null,
  coord2?: LocationCoordinates | null
): number {
  if (
    !coord1 ||
    !coord2 ||
    typeof coord1.lat !== 'number' ||
    typeof coord1.lng !== 'number' ||
    typeof coord2.lat !== 'number' ||
    typeof coord2.lng !== 'number' ||
    isNaN(coord1.lat) ||
    isNaN(coord1.lng) ||
    isNaN(coord2.lat) ||
    isNaN(coord2.lng)
  ) {
    return 999;
  }
  const R = 6371; // Radius of the Earth in km
  const dLat = deg2rad(coord2.lat - coord1.lat);
  const dLon = deg2rad(coord2.lng - coord1.lng);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(coord1.lat)) *
      Math.cos(deg2rad(coord2.lat)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return Math.round(d * 10) / 10; // Round to 1 decimal place
}

export const calculateDistanceKm = calculateHaversineDistance;

export const DISTANCE_OPTIONS = [1, 2, 3, 5, 8, 10, 12, 15, 20, 25, 30] as const;
export const MAX_DISTANCE_ALL = 30; // 30+ km represents "All / Unlimited" distance filter

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Format distance in a human-friendly string (e.g. "850 m" or "1.4 km")
 */
export function formatDistance(distanceKm: number | undefined): string {
  if (distanceKm === undefined || isNaN(distanceKm)) return 'Nearby';
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m away`;
  }
  return `${distanceKm.toFixed(1)} km away`;
}

/**
 * Filter items by max distance from given user location
 */
export function isWithinRadius(
  userCoord: LocationCoordinates,
  targetCoord: LocationCoordinates,
  radiusKm: number = 5.0
): boolean {
  const dist = calculateHaversineDistance(userCoord, targetCoord);
  return dist <= radiusKm;
}

/**
 * Natural language intent parser for smart search input
 * Example: "I need a cardiologist" -> detects "Cardiology"
 */
export function parseSmartSearchQuery(query: string): {
  detectedSpecialty: string | null;
  detectedEmergency: boolean;
  cleanKeywords: string;
} {
  const q = query.toLowerCase().trim();
  let detectedSpecialty: string | null = null;
  let detectedEmergency = false;

  if (q.includes('emergency') || q.includes('urgent') || q.includes('24/7') || q.includes('tez yordam') || q.includes('ambul')) {
    detectedEmergency = true;
  }

  const specialtyKeywords: Record<string, string[]> = {
    Cardiology: ['cardio', 'heart', 'cardiologist', 'kardiolog', 'yurak', 'cardiology'],
    Dentistry: ['dent', 'teeth', 'tooth', 'dentist', 'stomatolog', 'tish', 'orthodont'],
    Pediatrics: ['pediatr', 'child', 'baby', 'kid', 'pediatrician', 'bolalar'],
    Dermatology: ['derma', 'skin', 'rash', 'dermatologist', 'teri'],
    Neurology: ['neuro', 'brain', 'headache', 'neurologist', 'nerv', 'asab'],
    Ophthalmology: ['eye', 'vision', 'ophthalm', 'optometrist', 'ko\'z', 'glaz'],
    Orthopedics: ['ortho', 'bone', 'joint', 'fracture', 'travmatolog', 'suyak'],
    Gynecology: ['gyneco', 'women', 'ginekolog', 'ayollar', 'pregnancy'],
    ENT: ['ent', 'ear', 'nose', 'throat', 'lor', 'quloq', 'tomoq'],
    'General Medicine': ['general', 'therapist', 'family doctor', 'terapevt', 'umumiy', 'physician', 'doctor', 'checkup'],
    Gastroenterology: ['gastro', 'stomach', 'digestion', 'oshqozon'],
    Endocrinology: ['endocrin', 'thyroid', 'hormone', 'diabet', 'qand'],
  };

  for (const [specialty, keywords] of Object.entries(specialtyKeywords)) {
    if (keywords.some(k => q.includes(k))) {
      detectedSpecialty = specialty;
      break;
    }
  }

  return {
    detectedSpecialty,
    detectedEmergency,
    cleanKeywords: query,
  };
}

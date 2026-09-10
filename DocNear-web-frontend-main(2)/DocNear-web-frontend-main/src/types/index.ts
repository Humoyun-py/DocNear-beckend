export interface LocationCoordinates {
  lat: number;
  lng: number;
  city?: string;
  address?: string;
}

export interface WorkingHours {
  open: string; // e.g. "08:00"
  close: string; // e.g. "20:00"
  is24Hours?: boolean;
  days: string; // e.g. "Mon - Sat"
}

export interface Facility {
  id: string;
  name: string;
  icon: string;
}

export interface ClinicPhoto {
  id: string;
  url: string;
  title: string;
  category?: 'all' | 'facility' | 'equipment' | 'rooms' | 'exterior';
  description?: string;
}

export interface Clinic {
  id: string;
  name: string;
  tagline?: string;
  description: string;
  isPartner: boolean; // Verified Partner only
  isEmergency24x7: boolean;
  rating: number;
  reviewCount: number;
  address: string;
  district: string;
  phone: string;
  emergencyPhone?: string;
  latitude?: number;
  longitude?: number;
  coordinates: LocationCoordinates;
  distanceKm?: number; // Calculated relative to user
  image: string;
  coverImage?: string;
  logo: string;
  gallery?: ClinicPhoto[];
  images?: string[];
  workingHours: WorkingHours;
  isOpenNow: boolean;
  specialties: string[];
  facilities: string[];
  languages: string[];
  services: { name: string; price?: string }[];
  acceptedInsurances?: string[];
  doctorCount: number;
  nextAvailableTime: string; // e.g. "Today 14:30"
  trafficLevel?: 'Quiet' | 'Moderate' | 'Busy';
  trafficSummary?: string;
  peakHours?: string;
}

export interface TimeSlot {
  time: string; // e.g. "09:00", "09:30"
  isAvailable: boolean;
  period: 'morning' | 'afternoon' | 'evening';
}

export interface DaySchedule {
  date: string; // YYYY-MM-DD
  dayLabel: string; // e.g. "MON 25 AUG"
  isToday?: boolean;
  slots: TimeSlot[];
}

export interface Doctor {
  id: string;
  name: string;
  title: string; // e.g. "MD, PhD"
  specialty: string;
  subSpecialties?: string[];
  experienceYears: number;
  rating: number;
  reviewCount: number;
  patientCount: number;
  photo: string;
  biography: string;
  education: string[];
  certifications: string[];
  languages: string[];
  clinicId: string;
  clinicName: string;
  clinicAddress: string;
  consultationFee: string; // e.g. "$35" or "150,000 UZS"
  availableToday: boolean;
  nextFreeTime: string; // e.g. "14:30"
  todaySlots: string[]; // e.g. ["14:30", "16:00", "18:30"]
  availableSlots?: string[];
  weeklySchedule: DaySchedule[];
  distanceKm?: number;
}

export interface Specialty {
  id: string;
  name: string;
  description: string;
  iconName: string;
  doctorCount: number;
  clinicCount: number;
  popularConditions: string[];
}

export type AppointmentStatus =
  | 'WAITING' | 'IN_PROGRESS' | 'REJECTED' | 'NO_SHOW'
  | 'PENDING'
  | 'CONFIRMED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'RESCHEDULED'
  | 'Confirmed'
  | 'Pending'
  | 'Completed'
  | 'Cancelled'
  | 'Rescheduled';

export interface Appointment {
  id: string;
  bookingCode: string; // Format: "DN-XXXXX"
  clinicId: string;
  clinicName: string;
  clinicAddress: string;
  clinicPhone: string;
  clinicImage?: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialty: string;
  doctorPhoto: string;
  patientName: string;
  patientPhone: string;
  patientEmail?: string;
  notes?: string;
  date: string; // ISO format "YYYY-MM-DD"
  time: string; // 24-hour format "HH:mm"
  status: AppointmentStatus;
  createdAt: string;
  price?: string;
  consultationFee?: string;
  visitReason?: string;
  reasonForVisit?: string;
}

export interface Notification {
  id: string;
  type: 'booking_confirmed' | 'booking_cancelled' | 'reminder' | 'schedule_update' | 'system';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  appointmentId?: string;
  link?: string;
}

export interface HealthPreferences {
  focusAreas: string[]; // e.g. ["Cardiology & Heart Health", "Sleep & Stress Reduction", "Nutrition & Metabolism", "Dental Care", "Pediatrics & Family"]
  activityLevel?: 'Sedentary' | 'Moderate' | 'Active';
  dietaryPreference?: string;
  notes?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  savedDoctorIds: string[];
  savedClinicIds: string[];
  healthPreferences?: HealthPreferences;
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  notificationSettings: {
    appointmentReminders: boolean;
    smsReminders: boolean;
    emailUpdates: boolean;
    promoOffers: boolean;
  };
}

export interface Review {
  id: string;
  targetId: string;
  targetType: 'clinic' | 'doctor';
  targetName?: string;
  userName: string;
  userAvatar?: string;
  userEmail?: string;
  rating: number; // 1-5
  comment: string;
  date: string;
  isVerifiedPatient: boolean;
  tags?: string[];
}

export type TimeOfDayFilter = 'all' | 'morning' | 'afternoon' | 'evening';
export type SortByOption = 'distance' | 'rating' | 'availability' | 'relevance';

export interface SearchFilterState {
  query: string;
  specialty: string;
  maxDistanceKm: number;
  minRating: number;
  availability: 'all' | 'today' | 'tomorrow' | 'weekend';
  timeOfDay?: TimeOfDayFilter;
  isEmergencyOnly: boolean;
  viewMode: 'split' | 'list' | 'map';
  searchType: 'all' | 'doctors' | 'clinics';
  openNowOnly: boolean;
  insuranceProvider?: string;
  sortBy?: SortByOption;
}

export type WaitlistTimeRange = 'any' | 'morning' | 'afternoon' | 'evening';
export type WaitlistStatus = 'waiting' | 'slot_available' | 'booked' | 'cancelled';

export interface WaitlistEntry {
  id: string;
  userId?: string;
  userName: string;
  userPhone: string;
  userEmail?: string;
  clinicId: string;
  clinicName: string;
  doctorId?: string;
  doctorName?: string;
  doctorSpecialty?: string;
  doctorPhoto?: string;
  preferredDate: string;
  preferredTimeRange: WaitlistTimeRange;
  notes?: string;
  status: WaitlistStatus;
  createdAt: string;
  availableSlot?: {
    date: string;
    time: string;
  };
}

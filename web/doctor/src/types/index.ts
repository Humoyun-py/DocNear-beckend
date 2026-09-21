export type VerificationStatus = 'verified' | 'pending_verification' | 'suspended' | 'inactive';

export type UserRole = 'USER' | 'DOCTOR' | 'CLINIC_OWNER' | 'ADMIN';

export type AppointmentStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'RESCHEDULED'
  | 'pending'
  | 'confirmed'
  | 'waiting'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'rejected'
  | 'no_show'
  | 'rescheduled';

export type AppointmentType =
  | 'Cardiology Consultation'
  | 'Follow-up Consultation'
  | 'ECG & Diagnostics Review'
  | 'Preventive Checkup'
  | 'Hypertension Management'
  | 'Heart Failure Routine'
  | 'Emergency Review';

export interface User {
  id: string;
  email: string;
  phone: string;
  fullName: string;
  role: UserRole;
  avatarUrl: string;
  doctorId?: string;
  clinicId?: string;
}

export interface DoctorProfile {
  id: string;
  userId: string;
  title: string; // e.g. 'Dr.'
  firstName: string;
  lastName: string;
  specialty: string;
  subSpecialties: string[];
  medicalLicenseNumber: string;
  yearsOfExperience: number;
  rating: number;
  reviewCount: number;
  bio: string;
  phone: string;
  email: string;
  avatarUrl: string;
  verificationStatus: VerificationStatus;
  verificationSubmittedAt?: string;
  verificationNotes?: string;
  education: Array<{
    degree: string;
    institution: string;
    year: number;
  }>;
  certifications: Array<{
    title: string;
    issuingOrganization: string;
    year: number;
  }>;
  languages: string[];
  clinicId: string;
  consultationFee: number;
  currency: string;
  officeNumber?: string;
}

export interface Clinic {
  id: string;
  name: string;
  tagline: string;
  logoUrl: string;
  coverImageUrl: string;
  address: string;
  city: string;
  postalCode: string;
  phone: string;
  email: string;
  workingHours: string;
  services: string[];
  facilities: string[];
  doctorCount: number;
  rating: number;
  totalReviews: number;
  latitude: number;
  longitude: number;
  directionsInstructions: string;
  officeNumber?: string;
}

export interface Patient {
  id: string;
  fullName: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  phone: string;
  email: string;
  bloodGroup: string;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  totalAppointments: number;
  lastAppointmentDate?: string;
  nextAppointmentDate?: string;
  allergies: string[];
  medicalHistory: string[];
  notes?: string;
  avatarColor: string;
}

export interface StatusHistoryItem {
  status: AppointmentStatus;
  timestamp: string;
  note?: string;
  updatedBy?: string;
}

export interface Appointment {
  id: string; // e.g. appointment_101
  bookingCode: string; // e.g. DN-89201
  clinicId: string; // e.g. clinic_001
  clinicName: string;
  clinicAddress?: string;
  clinicPhone?: string;
  doctorId?: string; // e.g. doctor_001
  doctorProfileId: string; // backwards compatibility
  doctorName?: string;
  doctorSpecialty?: string;
  doctorPhoto?: string;
  patientId: string; // e.g. patient_001
  patientName: string;
  patientPhone: string;
  patientEmail?: string;
  visitReason?: string;
  patientNotes?: string;
  doctorNotes?: string;
  patientNote?: string; // compatibility alias
  doctorNote?: string; // compatibility alias
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  durationMinutes: number;
  type: AppointmentType;
  status: AppointmentStatus;
  consultationFee?: number;
  createdAt?: string;
  updatedAt?: string;
  cancellationReason?: string;
  startedAt?: string; // ISO string
  completedAt?: string; // ISO string
  isEmergency?: boolean;
  statusHistory?: StatusHistoryItem[];
}

export interface DayWorkingHours {
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday, 1 = Monday, etc.
  dayName: string;
  isActive: boolean;
  startTime: string; // "09:00"
  endTime: string; // "17:00"
  breakStartTime: string; // "13:00"
  breakEndTime: string; // "14:00"
}

export interface BlockedTimeSlot {
  id: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  reason: string;
  type: 'blocked' | 'break' | 'day_off' | 'emergency';
}

export interface AppointmentSettings {
  defaultDurationMinutes: 15 | 30 | 45 | 60;
  bufferMinutes: number; // e.g. 5 or 10 min
  maxAppointmentsPerDay: number;
  maxConsecutiveAppointments: number;
  isAcceptingNewBookings: boolean;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  category: 'booking_request' | 'confirmed' | 'cancellation' | 'reminder' | 'reschedule' | 'conflict' | 'clinic_announcement';
  timestamp: string;
  isRead: boolean;
  appointmentId?: string;
  patientId?: string;
}

export interface AnalyticsSummary {
  todayAppointmentsCount: number;
  todayCompletedCount: number;
  todayPendingCount: number;
  todayCancelledCount: number;
  todayNoShowCount: number;
  weeklyTotal: number;
  monthlyTotal: number;
  completionRatePercent: number;
  cancellationRatePercent: number;
  noShowRatePercent: number;
  averageAppointmentsPerDay: number;
  patientGrowthCount: number;
  weeklyTrend: Array<{ day: string; count: number; completed: number; cancelled: number }>;
  monthlyTrend: Array<{ month: string; appointments: number; revenue: number }>;
  timeSlotDistribution: Array<{ time: string; count: number }>;
}

export interface ActiveConsultationTimer {
  appointmentId: string;
  patientName: string;
  startedAtTimestamp: number;
  isActive: boolean;
}

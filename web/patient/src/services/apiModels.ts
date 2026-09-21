import { Appointment, AppointmentStatus, Clinic, Doctor, DaySchedule, LocationCoordinates } from '../types';
import { calculateHaversineDistance } from '../utils/geo';
export interface ClinicDto {
 id: number; name: string; description: string; address: string; phone: string; latitude: number; longitude: number;
 logo: string | null; cover_image: string | null; rating: string; verified_partner: boolean; is_24_7: boolean;
 has_emergency_service: boolean; open_status: boolean; doctor_count: number; next_available_time: string | null;
 working_hours: Record<string, [string, string][]>; facilities: string[];
 services: {name: string}[]; images: {id: number; image: string}[]; distance_km?: number;
 doctors?: DoctorDto[];
}
export interface DoctorDto {
 id: number; name: string; bio: string; profile_image: string | null; experience_years: number; education: string;
 certifications: string[]; languages: string[]; rating: string; total_reviews: number; next_available_time: string | null; distance_km?: number;
 affiliations: {clinic: number; clinic_name: string; specialty: number; specialty_name: string; is_primary: boolean; latitude: number; longitude: number}[];
}
export interface AppointmentDto {
 id: number; booking_id: string; doctor: number; doctor_name: string; clinic: number; clinic_name: string; specialty_name: string;
 patient_name: string; patient_note: string; appointment_date: string; start_time: string; status: string; created_at: string;
}
export interface AvailabilityDto { date: string; slots: {time: string; end_time: string; available: boolean}[] }
export function tashkentDate(offset = 0): string {
 return new Intl.DateTimeFormat('en-CA', {timeZone: 'Asia/Tashkent', year: 'numeric', month: '2-digit', day: '2-digit'}).format(new Date(Date.now() + offset * 86400000));
}
export function schedule(dto: AvailabilityDto): DaySchedule {
 return { date: dto.date, dayLabel: dto.date, isToday: dto.date === tashkentDate(), slots: dto.slots.map(s => ({
   time: s.time.slice(0, 5), isAvailable: s.available, period: Number(s.time.slice(0, 2)) < 12 ? 'morning' : Number(s.time.slice(0, 2)) < 17 ? 'afternoon' : 'evening'
 })) };
}
export function mapClinic(c: ClinicDto, coords?: LocationCoordinates): Clinic {
 const coordinates = {lat: Number(c.latitude), lng: Number(c.longitude)};
 const intervals = Object.values(c.working_hours).flat();
 return { id: String(c.id), name: c.name, description: c.description, address: c.address, district: '', phone: c.phone,
 coordinates, latitude: coordinates.lat, longitude: coordinates.lng, distanceKm: coords ? calculateHaversineDistance(coords, coordinates) : c.distance_km,
 image: c.cover_image || c.logo || '', coverImage: c.cover_image || '', logo: c.logo || '',
 images: c.images.map(i => i.image), gallery: c.images.map(i => ({id: String(i.id), url: i.image, title: c.name})),
 rating: Number(c.rating), reviewCount: 0, isPartner: c.verified_partner, isEmergency24x7: c.is_24_7 && c.has_emergency_service,
 isOpenNow: c.open_status, doctorCount: c.doctor_count, nextAvailableTime: c.next_available_time || '',
 workingHours: {open: intervals[0]?.[0] || '', close: intervals[0]?.[1] || '', is24Hours: c.is_24_7, days: Object.keys(c.working_hours).join(', ')},
 specialties: [...new Set(c.doctors?.flatMap(d => d.affiliations.map(a => a.specialty_name)) || [])],
 facilities: c.facilities, languages: [], services: c.services };
}
export function mapDoctor(d: DoctorDto, coords?: LocationCoordinates, clinicId?: string): Doctor {
 const link = d.affiliations.find(a => String(a.clinic) === clinicId) || d.affiliations.find(a => a.is_primary) || d.affiliations[0];
 return {id: String(d.id), name: d.name, title: '', specialty: link?.specialty_name || '', subSpecialties: d.affiliations.map(a => a.specialty_name),
 experienceYears: d.experience_years, rating: Number(d.rating), reviewCount: d.total_reviews, patientCount: 0, photo: d.profile_image || '',
 biography: d.bio, education: d.education ? [d.education] : [], certifications: d.certifications, languages: d.languages,
 clinicId: link ? String(link.clinic) : '', clinicName: link?.clinic_name || '', clinicAddress: '', consultationFee: '',
 availableToday: !!d.next_available_time?.startsWith(tashkentDate()), nextFreeTime: d.next_available_time || '', todaySlots: [], weeklySchedule: [],
 distanceKm: coords && link ? calculateHaversineDistance(coords, {lat: Number(link.latitude), lng: Number(link.longitude)}) : d.distance_km };
}
export function mapAppointment(a: AppointmentDto): Appointment {
 return {id: String(a.id), bookingCode: a.booking_id, doctorId: String(a.doctor), doctorName: a.doctor_name,
 clinicId: String(a.clinic), clinicName: a.clinic_name, clinicAddress: '', clinicPhone: '', doctorSpecialty: a.specialty_name,
 doctorPhoto: '', patientName: a.patient_name, patientPhone: '', notes: a.patient_note, date: a.appointment_date,
 time: a.start_time.slice(0, 5), status: ({pending:'Pending',confirmed:'Confirmed',completed:'Completed',cancelled:'Cancelled'}[a.status] || a.status.toUpperCase()) as AppointmentStatus, createdAt: a.created_at };
}

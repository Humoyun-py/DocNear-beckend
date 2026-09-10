import { Doctor, LocationCoordinates } from '../types';
import { apiList, apiRequest } from './apiClient';
import { AvailabilityDto, DoctorDto, mapDoctor, schedule, tashkentDate } from './apiModels';
import { isMatchingSpecialty } from '../utils/specialtyTranslations';
export const doctorService = {
 async getDoctors(coords?: LocationCoordinates) { return (await apiList<DoctorDto>('doctors/')).map(d => mapDoctor(d, coords)); },
 async getDoctorById(id: string, coords?: LocationCoordinates): Promise<Doctor> {
  const doctor = mapDoctor(await apiRequest<DoctorDto>('doctors/' + id + '/'), coords);
  if (doctor.clinicId) doctor.weeklySchedule = await this.getSchedule(id, doctor.clinicId);
  doctor.todaySlots = doctor.weeklySchedule[0]?.slots.filter(s => s.isAvailable).map(s => s.time) || [];
  doctor.availableToday = doctor.todaySlots.length > 0;
  return doctor;
 },
 async getAvailability(id: string, clinicId: string, date: string) {
  return schedule(await apiRequest<AvailabilityDto>('doctors/' + id + '/availability/?clinic_id=' + clinicId + '&date=' + date));
 },
 async getSchedule(id: string, clinicId: string) {
  return Promise.all(Array.from({length: 7}, (_, i) => this.getAvailability(id, clinicId, tashkentDate(i))));
 },
 async getDoctorsByClinic(clinicId: string) { return (await apiList<DoctorDto>('doctors/?clinic=' + clinicId)).map(d => mapDoctor(d, undefined, clinicId)); },
 async getNearestAvailableDoctors(coords: LocationCoordinates, limit = 6) {
  return (await this.getDoctors(coords)).filter(d => d.availableToday).sort((a,b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity)).slice(0, limit);
 },
 async searchDoctors(query: string, specialty?: string, coords?: LocationCoordinates, maxDistanceKm = 5, minRating = 0, onlyToday = false) {
  return (await this.getDoctors(coords)).filter(d =>
   (!query || (d.name + ' ' + d.specialty + ' ' + d.clinicName).toLowerCase().includes(query.toLowerCase())) &&
   (!specialty || specialty === 'all' || isMatchingSpecialty(d.specialty, specialty)) &&
   (d.distanceKm === undefined || d.distanceKm <= maxDistanceKm) && d.rating >= minRating && (!onlyToday || d.availableToday));
 }
};

import { Appointment, AppointmentStatus } from '../types';
import { apiClient, apiList } from './apiClient';
export interface AppointmentFilters {
 status?: AppointmentStatus | 'all'; search?: string; date?: string; clinicId?: string; patientName?: string;
 bookingCode?: string; time?: string; specialty?: string; doctorId?: string;
}
export function mapAppointment(a: any): Appointment {
 const minutes = (t: string) => Number(t.slice(0,2))*60 + Number(t.slice(3,5));
 return { id: String(a.id), bookingCode: a.booking_id, clinicId: String(a.clinic), clinicName: a.clinic_name,
 doctorId: String(a.doctor), doctorProfileId: String(a.doctor), doctorName: a.doctor_name, doctorSpecialty: a.specialty_name,
 patientId: String(a.patient), patientName: a.patient_name, patientPhone: a.patient_phone || '', patientNote: a.patient_note || '',
 patientNotes: a.patient_note || '', date: a.appointment_date, time: a.start_time.slice(0,5), durationMinutes: minutes(a.end_time)-minutes(a.start_time),
 type: a.specialty_name, status: a.status, createdAt: a.created_at, updatedAt: a.updated_at, cancellationReason: a.cancel_reason, statusHistory: [] };
}
async function action(id: string, name: string, body = {}) {
 return mapAppointment((await apiClient.post('/doctor-panel/appointments/' + id + '/' + name + '/', body)).data);
}
export const doctorAppointmentService = {
 async getAppointments(filters: AppointmentFilters = {}): Promise<Appointment[]> {
  const params: Record<string,string> = {};
  if (filters.status && filters.status !== 'all') params.status = filters.status.toLowerCase();
  if (filters.date) params.date = filters.date;
  if (filters.search) params.search = filters.search;
  if (filters.clinicId) params.clinic = filters.clinicId;
  if (filters.bookingCode) params.booking_id = filters.bookingCode;
  return (await apiList<any>('/doctor-panel/appointments/', params)).map(mapAppointment);
 },
 async getAppointmentById(id: string): Promise<Appointment | undefined> {
  return mapAppointment((await apiClient.get('/doctor-panel/appointments/' + id + '/')).data);
 },
 confirmBooking(id: string, note?: string) { return action(id, 'accept', {reason: note || ''}); },
 rejectBooking(id: string, reason: string) { return action(id, 'reject', {reason}); },
 cancelAppointment(id: string, reason: string) { return action(id, 'cancel', {reason}); },
 rescheduleAppointment(id: string, date: string, time: string, _reason?: string) { return action(id, 'reschedule', {date,time}); },
 completeAppointment(id: string, doctorNote?: string) { return action(id, 'complete', {reason: doctorNote || ''}); },
 startAppointment(id: string) { return action(id, 'start'); },
 markNoShow(id: string) { return action(id, 'no-show'); },
 async createBooking(_booking: Partial<Appointment>): Promise<Appointment> { throw new Error('Qabulni bemor o‘z akkauntidan yaratadi'); },
 async resetData(): Promise<void> { throw new Error('Server ma’lumotlarini bu yerdan o‘chirib bo‘lmaydi'); },
};

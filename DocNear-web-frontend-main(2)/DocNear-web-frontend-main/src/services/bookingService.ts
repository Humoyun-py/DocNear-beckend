import { Appointment } from '../types';
import { apiList, apiRequest } from './apiClient';
import { AppointmentDto, mapAppointment } from './apiModels';
type BookingInput = Pick<Appointment, 'clinicId' | 'doctorId' | 'date' | 'time'> & Partial<Appointment>;
export const bookingService = {
 async getMyAppointments() { return (await apiList<AppointmentDto>('appointments/')).map(mapAppointment); },
 async getAppointmentById(id: string) { return mapAppointment(await apiRequest<AppointmentDto>('appointments/' + id + '/')); },
 async createBooking(data: BookingInput) {
  return mapAppointment(await apiRequest<AppointmentDto>('appointments/', {method: 'POST', body: JSON.stringify({
   doctor_id: Number(data.doctorId), clinic_id: Number(data.clinicId), date: data.date, time: data.time, patient_note: data.notes || data.visitReason || '',
  })}));
 },
 async cancelAppointment(id: string, reason = '') {
  await apiRequest('appointments/' + id + '/cancel/', {method: 'POST', body: JSON.stringify({reason})}); return true;
 },
 async rescheduleAppointment(id: string, date: string, time: string) {
  return mapAppointment(await apiRequest<AppointmentDto>('appointments/' + id + '/reschedule/', {method: 'POST', body: JSON.stringify({date,time})}));
 }
};

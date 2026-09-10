import { WaitlistEntry, WaitlistTimeRange } from '../types';
import { apiRequest, apiList } from './apiClient';
function mapEntry(e:any):WaitlistEntry {
 return {id:String(e.id),userName:e.patient_name,userPhone:'',clinicId:String(e.clinic),clinicName:e.clinic_name,
 doctorId:String(e.doctor),doctorName:e.doctor_name,preferredDate:e.preferred_date,preferredTimeRange:e.time_range,
 notes:e.notes,status:e.status==='waiting' && e.available_slot?'slot_available':e.status,createdAt:e.created_at,availableSlot:e.available_slot || undefined};
}
export const waitlistService = {
 async getWaitlists(_phone?:string):Promise<WaitlistEntry[]> { return (await apiList('waitlists/')).map(mapEntry); },
 async joinWaitlist(data:{userId?:string;userName:string;userPhone:string;userEmail?:string;clinicId:string;clinicName:string;doctorId?:string;doctorName?:string;doctorSpecialty?:string;doctorPhoto?:string;preferredDate:string;preferredTimeRange?:WaitlistTimeRange;notes?:string}):Promise<WaitlistEntry> {
  if(!data.doctorId) throw new Error('Kutish ro‘yxati uchun shifokorni tanlang');
  return mapEntry(await apiRequest('waitlists/',{method:'POST',body:JSON.stringify({doctor:Number(data.doctorId),clinic:Number(data.clinicId),
   preferred_date:data.preferredDate,time_range:data.preferredTimeRange || 'any',notes:data.notes || ''})}));
 },
 async cancelWaitlist(id:string):Promise<boolean> { await apiRequest('waitlists/'+id+'/cancel/',{method:'POST'});return true; },
 async checkAvailability(id:string):Promise<WaitlistEntry> { return mapEntry(await apiRequest('waitlists/'+id+'/')); },
 async markAsBooked(id:string) { await apiRequest('waitlists/'+id+'/mark-booked/',{method:'POST'}); },
};

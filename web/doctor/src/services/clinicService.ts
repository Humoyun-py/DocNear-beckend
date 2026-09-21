import { Clinic } from '../types';
import { apiList } from './apiClient';
export const clinicService = {
 async getClinic(): Promise<Clinic> {
  const raw = (await apiList<any>('/doctor-panel/clinics/'))[0];
  if (!raw) throw new Error('Sizga klinika biriktirilmagan');
  return {id: String(raw.id),name:raw.name,tagline:'',logoUrl:raw.logo || '',coverImageUrl:raw.cover_image || '',
   address:raw.address,city:'',postalCode:'',phone:raw.phone,email:raw.email,workingHours:JSON.stringify(raw.working_hours),
   services:raw.services.map((s:any)=>s.name),facilities:raw.facilities,doctorCount:raw.doctor_count,rating:Number(raw.rating),
   totalReviews:0,latitude:Number(raw.latitude),longitude:Number(raw.longitude),directionsInstructions:''};
 }
};

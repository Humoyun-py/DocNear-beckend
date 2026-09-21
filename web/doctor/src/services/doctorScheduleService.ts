import { DayWorkingHours, BlockedTimeSlot, AppointmentSettings } from '../types';
import { apiClient, apiList } from './apiClient';
async function snapshot() { return (await apiClient.get('/doctor-panel/schedule/')).data; }
async function clinicId():Promise<number> { const data=await snapshot(); const id=data.policies[0]?.clinic; if(!id) throw new Error('Klinika biriktirilmagan'); return id; }
function mapBlock(b:any):BlockedTimeSlot { return {id:String(b.id),date:b.start_datetime.slice(0,10),startTime:b.start_datetime.slice(11,16),endTime:b.end_datetime.slice(11,16),reason:b.reason,type:'blocked'}; }
export const doctorScheduleService = {
 async getWorkingHours(_doctorId?:string):Promise<DayWorkingHours[]> {
  const data=await snapshot(); const clinic=data.policies[0]?.clinic;
  return Array.from({length:7},(_,day)=>{
   const row=data.schedules.find((s:any)=>s.clinic===clinic && s.day_of_week===(day+6)%7);
   const br=data.breaks.find((b:any)=>b.clinic===clinic && b.weekday===(day+6)%7);
   return {dayOfWeek:day as DayWorkingHours['dayOfWeek'],dayName:['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][day],
    isActive:row?.is_working || false,startTime:row?.start_time?.slice(0,5) || '09:00',endTime:row?.end_time?.slice(0,5) || '17:00',
    breakStartTime:br?.start_time?.slice(0,5) || '',breakEndTime:br?.end_time?.slice(0,5) || ''};
  });
 },
 async updateWorkingHours(hours:DayWorkingHours[]):Promise<DayWorkingHours[]> {
  const clinic=await clinicId();
  await apiClient.patch('/doctor-panel/schedule/',{schedules:hours.map(h=>({clinic,day_of_week:(h.dayOfWeek+6)%7,is_working:h.isActive,start_time:h.startTime,end_time:h.endTime}))});
  const data=await snapshot();
  for(const h of hours) {
   const weekday=(h.dayOfWeek+6)%7;
   const existing=data.breaks.filter((b:any)=>b.clinic===clinic && b.weekday===weekday);
   if(existing.length===1 && existing[0].start_time.slice(0,5)===h.breakStartTime && existing[0].end_time.slice(0,5)===h.breakEndTime) continue;
   for(const b of existing) await apiClient.delete('/doctor-panel/breaks/'+b.id+'/');
   if(h.isActive && h.breakStartTime && h.breakEndTime) await apiClient.post('/doctor-panel/breaks/',{clinic,weekday,start_time:h.breakStartTime,end_time:h.breakEndTime});
  }
  return this.getWorkingHours();
 },
 async getBlockedSlots(date?:string):Promise<BlockedTimeSlot[]> {
  return (await apiList<any>('/doctor-panel/blocked-times/')).map(mapBlock).filter(b=>!date||b.date===date);
 },
 async addBlockedSlot(slot:Omit<BlockedTimeSlot,'id'>):Promise<BlockedTimeSlot> {
  return mapBlock((await apiClient.post('/doctor-panel/blocked-times/',{clinic:await clinicId(),start_datetime:slot.date+'T'+slot.startTime+':00+05:00',end_datetime:slot.date+'T'+slot.endTime+':00+05:00',reason:slot.reason})).data);
 },
 async removeBlockedSlot(id:string) { await apiClient.delete('/doctor-panel/blocked-times/'+id+'/'); },
 async getSettings():Promise<AppointmentSettings> {
  const [data,profile]=await Promise.all([snapshot(),apiClient.get('/doctor-panel/profile/')]);
  const p=data.policies[0];
  return {defaultDurationMinutes:p?.consultation_duration || 30,bufferMinutes:p?.buffer_time || 0,maxAppointmentsPerDay:p?.max_appointments_per_day || 0,
   maxConsecutiveAppointments:0,isAcceptingNewBookings:profile.data.accepts_bookings};
 },
 async updateSettings(settings:Partial<AppointmentSettings>):Promise<AppointmentSettings> {
  const clinic=await clinicId();
  await apiClient.patch('/doctor-panel/schedule/',{policies:[{clinic,
   ...(settings.defaultDurationMinutes!==undefined?{consultation_duration:settings.defaultDurationMinutes}:{}),
   ...(settings.bufferMinutes!==undefined?{buffer_time:settings.bufferMinutes}:{}),
   ...(settings.maxAppointmentsPerDay!==undefined?{max_appointments_per_day:settings.maxAppointmentsPerDay}:{})}]});
  if(settings.isAcceptingNewBookings!==undefined) await apiClient.post('/doctor-panel/availability/toggle/',{available:settings.isAcceptingNewBookings});
  return this.getSettings();
 },
 async checkSlotConflict(date:string,time:string,_duration=30,_exclude?:string) {
  const slots=await this.getAvailableSlots(date);
  return {hasConflict:!slots.includes(time),reason:slots.includes(time)?undefined:'Bu vaqt band yoki ish jadvaliga kirmaydi'};
 },
 async getAvailableSlots(date:string,_duration=30):Promise<string[]> {
  const [profile,clinic]=await Promise.all([apiClient.get('/doctor-panel/profile/'),clinicId()]);
  const {data}=await apiClient.get('/doctors/'+profile.data.id+'/availability/',{params:{clinic_id:clinic,date}});
  return data.slots.filter((s:any)=>s.available).map((s:any)=>s.time.slice(0,5));
 }
};
export const scheduleService=doctorScheduleService;

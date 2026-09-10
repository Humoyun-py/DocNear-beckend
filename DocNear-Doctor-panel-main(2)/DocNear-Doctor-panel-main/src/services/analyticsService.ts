import { AnalyticsSummary } from '../types';
import { apiClient, apiList } from './apiClient';
export const analyticsService = {
 async getSummary():Promise<AnalyticsSummary> {
  const date = new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Tashkent'}).format(new Date());
  const [response,today] = await Promise.all([apiClient.get('/doctor-panel/analytics/'),apiList<any>('/doctor-panel/appointments/',{date})]);
  const a=response.data;
  return {todayAppointmentsCount:today.length,todayCompletedCount:today.filter(i=>i.status==='completed').length,
   todayPendingCount:today.filter(i=>i.status==='pending').length,todayCancelledCount:today.filter(i=>i.status==='cancelled').length,
   todayNoShowCount:today.filter(i=>i.status==='no_show').length,weeklyTotal:a.weekly_appointments,monthlyTotal:a.monthly_appointments,
   completionRatePercent:a.completion_rate,cancellationRatePercent:a.total_appointments?100*a.cancelled_count/a.total_appointments:0,
   noShowRatePercent:a.total_appointments?100*a.no_show_count/a.total_appointments:0,averageAppointmentsPerDay:a.average_appointments_per_day,
   patientGrowthCount:0,weeklyTrend:a.daily_appointments.slice(-7).map((d:any)=>({day:d.date,count:d.count,completed:0,cancelled:0})),
   monthlyTrend:[],timeSlotDistribution:[]};
 }
};

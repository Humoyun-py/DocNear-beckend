import { useQuery } from '@tanstack/react-query';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CircleAlert } from 'lucide-react';
import { adminDashboardService } from './services/adminDashboardService';

export default function AnalyticsPage() {
  const query = useQuery({ queryKey: ['analytics'], queryFn: adminDashboardService.analytics });
  if (query.isLoading) return <div className="loading"><span className="spinner" /> Loading live data...</div>;
  if (query.isError) return <div className="panel error-state"><CircleAlert size={22} /><h3>Unable to load analytics</h3><p className="muted">Check the API URL and administrator permissions, then try again.</p></div>;
  return <><h1>Analytics</h1><div className="panel"><h2>Daily appointments</h2><ResponsiveContainer width="100%" height={320}><BarChart data={query.data?.daily_appointments || []}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="date"/><YAxis allowDecimals={false}/><Tooltip/><Bar dataKey="count" fill="#197b58"/></BarChart></ResponsiveContainer></div></>;
}

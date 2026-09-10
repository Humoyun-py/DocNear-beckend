import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from 'recharts';
import {
  TrendingUp,
  Calendar,
  CheckCircle2,
  XCircle,
  Users,
  Activity,
  Clock,
} from 'lucide-react';
import { analyticsService } from '../../services/analyticsService';
import { AnalyticsSummary } from '../../types';
import { StatCard } from '../../components/common/StatCard';
import { useThemeStore } from '../../store/useThemeStore';

export const AnalyticsPage: React.FC = () => {
  const [analytics,setAnalytics]=useState<AnalyticsSummary>();
  useEffect(()=>{analyticsService.getSummary().then(setAnalytics).catch(console.error)},[]);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('week');
  const theme = useThemeStore((state) => state.theme);
  const isDark = theme === 'dark';

  if (!analytics) return <div role="status">Hisobot yuklanmoqda…</div>;
  const {
    todayAppointmentsCount,
    todayCompletedCount,
    todayCancelledCount,
    todayNoShowCount,
    weeklyTotal,
    monthlyTotal,
    completionRatePercent,
    averageAppointmentsPerDay,
    patientGrowthCount,
    weeklyTrend,
    monthlyTrend,
    timeSlotDistribution,
  } = analytics;

  // Pie chart data for completion vs cancellation vs no-show
  const outcomeData = [
    { name: 'Completed', value: todayCompletedCount, color: '#10b981' },
    { name: 'Cancelled', value: todayCancelledCount, color: '#f43f5e' },
    { name: 'No-Show', value: todayNoShowCount, color: '#64748b' },
  ];

  return (
    <div id="analytics-page-container" className="space-y-8 pb-12 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Practice Analytics & Performance
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Operational metrics, consultation completion velocity, and patient volume trends
          </p>
        </div>

        {/* Time range selector */}
        <div className="flex p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          {(['week', 'month', 'year'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                timeRange === range
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {range === 'week' ? 'Past 7 Days' : range === 'month' ? 'This Month' : 'Past Year'}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          label="Weekly Consultations"
          value={weeklyTotal}
          sublabel="Past 7 days"
          icon={<Calendar className="w-5 h-5 text-blue-600" />}
          highlight
          trend={{ value: '+12% vs last week', isPositive: true }}
        />
        <StatCard
          label="Completion Rate"
          value={`${completionRatePercent}%`}
          sublabel="126 consultations completed"
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
          trend={{ value: '+3.4% quality index', isPositive: true }}
        />
        <StatCard
          label="Daily Average"
          value={averageAppointmentsPerDay}
          sublabel="Consultations per clinic day"
          icon={<Activity className="w-5 h-5 text-indigo-600" />}
        />
        <StatCard
          label="New Patient Growth"
          value={`+${patientGrowthCount}`}
          sublabel="Month-over-month increase"
          icon={<Users className="w-5 h-5 text-emerald-600" />}
          trend={{ value: '+14% growth', isPositive: true }}
        />
      </div>

      {/* Primary Charts Row: Weekly Appointments & Hourly Heat Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Weekly Appointments Bar Chart */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Consultation Volume by Day
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Completed vs Scheduled consultations across the active week
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 rounded-lg">
              Total: {weeklyTotal}
            </span>
          </div>

          <div className="h-64 pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#1e293b' : '#f1f5f9'} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#0f172a' : '#ffffff',
                    borderColor: isDark ? '#1e293b' : '#e2e8f0',
                    borderRadius: '8px',
                    color: isDark ? '#fff' : '#0f172a',
                    fontSize: '12px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Outcome Breakdown (Donut Chart) */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Appointment Outcomes
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Breakdown of total monthly booking resolutions
            </p>
          </div>

          <div className="h-48 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={outcomeData}
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {outcomeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#0f172a' : '#ffffff',
                    borderColor: isDark ? '#1e293b' : '#e2e8f0',
                    borderRadius: '8px',
                    color: isDark ? '#fff' : '#0f172a',
                    fontSize: '12px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Outcome Legend */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            {outcomeData.map((item) => (
              <div key={item.name} className="text-center">
                <div className="flex items-center justify-center gap-1.5 text-slate-500">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-[11px]">{item.name}</span>
                </div>
                <div className="font-bold font-mono text-sm mt-0.5 text-slate-800 dark:text-slate-200">
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Secondary Row: Monthly Growth Trend & Peak Hours */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Monthly Consultation Growth (Line Chart) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Monthly Consultation Velocity
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                8-month historical clinical trajectory
              </p>
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-1 rounded-lg">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Steady upward trajectory</span>
            </div>
          </div>

          <div className="h-60 pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#1e293b' : '#f1f5f9'} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#0f172a' : '#ffffff',
                    borderColor: isDark ? '#1e293b' : '#e2e8f0',
                    borderRadius: '8px',
                    color: isDark ? '#fff' : '#0f172a',
                    fontSize: '12px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="appointments"
                  stroke="#2563eb"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#2563eb' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Hourly Peak Time Analysis */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Peak Consultation Hours
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Distribution of patient bookings across shift hours
            </p>
          </div>

          <div className="space-y-2.5 pt-2">
            {timeSlotDistribution.map((item) => (
              <div key={item.time} className="flex items-center gap-3 text-xs">
                <span className="w-12 font-mono font-semibold text-slate-600 dark:text-slate-400">
                  {item.time}
                </span>
                <div className="flex-1 h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-500"
                    style={{ width: `${(item.count / 40) * 100}%` }}
                  />
                </div>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200 w-6 text-right">
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

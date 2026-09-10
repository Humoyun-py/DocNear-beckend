import { today, upcomingDays } from '../../utils/calendar';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  Play,
  ArrowRight,
  AlertCircle,
  Coffee,
  Building2,
  ChevronRight,
  CalendarClock,
  Bell,
  BarChart3,
  CalendarPlus,
  UserCheck,
  Zap,
  ArrowUpRight,
  UserCheck2,
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useAppointmentStore } from '../../store/useAppointmentStore';
import { useScheduleStore } from '../../store/useScheduleStore';
import { useNotificationStore } from '../../store/useNotificationStore';
import { useToastStore } from '../../store/useToastStore';
import { StatCard } from '../../components/common/StatCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Appointment } from '../../types';
import { calculateEndTime } from '../../utils/time';

export const DashboardPage: React.FC = () => {
  const { profile, user } = useAuthStore();
  const {
    appointments,
    setSelectedAppointmentId,
    startAppointment,
    setCompleteTarget,
    acceptRequest,
    rejectRequest,
  } = useAppointmentStore();
  const { blockedSlots, settings } = useScheduleStore();
  const { unreadCount } = useNotificationStore();
  const { addToast } = useToastStore();
  const navigate = useNavigate();

  // Current date formatting (reference: September 5, 2026)
  const todayDateStr = today();
  const displayDate = 'Saturday, September 5, 2026';

  // Strict doctor isolation: filter appointments belonging to currently logged-in doctor
  const currentDoctorId = user?.doctorId || profile?.id || 'doctor_001';
  const doctorAppointments = appointments.filter(
    (a) => a.doctorId === currentDoctorId || a.doctorProfileId === currentDoctorId
  );

  // Filter metrics
  const todayAppointments = doctorAppointments.filter((a) => a.date === todayDateStr);
  const pendingRequests = doctorAppointments.filter((a) => a.status === 'pending' || a.status === 'PENDING');
  const confirmedCount = doctorAppointments.filter(
    (a) => a.status === 'confirmed' || a.status === 'CONFIRMED' || a.status === 'waiting'
  ).length;
  const completedCount = doctorAppointments.filter(
    (a) => a.status === 'completed' || a.status === 'COMPLETED'
  ).length;
  const cancelledCount = doctorAppointments.filter(
    (a) => a.status === 'cancelled' || a.status === 'CANCELLED' || a.status === 'rejected'
  ).length;
  const upcomingCount = doctorAppointments.filter(
    (a) => a.date > todayDateStr && (a.status === 'confirmed' || a.status === 'CONFIRMED' || a.status === 'pending')
  ).length;

  // Next patient / Active consultation
  const inProgressAppointment = todayAppointments.find((a) => a.status === 'in_progress');
  const upcomingTodayAppointment = todayAppointments.find(
    (a) => a.status === 'waiting' || a.status === 'confirmed' || a.status === 'CONFIRMED'
  );
  const nextAppointment = inProgressAppointment || upcomingTodayAppointment;
  const isConsultationActive = Boolean(inProgressAppointment);

  const handleStartConsultation = async (apt: Appointment, e?: React.MouseEvent) => {
    e?.stopPropagation();
    await startAppointment(apt.id);
    addToast({
      type: 'info',
      title: 'Consultation Started',
      message: `Active timer initiated for ${apt.patientName}. Complete consultation when finished.`,
    });
  };

  const handleAcceptRequest = async (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await acceptRequest(id);
    addToast({
      type: 'success',
      title: 'Booking Request Accepted',
      message: `Appointment for ${name} has been confirmed.`,
    });
  };

  const handleRejectRequest = async (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await rejectRequest(id);
    addToast({
      type: 'warning',
      title: 'Booking Request Declined',
      message: `Booking request for ${name} was rejected.`,
    });
  };

  // Timeline entries for today (appointments + breaks)
  const todayBreaks = blockedSlots.filter((b) => b.date === todayDateStr);
  type TimelineEntry =
    | { kind: 'appointment'; data: Appointment }
    | { kind: 'break'; data: (typeof todayBreaks)[0] };

  const timelineEntries: TimelineEntry[] = [
    ...todayAppointments.map((apt) => ({ kind: 'appointment' as const, data: apt })),
    ...todayBreaks.map((brk) => ({ kind: 'break' as const, data: brk })),
  ].sort((a, b) => {
    const timeA = a.kind === 'appointment' ? a.data.time : a.data.startTime;
    const timeB = b.kind === 'appointment' ? b.data.time : b.data.startTime;
    return timeA.localeCompare(timeB);
  });

  return (
    <div id="doctor-dashboard-container" className="space-y-8 pb-12 animate-in fade-in duration-300">
      {/* Top Header: Physician Info & Multi-Doctor Persona Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
            <Building2 className="w-3.5 h-3.5" />
            <span>{profile?.clinicId === 'clinic_002' ? 'City Neurology Center' : 'MedLife Central Clinic'} • Room 304</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
            Doctor Dashboard — Dr. {profile?.firstName} {profile?.lastName}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 flex flex-wrap items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>{displayDate}</span>
            <span>•</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">{profile?.specialty}</span>
            <span>•</span>
            <span className="font-mono">
              {settings.isAcceptingNewBookings ? 'Accepting Patients' : 'Bookings Paused'}
            </span>
          </p>
        </div>

      </div>

      {/* 7 Specific Summary Cards Requested:
          1. Today's appointments
          2. Pending booking requests
          3. Confirmed appointments
          4. Completed appointments
          5. Cancelled appointments
          6. Upcoming appointments
          7. Unread notifications */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Clinical Summary Overview
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            Showing exclusively appointments for {profile?.title} {profile?.lastName}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
          {/* 1. Today's appointments */}
          <StatCard
            id="stat-today-appointments"
            label="Today's Total"
            value={todayAppointments.length}
            sublabel="Scheduled today"
            icon={<Clock className="w-4 h-4 text-blue-600" />}
            highlight
            onClick={() => navigate('/appointments?tab=today')}
          />

          {/* 2. Pending booking requests */}
          <StatCard
            id="stat-pending-requests"
            label="Pending Requests"
            value={pendingRequests.length}
            sublabel="Awaiting action"
            icon={<AlertCircle className="w-4 h-4 text-amber-600" />}
            highlight={pendingRequests.length > 0}
            onClick={() => navigate('/appointments?tab=pending')}
          />

          {/* 3. Confirmed appointments */}
          <StatCard
            id="stat-confirmed-appointments"
            label="Confirmed"
            value={confirmedCount}
            sublabel="Active bookings"
            icon={<CheckCircle2 className="w-4 h-4 text-indigo-600" />}
            onClick={() => navigate('/appointments?tab=confirmed')}
          />

          {/* 4. Completed appointments */}
          <StatCard
            id="stat-completed-appointments"
            label="Completed"
            value={completedCount}
            sublabel="Finalized visits"
            icon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />}
            onClick={() => navigate('/appointments?tab=completed')}
          />

          {/* 5. Cancelled appointments */}
          <StatCard
            id="stat-cancelled-appointments"
            label="Cancelled"
            value={cancelledCount}
            sublabel="Declined or cancelled"
            icon={<XCircle className="w-4 h-4 text-rose-600" />}
            onClick={() => navigate('/appointments?tab=cancelled')}
          />

          {/* 6. Upcoming appointments */}
          <StatCard
            id="stat-upcoming-appointments"
            label="Upcoming"
            value={upcomingCount}
            sublabel="Future clinic days"
            icon={<CalendarClock className="w-4 h-4 text-blue-500" />}
            onClick={() => navigate('/appointments?tab=upcoming')}
          />

          {/* 7. Unread notifications */}
          <StatCard
            id="stat-unread-notifications"
            label="Notifications"
            value={unreadCount}
            sublabel="Alerts & reminders"
            icon={<Bell className="w-4 h-4 text-purple-600" />}
            highlight={unreadCount > 0}
            onClick={() => navigate('/notifications')}
          />
        </div>
      </div>

      {/* Grid: Next Patient (Hero) & Quick Actions (Sections 3 & 4) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Section 3: Next Patient */}
        <div className="lg:col-span-7 bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 rounded-2xl p-6 sm:p-7 text-white shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-12 -mt-12 w-48 h-48 rounded-full bg-blue-400/20 blur-2xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between">
              <span
                className={`text-xs font-bold uppercase tracking-widest flex items-center gap-1.5 ${
                  isConsultationActive ? 'text-emerald-300' : 'text-blue-200'
                }`}
              >
                {isConsultationActive ? (
                  <>
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                    </span>
                    <span>Active Consultation In Progress</span>
                  </>
                ) : (
                  <>
                    <Clock className="w-3.5 h-3.5" />
                    <span>Next Patient on Schedule</span>
                  </>
                )}
              </span>
              {nextAppointment && (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-white/20 text-white backdrop-blur-xs font-mono">
                  {nextAppointment.time} - {calculateEndTime(nextAppointment.time, nextAppointment.durationMinutes)}
                </span>
              )}
            </div>

            {nextAppointment ? (
              <div className="mt-5 space-y-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-2xl font-extrabold text-white tracking-tight">
                      {nextAppointment.patientName}
                    </h3>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/30 text-blue-100 border border-blue-400/30 font-mono">
                      {nextAppointment.bookingCode}
                    </span>
                  </div>
                  <p className="text-xs text-blue-100 mt-1">
                    Phone: <span className="font-mono">{nextAppointment.patientPhone}</span> • ID: {nextAppointment.patientId}
                  </p>
                  <p className="text-sm text-blue-100 font-medium mt-1">
                    {nextAppointment.type} — {nextAppointment.visitReason}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 text-xs text-blue-100/90">
                  <div className="p-3 rounded-xl bg-white/10 backdrop-blur-xs">
                    <span className="block text-blue-200 text-[11px]">Clinic Bay</span>
                    <span className="font-semibold text-white mt-0.5 block truncate">
                      {nextAppointment.clinicName}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/10 backdrop-blur-xs">
                    <span className="block text-blue-200 text-[11px]">Duration & Fee</span>
                    <span className="font-semibold text-white mt-0.5 block font-mono">
                      {nextAppointment.durationMinutes} min • Narx: klinikadan aniqlang
                    </span>
                  </div>
                </div>

                {nextAppointment.patientNotes && (
                  <div className="p-3 rounded-xl bg-white/10 text-xs text-blue-50 leading-relaxed border border-white/10">
                    <span className="font-semibold text-blue-200 block text-[11px]">Patient Note:</span>
                    "{nextAppointment.patientNotes}"
                  </div>
                )}
              </div>
            ) : (
              <div className="py-12 text-center text-blue-200 text-sm">
                No immediate consultations remaining for today.
              </div>
            )}
          </div>

          {/* Action buttons */}
          {nextAppointment && (
            <div className="mt-6 pt-5 border-t border-white/15 flex flex-wrap items-center gap-3">
              {nextAppointment.status === 'in_progress' ? (
                <button
                  type="button"
                  onClick={() => setCompleteTarget(nextAppointment)}
                  className="flex-1 min-w-[160px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-emerald-400 hover:bg-emerald-300 text-slate-950 transition-colors shadow-sm"
                >
                  <CheckCircle2 className="w-4 h-4 text-slate-950" />
                  <span>Complete Consultation</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={(e) => handleStartConsultation(nextAppointment, e)}
                  className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors shadow-sm"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Start Consultation</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => navigate(`/appointments/${nextAppointment.id}`)}
                className="px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm bg-white/15 hover:bg-white/25 text-white transition-colors"
              >
                View Full Details
              </button>
            </div>
          )}
        </div>

        {/* Section 4: Quick Actions & Weekly Statistics Overview (Section 4 & 5) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Quick Actions Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>Quick Actions</span>
            </h3>

            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <button
                onClick={() => navigate('/appointments?tab=pending')}
                className="p-3 text-left rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-blue-50 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 transition-colors group"
              >
                <div className="flex items-center justify-between text-slate-500 group-hover:text-blue-600 mb-1">
                  <AlertCircle className="w-4 h-4" />
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </div>
                <div className="font-bold text-slate-900 dark:text-white">Review Requests</div>
                <div className="text-[11px] text-slate-500">{pendingRequests.length} pending approval</div>
              </button>

              <button
                onClick={() => navigate('/schedule')}
                className="p-3 text-left rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-blue-50 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 transition-colors group"
              >
                <div className="flex items-center justify-between text-slate-500 group-hover:text-blue-600 mb-1">
                  <CalendarClock className="w-4 h-4" />
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </div>
                <div className="font-bold text-slate-900 dark:text-white">Manage Slots</div>
                <div className="text-[11px] text-slate-500">Working days & hours</div>
              </button>

              <button
                onClick={() => navigate('/schedule')}
                className="p-3 text-left rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-blue-50 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 transition-colors group"
              >
                <div className="flex items-center justify-between text-slate-500 group-hover:text-blue-600 mb-1">
                  <Coffee className="w-4 h-4" />
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </div>
                <div className="font-bold text-slate-900 dark:text-white">Add Lunch Break</div>
                <div className="text-[11px] text-slate-500">Block personal hours</div>
              </button>

              <button
                onClick={() => navigate('/patients')}
                className="p-3 text-left rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-blue-50 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 transition-colors group"
              >
                <div className="flex items-center justify-between text-slate-500 group-hover:text-blue-600 mb-1">
                  <UserCheck className="w-4 h-4" />
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </div>
                <div className="font-bold text-slate-900 dark:text-white">Patient Records</div>
                <div className="text-[11px] text-slate-500">Consultation history</div>
              </button>
            </div>
          </div>

          {/* Section 5: Weekly Appointment Statistics */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-600" />
                <span>Weekly Appointment Statistics</span>
              </h3>
              <span className="text-xs font-mono font-semibold text-slate-400">Sep 01 - Sep 07</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between font-semibold text-slate-600 dark:text-slate-300">
                <span>Completed Consultations</span>
                <span className="font-mono text-emerald-600 font-bold">18 / 24 slots (75%)</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                <div className="bg-emerald-500" style={{ width: '75%' }} />
                <div className="bg-blue-500" style={{ width: '15%' }} />
                <div className="bg-rose-500" style={{ width: '10%' }} />
              </div>

              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                <div>
                  <span className="text-slate-400 block">Total Hours</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-sm">28.5 hrs</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Avg Duration</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-sm">30 mins</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Attendance</span>
                  <span className="font-mono font-bold text-emerald-600 text-sm">96.4%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Latest Booking Requests */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                Latest Booking Requests
              </h3>
              {pendingRequests.length > 0 && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-mono">
                  {pendingRequests.length} Pending
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Review and approve pending patient bookings for upcoming clinic slots
            </p>
          </div>
          <button
            onClick={() => navigate('/appointments?tab=pending')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1"
          >
            <span>View all pending</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {pendingRequests.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-xl text-slate-500 text-xs">
            No pending booking requests right now. All appointments are up to date!
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {pendingRequests.slice(0, 3).map((req) => (
              <div
                key={req.id}
                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900 text-amber-700 dark:text-amber-300 font-bold flex items-center justify-center text-xs">
                    {req.patientName.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">
                        {req.patientName}
                      </span>
                      <span className="font-mono text-xs text-blue-600 font-bold bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded">
                        {req.bookingCode}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {req.date} at {req.time} ({req.durationMinutes} min) • Reason: {req.visitReason || req.type}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => handleRejectRequest(req.id, req.patientName, e)}
                    className="px-3.5 py-1.5 text-xs font-semibold rounded-xl text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 border border-rose-200 dark:border-rose-900 transition-colors"
                  >
                    Reject
                  </button>
                  <button
                    onClick={(e) => handleAcceptRequest(req.id, req.patientName, e)}
                    className="px-4 py-1.5 text-xs font-semibold rounded-xl text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-xs"
                  >
                    Confirm Booking
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 1: Today's Schedule */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              Today's Schedule
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Hourly chronological consultation appointments and scheduled breaks
            </p>
          </div>
          <button
            onClick={() => navigate('/schedule')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1"
          >
            <span>Full Schedule Page</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-3">
          {timelineEntries.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-xl text-slate-500 text-xs">
              No appointments or scheduled breaks for today.
            </div>
          ) : (
            timelineEntries.map((entry, idx) => {
              if (entry.kind === 'break') {
                const brk = entry.data;
                return (
                  <div
                    key={`brk-${idx}`}
                    className="flex items-center gap-4 p-3.5 rounded-xl bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-xs"
                  >
                    <div className="font-mono font-semibold text-slate-700 dark:text-slate-300 w-28 shrink-0 flex items-center gap-1.5">
                      <Coffee className="w-3.5 h-3.5 text-amber-600" />
                      <span>{brk.startTime} - {brk.endTime}</span>
                    </div>
                    <div className="flex-1 font-medium">{brk.reason}</div>
                    <span className="px-2 py-0.5 rounded-full bg-slate-200/60 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[11px]">
                      Break Time
                    </span>
                  </div>
                );
              }

              const apt = entry.data;
              return (
                <div
                  key={apt.id}
                  onClick={() => navigate(`/appointments/${apt.id}`)}
                  className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-slate-50/70 dark:hover:bg-slate-800/50 cursor-pointer transition-all gap-3"
                >
                  <div className="flex items-center gap-4">
                    <div className="font-mono font-bold text-sm text-slate-900 dark:text-white w-14 shrink-0">
                      {apt.time}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {apt.patientName}
                        </span>
                        <span className="text-xs font-mono font-bold text-blue-600">
                          {apt.bookingCode}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {apt.visitReason || apt.type} • {apt.durationMinutes} min • Phone: {apt.patientPhone}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <StatusBadge status={apt.status} size="sm" />
                    {apt.status === 'in_progress' ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCompleteTarget(apt);
                        }}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-xs transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Complete</span>
                      </button>
                    ) : apt.status === 'confirmed' || apt.status === 'waiting' ? (
                      <button
                        type="button"
                        onClick={(e) => handleStartConsultation(apt, e)}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-xs transition-colors"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Start</span>
                      </button>
                    ) : null}
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

import { today, upcomingDays } from '../../utils/calendar';
import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  Calendar,
  Clock,
  Play,
  CheckCircle2,
  XCircle,
  CalendarClock,
  Phone,
  Eye,
  DollarSign,
  FileText,
  SlidersHorizontal,
} from 'lucide-react';
import { useAppointmentStore } from '../../store/useAppointmentStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useToastStore } from '../../store/useToastStore';
import { StatusBadge } from '../../components/common/StatusBadge';
import { EmptyState } from '../../components/common/EmptyState';
import { RejectAppointmentModal } from '../../components/appointments/RejectAppointmentModal';
import { Appointment } from '../../types';

export const AppointmentsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const {
    appointments,
    startAppointment,
    confirmAppointment,
    setCancelTarget,
    setRescheduleTarget,
    setCompleteTarget,
  } = useAppointmentStore();

  const { profile, user } = useAuthStore();
  const { addToast } = useToastStore();

  // Selected tab from url or state
  const tabParam = searchParams.get('tab') || 'all';
  const [activeTab, setActiveTab] = useState<string>(tabParam);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [rejectTarget, setRejectTarget] = useState<Appointment | null>(null);

  // Sync tab with URL
  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  // Reference today date
  const todayStr = today();

  // Strict doctor isolation
  const currentDoctorId = user?.doctorId || profile?.id || 'doctor_001';
  const doctorAppointments = useMemo(() => {
    return appointments.filter(
      (a) => a.doctorId === currentDoctorId || a.doctorProfileId === currentDoctorId
    );
  }, [appointments, currentDoctorId]);

  // Tab counts
  const tabCounts = useMemo(() => {
    return {
      all: doctorAppointments.length,
      today: doctorAppointments.filter((a) => a.date === todayStr).length,
      upcoming: doctorAppointments.filter((a) => a.date > todayStr && a.status !== 'cancelled' && a.status !== 'rejected').length,
      pending: doctorAppointments.filter((a) => a.status === 'pending' || a.status === 'PENDING').length,
      confirmed: doctorAppointments.filter((a) => a.status === 'confirmed' || a.status === 'CONFIRMED' || a.status === 'waiting').length,
      completed: doctorAppointments.filter((a) => a.status === 'completed' || a.status === 'COMPLETED').length,
      cancelled: doctorAppointments.filter((a) => a.status === 'cancelled' || a.status === 'CANCELLED' || a.status === 'rejected').length,
    };
  }, [doctorAppointments, todayStr]);

  // Filter logic
  const filteredAppointments = useMemo(() => {
    return doctorAppointments.filter((apt) => {
      // Tab filter
      if (activeTab === 'today' && apt.date !== todayStr) return false;
      if (activeTab === 'upcoming' && (apt.date <= todayStr || apt.status === 'cancelled' || apt.status === 'rejected')) return false;
      if (activeTab === 'pending' && apt.status !== 'pending' && apt.status !== 'PENDING') return false;
      if (activeTab === 'confirmed' && apt.status !== 'confirmed' && apt.status !== 'CONFIRMED' && apt.status !== 'waiting' && apt.status !== 'in_progress')
        return false;
      if (activeTab === 'completed' && apt.status !== 'completed' && apt.status !== 'COMPLETED') return false;
      if (activeTab === 'cancelled' && apt.status !== 'cancelled' && apt.status !== 'CANCELLED' && apt.status !== 'rejected') return false;

      // Type filter
      if (selectedType !== 'all' && apt.type !== selectedType) return false;

      // Date filter
      if (selectedDate && apt.date !== selectedDate) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = apt.patientName.toLowerCase().includes(q);
        const matchesCode = apt.bookingCode.toLowerCase().includes(q);
        const matchesPhone = apt.patientPhone.includes(q);
        const matchesReason = (apt.visitReason || '').toLowerCase().includes(q);
        if (!matchesName && !matchesCode && !matchesPhone && !matchesReason) return false;
      }

      return true;
    });
  }, [doctorAppointments, activeTab, selectedType, selectedDate, searchQuery, todayStr]);

  const handleStart = async (id: string, name: string) => {
    await startAppointment(id);
    addToast({
      type: 'info',
      title: 'Consultation Commenced',
      message: `Timer active for ${name}.`,
    });
  };

  const handleConfirm = async (id: string, name: string) => {
    await confirmAppointment(id);
    addToast({
      type: 'success',
      title: 'Booking Confirmed',
      message: `Appointment for ${name} has been confirmed.`,
    });
  };

  // Types list
  const appointmentTypes = Array.from(new Set(doctorAppointments.map((a) => a.type)));

  return (
    <div id="doctor-appointments-page" className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Appointment Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Manage consultations, requests, and schedules for Dr. {profile?.firstName} {profile?.lastName}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900 font-mono">
            {doctorAppointments.length} Total Bookings
          </span>
        </div>
      </div>

      {/* 7 Required Tabs:
          - All appointments
          - Today
          - Upcoming
          - Pending requests
          - Confirmed
          - Completed
          - Cancelled */}
      <div className="border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-px">
          {[
            { id: 'all', label: 'All Appointments', count: tabCounts.all },
            { id: 'today', label: 'Today', count: tabCounts.today },
            { id: 'upcoming', label: 'Upcoming', count: tabCounts.upcoming },
            { id: 'pending', label: 'Pending Requests', count: tabCounts.pending, alert: tabCounts.pending > 0 },
            { id: 'confirmed', label: 'Confirmed', count: tabCounts.confirmed },
            { id: 'completed', label: 'Completed', count: tabCounts.completed },
            { id: 'cancelled', label: 'Cancelled', count: tabCounts.cancelled },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-3 text-xs font-semibold border-b-2 whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                  tab.alert
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 font-bold'
                    : activeTab === tab.id
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm grid grid-cols-1 sm:grid-cols-12 gap-3">
        {/* Search */}
        <div className="sm:col-span-5 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by patient name, phone, booking ID (DN-XXXXX)..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        {/* Type Filter */}
        <div className="sm:col-span-4">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full py-2 px-3 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="all">All Consultation Types</option>
            {appointmentTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        {/* Specific Date Filter */}
        <div className="sm:col-span-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full py-2 px-3 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
          />
        </div>
      </div>

      {/* Appointment Cards / Rows */}
      {filteredAppointments.length === 0 ? (
        <EmptyState
          title="No appointments found"
          description="No appointments match the current filter or search criteria."
          actionLabel="Clear Filters"
          onAction={() => {
            setActiveTab('all');
            setSearchQuery('');
            setSelectedType('all');
            setSelectedDate('');
          }}
        />
      ) : (
        <div className="space-y-3">
          {filteredAppointments.map((apt) => {
            const isToday = apt.date === todayStr;
            const isPending = apt.status === 'pending' || apt.status === 'PENDING';
            const isConfirmed = apt.status === 'confirmed' || apt.status === 'CONFIRMED' || apt.status === 'waiting';
            const isInProgress = apt.status === 'in_progress';
            const isCompleted = apt.status === 'completed' || apt.status === 'COMPLETED';
            const isCancelled = apt.status === 'cancelled' || apt.status === 'CANCELLED' || apt.status === 'rejected';

            const feeFormatted = 'Klinikadan aniqlang';

            return (
              <div
                key={apt.id}
                data-appointment-id={apt.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs hover:border-blue-300 dark:hover:border-blue-800 transition-all space-y-4"
              >
                {/* Top Row: Booking ID, Patient Info, Date/Time, Status, Fee */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left: Patient and Booking ID */}
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="font-mono font-black text-xs px-2.5 py-1 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                        {apt.bookingCode}
                      </span>
                      <StatusBadge status={apt.status} size="sm" />
                      <span className="text-xs text-slate-400 font-mono">
                        ID: {apt.id}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 pt-1">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        {apt.patientName}
                      </h3>
                      <span className="text-xs text-slate-500 flex items-center gap-1 font-mono">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        {apt.patientPhone}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 dark:text-slate-400 flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {apt.type}
                      </span>
                      <span>•</span>
                      <span>Reason: {apt.visitReason}</span>
                    </div>
                  </div>

                  {/* Middle / Right: Date, Time, Duration & Fee */}
                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-6 text-xs">
                    <div className="space-y-0.5">
                      <div className="font-mono font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-blue-600" />
                        {apt.date} {isToday && <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 rounded font-sans">Today</span>}
                      </div>
                      <div className="font-mono text-slate-500 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-emerald-600" />
                        {apt.time} ({apt.durationMinutes} min)
                      </div>
                    </div>

                    <div className="border-l border-slate-200 dark:border-slate-800 pl-6 space-y-0.5">
                      <span className="text-[11px] text-slate-400 block uppercase font-semibold">Consultation Fee</span>
                      <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                        {feeFormatted}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Patient / Clinical Notes snippet if present */}
                {apt.patientNotes && (
                  <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50/70 dark:bg-slate-800/40 p-2.5 rounded-xl italic">
                    <span className="font-semibold not-italic text-slate-700 dark:text-slate-300">Patient Note:</span> "{apt.patientNotes}"
                  </div>
                )}

                {/* Bottom Action Buttons Row */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigate(`/appointments/${apt.id}`)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5 text-blue-600" />
                      <span>View Details</span>
                    </button>

                    {/* Reschedule Button */}
                    {!isCompleted && !isCancelled && (
                      <button
                        onClick={() => setRescheduleTarget(apt)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 rounded-lg transition-colors"
                      >
                        <CalendarClock className="w-3.5 h-3.5" />
                        <span>Reschedule</span>
                      </button>
                    )}

                    {/* Cancel Button */}
                    {!isCompleted && !isCancelled && (
                      <button
                        onClick={() => setCancelTarget(apt)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 rounded-lg transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Cancel</span>
                      </button>
                    )}
                  </div>

                  {/* Primary Status Context Actions */}
                  <div className="flex items-center gap-2">
                    {/* If Pending: Confirm or Reject */}
                    {isPending && (
                      <>
                        <button
                          onClick={() => setRejectTarget(apt)}
                          className="px-3.5 py-1.5 text-xs font-semibold rounded-lg text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 border border-rose-200 dark:border-rose-900 transition-colors"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => handleConfirm(apt.id, apt.patientName)}
                          className="px-4 py-1.5 text-xs font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-xs"
                        >
                          Confirm Booking
                        </button>
                      </>
                    )}

                    {/* If In Progress: Complete visit */}
                    {isInProgress && (
                      <button
                        onClick={() => setCompleteTarget(apt)}
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Complete Visit</span>
                      </button>
                    )}

                    {/* If Today & Confirmed: Start visit */}
                    {isToday && isConfirmed && (
                      <button
                        onClick={() => handleStart(apt.id, apt.patientName)}
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Start Visit</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reject Modal with mandatory reason */}
      <RejectAppointmentModal
        appointment={rejectTarget}
        isOpen={Boolean(rejectTarget)}
        onClose={() => setRejectTarget(null)}
      />
    </div>
  );
};

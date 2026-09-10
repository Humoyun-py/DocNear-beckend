import { create } from 'zustand';
import { Appointment, AppointmentStatus } from '../types';
import { doctorAppointmentService } from '../services/doctorAppointmentService';
import { doctorNotificationService } from '../services/doctorNotificationService';

export interface ActiveConsultation {
  appointmentId: string;
  patientName: string;
  type: string;
  durationMinutes: number;
  scheduledTime: string;
  startedAtTimestamp: number;
  elapsedSeconds: number;
  isRunning: boolean;
}

interface AppointmentState {
  appointments: Appointment[];
  isLoading: boolean;
  selectedAppointmentId: string | null;
  isDrawerOpen: boolean;
  activeConsultation: ActiveConsultation | null;

  // Active modal targets
  cancelTarget: Appointment | null;
  rescheduleTarget: Appointment | null;
  completeTarget: Appointment | null;
  noShowTarget: Appointment | null;

  fetchAppointments: () => Promise<void>;
  setSelectedAppointmentId: (id: string | null) => void;
  setDrawerOpen: (open: boolean) => void;

  setCancelTarget: (apt: Appointment | null) => void;
  setRescheduleTarget: (apt: Appointment | null) => void;
  setCompleteTarget: (apt: Appointment | null) => void;
  setNoShowTarget: (apt: Appointment | null) => void;

  // Actions
  acceptRequest: (id: string) => Promise<void>;
  rejectRequest: (id: string, reason?: string) => Promise<void>;
  confirmAppointment: (id: string) => Promise<void>;
  startAppointment: (id: string) => Promise<void>;
  completeAppointment: (id: string, doctorNote?: string) => Promise<void>;
  cancelAppointment: (id: string, reason: string) => Promise<void>;
  rescheduleAppointment: (id: string, newDate: string, newTime: string, reason?: string) => Promise<void>;
  markNoShow: (id: string) => Promise<void>;
  bookNewAppointment: (booking: Partial<Appointment>) => Promise<Appointment>;
  tickConsultationTimer: () => void;
  fastForwardToEndTime: () => void;
}

export const useAppointmentStore = create<AppointmentState>((set, get) => ({
  appointments: [],
  isLoading: false,
  selectedAppointmentId: null,
  isDrawerOpen: false,
  activeConsultation: null,

  cancelTarget: null,
  rescheduleTarget: null,
  completeTarget: null,
  noShowTarget: null,

  fetchAppointments: async () => {
    set({ isLoading: true });
    try {
      const data = await doctorAppointmentService.getAppointments();
      set({ appointments: data, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  setSelectedAppointmentId: (id) => {
    set({ selectedAppointmentId: id, isDrawerOpen: Boolean(id) });
  },

  setDrawerOpen: (open) => {
    set({ isDrawerOpen: open });
    if (!open) {
      set({ selectedAppointmentId: null });
    }
  },

  setCancelTarget: (apt) => set({ cancelTarget: apt }),
  setRescheduleTarget: (apt) => set({ rescheduleTarget: apt }),
  setCompleteTarget: (apt) => set({ completeTarget: apt }),
  setNoShowTarget: (apt) => set({ noShowTarget: apt }),

  acceptRequest: async (id) => {
    const updated = await doctorAppointmentService.confirmBooking(id);
    set((state) => ({
      appointments: state.appointments.map((a) => (a.id === id || a.bookingCode === id ? updated : a)),
    }));
    await doctorNotificationService.notifyBookingStatusChange(
      updated.bookingCode,
      updated.patientName,
      'CONFIRMED',
      'Slot reserved on clinical calendar'
    );
  },

  rejectRequest: async (id, reason) => {
    const mandatoryReason = reason || 'Doctor unavailable during this time slot';
    const updated = await doctorAppointmentService.rejectBooking(id, mandatoryReason);
    set((state) => ({
      appointments: state.appointments.map((a) => (a.id === id || a.bookingCode === id ? updated : a)),
    }));
    await doctorNotificationService.notifyBookingStatusChange(
      updated.bookingCode,
      updated.patientName,
      'CANCELLED',
      mandatoryReason
    );
  },

  confirmAppointment: async (id) => {
    const updated = await doctorAppointmentService.confirmBooking(id);
    set((state) => ({
      appointments: state.appointments.map((a) => (a.id === id || a.bookingCode === id ? updated : a)),
    }));
    await doctorNotificationService.notifyBookingStatusChange(
      updated.bookingCode,
      updated.patientName,
      'CONFIRMED'
    );
  },

  startAppointment: async (id) => {
    const apt = get().appointments.find((a) => a.id === id || a.bookingCode === id);
    const updated = await doctorAppointmentService.startAppointment(id);
    const now = Date.now();

    set((state) => ({
      appointments: state.appointments.map((a) => (a.id === id || a.bookingCode === id ? updated : a)),
      activeConsultation: {
        appointmentId: id,
        patientName: apt?.patientName || 'Patient',
        type: apt?.type || 'Consultation',
        durationMinutes: apt?.durationMinutes || 30,
        scheduledTime: apt?.time || '09:00',
        startedAtTimestamp: now,
        elapsedSeconds: 0,
        isRunning: true,
      },
    }));
  },

  completeAppointment: async (id, doctorNote) => {
    const updated = await doctorAppointmentService.completeAppointment(id, doctorNote);
    set((state) => ({
      appointments: state.appointments.map((a) => (a.id === id || a.bookingCode === id ? updated : a)),
      activeConsultation: state.activeConsultation?.appointmentId === id ? null : state.activeConsultation,
      completeTarget: null,
    }));
    await doctorNotificationService.notifyBookingStatusChange(
      updated.bookingCode,
      updated.patientName,
      'COMPLETED',
      'Clinical summary recorded'
    );
  },

  cancelAppointment: async (id, reason) => {
    const mandatoryReason = reason || 'Cancelled by provider';
    const updated = await doctorAppointmentService.cancelAppointment(id, mandatoryReason);
    set((state) => ({
      appointments: state.appointments.map((a) => (a.id === id || a.bookingCode === id ? updated : a)),
      activeConsultation: state.activeConsultation?.appointmentId === id ? null : state.activeConsultation,
      cancelTarget: null,
    }));
    await doctorNotificationService.notifyBookingStatusChange(
      updated.bookingCode,
      updated.patientName,
      'CANCELLED',
      mandatoryReason
    );
  },

  rescheduleAppointment: async (id, newDate, newTime, reason) => {
    const updated = await doctorAppointmentService.rescheduleAppointment(id, newDate, newTime, reason);
    set((state) => ({
      appointments: state.appointments.map((a) => (a.id === id || a.bookingCode === id ? updated : a)),
      rescheduleTarget: null,
    }));
    await doctorNotificationService.notifyBookingStatusChange(
      updated.bookingCode,
      updated.patientName,
      'RESCHEDULED',
      `Moved to ${newDate} at ${newTime}`
    );
  },

  markNoShow: async (id) => {
    const updated = await doctorAppointmentService.markNoShow(id);
    set(state=>({appointments:state.appointments.map(a=>a.id===id?updated:a),noShowTarget:null}));
  },

  bookNewAppointment: async (booking) => {
    const newApt = await doctorAppointmentService.createBooking(booking);
    set((state) => ({
      appointments: [newApt, ...state.appointments],
    }));
    await doctorNotificationService.addNotification({
      title: 'New Booking Request',
      message: `New booking request ${newApt.bookingCode} received from ${newApt.patientName} for ${newApt.date} at ${newApt.time}.`,
      category: 'booking_request',
      appointmentId: newApt.id,
    });
    return newApt;
  },

  tickConsultationTimer: () => {
    const current = get().activeConsultation;
    if (current && current.isRunning) {
      const elapsed = Math.floor((Date.now() - current.startedAtTimestamp) / 1000);
      set({
        activeConsultation: {
          ...current,
          elapsedSeconds: elapsed,
        },
      });
    }
  },

  fastForwardToEndTime: () => {
    const current = get().activeConsultation;
    if (current && current.isRunning) {
      const targetSeconds = (current.durationMinutes || 30) * 60;
      set({
        activeConsultation: {
          ...current,
          startedAtTimestamp: Date.now() - targetSeconds * 1000,
          elapsedSeconds: targetSeconds,
        },
      });
    }
  },
}));

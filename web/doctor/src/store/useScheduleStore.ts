import { create } from 'zustand';
import { DayWorkingHours, BlockedTimeSlot, AppointmentSettings, Appointment } from '../types';
import { scheduleService } from '../services/scheduleService';

interface ScheduleConflict {
  hasConflict: boolean;
  affectedAppointment?: Appointment;
  message?: string;
}

interface ScheduleState {
  workingHours: DayWorkingHours[];
  blockedSlots: BlockedTimeSlot[];
  settings: AppointmentSettings;
  isLoading: boolean;
  conflictModalData: {
    isOpen: boolean;
    slotData?: Omit<BlockedTimeSlot, 'id'>;
    affectedAppointment?: Appointment;
  };

  fetchScheduleData: () => Promise<void>;
  updateWorkingHours: (hours: DayWorkingHours[]) => Promise<void>;
  addBlockedSlot: (slot: Omit<BlockedTimeSlot, 'id'>, existingAppointments?: Appointment[]) => Promise<boolean>;
  forceAddBlockedSlot: (slot: Omit<BlockedTimeSlot, 'id'>) => Promise<void>;
  closeConflictModal: () => void;
  removeBlockedSlot: (id: string) => Promise<void>;
  updateSettings: (newSettings: Partial<AppointmentSettings>) => Promise<void>;
  toggleAvailability: () => Promise<void>;
  checkConflict: (
    date: string,
    startTime: string,
    endTime: string,
    existingAppointments: Appointment[]
  ) => ScheduleConflict;
}

export const useScheduleStore = create<ScheduleState>((set, get) => ({
  workingHours: [],
  blockedSlots: [],
  settings: {defaultDurationMinutes:30,bufferMinutes:0,maxAppointmentsPerDay:0,maxConsecutiveAppointments:0,isAcceptingNewBookings:false},
  isLoading: false,
  conflictModalData: {
    isOpen: false,
  },

  fetchScheduleData: async () => {
    set({ isLoading: true });
    try {
      const [hours, slots, settings] = await Promise.all([
        scheduleService.getWorkingHours(),
        scheduleService.getBlockedSlots(),
        scheduleService.getSettings(),
      ]);
      set({
        workingHours: hours,
        blockedSlots: slots,
        settings,
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
    }
  },

  updateWorkingHours: async (hours) => {
    const updated = await scheduleService.updateWorkingHours(hours);
    set({ workingHours: updated });
  },

  checkConflict: (date, startTime, endTime, existingAppointments) => {
    // Check if any non-cancelled appointment falls inside [startTime, endTime] on that date
    const startMins = timeToMinutes(startTime);
    const endMins = timeToMinutes(endTime);

    const affected = existingAppointments.find((apt) => {
      if (apt.date !== date || apt.status === 'cancelled' || apt.status === 'rejected') {
        return false;
      }
      const aptStart = timeToMinutes(apt.time);
      const aptEnd = aptStart + apt.durationMinutes;
      // Overlap condition: start < aptEnd && end > aptStart
      return startMins < aptEnd && endMins > aptStart;
    });

    if (affected) {
      return {
        hasConflict: true,
        affectedAppointment: affected,
        message: `Schedule conflict with ${affected.patientName} (${affected.time} - ${affected.type})`,
      };
    }

    return { hasConflict: false };
  },

  addBlockedSlot: async (slot, existingAppointments = []) => {
    const conflict = get().checkConflict(slot.date, slot.startTime, slot.endTime, existingAppointments);
    if (conflict.hasConflict && conflict.affectedAppointment) {
      set({
        conflictModalData: {
          isOpen: true,
          slotData: slot,
          affectedAppointment: conflict.affectedAppointment,
        },
      });
      return false; // Prevent silent overwrite
    }

    const newSlot = await scheduleService.addBlockedSlot(slot);
    set((state) => ({
      blockedSlots: [...state.blockedSlots, newSlot],
    }));
    return true;
  },

  forceAddBlockedSlot: async (slot) => {
    const newSlot = await scheduleService.addBlockedSlot(slot);
    set((state) => ({
      blockedSlots: [...state.blockedSlots, newSlot],
      conflictModalData: { isOpen: false },
    }));
  },

  closeConflictModal: () => {
    set({ conflictModalData: { isOpen: false } });
  },

  removeBlockedSlot: async (id) => {
    await scheduleService.removeBlockedSlot(id);
    set((state) => ({
      blockedSlots: state.blockedSlots.filter((s) => s.id !== id),
    }));
  },

  updateSettings: async (newSettings) => {
    const updated = await scheduleService.updateSettings(newSettings);
    set({ settings: updated });
  },

  toggleAvailability: async () => {
    const current = get().settings.isAcceptingNewBookings;
    const updated = await scheduleService.updateSettings({
      isAcceptingNewBookings: !current,
    });
    set({ settings: updated });
  },
}));

function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
}

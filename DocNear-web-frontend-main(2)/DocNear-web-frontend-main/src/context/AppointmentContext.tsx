import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Appointment, Clinic, Doctor } from '../types';
import { bookingService } from '../services/bookingService';
import { notificationService } from '../services/notificationService';
import { useAuth } from './AuthContext';
import confetti from 'canvas-confetti';

interface BookingModalState {
  isOpen: boolean;
  rescheduleId?: string;
  preselectedClinic?: Clinic | null;
  preselectedDoctor?: Doctor | null;
  preselectedDate?: string | null;
  preselectedTime?: string | null;
}

export interface ToastInfo {
  id: string;
  type: 'success' | 'info' | 'error' | 'reminder' | 'booking';
  title?: string;
  message: string;
  appointmentId?: string;
  link?: string;
  time?: string;
  reminderBadge?: string;
}

interface AppointmentContextType {
  appointments: Appointment[];
  isLoading: boolean;
  bookingModal: BookingModalState;
  toasts: ToastInfo[];
  openBookingModal: (options?: {
    clinic?: Clinic | null;
    doctor?: Doctor | null;
    date?: string | null;
    time?: string | null;
    rescheduleId?: string;
  }) => void;
  closeBookingModal: () => void;
  bookAppointment: (bookingData: {
    clinicId: string;
    clinicName: string;
    clinicAddress: string;
    clinicPhone: string;
    clinicImage: string;
    doctorId: string;
    doctorName: string;
    doctorSpecialty: string;
    doctorPhoto: string;
    patientName: string;
    patientPhone: string;
    patientEmail?: string;
    notes?: string;
    date: string;
    time: string;
    price: string;
    visitReason?: string;
  }) => Promise<Appointment>;
  cancelAppointment: (id: string, reason?: string) => Promise<boolean>;
  rescheduleAppointment: (id: string, newDate: string, newTime: string) => Promise<Appointment | null>;
  showToast: (
    message: string,
    type?: 'success' | 'info' | 'error' | 'reminder' | 'booking',
    title?: string,
    extra?: { appointmentId?: string; link?: string; time?: string; reminderBadge?: string }
  ) => void;
  showUpcomingReminderToast: (appointment?: Appointment) => void;
  trigger24HourReminder: (appointment?: Appointment) => void;
  trigger1HourReminder: (appointment?: Appointment) => void;
  dismissToast: (id: string) => void;
}

const AppointmentContext = createContext<AppointmentContextType | undefined>(undefined);

export const AppointmentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [toasts, setToasts] = useState<ToastInfo[]>([]);
  const [bookingModal, setBookingModal] = useState<BookingModalState>({
    isOpen: false,
    preselectedClinic: null,
    preselectedDoctor: null,
    preselectedDate: null,
    preselectedTime: null,
  });

  const loadAppointments = async () => {
    if (!isAuthenticated) { setAppointments([]); setIsLoading(false); return; }
    setIsLoading(true);
    try {
      const data = await bookingService.getMyAppointments();
      if (user && user.phone) {
        const userBookings = data.filter(
          (a) => !a.patientPhone || a.patientPhone.replace(/\D/g, '') === user.phone.replace(/\D/g, '')
        );
        setAppointments(userBookings.length > 0 ? userBookings : data);
      } else {
        setAppointments(data);
      }
    } catch (err) {
      console.error('Failed to load appointments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
    if (!isAuthenticated) return;
    const timer = setInterval(loadAppointments, 30000);
    return () => clearInterval(timer);
  }, [isAuthenticated, user?.id]);

  const showToast = (
    message: string,
    type: 'success' | 'info' | 'error' | 'reminder' | 'booking' = 'success',
    title?: string,
    extra?: { appointmentId?: string; link?: string; time?: string; reminderBadge?: string }
  ) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    setToasts((prev) => [...prev, { id, type, title, message, ...extra }]);
    setTimeout(() => {
      dismissToast(id);
    }, 7000);
  };

  const trigger24HourReminder = (targetApt?: Appointment) => {
    const apt = targetApt || appointments.find((a) => a.status === 'Confirmed' || a.status === 'Pending') || appointments[0];
    if (apt) {
      showToast(
        `24-Hour Reminder: Your appointment with ${apt.doctorName} (${apt.doctorSpecialty}) at ${apt.clinicName} is scheduled for tomorrow at ${apt.time}. Code: ${apt.bookingCode}`,
        'reminder',
        '24-Hour Pre-Appointment Reminder',
        { appointmentId: apt.id, link: '/appointments', time: `${apt.date} • ${apt.time}`, reminderBadge: '24h Notice' }
      );
    } else {
      showToast('No active appointments found to send 24-hour reminder for.', 'info', '24h Reminder');
    }
  };

  const trigger1HourReminder = (targetApt?: Appointment) => {
    const apt = targetApt || appointments.find((a) => a.status === 'Confirmed' || a.status === 'Pending') || appointments[0];
    if (apt) {
      showToast(
        `Urgent 1-Hour Alert: Your appointment with ${apt.doctorName} at ${apt.clinicName} starts in 1 hour (${apt.time}). Please arrive 10 minutes early with your ID. Code: ${apt.bookingCode}`,
        'reminder',
        '1-Hour Pre-Appointment Alert',
        { appointmentId: apt.id, link: '/appointments', time: `Starting in 1 hour • ${apt.time}`, reminderBadge: '1h Alert' }
      );
    } else {
      showToast('No active appointments found to send 1-hour reminder for.', 'info', '1h Reminder');
    }
  };

  const showUpcomingReminderToast = (targetApt?: Appointment) => {
    trigger24HourReminder(targetApt);
  };

  // Automated background reminder checker
  useEffect(() => {
    if (appointments.length === 0) return;

    const checkReminders = () => {
      const now = new Date();
      appointments.forEach((apt) => {
        if (apt.status !== 'Confirmed' && apt.status !== 'Pending') return;
        
        try {
          const [hours, mins] = (apt.time || '10:00').split(':').map(Number);
          const aptDate = new Date(apt.date || '2026-08-26');
          aptDate.setHours(hours || 10, mins || 0, 0, 0);

          const diffMs = aptDate.getTime() - now.getTime();
          const diffHours = diffMs / (1000 * 60 * 60);

          const key24h = `reminder_24h_sent_${apt.id}`;
          const key1h = `reminder_1h_sent_${apt.id}`;

          // If appointment is between 20h and 26h away, send 24h reminder
          if (diffHours > 0 && diffHours <= 26 && diffHours >= 20) {
            if (!sessionStorage.getItem(key24h)) {
              sessionStorage.setItem(key24h, 'true');
              trigger24HourReminder(apt);
            }
          }

          // If appointment is between 0.2h and 1.5h away, send 1h reminder
          if (diffHours > 0 && diffHours <= 1.5) {
            if (!sessionStorage.getItem(key1h)) {
              sessionStorage.setItem(key1h, 'true');
              trigger1HourReminder(apt);
            }
          }
        } catch {
          // ignore parsing error
        }
      });
    };

    // Initial check
    checkReminders();
    const interval = setInterval(checkReminders, 30000);
    return () => clearInterval(interval);
  }, [appointments]);

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const openBookingModal = (options?: {
    clinic?: Clinic | null;
    doctor?: Doctor | null;
    date?: string | null;
    time?: string | null;
    rescheduleId?: string;
  }) => {
    // If user is not logged in, redirect directly to /login page
    if (!isAuthenticated || !user) {
      showToast('Shifokor qabulini band qilish uchun iltimos, avval tizimga kiring.', 'info', 'Tizimga kirish talab etiladi');
      navigate('/login', { state: { returnToBooking: options } });
      return;
    }

    setBookingModal({
      isOpen: true,
      rescheduleId: options?.rescheduleId,
      preselectedClinic: options?.clinic || null,
      preselectedDoctor: options?.doctor || null,
      preselectedDate: options?.date || null,
      preselectedTime: options?.time || null,
    });
  };

  const closeBookingModal = () => {
    setBookingModal({
      isOpen: false,
      preselectedClinic: null,
      preselectedDoctor: null,
      preselectedDate: null,
      preselectedTime: null,
    });
  };

  const bookAppointment = async (bookingData: {
    clinicId: string;
    clinicName: string;
    clinicAddress: string;
    clinicPhone: string;
    clinicImage: string;
    doctorId: string;
    doctorName: string;
    doctorSpecialty: string;
    doctorPhoto: string;
    patientName: string;
    patientPhone: string;
    patientEmail?: string;
    notes?: string;
    date: string;
    time: string;
    price: string;
    visitReason?: string;
  }): Promise<Appointment> => {
    const newAppointment = await bookingService.createBooking(bookingData);
    setAppointments((prev) => [newAppointment, ...prev]);

    // Push notification
    notificationService.addNotification({
      type: 'booking_confirmed',
      title: 'Appointment Booked Successfully',
      message: `Your booking with ${newAppointment.doctorName} on ${newAppointment.date} at ${newAppointment.time} has been confirmed.`,
      appointmentId: newAppointment.id,
      link: '/appointments',
    });

    // Trigger celebratory confetti
    try {
      confetti({
        particleCount: 75,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#2563eb', '#10b981', '#38bdf8', '#6366f1'],
      });
    } catch {
      // ignore
    }

    showToast(`Appointment booked successfully! ID: ${newAppointment.bookingCode}`, 'success');
    return newAppointment;
  };

  const cancelAppointment = async (id: string, reason?: string): Promise<boolean> => {
    const success = await bookingService.cancelAppointment(id, reason);
    if (success) {
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: 'Cancelled' } : a))
      );
      notificationService.addNotification({
        type: 'booking_cancelled',
        title: 'Appointment Cancelled',
        message: 'Your appointment has been cancelled.',
        appointmentId: id,
        link: '/appointments',
      });
      showToast('Appointment has been cancelled', 'info');
    }
    return success;
  };

  const rescheduleAppointment = async (
    id: string,
    newDate: string,
    newTime: string
  ): Promise<Appointment | null> => {
    const updated = await bookingService.rescheduleAppointment(id, newDate, newTime);
    if (updated) {
      setAppointments((prev) => prev.map((a) => (a.id === id ? updated : a)));
      showToast(`Appointment rescheduled to ${newDate} at ${newTime}`, 'success');
    }
    return updated;
  };

  return (
    <AppointmentContext.Provider
      value={{
        appointments,
        isLoading,
        bookingModal,
        toasts,
        openBookingModal,
        closeBookingModal,
        bookAppointment,
        cancelAppointment,
        rescheduleAppointment,
        showToast,
        showUpcomingReminderToast,
        trigger24HourReminder,
        trigger1HourReminder,
        dismissToast,
      }}
    >
      {children}
    </AppointmentContext.Provider>
  );
};

export const useAppointments = (): AppointmentContextType => {
  const context = useContext(AppointmentContext);
  if (!context) {
    throw new Error('useAppointments must be used within an AppointmentProvider');
  }
  return context;
};

import { Appointment } from '../types';

export interface CalendarEventData {
  title: string;
  doctorName: string;
  doctorSpecialty?: string;
  clinicName: string;
  clinicAddress: string;
  clinicPhone?: string;
  date: string; // e.g. "2026-08-25" or "2026-08-26"
  time: string; // e.g. "09:30" or "14:00"
  bookingCode?: string;
  patientName?: string;
  reason?: string;
}

/**
 * Parses appointment date and time into start and end Date objects
 */
function parseAppointmentDateTime(dateStr: string, timeStr: string): { start: Date; end: Date } {
  const now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth();
  let day = now.getDate();

  // Try parsing YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const parts = dateStr.split('-').map(Number);
    year = parts[0];
    month = parts[1] - 1;
    day = parts[2];
  } else {
    // Try to match date
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      year = parsed.getFullYear();
      month = parsed.getMonth();
      day = parsed.getDate();
    }
  }

  // Parse HH:MM
  let hours = 10;
  let minutes = 0;
  if (timeStr) {
    const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})/);
    if (timeMatch) {
      hours = parseInt(timeMatch[1], 10);
      minutes = parseInt(timeMatch[2], 10);
    }
  }

  const startDate = new Date(year, month, day, hours, minutes, 0);
  // Default appointment duration is 45 minutes
  const endDate = new Date(startDate.getTime() + 45 * 60 * 1000);

  return { start: startDate, end: endDate };
}

/**
 * Formats a Date object to iCalendar ISO 8601 string (e.g. 20260825T143000Z or local)
 */
function formatToICSDate(date: Date): string {
  const pad = (n: number) => (n < 10 ? '0' + n : n);
  const year = date.getUTCFullYear();
  const month = pad(date.getUTCMonth() + 1);
  const day = pad(date.getUTCDate());
  const hours = pad(date.getUTCHours());
  const minutes = pad(date.getUTCMinutes());
  const seconds = pad(date.getUTCSeconds());
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

/**
 * Generate Google Calendar Web URL for one-click add
 */
export function getGoogleCalendarUrl(data: CalendarEventData | Appointment): string {
  const doctorName = 'doctorName' in data ? data.doctorName : '';
  const clinicName = 'clinicName' in data ? data.clinicName : '';
  const clinicAddress = 'clinicAddress' in data ? data.clinicAddress : '';
  const date = data.date;
  const time = data.time;
  const bookingCode = 'bookingCode' in data ? data.bookingCode : '';
  const patientName = 'patientName' in data ? data.patientName : '';
  const clinicPhone = 'clinicPhone' in data ? data.clinicPhone : '';

  const { start, end } = parseAppointmentDateTime(date, time);
  const dates = `${formatToICSDate(start)}/${formatToICSDate(end)}`;

  const title = `DocNear: ${doctorName} - ${clinicName}`;
  const details = [
    `Medical Consultation Appointment`,
    `Doctor: ${doctorName}`,
    `Clinic: ${clinicName}`,
    clinicAddress ? `Location: ${clinicAddress}` : '',
    clinicPhone ? `Phone: ${clinicPhone}` : '',
    bookingCode ? `Booking Code: ${bookingCode}` : '',
    patientName ? `Patient: ${patientName}` : '',
    `Booked via DocNear Healthcare Platform`,
  ]
    .filter(Boolean)
    .join('\n');

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: dates,
    details: details,
    location: clinicAddress || clinicName,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Generate and trigger download of .ics (iCalendar) file
 * Compatible with Apple Calendar, Microsoft Outlook, iOS, Android, macOS
 */
export function downloadICalendarFile(data: CalendarEventData | Appointment): void {
  const doctorName = 'doctorName' in data ? data.doctorName : 'Doctor';
  const clinicName = 'clinicName' in data ? data.clinicName : 'Clinic';
  const clinicAddress = 'clinicAddress' in data ? data.clinicAddress : '';
  const clinicPhone = 'clinicPhone' in data ? data.clinicPhone : '';
  const date = data.date;
  const time = data.time;
  const bookingCode = ('bookingCode' in data && data.bookingCode) ? data.bookingCode : `DOC-${Date.now()}`;
  const patientName = 'patientName' in data ? data.patientName : '';

  const { start, end } = parseAppointmentDateTime(date, time);
  const startStr = formatToICSDate(start);
  const endStr = formatToICSDate(end);
  const nowStr = formatToICSDate(new Date());

  const summary = `DocNear: ${doctorName} (${clinicName})`;
  const description = `Doctor Appointment with ${doctorName}\\nClinic: ${clinicName}\\nAddress: ${clinicAddress}\\nPhone: ${clinicPhone}\\nPatient: ${patientName}\\nBooking ID: ${bookingCode}\\nBooked via DocNear.`;

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//DocNear Healthcare//Doctor Booking//UZ',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${bookingCode}@docnear.uz`,
    `DTSTAMP:${nowStr}`,
    `DTSTART:${startStr}`,
    `DTEND:${endStr}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${clinicAddress || clinicName}`,
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'TRIGGER:-PT1H',
    'ACTION:DISPLAY',
    `DESCRIPTION:Reminder: Appointment with ${doctorName} in 1 hour`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `appointment-${bookingCode}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

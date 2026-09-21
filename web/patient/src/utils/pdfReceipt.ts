import { jsPDF } from 'jspdf';
import { Appointment } from '../types';

export function generateAppointmentReceiptPDF(appointment: Appointment): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const primaryColor: [number, number, number] = [26, 86, 219]; // #1A56DB Royal Blue
  const darkTextColor: [number, number, number] = [15, 23, 42]; // #0F172A Slate 900
  const mutedTextColor: [number, number, number] = [100, 116, 139]; // #64748B Slate 500
  const lightBg: [number, number, number] = [248, 250, 252]; // #F8FAFC
  const emeraldColor: [number, number, number] = [16, 185, 129]; // #10B981 Emerald 500

  // 1. Header Banner
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('DocNear Healthcare Network', 15, 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Official Appointment Receipt & Booking Confirmation', 15, 21);

  // Status Pill in Header
  doc.setFillColor(...emeraldColor);
  doc.roundedRect(145, 8, 50, 11, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(`STATUS: ${appointment.status.toUpperCase()}`, 148, 15);

  // 2. Receipt Meta Box
  let y = 38;
  doc.setFillColor(...lightBg);
  doc.roundedRect(15, y, 180, 22, 3, 3, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(15, y, 180, 22, 3, 3, 'S');

  doc.setTextColor(...darkTextColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Booking Ref:', 22, y + 8);
  doc.setTextColor(...primaryColor);
  doc.text(appointment.bookingCode || `DOC-${appointment.id.slice(0, 6).toUpperCase()}`, 48, y + 8);

  doc.setTextColor(...darkTextColor);
  doc.text('Issue Date:', 115, y + 8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...mutedTextColor);
  doc.text(new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }), 140, y + 8);

  doc.setTextColor(...darkTextColor);
  doc.setFont('helvetica', 'bold');
  doc.text('Appointment Date & Time:', 22, y + 16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...emeraldColor);
  doc.text(`${appointment.date}  at  ${appointment.time}`, 70, y + 16);

  // 3. Two-Column Details: Doctor & Clinic | Patient Details
  y = 68;

  // Left Column - Doctor & Clinic Info
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(15, y, 87, 68, 2, 2, 'S');

  doc.setFillColor(239, 246, 255);
  doc.rect(15.5, y + 0.5, 86, 9, 'F');
  doc.setTextColor(...primaryColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Healthcare Provider', 20, y + 6.5);

  doc.setTextColor(...darkTextColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(appointment.doctorName, 20, y + 17);

  doc.setTextColor(...primaryColor);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(appointment.doctorSpecialty, 20, y + 23);

  doc.setTextColor(...darkTextColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('Clinic Facility:', 20, y + 33);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...mutedTextColor);
  doc.text(appointment.clinicName, 20, y + 38, { maxWidth: 77 });

  doc.setTextColor(...darkTextColor);
  doc.setFont('helvetica', 'bold');
  doc.text('Address:', 20, y + 48);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...mutedTextColor);
  doc.text(appointment.clinicAddress, 20, y + 53, { maxWidth: 77 });

  doc.setTextColor(...darkTextColor);
  doc.setFont('helvetica', 'bold');
  doc.text('Phone:', 20, y + 62);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...mutedTextColor);
  doc.text(appointment.clinicPhone, 34, y + 62);

  // Right Column - Patient Details
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(108, y, 87, 68, 2, 2, 'S');

  doc.setFillColor(239, 246, 255);
  doc.rect(108.5, y + 0.5, 86, 9, 'F');
  doc.setTextColor(...primaryColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Patient & Visit Information', 113, y + 6.5);

  doc.setTextColor(...darkTextColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(appointment.patientName, 113, y + 17);

  doc.setTextColor(...darkTextColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Contact Phone:', 113, y + 26);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...mutedTextColor);
  doc.text(appointment.patientPhone, 142, y + 26);

  if (appointment.patientEmail) {
    doc.setTextColor(...darkTextColor);
    doc.setFont('helvetica', 'bold');
    doc.text('Email:', 113, y + 33);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...mutedTextColor);
    doc.text(appointment.patientEmail, 126, y + 33);
  }

  doc.setTextColor(...darkTextColor);
  doc.setFont('helvetica', 'bold');
  doc.text('Reason for Visit:', 113, y + 42);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...mutedTextColor);
  doc.text(appointment.visitReason || 'General Medical Consultation', 113, y + 48, { maxWidth: 77 });

  if (appointment.notes) {
    doc.setTextColor(...darkTextColor);
    doc.setFont('helvetica', 'bold');
    doc.text('Patient Notes:', 113, y + 57);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(...mutedTextColor);
    doc.text(appointment.notes, 113, y + 62, { maxWidth: 77 });
  }

  // 4. Financial & Payment Summary Table
  y = 145;
  doc.setFillColor(...lightBg);
  doc.roundedRect(15, y, 180, 52, 3, 3, 'F');
  doc.roundedRect(15, y, 180, 52, 3, 3, 'S');

  doc.setTextColor(...primaryColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text('Financial & Payment Summary', 22, y + 8);

  // Table header line
  doc.setDrawColor(203, 213, 225);
  doc.line(22, y + 12, 187, y + 12);

  doc.setTextColor(...darkTextColor);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Standard Specialist Consultation Fee:', 22, y + 19);
  doc.setFont('helvetica', 'bold');
  doc.text(appointment.price, 185, y + 19, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.text('Online Network Booking & Reservation Service:', 22, y + 27);
  doc.setTextColor(...emeraldColor);
  doc.setFont('helvetica', 'bold');
  doc.text('FREE (Included)', 185, y + 27, { align: 'right' });

  doc.setDrawColor(203, 213, 225);
  doc.line(22, y + 33, 187, y + 33);

  doc.setTextColor(...darkTextColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Total Estimated Fee:', 22, y + 42);
  doc.setTextColor(...primaryColor);
  doc.setFontSize(12);
  doc.text(appointment.price, 185, y + 42, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...mutedTextColor);
  doc.text('* Payment is settled directly at the clinic reception upon arrival.', 22, y + 48);

  // 5. Patient Instructions & Important Notice
  y = 205;
  doc.setFillColor(254, 242, 242); // light rose/amber
  doc.roundedRect(15, y, 180, 36, 2, 2, 'F');
  doc.setDrawColor(254, 202, 202);
  doc.roundedRect(15, y, 180, 36, 2, 2, 'S');

  doc.setTextColor(185, 28, 28);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('Important Patient Guidelines & Check-in', 22, y + 7);

  doc.setTextColor(...darkTextColor);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('1. Please arrive at the clinic reception 10 - 15 minutes before your scheduled time slot.', 22, y + 14);
  doc.text('2. Present this official PDF receipt or your booking reference code to the registrar.', 22, y + 20);
  doc.text('3. Bring your valid national identification card / passport and relevant medical records.', 22, y + 26);
  doc.text('4. If you need to reschedule or have urgent symptoms, please contact the clinic hotline directly.', 22, y + 32);

  // 6. Security Footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...mutedTextColor);
  doc.text('DocNear Healthcare Verification System • Powered by Partner Medical Accreditations', 105, 280, { align: 'center' });
  doc.text(`Generated on ${new Date().toISOString()} • Ref: ${appointment.id}`, 105, 285, { align: 'center' });

  // Save the PDF
  const filename = `DocNear_Appointment_${appointment.bookingCode || appointment.id.slice(0, 8)}.pdf`;
  doc.save(filename);
}

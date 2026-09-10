import React, { useState, useRef, useEffect } from 'react';
import { Appointment } from '../../types';
import { getGoogleCalendarUrl, downloadICalendarFile } from '../../utils/calendarExport';
import { useLanguage } from '../../context/LanguageContext';
import {
  CalendarPlus,
  Download,
  Calendar,
  ExternalLink,
  ChevronDown,
  Check,
  Sparkles,
} from 'lucide-react';

interface ExportCalendarMenuProps {
  appointment: Appointment;
  onToast?: (message: string, type: 'success' | 'info' | 'error', title?: string) => void;
  className?: string;
}

export const ExportCalendarMenu: React.FC<ExportCalendarMenuProps> = ({
  appointment,
  onToast,
  className = '',
}) => {
  const { language, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleDownloadICS = () => {
    downloadICalendarFile({
      title: `DocNear: ${appointment.doctorName} - ${appointment.clinicName}`,
      doctorName: appointment.doctorName,
      doctorSpecialty: appointment.doctorSpecialty,
      clinicName: appointment.clinicName,
      clinicAddress: appointment.clinicAddress,
      clinicPhone: appointment.clinicPhone,
      date: appointment.date,
      time: appointment.time,
      bookingCode: appointment.bookingCode,
      patientName: appointment.patientName,
    });
    setIsOpen(false);
    if (onToast) {
      onToast(
        language === 'uz'
          ? 'iCal (.ics) fayli muvaffaqiyatli yuklab olindi!'
          : language === 'ru'
          ? 'Файл календаря (.ics) успешно сохранён!'
          : '.ics calendar file downloaded successfully!',
        'success',
        language === 'uz' ? 'Taqvimga eksport' : language === 'ru' ? 'Экспорт в календарь' : 'Calendar Export'
      );
    }
  };

  const handleCopySummary = () => {
    const summaryText = `DocNear Appointment:\nDoctor: ${appointment.doctorName} (${appointment.doctorSpecialty})\nClinic: ${appointment.clinicName}\nDate: ${appointment.date} at ${appointment.time}\nAddress: ${appointment.clinicAddress}\nBooking ID: ${appointment.bookingCode}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(summaryText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
      if (onToast) {
        onToast(
          language === 'uz' ? 'Qabul ma’lumotlari nusxalandi!' : language === 'ru' ? 'Данные визита скопированы!' : 'Appointment details copied!',
          'info'
        );
      }
    }
    setIsOpen(false);
  };

  const googleUrl = getGoogleCalendarUrl({
    title: `DocNear: ${appointment.doctorName} - ${appointment.clinicName}`,
    doctorName: appointment.doctorName,
    doctorSpecialty: appointment.doctorSpecialty,
    clinicName: appointment.clinicName,
    clinicAddress: appointment.clinicAddress,
    clinicPhone: appointment.clinicPhone,
    date: appointment.date,
    time: appointment.time,
    bookingCode: appointment.bookingCode,
    patientName: appointment.patientName,
  });

  return (
    <div className={`relative inline-flex items-center gap-1 ${className}`} ref={menuRef}>
      {/* Primary 1-Click .ICS Download Button */}
      <button
        type="button"
        onClick={handleDownloadICS}
        className="px-3 py-1.5 rounded-l-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold border border-blue-200 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
        title="Download .ics for Apple Calendar, Outlook, Mobile"
      >
        <Download size={13} className="text-blue-600" />
        <span>
          {language === 'uz'
            ? 'Taqvimga saqlash (.ics)'
            : language === 'ru'
            ? 'Экспорт в календарь (.ics)'
            : 'Export to Calendar (.ics)'}
        </span>
      </button>

      {/* Dropdown Options Toggle */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="px-2 py-1.5 rounded-r-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold border-y border-r border-blue-200 transition-all cursor-pointer"
        aria-label="More calendar options"
      >
        <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1.5 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-2 z-30 space-y-1 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-1 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            {language === 'uz' ? 'Qabulni taqvimga qo‘shish' : language === 'ru' ? 'Добавить в календарь' : 'Add to Calendar'}
          </div>

          {/* 1. Apple Calendar / Outlook (.ics file) */}
          <button
            type="button"
            onClick={handleDownloadICS}
            className="w-full px-3 py-2 rounded-xl text-left text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-700 dark:hover:text-blue-400 flex items-center gap-2.5 transition-colors cursor-pointer"
          >
            <Calendar size={15} className="text-blue-600 dark:text-blue-400 shrink-0" />
            <div>
              <span className="block font-bold">Apple Calendar / Outlook</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">
                {language === 'uz' ? '.ics universal faylni yuklab olish' : language === 'ru' ? 'Скачать .ics файл' : 'Download universal .ics file'}
              </span>
            </div>
          </button>

          {/* 2. Google Calendar Direct Web Link */}
          <a
            href={googleUrl}
            target="_blank"
            rel="noreferrer"
            onClick={() => setIsOpen(false)}
            className="w-full px-3 py-2 rounded-xl text-left text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-800 dark:hover:text-emerald-300 flex items-center gap-2.5 transition-colors"
          >
            <CalendarPlus size={15} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <span className="block font-bold">Google Calendar</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">
                {language === 'uz' ? 'Google taqvimida 1-bosishda ochish' : language === 'ru' ? 'Открыть в Google Календаре' : 'Open in Google Calendar web'}
              </span>
            </div>
          </a>

          {/* 3. Copy Details to Clipboard */}
          <button
            type="button"
            onClick={handleCopySummary}
            className="w-full px-3 py-2 rounded-xl text-left text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2.5 transition-colors cursor-pointer border-t border-slate-100 dark:border-slate-800 mt-1 pt-2"
          >
            {copied ? (
              <Check size={15} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <Sparkles size={15} className="text-amber-500 dark:text-amber-400 shrink-0" />
            )}
            <div>
              <span className="block font-bold">
                {copied
                  ? language === 'uz'
                    ? 'Nusxalandi!'
                    : 'Copied!'
                  : language === 'uz'
                  ? 'Matn sifatida nusxalash'
                  : language === 'ru'
                  ? 'Скопировать текст визита'
                  : 'Copy Appointment Text'}
              </span>
            </div>
          </button>
        </div>
      )}
    </div>
  );
};

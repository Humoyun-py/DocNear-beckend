import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Clock, Calendar, Bell, CheckCircle2, User, Phone, Mail, Sparkles, Building2 } from 'lucide-react';
import { Doctor, Clinic, WaitlistTimeRange } from '../../types';
import { waitlistService } from '../../services/waitlistService';
import { useAuth } from '../../context/AuthContext';
import { useAppointments } from '../../context/AppointmentContext';
import { useLanguage } from '../../context/LanguageContext';

interface WaitlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  doctor?: Doctor | null;
  clinic?: Clinic | null;
  initialDate?: string;
  onSuccess?: () => void;
}

export const WaitlistModal: React.FC<WaitlistModalProps> = ({
  isOpen,
  onClose,
  doctor,
  clinic,
  initialDate,
  onSuccess,
}) => {
  const { user } = useAuth();
  const { showToast } = useAppointments();
  const { t } = useLanguage();

  const [preferredDate, setPreferredDate] = useState<string>(
    initialDate || '2026-08-26'
  );
  const [preferredTimeRange, setPreferredTimeRange] = useState<WaitlistTimeRange>('any');
  const [patientName, setPatientName] = useState<string>(user?.name || '');
  const [patientPhone, setPatientPhone] = useState<string>(user?.phone || '');
  const [patientEmail, setPatientEmail] = useState<string>(user?.email || '');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const clinicId = doctor?.clinicId || clinic?.id || 'clinic-1';
  const clinicName = doctor?.clinicName || clinic?.name || 'Medical Center';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim() || !patientPhone.trim()) {
      showToast('Iltimos, ism va telefon raqamingizni to‘ldiring.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await waitlistService.joinWaitlist({
        userId: user?.id,
        userName: patientName.trim(),
        userPhone: patientPhone.trim(),
        userEmail: patientEmail.trim() || undefined,
        clinicId,
        clinicName,
        doctorId: doctor?.id,
        doctorName: doctor?.name,
        doctorSpecialty: doctor?.specialty,
        doctorPhoto: doctor?.photo,
        preferredDate,
        preferredTimeRange,
        notes: notes.trim() || undefined,
      });

      showToast(
        t('waitlistJoinedDesc') || 'Siz kutish ro‘yxatiga qo‘shildingiz. O‘rin bo‘shashi bilan xabar yuboramiz!',
        'success',
        t('waitlistJoined') || 'Kutish ro‘yxatiga qabul qilindi'
      );

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      showToast('Xatolik yuz berdi. Iltimos qaytadan urinib ko‘ring.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden my-8"
        >
          {/* Modal Header */}
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 p-6 text-white relative">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2.5 mb-2">
              <span className="p-2 rounded-xl bg-white/15 backdrop-blur-md">
                <Bell size={20} className="text-amber-300 animate-bounce" />
              </span>
              <div>
                <h3 className="font-extrabold text-lg text-white">
                  {t('joinWaitlist') || 'Kutish ro‘yxatiga yozilish'}
                </h3>
                <p className="text-xs text-blue-100">
                  {t('waitlistDesc') || 'Bo‘sh vaqt yoki bekor qilingan o‘rin paydo bo‘lishi bilan xabar beramiz'}
                </p>
              </div>
            </div>

            {/* Target Doctor or Clinic Card */}
            <div className="mt-4 p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 flex items-center gap-3">
              {doctor ? (
                <>
                  <img
                    src={doctor.photo}
                    alt={doctor.name}
                    className="w-12 h-12 rounded-xl object-cover border border-white/30 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div className="min-w-0 flex-1">
                    <strong className="block text-sm font-bold text-white truncate">{doctor.name}</strong>
                    <span className="text-xs text-blue-200 block truncate">{doctor.specialty} • {doctor.clinicName}</span>
                  </div>
                </>
              ) : clinic ? (
                <>
                  <img
                    src={clinic.image}
                    alt={clinic.name}
                    className="w-12 h-12 rounded-xl object-cover border border-white/30 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div className="min-w-0 flex-1">
                    <strong className="block text-sm font-bold text-white truncate">{clinic.name}</strong>
                    <span className="text-xs text-blue-200 block truncate">{clinic.address}</span>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2 text-xs text-white">
                  <Building2 size={16} />
                  <span>{clinicName}</span>
                </div>
              )}
            </div>
          </div>

          {/* Modal Form Body */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Preferred Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Calendar size={14} className="text-blue-600 dark:text-blue-400" />
                  <span>{t('preferredDate') || 'Ma‘qul sana'}</span>
                </label>
                <input
                  type="date"
                  required
                  value={preferredDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setPreferredDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                />
              </div>

              {/* Time Window */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Clock size={14} className="text-blue-600 dark:text-blue-400" />
                  <span>{t('preferredTimeRange') || 'Vaqt oralig‘i'}</span>
                </label>
                <select
                  value={preferredTimeRange}
                  onChange={(e) => setPreferredTimeRange(e.target.value as WaitlistTimeRange)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                >
                  <option value="any" className="dark:bg-slate-800">{t('timeRangeAny') || 'Istalgan vaqt (Any Time)'}</option>
                  <option value="morning" className="dark:bg-slate-800">{t('timeRangeMorning') || 'Ertalab (09:00 - 12:00)'}</option>
                  <option value="afternoon" className="dark:bg-slate-800">{t('timeRangeAfternoon') || 'Kunduzi (12:00 - 17:00)'}</option>
                  <option value="evening" className="dark:bg-slate-800">{t('timeRangeEvening') || 'Kechqurun (17:00 - 20:00)'}</option>
                </select>
              </div>
            </div>

            {/* Patient Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <User size={13} className="text-slate-400 dark:text-slate-500" />
                  <span>{t('fullName')}</span>
                </label>
                <input
                  type="text"
                  required
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="Aziza Rakhimova"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <Phone size={13} className="text-slate-400 dark:text-slate-500" />
                  <span>{t('patientPhone')}</span>
                </label>
                <input
                  type="tel"
                  required
                  value={patientPhone}
                  onChange={(e) => setPatientPhone(e.target.value)}
                  placeholder="+998 90 123 45 67"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                <Mail size={13} className="text-slate-400 dark:text-slate-500" />
                <span>{t('emailAddress')} (Ixtiyoriy)</span>
              </label>
              <input
                type="email"
                value={patientEmail}
                onChange={(e) => setPatientEmail(e.target.value)}
                placeholder="example@mail.uz"
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Qo‘shimcha izoh yoki shikoyat (Ixtiyoriy)
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Tezroq ko‘rikdan o‘tish zarurati bo‘lsa yozib qoldiring..."
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-hidden resize-none"
              />
            </div>

            {/* Information Notice */}
            <div className="p-3 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-800 rounded-2xl flex items-start gap-2.5 text-xs text-blue-900 dark:text-blue-200">
              <Sparkles size={16} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed text-blue-800 dark:text-blue-300">
                Boshqa bemor qabulni bekor qilganda yoki yangi qabul ochilganda, tizim birinchi bo‘lib sizga SMS/Toast orqali tezkor band qilish taklifini yuboradi.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 size={16} />
                <span>{isSubmitting ? 'Yozilmoqda...' : t('joinWaitlist') || 'Kutish ro‘yxatiga qo‘shilish'}</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="py-3 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs transition-colors cursor-pointer"
              >
                {t('cancel')}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAppointments } from '../context/AppointmentContext';
import { useLanguage } from '../context/LanguageContext';
import {
  Bell,
  CheckCircle2,
  Clock,
  Calendar,
  AlertTriangle,
  Info,
  ShieldCheck,
  Smartphone,
  Trash2,
  CheckCheck,
  Settings2,
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface AppNotification {
  id: string;
  type: 'appointment_reminder' | 'booking_confirmed' | 'system' | 'health_tip';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  appointmentId?: string;
  bookingCode?: string;
}

export const NotificationsPage: React.FC = () => {
  const { user, isLoggedIn, updateProfile, openAuthModal } = useAuth();
  const { appointments, showToast } = useAppointments();
  const { language } = useLanguage();

  // Generate realistic notifications from user's appointments and system events
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const list: AppNotification[] = [];

    appointments.forEach((apt) => {
      list.push({
        id: `notif-${apt.id}-confirmed`,
        type: 'booking_confirmed',
        title:
          language === 'uz'
            ? 'Qabul muvaffaqiyatli band qilindi'
            : language === 'ru'
            ? 'Запись успешно создана'
            : 'Appointment Confirmed',
        message:
          language === 'uz'
            ? `${apt.doctorName} (${apt.clinicName}) qabuliga yozildingiz. Kod: ${apt.bookingCode || 'DN-10294'}. Sana: ${apt.date} soat ${apt.time}.`
            : language === 'ru'
            ? `Вы записаны к ${apt.doctorName} (${apt.clinicName}). Код: ${apt.bookingCode || 'DN-10294'}. Дата: ${apt.date} в ${apt.time}.`
            : `Booked with ${apt.doctorName} at ${apt.clinicName}. Code: ${apt.bookingCode || 'DN-10294'}. Date: ${apt.date} at ${apt.time}.`,
        timestamp: `${apt.date} ${apt.time}`,
        read: apt.status === 'Completed',
        appointmentId: apt.id,
        bookingCode: apt.bookingCode,
      });

      if (apt.status === 'Confirmed' || apt.status === 'Pending') {
        list.push({
          id: `notif-${apt.id}-reminder`,
          type: 'appointment_reminder',
          title:
            language === 'uz'
              ? 'Qabul eslatmasi (24 soat qoldi)'
              : language === 'ru'
              ? 'Напоминание о приеме (Осталось 24 часа)'
              : 'Upcoming Appointment Reminder (24h left)',
          message:
            language === 'uz'
              ? `Ertaga soat ${apt.time} da ${apt.doctorName} bilan uchrashuv belgilangan. Iltimos, 10 daqiqa oldin yetib keling.`
              : language === 'ru'
              ? `Завтра в ${apt.time} у вас прием у ${apt.doctorName}. Рекомендуем подойти за 10 минут.`
              : `Tomorrow at ${apt.time} you have a consultation with ${apt.doctorName}. Please arrive 10 minutes early.`,
          timestamp: `${apt.date} 09:00`,
          read: false,
          appointmentId: apt.id,
          bookingCode: apt.bookingCode,
        });
      }
    });

    // Add security and system notifications
    list.push({
      id: 'notif-welcome-auth',
      type: 'system',
      title:
        language === 'uz'
          ? 'DocNear xavfsiz tizimiga xush kelibsiz'
          : language === 'ru'
          ? 'Добро пожаловать в защищенную систему DocNear'
          : 'Welcome to DocNear Verified Healthcare',
      message:
        language === 'uz'
          ? 'Shaxsiy hisobingiz va ma‘lumotlaringiz xavfsiz shifrlangan. Har qanday tibbiy yordam kerak bo‘lganda xizmatimizdan foydalaning.'
          : language === 'ru'
          ? 'Ваш аккаунт и медицинские данные надежно защищены. Обращайтесь за квалифицированной помощью в любое время.'
          : 'Your patient records and bookings are securely protected. Connect with accredited partner clinics anytime.',
      timestamp: '2026-03-01 10:00',
      read: true,
    });

    return list;
  });

  const [appointmentReminders, setAppointmentReminders] = useState<boolean>(
    user?.notificationSettings?.appointmentReminders ?? true
  );
  const [smsNotifications, setSmsNotifications] = useState<boolean>(
    user?.notificationSettings?.smsReminders ?? true
  );
  const [emailReminders, setEmailReminders] = useState<boolean>(
    user?.notificationSettings?.emailUpdates ?? true
  );

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    showToast(
      language === 'uz'
        ? 'Barcha bildirishnomalar o‘qildi deb belgilandi'
        : language === 'ru'
        ? 'Все уведомления прочитаны'
        : 'All notifications marked as read',
      'success'
    );
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    showToast(
      language === 'uz'
        ? 'Bildirishnomalar tozalandi'
        : language === 'ru'
        ? 'Уведомления очищены'
        : 'Notifications cleared',
      'info'
    );
  };

  const handleToggle = async (key: 'appointmentReminders' | 'smsReminders' | 'emailUpdates', value: boolean) => {
    if (key === 'appointmentReminders') setAppointmentReminders(value);
    if (key === 'smsReminders') setSmsNotifications(value);
    if (key === 'emailUpdates') setEmailReminders(value);

    if (user && updateProfile) {
      await updateProfile({
        notificationSettings: {
          promoOffers: user.notificationSettings?.promoOffers ?? false,
          appointmentReminders: key === 'appointmentReminders' ? value : appointmentReminders,
          smsReminders: key === 'smsReminders' ? value : smsNotifications,
          emailUpdates: key === 'emailUpdates' ? value : emailReminders,
        },
      });
      showToast(
        language === 'uz' ? 'Sozlamalar saqlandi' : language === 'ru' ? 'Настройки сохранены' : 'Settings updated',
        'success'
      );
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
          <Bell size={32} />
        </div>
        <h1 className="text-xl font-black text-slate-900 dark:text-white">
          {language === 'uz' ? 'Bildirishnomalar' : language === 'ru' ? 'Уведомления' : 'Notifications'}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {language === 'uz'
            ? 'Qabul eslatmalari va SMS xabarnomalarni ko‘rish uchun profilingizga kiring.'
            : language === 'ru'
            ? 'Войдите в аккаунт, чтобы просматривать уведомления и напоминания о приемах.'
            : 'Sign in to access your appointment reminders and healthcare updates.'}
        </p>
        <button
          onClick={() => openAuthModal('login')}
          className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-md transition-all cursor-pointer"
        >
          {language === 'uz' ? 'Kirish' : language === 'ru' ? 'Войти' : 'Sign In'}
        </button>
      </div>
    );
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Bell size={26} className="text-blue-600 dark:text-blue-400" />
            <span>{language === 'uz' ? 'Bildirishnomalar' : language === 'ru' ? 'Уведомления' : 'Notifications'}</span>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-600 text-white">
                {unreadCount}
              </span>
            )}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {language === 'uz'
              ? 'Qabul eslatmalari, tasdiqlovchi xabarlar va shifokor yangiliklari'
              : language === 'ru'
              ? 'Напоминания о приемах, подтверждения и важные медицинские оповещения'
              : 'Appointment reminders, confirmations, and clinic updates'}
          </p>
        </div>

        {notifications.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <CheckCheck size={14} />
              <span>{language === 'uz' ? 'Barchasini o‘qish' : language === 'ru' ? 'Прочитать все' : 'Mark all read'}</span>
            </button>
            <button
              onClick={clearAllNotifications}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
            >
              <Trash2 size={14} />
              <span>{language === 'uz' ? 'Tozalash' : language === 'ru' ? 'Очистить' : 'Clear'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {notifications.length > 0 ? (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`p-4 rounded-2xl border transition-all ${
                !n.read
                  ? 'bg-blue-50/40 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/50 shadow-xs'
                  : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    n.type === 'appointment_reminder'
                      ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400'
                      : n.type === 'booking_confirmed'
                      ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400'
                      : 'bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400'
                  }`}
                >
                  {n.type === 'appointment_reminder' ? (
                    <Clock size={18} />
                  ) : n.type === 'booking_confirmed' ? (
                    <CheckCircle2 size={18} />
                  ) : (
                    <ShieldCheck size={18} />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                      {n.title}
                    </h2>
                    <span className="text-[11px] text-slate-500 shrink-0">{n.timestamp}</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                    {n.message}
                  </p>

                  {n.bookingCode && (
                    <div className="mt-2.5 flex items-center gap-2">
                      <Link
                        to="/appointments"
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition-colors"
                      >
                        <Calendar size={12} />
                        <span>{language === 'uz' ? 'Qabulga o‘tish' : language === 'ru' ? 'К приему' : 'View Appointment'}</span>
                      </Link>
                      <span className="text-[11px] font-mono font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                        {n.bookingCode}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
              <Bell size={24} />
            </div>
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
              {language === 'uz' ? 'Hozircha yangi bildirishnomalar yo‘q' : language === 'ru' ? 'Нет новых уведомлений' : 'No new notifications'}
            </p>
            <p className="text-xs text-slate-500">
              {language === 'uz'
                ? 'Shifokor qabulini band qilganingizda eslatmalar va tasdiqlash xabarlari shu yerda ko‘rinadi.'
                : language === 'ru'
                ? 'Здесь будут появляться подтверждения бронирования и напоминания о приемах.'
                : 'When you schedule visits, your booking confirmations and reminders will appear here.'}
            </p>
          </div>
        )}
      </div>

      {/* Notification Channel Preferences Card */}
      <div className="p-5 sm:p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-4">
        <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
          <Settings2 size={18} className="text-blue-600 dark:text-blue-400" />
          <span>{language === 'uz' ? 'Bildirishnoma kanallari va eslatmalar' : language === 'ru' ? 'Каналы уведомлений и напоминания' : 'Notification Channels & Alerts'}</span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          <div className="py-3 flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                {language === 'uz' ? 'Qabul eslatmalari (Push & SMS)' : language === 'ru' ? 'Напоминания о приемах (Push и SMS)' : 'Appointment Reminders (Push & SMS)'}
              </p>
              <p className="text-[11px] text-slate-500">
                {language === 'uz' ? 'Qabuldan 24 soat va 1 soat oldin avtomatik eslatish' : language === 'ru' ? 'Автоматическое напоминание за 24 часа и за 1 час' : 'Remind me 24h and 1h before my consultation'}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={appointmentReminders}
                onChange={(e) => handleToggle('appointmentReminders', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="py-3 flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                {language === 'uz' ? 'SMS orqali tasdiqlash' : language === 'ru' ? 'SMS-подтверждения' : 'SMS Booking Confirmations'}
              </p>
              <p className="text-[11px] text-slate-500">
                {language === 'uz' ? 'Band kodi va klinika manzilini bepul SMS orqali yuborish' : language === 'ru' ? 'Бесплатное SMS с кодом записи и адресом клиники' : 'Receive instant SMS with booking code and clinic address'}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={smsNotifications}
                onChange={(e) => handleToggle('smsReminders', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="py-3 flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                {language === 'uz' ? 'Email yangiliklar & Cheklar' : language === 'ru' ? 'Email-квитанции' : 'Email Receipts & Health Updates'}
              </p>
              <p className="text-[11px] text-slate-500">
                {language === 'uz' ? 'Qabul cheki va retsept nusxasini pochtaga olish' : language === 'ru' ? 'Электронный чек и копии назначений на почту' : 'Receive electronic receipts and consultation summary via email'}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={emailReminders}
                onChange={(e) => handleToggle('emailUpdates', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

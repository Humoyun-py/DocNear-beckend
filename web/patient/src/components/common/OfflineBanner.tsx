import React, { useState } from 'react';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { useLanguage } from '../../context/LanguageContext';
import { WifiOff, Wifi, RefreshCw, AlertCircle, CheckCircle2, X } from 'lucide-react';

export const OfflineBanner: React.FC = () => {
  const { isOnline, wasOffline, offlineSince, checkConnection } = useNetworkStatus();
  const { language } = useLanguage();
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);

  const handleRetry = async () => {
    setIsChecking(true);
    await checkConnection();
    setTimeout(() => {
      setIsChecking(false);
    }, 600);
  };

  // If user is online and wasn't recently offline, don't show anything
  if (isOnline && !wasOffline) {
    return null;
  }

  // Reconnected Toast/Banner
  if (isOnline && wasOffline) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="bg-emerald-600 dark:bg-emerald-700 text-white text-xs font-bold py-2.5 px-4 sticky top-16 z-50 shadow-md flex items-center justify-between transition-all animate-in fade-in slide-in-from-top-1"
      >
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-100 shrink-0" />
            <span>
              {language === 'uz'
                ? 'Internet aloqasi tiklandi. Endi qabullarni xavfsiz davom ettirishingiz mumkin.'
                : language === 'ru'
                ? 'Подключение к интернету восстановлено. Все сервисы доступны.'
                : 'Internet connection restored. You are back online.'}
            </span>
          </div>
          <span className="text-[11px] font-semibold bg-emerald-700/60 px-2 py-0.5 rounded-md text-emerald-100">
            Online
          </span>
        </div>
      </div>
    );
  }

  // Currently Offline Banner
  if (!isOnline && !isDismissed) {
    return (
      <div
        role="alert"
        aria-live="assertive"
        className="bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 text-white text-xs font-semibold py-2.5 px-4 sticky top-16 z-50 shadow-lg border-b border-amber-500/40 animate-in fade-in slide-in-from-top-2"
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
              <WifiOff size={16} className="text-white animate-pulse" />
            </div>
            <div>
              <p className="font-extrabold text-xs sm:text-sm text-white flex items-center gap-1.5">
                <span>
                  {language === 'uz'
                    ? 'Offlayn rejim: Internet aloqasi uzildi'
                    : language === 'ru'
                    ? 'Офлайн-режим: Нет подключения к интернету'
                    : 'Offline Mode: No Internet Connection'}
                </span>
                <span className="w-2 h-2 rounded-full bg-rose-300 animate-ping" />
              </p>
              <p className="text-[11px] text-amber-100/90 leading-tight">
                {language === 'uz'
                  ? 'Qabul ma‘lumotlari yo‘qolmasligi uchun loyiha qoralamasi qurilmangizda saqlanmoqda. Yangi qabul ulanish tiklanganda yuboriladi.'
                  : language === 'ru'
                  ? 'Черновик бронирования сохранён локально. Отправка будет доступна сразу после восстановления сети.'
                  : 'Your booking draft is saved locally. Booking submissions are paused to prevent data loss.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            <button
              type="button"
              onClick={handleRetry}
              disabled={isChecking}
              className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-white/30 active:scale-95"
            >
              <RefreshCw size={13} className={isChecking ? 'animate-spin' : ''} />
              <span>
                {language === 'uz'
                  ? 'Tekshirish'
                  : language === 'ru'
                  ? 'Проверить'
                  : 'Check Connection'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setIsDismissed(true)}
              className="p-1.5 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
              title="Dismiss warning"
              aria-label="Dismiss offline banner"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from '../../context/LocationContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAppointments } from '../../context/AppointmentContext';
import {
  PhoneCall,
  AlertTriangle,
  MapPin,
  Copy,
  Check,
  X,
  ShieldAlert,
  Navigation,
  Flame,
  Shield,
  HeartPulse,
  Activity,
  LifeBuoy,
  Share2,
  GripVertical,
  ChevronDown,
  ChevronUp,
  Wind,
} from 'lucide-react';

const STORAGE_KEY = 'docnear_sos_button_pos';

interface ButtonPosition {
  x: number;
  y: number;
}

export const EmergencySOSButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [copiedLocation, setCopiedLocation] = useState<boolean>(false);
  const [activeFirstAid, setActiveFirstAid] = useState<string | null>(null);

  const { userLocation } = useLocation();
  const { t, language } = useLanguage();
  const { showToast } = useAppointments();

  const buttonRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<ButtonPosition | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // References to keep drag calculations glitch-free
  const dragRef = useRef<{
    startX: number;
    startY: number;
    initialBtnX: number;
    initialBtnY: number;
    hasDragged: boolean;
    activePointerId: number | null;
  }>({
    startX: 0,
    startY: 0,
    initialBtnX: 0,
    initialBtnY: 0,
    hasDragged: false,
    activePointerId: null,
  });

  // Calculate safe default position in bottom-left corner
  const getDefaultPosition = useCallback((): ButtonPosition => {
    if (typeof window === 'undefined') return { x: 0, y: 0 };
    const width = window.innerWidth;
    const height = window.innerHeight;
    const btnHeight = 48;
    const leftMargin = width < 640 ? 16 : 24;
    const bottomMargin = width < 640 ? 80 : 28;

    return {
      x: leftMargin,
      y: Math.max(12, height - btnHeight - bottomMargin),
    };
  }, []);

  // Initialize position from localStorage or default
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: ButtonPosition = JSON.parse(saved);
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
          // If previously saved in the bottom-right corner where AI chat is, reset to bottom-left
          const inBottomRightZone = parsed.x > window.innerWidth - 240 && parsed.y > window.innerHeight - 150;
          if (!inBottomRightZone) {
            // Clamp inside viewport
            const clampedX = Math.min(Math.max(8, parsed.x), window.innerWidth - 100);
            const clampedY = Math.min(Math.max(8, parsed.y), window.innerHeight - 50);
            setPosition({ x: clampedX, y: clampedY });
            return;
          }
        }
      }
    } catch {
      // ignore JSON parse errors
    }
    setPosition(getDefaultPosition());
  }, [getDefaultPosition]);

  // Keep position clamped on window resize
  useEffect(() => {
    const handleResize = () => {
      setPosition((prev) => {
        if (!prev || !buttonRef.current) return prev;
        const rect = buttonRef.current.getBoundingClientRect();
        const maxX = Math.max(8, window.innerWidth - rect.width - 8);
        const maxY = Math.max(8, window.innerHeight - rect.height - 8);
        const newX = Math.min(Math.max(8, prev.x), maxX);
        const newY = Math.min(Math.max(8, prev.y), maxY);
        if (newX !== prev.x || newY !== prev.y) {
          return { x: newX, y: newY };
        }
        return prev;
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Pointer drag event handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Only respond to main left click / touch
    if (e.button !== 0 && e.pointerType === 'mouse') return;

    const currentPos = position || getDefaultPosition();
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialBtnX: currentPos.x,
      initialBtnY: currentPos.y,
      hasDragged: false,
      activePointerId: e.pointerId,
    };

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragRef.current.activePointerId !== e.pointerId) return;

    const deltaX = e.clientX - dragRef.current.startX;
    const deltaY = e.clientY - dragRef.current.startY;
    const distanceMoved = Math.hypot(deltaX, deltaY);

    if (!dragRef.current.hasDragged && distanceMoved > 5) {
      dragRef.current.hasDragged = true;
      setIsDragging(true);
    }

    if (dragRef.current.hasDragged) {
      const btnRect = buttonRef.current?.getBoundingClientRect();
      const btnWidth = btnRect?.width || 120;
      const btnHeight = btnRect?.height || 48;

      const maxX = Math.max(8, window.innerWidth - btnWidth - 8);
      const maxY = Math.max(8, window.innerHeight - btnHeight - 8);

      const newX = Math.min(Math.max(8, dragRef.current.initialBtnX + deltaX), maxX);
      const newY = Math.min(Math.max(8, dragRef.current.initialBtnY + deltaY), maxY);

      setPosition({ x: newX, y: newY });
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragRef.current.activePointerId !== e.pointerId) return;

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    const wasDragging = dragRef.current.hasDragged;
    dragRef.current.activePointerId = null;
    setIsDragging(false);

    if (wasDragging) {
      // Save newly dragged location
      if (position) {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(position));
        } catch {
          // ignore storage errors
        }
      }
    } else {
      // It was a click! Open modal
      setIsOpen(true);
    }
  };

  const handlePointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragRef.current.activePointerId === e.pointerId) {
      dragRef.current.activePointerId = null;
      setIsDragging(false);
    }
  };

  const handleCopyLocation = () => {
    const lat = userLocation.lat.toFixed(5);
    const lng = userLocation.lng.toFixed(5);
    const address = userLocation.address || userLocation.city || 'Tashkent, Uzbekistan';
    const textToCopy = `EMERGENCY SOS LOCATION:\nCoordinates: ${lat}, ${lng}\nAddress: ${address}\nGoogle Maps: https://maps.google.com/?q=${lat},${lng}`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(textToCopy);
      setCopiedLocation(true);
      showToast(t('coordinatesCopied'), 'success', 'GPS Location');
      setTimeout(() => setCopiedLocation(false), 3000);
    }
  };

  const handleShareEmergency = () => {
    const lat = userLocation.lat.toFixed(5);
    const lng = userLocation.lng.toFixed(5);
    const address = userLocation.address || userLocation.city || 'Tashkent, Uzbekistan';
    const text = `EMERGENCY ALERT: I need medical assistance at ${address} (Coords: ${lat}, ${lng}). Map: https://maps.google.com/?q=${lat},${lng}`;

    if (navigator.share) {
      navigator.share({
        title: 'Emergency Medical SOS - DocNear',
        text,
      }).catch(() => {});
    } else {
      handleCopyLocation();
    }
  };

  const dragHintText = language === 'uz'
    ? 'Mishka orqali istalgan joyga surish mumkin'
    : language === 'ru'
    ? 'Можно перемещать мышкой в любое место'
    : 'Drag anywhere with mouse/touch';

  return (
    <>
      {/* DRAGGABLE FLOATING EMERGENCY SOS BUTTON */}
      <div
        ref={buttonRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        style={{
          position: 'fixed',
          left: position ? `${position.x}px` : undefined,
          top: position ? `${position.y}px` : undefined,
          touchAction: 'none',
          zIndex: 45,
          userSelect: 'none',
          WebkitUserSelect: 'none',
        }}
        className={`group select-none ${
          !position ? 'bottom-20 left-4 sm:bottom-6 sm:left-6 fixed' : ''
        }`}
      >
        <button
          type="button"
          aria-label="Emergency SOS Medical Services"
          title={`${t('emergencySOS')} (103) • ${dragHintText}`}
          id="floating-emergency-sos-button"
          className={`relative flex items-center justify-center p-2.5 sm:px-4 sm:py-2.5 rounded-full bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white font-extrabold shadow-xl border-2 border-white/90 ring-4 ring-red-500/30 transition-shadow duration-150 select-none ${
            isDragging
              ? 'cursor-grabbing scale-105 shadow-2xl ring-red-500/60 ring-6'
              : 'cursor-grab hover:shadow-2xl hover:scale-102 active:scale-95'
          }`}
        >
          {/* Pulsing ring animation */}
          {!isDragging && (
            <span className="absolute -inset-1 rounded-full bg-red-600 opacity-70 animate-ping pointer-events-none" />
          )}

          <div className="relative flex items-center gap-1.5 sm:gap-2">
            {/* Grab handle indicator icon */}
            <div className="text-white/60 group-hover:text-white/90 flex items-center -ml-0.5 pointer-events-none">
              <GripVertical size={14} className="opacity-70 group-hover:opacity-100" />
            </div>

            <HeartPulse size={19} className="animate-pulse text-white shrink-0" />
            <span className="font-black tracking-wider text-xs sm:text-sm uppercase">
              SOS
            </span>
            <span className="hidden md:inline-block text-xs font-bold bg-white/20 px-2 py-0.5 rounded-full border border-white/20">
              103
            </span>
          </div>
        </button>
      </div>

      {/* EMERGENCY CONFIRMATION MODAL */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-red-200 dark:border-red-900/50 space-y-5 p-5 sm:p-6 relative text-slate-900 dark:text-white transition-colors duration-200">
            {/* Close Button */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              aria-label="Close emergency modal"
            >
              <X size={18} />
            </button>

            {/* Emergency Header */}
            <div className="flex items-start gap-3.5 pr-8">
              <div className="w-12 h-12 rounded-2xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-red-600/30">
                <AlertTriangle size={24} className="animate-bounce" />
              </div>
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 text-[11px] font-black uppercase tracking-wider border border-red-200 dark:border-red-800">
                  {t('emergencySOS')} 24/7
                </span>
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
                  {t('emergencyModalTitle')}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {t('emergencyModalSubtitle')}
                </p>
              </div>
            </div>

            {/* PRIMARY ONE-TAP 103 CALL BUTTON */}
            <div className="space-y-2">
              <a
                href="tel:103"
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-red-600 via-red-500 to-rose-600 text-white font-black text-base sm:text-lg flex items-center justify-center gap-3 shadow-lg shadow-red-600/30 hover:scale-[1.02] active:scale-[0.98] transition-all text-center border-2 border-red-400/50"
              >
                <PhoneCall size={24} className="animate-pulse shrink-0" />
                <span>{t('callAmbulance103')}</span>
              </a>
              <p className="text-[11px] text-center text-red-600 dark:text-red-400 font-semibold flex items-center justify-center gap-1.5">
                <AlertTriangle size={13} className="shrink-0" />
                <span>{t('emergencyWarning')}</span>
              </p>
            </div>

            {/* CURRENT USER GPS COORDINATES CARD */}
            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                  <MapPin size={14} className="text-red-600 dark:text-red-400" />
                  <span>{t('yourExactLocation')}</span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyLocation}
                  className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1 cursor-pointer bg-white dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xs"
                >
                  {copiedLocation ? (
                    <>
                      <Check size={12} className="text-emerald-600 dark:text-emerald-400" />
                      <span className="text-emerald-600 dark:text-emerald-400">{t('coordinatesCopied')}</span>
                    </>
                  ) : (
                    <>
                      <Copy size={12} />
                      <span>{t('copyCoordinates')}</span>
                    </>
                  )}
                </button>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-xl p-2.5 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-700 dark:text-slate-300 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">GPS:</span>
                  <strong className="text-slate-900 dark:text-white font-bold">
                    {userLocation.lat.toFixed(5)}, {userLocation.lng.toFixed(5)}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Manzil:</span>
                  <span className="text-slate-800 dark:text-slate-200 font-medium truncate max-w-[240px]">
                    {userLocation.address || userLocation.city || 'Toshkent shahri'}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <a
                  href={`https://maps.google.com/?q=${userLocation.lat},${userLocation.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Navigation size={12} className="text-blue-600 dark:text-blue-400" />
                  <span>Google Xarita</span>
                </a>
                <button
                  type="button"
                  onClick={handleShareEmergency}
                  className="flex-1 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Share2 size={12} className="text-blue-600 dark:text-blue-400" />
                  <span>Ulashish</span>
                </button>
              </div>
            </div>

            {/* OTHER EMERGENCY NUMBERS */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                {t('emergencyContactsTitle')}
              </span>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <a
                  href="tel:112"
                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 transition-all flex flex-col items-center gap-1"
                >
                  <ShieldAlert size={16} className="text-blue-600 dark:text-blue-400" />
                  <span className="font-extrabold text-slate-900 dark:text-white">112</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">Yagona xizmat</span>
                </a>

                <a
                  href="tel:102"
                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600 transition-all flex flex-col items-center gap-1"
                >
                  <Shield size={16} className="text-indigo-600 dark:text-indigo-400" />
                  <span className="font-extrabold text-slate-900 dark:text-white">102</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">Ichki ishlar</span>
                </a>

                <a
                  href="tel:101"
                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-amber-50 dark:hover:bg-amber-950/40 border border-slate-200 dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-600 transition-all flex flex-col items-center gap-1"
                >
                  <Flame size={16} className="text-amber-600 dark:text-amber-400" />
                  <span className="font-extrabold text-slate-900 dark:text-white">101</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">FVV (Yong‘in)</span>
                </a>
              </div>
            </div>

            {/* FIRST AID QUICK TIPS ACCORDION */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <LifeBuoy size={14} className="text-emerald-600 dark:text-emerald-400" />
                <span>{t('emergencyFirstAid')}</span>
              </span>

              <div className="space-y-1.5 text-xs">
                {[
                  {
                    id: 'chest',
                    title: 'Ko‘krak qafasidagi o‘tkir og‘riq',
                    icon: HeartPulse,
                    text: 'Bemorga to‘liq tinchlik bering, o‘tirgan holatda ushlang, tor kiyimlarni yeching va darhol 103 ga qo‘ng‘iroq qiling.',
                  },
                  {
                    id: 'bleeding',
                    title: 'Kuchli qon ketish',
                    icon: Activity,
                    text: 'Yaralangan joyga toza mato bilan to‘g‘ridan-to‘g‘ri qattiq bosim bering. Oyoq yoki qo‘lni yurak sathidan baland ko‘taring.',
                  },
                  {
                    id: 'choking',
                    title: 'Nafas yo‘li to‘silishi (Bo‘g‘ilish)',
                    icon: Wind,
                    text: 'Bemorning orqasiga kuraklar o‘rtasiga 5 marta qattiq uring, so‘ng Geymlix usulini (qorin yuqorisiga siltash) qo‘llang.',
                  },
                ].map((item) => {
                  const FirstAidIcon = item.icon;
                  return (
                  <div
                    key={item.id}
                    className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-slate-50/50 dark:bg-slate-800/50"
                  >
                    <button
                      type="button"
                      onClick={() => setActiveFirstAid(activeFirstAid === item.id ? null : item.id)}
                      className="w-full px-3 py-2 text-left font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between text-xs cursor-pointer hover:bg-slate-100/80 dark:hover:bg-slate-700/80"
                    >
                      <span className="flex items-center gap-2">
                        <FirstAidIcon size={15} className="text-emerald-600 dark:text-emerald-400" />
                        {item.title}
                      </span>
                      {activeFirstAid === item.id ? (
                        <ChevronUp size={15} className="text-slate-400" />
                      ) : (
                        <ChevronDown size={15} className="text-slate-400" />
                      )}
                    </button>
                    {activeFirstAid === item.id && (
                      <div className="px-3 pb-2.5 pt-1 text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-900">
                        {item.text}
                      </div>
                    )}
                  </div>
                  );
                })}
              </div>
            </div>

            {/* Cancel & Safe button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors cursor-pointer"
              >
                {t('dismiss')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useAppointments } from '../../context/AppointmentContext';
import { useLanguage } from '../../context/LanguageContext';
import { telegramAuthService } from '../../services/telegramAuthService';
import { TelegramBotSimulator } from './TelegramBotSimulator';
import {
  X,
  HeartPulse,
  Mail,
  Lock,
  User,
  Phone,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Send,
  ExternalLink,
  Bot,
  RefreshCw,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AuthModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  initialMode?: 'login' | 'register';
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen: propIsOpen,
  onClose: propOnClose,
  initialMode = 'login',
  onSuccess,
}) => {
  const {
    isAuthModalOpen: contextIsOpen,
    authModalMode: contextMode,
    closeAuthModal: contextClose,
    login,
    register,
  } = useAuth();
  const { showToast } = useAppointments();
  const { t, language } = useLanguage();

  const isOpen = propIsOpen !== undefined ? propIsOpen : contextIsOpen;
  const onClose = propOnClose || contextClose;

  const [mode, setMode] = useState<'login' | 'register' | 'telegram_verify'>(
    initialMode || contextMode || 'login'
  );

  // Sync mode when modal opens
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode || contextMode || 'login');
      setErrorMessage(null);
      setVerificationCode('');
    }
  }, [isOpen, initialMode, contextMode]);

  // Login form state (empty by default so user logs in from 0)
  const [loginIdentifier, setLoginIdentifier] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [showLoginPassword, setShowLoginPassword] = useState<boolean>(false);

  // Register form state (Requested: Ism, Familiya, Telefon nomer, Password, Confirm Password)
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [phone, setPhone] = useState<string>('+998 ');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

  // Telegram Verification state
  const [verificationCode, setVerificationCode] = useState<string>('');
  const [countdown, setCountdown] = useState<number>(300); // 5 minutes
  const [isBotSimulatorOpen, setIsBotSimulatorOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const botUsername = telegramAuthService.getBotUsername();

  // Countdown timer for telegram verification
  useEffect(() => {
    let timer: any;
    if (mode === 'telegram_verify' && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [mode, countdown]);

  if (!isOpen) return null;

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Handle Login submission
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!loginIdentifier.trim() || !loginPassword.trim()) {
      setErrorMessage('Iltimos, telefon raqam/email va parolingizni kiriting.');
      return;
    }

    setIsLoading(true);
    try {
      await login(loginIdentifier, loginPassword);
      showToast('Xush kelibsiz! Tizimga muvaffaqiyatli kirdingiz.', 'success');
      if (onSuccess) onSuccess();
      onClose();
      contextClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Kirishda xatolik yuz berdi.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Quick Demo Login


  // Handle Register First Step (validation -> initiate Telegram verification)
  const handleRegisterNext = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanFirst = firstName.trim();
    const cleanLast = lastName.trim();
    const cleanPhone = phone.trim();

    if (!cleanFirst) {
      setErrorMessage('Iltimos, ismingizni kiriting.');
      return;
    }
    if (!cleanLast) {
      setErrorMessage('Iltimos, familiyangizni kiriting.');
      return;
    }
    if (cleanPhone.length < 9) {
      setErrorMessage('Iltimos, to‘liq telefon raqamingizni kiriting (Masalan: +998 90 123 45 67).');
      return;
    }
    if (!password || password.length < 10) {
      setErrorMessage('Parol kamida 10 ta belgidan iborat bo‘lishi kerak.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Parol va parolni tasdiqlash mos kelmadi. Iltimos, tekshiring.');
      return;
    }

    // Start Telegram verification session
    try {
      await register({ firstName: cleanFirst, lastName: cleanLast, phone: cleanPhone, password });
      contextClose();
      showToast('Ro‘yxatdan o‘tildi', 'success');
    } catch (error) { setErrorMessage(error instanceof Error ? error.message : 'Ro‘yxatdan o‘tish bajarilmadi'); }
  };

  // Handle Resend Telegram Code
  const handleResendCode = () => {
    telegramAuthService.resendCode(phone, firstName, lastName);
    setCountdown(300);
    setVerificationCode('');
    showToast('Yangi tasdiqlash kodi tayyorlandi.', 'info');
  };

  // Handle Verification Code Submit & Complete Registration
  const handleVerifyAndRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!verificationCode.trim() || verificationCode.trim().length < 6) {
      setErrorMessage('Iltimos, 6 xonali tasdiqlash kodini to‘liq kiriting.');
      return;
    }

    setIsLoading(true);
    try {
      const verifyRes = telegramAuthService.verifyCode(phone, verificationCode);
      if (!verifyRes.success) {
        setErrorMessage(verifyRes.message);
        setIsLoading(false);
        return;
      }

      // Complete registration in AuthContext
      await register({
        firstName,
        lastName,
        phone,
        password,
      });

      showToast(`Tabriklaymiz, ${firstName}! Ro'yxatdan muvaffaqiyatli o'tdingiz.`, 'success');
      if (onSuccess) onSuccess();
      onClose();
      contextClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Ro‘yxatdan o‘tishda xatolik yuz berdi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden my-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Accent */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
              <HeartPulse size={22} className="stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg tracking-tight leading-none text-white">
                {mode === 'login' && 'DocNear tizimiga kirish'}
                {mode === 'register' && 'Yangi hisob yaratish'}
                {mode === 'telegram_verify' && 'Telegram orqali tasdiqlash'}
              </h3>
              <p className="text-xs text-blue-100 mt-1">
                {mode === 'login' && 'Qabulni band qilish uchun profilingizga kiring'}
                {mode === 'register' && 'Ma‘lumotlaringizni to‘ldiring va hisob oching'}
                {mode === 'telegram_verify' && 'Telefon raqamingiz xavfsizligini tasdiqlang'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Error Notification Banner */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-start gap-2.5 animate-in fade-in">
            <AlertCircle size={16} className="text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{errorMessage}</div>
          </div>
        )}

        {/* Content Area */}
        <div className="p-6 sm:p-7">
          {/* ===================== MODE 1: LOGIN ===================== */}
          {mode === 'login' && (
            <div className="space-y-5">
<form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'ru'
                      ? 'Имя, номер телефона или Email'
                      : language === 'en'
                      ? 'Name, Phone number or Email'
                      : 'Telefon raqam yoki email'}
                  </label>
                  <div className="relative">
                    <User size={16} className="absolute left-3.5 top-3.5 text-slate-400 dark:text-slate-500" />
                    <input
                      type="text"
                      required
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      placeholder={
                        language === 'ru'
                          ? 'Ваше имя, телефон или email (Например: Aziza)'
                          : language === 'en'
                          ? 'Your name, phone or email (e.g. Aziza)'
                          : 'Ismingiz, telefon yoki email (Masalan: Aziza)'
                      }
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Parol</label>
                  </div>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-3.5 text-slate-400 dark:text-slate-500" />
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    >
                      {showLoginPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Tekshirilmoqda...</span>
                    </>
                  ) : (
                    <>
                      <span>Tizimga kirish</span>
                      <ArrowRight size={15} />
                    </>
                  )}
                </button>
              </form>

              {/* Toggle to Register */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Hisobingiz yo‘qmi?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMessage(null);
                      setMode('register');
                    }}
                    className="font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline cursor-pointer"
                  >
                    Ro‘yxatdan o‘tish
                  </button>
                </p>
              </div>
            </div>
          )}

          {/* ===================== MODE 2: REGISTER (Ism, Familiya, Telefon, Parol, Confirm Parol) ===================== */}
          {mode === 'register' && (
            <form onSubmit={handleRegisterNext} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Ism (First Name) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Ism <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User size={16} className="absolute left-3.5 top-3.5 text-slate-400 dark:text-slate-500" />
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Masalan: Jasur"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Familiya (Last Name) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Familiya <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User size={16} className="absolute left-3.5 top-3.5 text-slate-400 dark:text-slate-500" />
                    <input
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Masalan: Alimov"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Telefon nomer */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Telefon raqam (Telegram ulangan) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Phone size={16} className="absolute left-3.5 top-3.5 text-slate-400 dark:text-slate-500" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+998 90 123 45 67"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                  <Bot size={12} className="text-blue-600 dark:text-blue-400" />
                  <span>Tasdiqlash kodi @{botUsername} boti orqali yuboriladi</span>
                </p>
              </div>

              {/* Parol & Parolni tasdiqlash */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Parol <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-3.5 text-slate-400 dark:text-slate-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Kamida 10 belgi"
                      className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Parolni tasdiqlash <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-3.5 text-slate-400 dark:text-slate-500" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Parolni qaytaring"
                      className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-2.5 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    >
                      {showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                <span>Davom etish (Telegram orqali tasdiqlash)</span>
                <ArrowRight size={15} />
              </button>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Hisobingiz bormi?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMessage(null);
                      setMode('login');
                    }}
                    className="font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline cursor-pointer"
                  >
                    Tizimga kirish
                  </button>
                </p>
              </div>
            </form>
          )}

          {/* ===================== MODE 3: TELEGRAM BOT VERIFICATION ===================== */}
          {mode === 'telegram_verify' && (
            <div className="space-y-5">
              {/* Telegram Instructions Box */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-950/40 dark:to-blue-950/40 border border-sky-200/80 dark:border-sky-800/80 space-y-3">
                <div className="flex items-center gap-2 text-sky-900 dark:text-sky-200 font-bold text-xs">
                  <Bot size={18} className="text-sky-600 dark:text-sky-400" />
                  <span>Telegram Bot orqali tasdiqlash</span>
                </div>

                <div className="text-[12px] text-slate-700 dark:text-slate-300 space-y-1.5">
                  <div className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-sky-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </span>
                    <span>
                      Telegram'da <strong>@{botUsername}</strong> botiga kiring
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-sky-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      2
                    </span>
                    <span>
                      <strong>/start</strong> tugmasini bosing va <strong>{phone}</strong> raqamingizni yuboring
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-sky-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      3
                    </span>
                    <span>Bot yuborgan 6 xonali tasdiqlash kodini quyiga kiriting</span>
                  </div>
                </div>

                {/* Direct Action Buttons for Telegram Bot */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsBotSimulatorOpen(true)}
                    className="py-2 px-3 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    <Sparkles size={13} className="text-sky-400" />
                    <span>Bot Simulyatorini ochish</span>
                  </button>

                  <a
                    href={`https://t.me/${botUsername}?start=auth_${phone.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2 px-3 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all text-center"
                  >
                    <ExternalLink size={13} />
                    <span>Telegram'da ochish</span>
                  </a>
                </div>
              </div>

              {/* Embedded Bot Simulator Overlay when toggled */}
              {isBotSimulatorOpen && (
                <div className="p-3 bg-slate-950/5 dark:bg-slate-800/40 rounded-3xl border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between mb-2 px-1">
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      Interaktiv Telegram Bot
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsBotSimulatorOpen(false)}
                      className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                    >
                      Yopish
                    </button>
                  </div>
                  <TelegramBotSimulator
                    phone={phone}
                    firstName={firstName}
                    lastName={lastName}
                    onCodeReceived={(code) => {
                      setVerificationCode(code);
                      setIsBotSimulatorOpen(false);
                    }}
                    onClose={() => setIsBotSimulatorOpen(false)}
                  />
                </div>
              )}

              {/* Code Input Form */}
              <form onSubmit={handleVerifyAndRegister} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      6 xonali tasdiqlash kodi
                    </label>
                    <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded-md border border-blue-100 dark:border-blue-900/50">
                      {formatTimer(countdown)}
                    </span>
                  </div>

                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="Masalan: 849201"
                    className="w-full text-center py-3 rounded-2xl border-2 border-blue-600/60 dark:border-blue-500/60 bg-white dark:bg-slate-800 text-xl font-mono font-extrabold tracking-widest text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading || verificationCode.length < 6}
                  className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Tekshirilmoqda...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      <span>Tasdiqlash va Hisobni faollashtirish</span>
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between text-xs pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMessage(null);
                      setMode('register');
                    }}
                    className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
                  >
                    ← Raqamni o‘zgartirish
                  </button>

                  <button
                    type="button"
                    onClick={handleResendCode}
                    className="text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer"
                  >
                    Kodni qayta yuborish
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

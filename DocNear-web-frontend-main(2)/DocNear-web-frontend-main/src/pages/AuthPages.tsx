import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAppointments } from '../context/AppointmentContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { telegramAuthService } from '../services/telegramAuthService';
import { TelegramBotSimulator } from '../components/auth/TelegramBotSimulator';
import {
  HeartPulse,
  Mail,
  Lock,
  User,
  Phone,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Bot,
  ExternalLink,
  Sparkles,
  RefreshCw,
  Eye,
  EyeOff,
  CalendarCheck,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, isLoggedIn, user } = useAuth();
  const { showToast, openBookingModal } = useAppointments();
  const navigate = useNavigate();
  const location = useLocation();

  const returnToBooking = (location.state as any)?.returnToBooking;

  const [identifier, setIdentifier] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // If already logged in, automatically redirect away from login page
  useEffect(() => {
    if (isLoggedIn && user) {
      if (returnToBooking) {
        navigate(-1);
        setTimeout(() => {
          openBookingModal(returnToBooking);
        }, 150);
      } else {
        const dest = (location.state as any)?.from || '/profile';
        navigate(dest, { replace: true });
      }
    }
  }, [isLoggedIn, user, returnToBooking, navigate, location.state, openBookingModal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);
    try {
      await login(identifier, password);
      showToast('Xush kelibsiz! Tizimga muvaffaqiyatli kirdingiz.', 'success');
      
      if (returnToBooking) {
        navigate(-1);
        setTimeout(() => {
          openBookingModal(returnToBooking);
        }, 150);
      } else {
        const dest = (location.state as any)?.from || '/profile';
        navigate(dest, { replace: true });
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Kirishda xatolik yuz berdi.');
    } finally {
      setIsLoading(false);
    }
  };



  return (
    <div className="max-w-md mx-auto px-4 py-12 space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center mx-auto shadow-md shadow-blue-600/20">
          <HeartPulse size={26} />
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          DocNear tizimiga kirish
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {returnToBooking
            ? 'Shifokor qabulini davom ettirish va band qilish uchun hisobingizga kiring.'
            : 'Shifokor qabulini band qilish va uchrashuvlarni boshqarish uchun kiring.'}
        </p>
      </div>

      {returnToBooking && (
        <div className="p-3.5 bg-blue-50 dark:bg-blue-950/40 rounded-2xl border border-blue-200 dark:border-blue-800 text-xs text-blue-900 dark:text-blue-200 flex items-center gap-2.5">
          <CalendarCheck size={18} className="text-blue-600 dark:text-blue-400 shrink-0" />
          <span>Qabulni tasdiqlash uchun avval profilingizga kiring yoki ro'yxatdan o'ting.</span>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle size={15} />
            <span>{errorMsg}</span>
          </div>
        )}

<form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Telefon raqam yoki email
            </label>
            <div className="relative">
              <User size={16} className="absolute left-3.5 top-3.5 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Telefon raqam yoki email"
                className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Parol</label>
              <Link to="/forgot-password" className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline">
                Parolni unutdingizmi?
              </Link>
            </div>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-3.5 text-slate-400 dark:text-slate-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Parolingizni kiriting"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                <span>Kirilmoqda...</span>
              </>
            ) : (
              <>
                <span>Tizimga kirish</span>
                <ArrowRight size={15} />
              </>
            )}
          </button>
        </form>

        <p className="text-xs text-center text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
          Hisobingiz yo‘qmi?{' '}
          <Link
            to="/register"
            state={location.state}
            className="text-blue-600 dark:text-blue-400 font-bold hover:underline"
          >
            Ro‘yxatdan o‘tish
          </Link>
        </p>
      </div>
    </div>
  );
};

export const RegisterPage: React.FC = () => {
  const { register, isLoggedIn, user } = useAuth();
  const { showToast, openBookingModal } = useAppointments();
  const navigate = useNavigate();
  const location = useLocation();

  const returnToBooking = (location.state as any)?.returnToBooking;

  // Automatically redirect if already logged in
  useEffect(() => {
    if (isLoggedIn && user) {
      if (returnToBooking) {
        navigate(-1);
        setTimeout(() => {
          openBookingModal(returnToBooking);
        }, 150);
      } else {
        const dest = (location.state as any)?.from || '/profile';
        navigate(dest, { replace: true });
      }
    }
  }, [isLoggedIn, user, returnToBooking, navigate, location.state, openBookingModal]);

  // Requested fields: Ism, Familiya, Telefon nomer, Parol, Confirm Password
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [phone, setPhone] = useState<string>('+998 ');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

  // Telegram verification step
  const [step, setStep] = useState<'form' | 'telegram_verify'>('form');
  const [verificationCode, setVerificationCode] = useState<string>('');
  const [countdown, setCountdown] = useState<number>(300);
  const [isBotSimulatorOpen, setIsBotSimulatorOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const botUsername = telegramAuthService.getBotUsername();

  useEffect(() => {
    let timer: any;
    if (step === 'telegram_verify' && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanFirst = firstName.trim();
    const cleanLast = lastName.trim();
    const cleanPhone = phone.trim();

    if (!cleanFirst) {
      setErrorMsg('Iltimos, ismingizni kiriting.');
      return;
    }
    if (!cleanLast) {
      setErrorMsg('Iltimos, familiyangizni kiriting.');
      return;
    }
    if (cleanPhone.length < 9) {
      setErrorMsg('Iltimos, to‘liq telefon raqamingizni kiriting (Masalan: +998 90 123 45 67).');
      return;
    }
    if (!password || password.length < 10) {
      setErrorMsg('Parol kamida 10 ta belgidan iborat bo‘lishi kerak.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Parol va parolni tasdiqlash mos kelmadi. Iltimos, tekshiring.');
      return;
    }

    try {
      await register({ firstName: cleanFirst, lastName: cleanLast, phone: cleanPhone, password });
      navigate('/');
      showToast('Ro‘yxatdan o‘tildi', 'success');
    } catch (error) { setErrorMsg(error instanceof Error ? error.message : 'Ro‘yxatdan o‘tish bajarilmadi'); }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!verificationCode.trim() || verificationCode.trim().length < 6) {
      setErrorMsg('Iltimos, 6 xonali tasdiqlash kodini to‘liq kiriting.');
      return;
    }

    setIsLoading(true);
    try {
      const verifyRes = telegramAuthService.verifyCode(phone, verificationCode);
      if (!verifyRes.success) {
        setErrorMsg(verifyRes.message);
        setIsLoading(false);
        return;
      }

      await register({
        firstName,
        lastName,
        phone,
        password,
      });

      showToast(`Tabriklaymiz, ${firstName}! Ro'yxatdan muvaffaqiyatli o'tdingiz.`, 'success');
      
      if (returnToBooking) {
        navigate(-1);
        setTimeout(() => {
          openBookingModal(returnToBooking);
        }, 150);
      } else {
        const dest = (location.state as any)?.from || '/profile';
        navigate(dest, { replace: true });
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Ro‘yxatdan o‘tishda xatolik yuz berdi.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = () => {
    telegramAuthService.resendCode(phone, firstName, lastName);
    setCountdown(300);
    setVerificationCode('');
    showToast('Yangi tasdiqlash kodi tayyorlandi.', 'info');
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-12 space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center mx-auto shadow-md shadow-blue-600/20">
          <HeartPulse size={26} />
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {step === 'form' ? 'Bemor hisobini yaratish' : 'Telegram orqali tasdiqlash'}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {step === 'form'
            ? 'Bir necha soniyada ro‘yxatdan o‘ting va shifokor qabulini band qiling.'
            : 'Xavfsizlik uchun @' + botUsername + ' boti orqali tasdiqlash kodini oling.'}
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle size={16} className="text-rose-600 dark:text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {step === 'form' ? (
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Ism */}
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
                    placeholder="Jasur"
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              {/* Familiya */}
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
                    placeholder="Alimov"
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
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
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                <Bot size={12} className="text-blue-600 dark:text-blue-400" />
                <span>Tasdiqlash kodi @{botUsername} orqali beriladi</span>
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
                    className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
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
                    className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
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
              className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Davom etish (Telegram orqali tasdiqlash)</span>
              <ArrowRight size={15} />
            </button>
          </form>
        ) : (
          <div className="space-y-5">
            {/* Instructions box */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-950/40 dark:to-blue-950/40 border border-sky-200/80 dark:border-sky-800/60 space-y-3">
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
                  <span>Bot bergan 6 xonali tasdiqlash kodini kiriting</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsBotSimulatorOpen(true)}
                  className="py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
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

            {/* Embedded Bot Simulator */}
            {isBotSimulatorOpen && (
              <div className="p-3 bg-slate-950/5 dark:bg-slate-800/40 rounded-3xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Interaktiv Telegram Bot
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsBotSimulatorOpen(false)}
                    className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
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

            {/* Code Input */}
            <form onSubmit={handleVerifySubmit} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    6 xonali tasdiqlash kodi
                  </label>
                  <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded-md">
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
                  className="w-full text-center py-3 rounded-2xl border-2 border-blue-600/60 dark:border-blue-500 bg-white dark:bg-slate-800 text-xl font-mono font-extrabold tracking-widest text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || verificationCode.length < 6}
                className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Tekshirilmoqda...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    <span>Tasdiqlash va Ro‘yxatdan o‘tish</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg(null);
                    setStep('form');
                  }}
                  className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
                >
                  ← Raqamni o‘zgartirish
                </button>

                <button
                  type="button"
                  onClick={handleResend}
                  className="text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer"
                >
                  Kodni qayta yuborish
                </button>
              </div>
            </form>
          </div>
        )}

        <p className="text-xs text-center text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
          Hisobingiz bormi?{' '}
          <Link
            to="/login"
            state={location.state}
            className="text-blue-600 dark:text-blue-400 font-bold hover:underline"
          >
            Tizimga kirish
          </Link>
        </p>
      </div>
    </div>
  );
};

export const ForgotPasswordPage: React.FC = () => {
  const { showToast } = useAppointments();
  const [email, setEmail] = useState<string>('');
  const [submitted, setSubmitted] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    showToast('Parolni tiklash havolasi emailingizga yuborildi.', 'info');
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Parolni tiklash
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Ro‘yxatdan o‘tgan email yoki telefoningizni kiriting.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
        {submitted ? (
          <div className="text-center space-y-3 py-4">
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 size={24} />
            </div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Email pochtangizni tekshiring</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Qayta tiklash ko‘rsatmalari <strong className="text-slate-700 dark:text-slate-200">{email}</strong> manziliga yuborildi.
            </p>
            <Link
              to="/login"
              className="inline-block mt-2 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
            >
              Kirish sahifasiga qaytish
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Email manzil</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-3 text-slate-400 dark:text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="yourname@example.com"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              Havolani yuborish
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

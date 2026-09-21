import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, Bot, HeartPulse, Phone, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAppointments } from '../context/AppointmentContext';
import { formatUzPhoneInput, normalizeUzPhone, validE164Phone } from '../utils/phone';
import { ApiError } from '../services/apiClient';

function PhoneAuthPage({ purpose }: { purpose: 'login' | 'register' }) {
  const { createTelegramHandoff, verifyOtp, isLoggedIn } = useAuth();
  const { showToast } = useAppointments();
  const navigate = useNavigate();
  const location = useLocation();
  const [phone, setPhone] = useState(() => formatUzPhoneInput((location.state as { phone?: string } | null)?.phone || '+998'));
  const [code, setCode] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [errorCode, setErrorCode] = useState('');
  const [botUrl, setBotUrl] = useState('');
  const inFlight = useRef(false);
  const phoneInput = useRef<HTMLInputElement>(null);

  useEffect(() => { if (isLoggedIn) navigate((location.state as any)?.from || '/profile', { replace: true }); }, [isLoggedIn, location.state, navigate]);

  function openTelegram(url: string) {
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  function updatePhone(value: string, caret: number | null) {
    const formatted = formatUzPhoneInput(value);
    const formattedCaret = formatUzPhoneInput(value.slice(0, caret ?? value.length)).length;
    setPhone(formatted);
    requestAnimationFrame(() => phoneInput.current?.setSelectionRange(formattedCaret, formattedCaret));
  }

  async function startTelegramHandoff() {
    if (inFlight.current) return;
    setError('');
    setErrorCode('');
    const normalized = normalizeUzPhone(phone);
    if (!validE164Phone(normalized)) { setError('Telefon raqamini to‘g‘ri kiriting. Masalan: +998901234567'); return; }
    if (purpose === 'register' && !firstName.trim()) { setError('Ismingizni kiriting.'); return; }
    inFlight.current = true;
    setBusy(true);
    try {
      setPhone(formatUzPhoneInput(normalized));
      const url = await createTelegramHandoff({ phone: normalized, purpose, firstName, lastName });
      setBotUrl(url);
      setCode('');
      setStep('code');
      openTelegram(url);
      showToast('Telegram botda telefon raqamingizni yuboring.', 'success');
    } catch (e) {
      const code = e instanceof ApiError ? e.code : '';
      setErrorCode(code);
      setError(code === 'account_already_exists'
        ? 'Bu telefon raqami bilan hisob allaqachon mavjud.'
        : code === 'account_not_found'
          ? 'Bu telefon raqami uchun hisob topilmadi.'
          : e instanceof ApiError
            ? e.message
            : 'Kodni yuborib bo‘lmadi.');
    }
    finally { inFlight.current = false; setBusy(false); }
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    if (inFlight.current) return;
    setError('');
    if (!/^\d{6}$/.test(code)) { setError('6 xonali tasdiqlash kodini kiriting.'); return; }
    inFlight.current = true;
    setBusy(true);
    try { await verifyOtp({ phone: normalizeUzPhone(phone), code, purpose }); showToast('Telefon raqamingiz tasdiqlandi.', 'success'); }
    catch (e) { setError(e instanceof Error ? e.message : 'Kod tasdiqlanmadi.'); }
    finally { inFlight.current = false; setBusy(false); }
  }

  return <div className="max-w-md mx-auto px-4 py-12"><div className="bg-white dark:bg-slate-900 rounded-3xl p-7 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
    <div className="text-center"><HeartPulse className="mx-auto text-blue-600" size={38}/><h1 className="text-2xl font-extrabold mt-3">{purpose === 'login' ? 'Telefon orqali kirish' : 'Bemor hisobini yaratish'}</h1><p className="text-sm text-slate-500 mt-1">{purpose === 'login' ? 'Kirish kodi so‘raladi.' : 'Ro‘yxatdan o‘tish kodi so‘raladi.'} Email va parol talab qilinmaydi.</p></div>
    {error && <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-sm space-y-2"><div className="flex gap-2"><AlertCircle size={18}/>{error}</div>
      {errorCode === 'account_already_exists' && <Link className="block font-bold underline" to="/login" state={{ phone: normalizeUzPhone(phone) }}>Kirish sahifasiga o‘tish</Link>}
      {errorCode === 'account_not_found' && <Link className="block font-bold underline" to="/register" state={{ phone: normalizeUzPhone(phone) }}>Ro‘yxatdan o‘tish</Link>}
    </div>}
    {step === 'phone' ? <div className="space-y-4">
      {purpose === 'register' && <div className="grid grid-cols-2 gap-3"><input disabled={busy} className="border rounded-xl p-3" value={firstName} onChange={e=>setFirstName(e.target.value)} placeholder="Ism"/><input disabled={busy} className="border rounded-xl p-3" value={lastName} onChange={e=>setLastName(e.target.value)} placeholder="Familiya"/></div>}
      <label className="block text-sm font-semibold">Telefon raqamingizni kiriting<input ref={phoneInput} disabled={busy} className="mt-1 w-full border rounded-xl p-3" type="tel" inputMode="numeric" value={phone} onChange={e=>updatePhone(e.target.value, e.target.selectionStart)} placeholder="+998 90 123 45 67" autoComplete="tel"/></label>
      <button disabled={busy} onClick={startTelegramHandoff} className="w-full bg-blue-600 text-white rounded-xl p-3 font-bold flex justify-center gap-2"><Bot size={18}/>{busy ? 'Kutilmoqda...' : 'Tasdiqlash kodini olish'}</button>
    </div> : <form onSubmit={verify} className="space-y-4">
      <p className="text-sm text-center">Kod yuborilgan raqam: {phone}</p>
      <p className="text-sm text-slate-600 text-center">Tasdiqlash kodi Telegram bot orqali yuboriladi.<br/>Botda telefon raqamingizni yuboring, keyin olgan 6 xonali kodni shu yerga kiriting.</p>
      <label className="block text-sm font-semibold">Tasdiqlash kodini kiriting<input disabled={busy} autoComplete="one-time-code" className="mt-1 w-full border rounded-xl p-3 tracking-[0.4em] text-center" inputMode="numeric" maxLength={6} value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,'').slice(0,6))} onPaste={e=>{e.preventDefault();setCode(e.clipboardData.getData('text').replace(/\D/g,'').slice(0,6))}}/></label>
      <button disabled={busy} className="w-full bg-blue-600 text-white rounded-xl p-3 font-bold flex justify-center gap-2"><ShieldCheck size={18}/>{busy ? 'Tekshirilmoqda...' : 'Tasdiqlash'}</button>
      <p className="text-xs text-slate-500 text-center">Faqat oxirgi yuborilgan kod amal qiladi.</p>
      <button type="button" disabled={busy || !botUrl} onClick={()=>openTelegram(botUrl)} className="w-full text-blue-600 flex justify-center gap-2"><Bot size={16}/>Telegram botni qayta ochish</button>
      <button type="button" disabled={busy} onClick={()=>{setStep('phone');setCode('');setBotUrl('');setError('');setErrorCode('')}} className="w-full text-sm text-blue-600">Telefon raqamini o‘zgartirish</button>
    </form>}
    <p className="text-center text-sm">{purpose === 'login' ? <>Hisobingiz yo‘qmi? <Link aria-disabled={busy} onClick={e=>{if(busy)e.preventDefault()}} className="text-blue-600 font-bold" to="/register">Ro‘yxatdan o‘tish</Link></> : <>Hisobingiz bormi? <Link aria-disabled={busy} onClick={e=>{if(busy)e.preventDefault()}} className="text-blue-600 font-bold" to="/login">Kirish</Link></>}</p>
  </div></div>;
}

export const LoginPage = () => <PhoneAuthPage purpose="login"/>;
export const RegisterPage = () => <PhoneAuthPage purpose="register"/>;
export const ForgotPasswordPage = () => <div className="max-w-md mx-auto p-8 text-center"><Phone className="mx-auto"/><h1 className="text-xl font-bold mt-3">Parol talab qilinmaydi</h1><p className="mt-2">Telefon raqamingizga yuborilgan tasdiqlash kodi orqali kiring.</p><Link className="text-blue-600 font-bold" to="/login">Kirish sahifasiga qaytish</Link></div>;

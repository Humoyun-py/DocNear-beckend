import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, Bot, HeartPulse, Phone, RefreshCw, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAppointments } from '../context/AppointmentContext';
import { useOtpCooldown } from '../hooks/useOtpCooldown';
import { normalizeUzPhone, validE164Phone } from '../utils/phone';
import { isOtpRateLimited } from '../services/apiClient';

const telegramBotUsername = (import.meta.env.VITE_TELEGRAM_BOT_USERNAME || '').trim().replace(/^@/, '');
const telegramBotUrl = telegramBotUsername ? `https://t.me/${telegramBotUsername}` : '';

function PhoneAuthPage({ purpose }: { purpose: 'login' | 'register' }) {
  const { requestOtp, verifyOtp, isLoggedIn } = useAuth();
  const { showToast } = useAppointments();
  const navigate = useNavigate();
  const location = useLocation();
  const [phone, setPhone] = useState('+998');
  const [code, setCode] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [lastChannel, setLastChannel] = useState<'sms' | 'telegram'>('sms');
  const cooldown = useOtpCooldown();
  const inFlight = useRef(false);

  useEffect(() => { if (isLoggedIn) navigate((location.state as any)?.from || '/profile', { replace: true }); }, [isLoggedIn, location.state, navigate]);

  async function send(channel: 'sms' | 'telegram') {
    if (inFlight.current || cooldown.seconds > 0) return;
    setError('');
    const normalized = normalizeUzPhone(phone);
    if (!validE164Phone(normalized)) { setError('Telefon raqamini to‘g‘ri kiriting. Masalan: +998901234567'); return; }
    if (purpose === 'register' && !firstName.trim()) { setError('Ismingizni kiriting.'); return; }
    inFlight.current = true;
    setBusy(true);
    try {
      setPhone(normalized);
      await requestOtp({ phone: normalized, purpose, channel, firstName, lastName });
      setLastChannel(channel);
      setCode('');
      setStep('code');
      cooldown.start();
      showToast(channel === 'sms' ? 'Tasdiqlash kodi SMS orqali yuborildi.' : 'Tasdiqlash kodi Telegram orqali yuborildi.', 'success');
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Kodni yuborib bo‘lmadi.';
      setError(message);
      if (isOtpRateLimited(e)) cooldown.start();
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
    try { await verifyOtp({ phone, code, purpose }); showToast('Telefon raqamingiz tasdiqlandi.', 'success'); }
    catch (e) { setError(e instanceof Error ? e.message : 'Kod tasdiqlanmadi.'); }
    finally { inFlight.current = false; setBusy(false); }
  }

  return <div className="max-w-md mx-auto px-4 py-12"><div className="bg-white dark:bg-slate-900 rounded-3xl p-7 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
    <div className="text-center"><HeartPulse className="mx-auto text-blue-600" size={38}/><h1 className="text-2xl font-extrabold mt-3">{purpose === 'login' ? 'Telefon orqali kirish' : 'Bemor hisobini yaratish'}</h1><p className="text-sm text-slate-500 mt-1">{purpose === 'login' ? 'Kirish kodi so‘raladi.' : 'Ro‘yxatdan o‘tish kodi so‘raladi.'} Email va parol talab qilinmaydi.</p></div>
    {error && <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-sm flex gap-2"><AlertCircle size={18}/>{error}</div>}
    {step === 'phone' ? <div className="space-y-4">
      {purpose === 'register' && <div className="grid grid-cols-2 gap-3"><input disabled={busy} className="border rounded-xl p-3" value={firstName} onChange={e=>setFirstName(e.target.value)} placeholder="Ism"/><input disabled={busy} className="border rounded-xl p-3" value={lastName} onChange={e=>setLastName(e.target.value)} placeholder="Familiya"/></div>}
      <label className="block text-sm font-semibold">Telefon raqamingizni kiriting<input disabled={busy} className="mt-1 w-full border rounded-xl p-3" type="tel" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+998901234567" autoComplete="tel"/></label>
      <button disabled={busy || cooldown.seconds > 0} onClick={()=>send('sms')} className="w-full bg-blue-600 text-white rounded-xl p-3 font-bold flex justify-center gap-2"><Phone size={18}/>{busy ? 'Yuborilmoqda...' : 'Tasdiqlash kodini yuborish'}</button>
      <button disabled={busy || cooldown.seconds > 0} onClick={()=>send('telegram')} className="w-full border rounded-xl p-3 font-bold flex justify-center gap-2"><Bot size={18}/>Kodni Telegram orqali olish</button>
      {cooldown.seconds > 0 && <p role="status" className="text-sm text-center">Qayta yuborish ({cooldown.seconds}s)</p>}
      <p className="text-xs text-slate-500">Telegram uchun avval DocNear botida telefon raqamingizni ulashing.</p>
      {telegramBotUrl && <a href={telegramBotUrl} target="_blank" rel="noreferrer" className="block text-center text-sm text-blue-600 font-bold">Telegram botni ochish</a>}
    </div> : <form onSubmit={verify} className="space-y-4">
      <p className="text-sm text-center">Kod yuborilgan raqam: {phone}</p>
      <label className="block text-sm font-semibold">Tasdiqlash kodini kiriting<input disabled={busy} autoComplete="one-time-code" className="mt-1 w-full border rounded-xl p-3 tracking-[0.4em] text-center" inputMode="numeric" maxLength={6} value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,'').slice(0,6))} onPaste={e=>{e.preventDefault();setCode(e.clipboardData.getData('text').replace(/\D/g,'').slice(0,6))}}/></label>
      <button disabled={busy} className="w-full bg-blue-600 text-white rounded-xl p-3 font-bold flex justify-center gap-2"><ShieldCheck size={18}/>{busy ? 'Tekshirilmoqda...' : 'Tasdiqlash'}</button>
      <p className="text-xs text-slate-500 text-center">Faqat oxirgi yuborilgan kod amal qiladi.</p>
      <button type="button" disabled={busy || cooldown.seconds > 0} onClick={()=>send(lastChannel)} className="w-full text-blue-600 flex justify-center gap-2"><RefreshCw size={16}/>{cooldown.seconds > 0 ? `Qayta yuborish (${cooldown.seconds}s)` : 'Kodni qayta yuborish'}</button>
      <button type="button" disabled={busy} onClick={()=>{setStep('phone');setCode('');setError('')}} className="w-full text-sm text-blue-600">Telefon raqamini o‘zgartirish</button>
    </form>}
    <p className="text-center text-sm">{purpose === 'login' ? <>Hisobingiz yo‘qmi? <Link aria-disabled={busy} onClick={e=>{if(busy)e.preventDefault()}} className="text-blue-600 font-bold" to="/register">Ro‘yxatdan o‘tish</Link></> : <>Hisobingiz bormi? <Link aria-disabled={busy} onClick={e=>{if(busy)e.preventDefault()}} className="text-blue-600 font-bold" to="/login">Kirish</Link></>}</p>
  </div></div>;
}

export const LoginPage = () => <PhoneAuthPage purpose="login"/>;
export const RegisterPage = () => <PhoneAuthPage purpose="register"/>;
export const ForgotPasswordPage = () => <div className="max-w-md mx-auto p-8 text-center"><Phone className="mx-auto"/><h1 className="text-xl font-bold mt-3">Parol talab qilinmaydi</h1><p className="mt-2">Telefon raqamingizga yuborilgan tasdiqlash kodi orqali kiring.</p><Link className="text-blue-600 font-bold" to="/login">Kirish sahifasiga qaytish</Link></div>;

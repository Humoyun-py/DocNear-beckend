import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, Bot, HeartPulse, Phone, RefreshCw, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAppointments } from '../context/AppointmentContext';

const phonePattern = /^\+[1-9]\d{7,14}$/;
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

  useEffect(() => { if (isLoggedIn) navigate((location.state as any)?.from || '/profile', { replace: true }); }, [isLoggedIn, location.state, navigate]);

  async function send(channel: 'sms' | 'telegram') {
    setError('');
    if (!phonePattern.test(phone)) { setError('Telefon raqamni xalqaro formatda kiriting: +998901234567'); return; }
    if (purpose === 'register' && !firstName.trim()) { setError('Ismingizni kiriting.'); return; }
    setBusy(true);
    try {
      await requestOtp({ phone, purpose, channel, firstName, lastName });
      setStep('code');
      showToast(channel === 'sms' ? 'Tasdiqlash kodi SMS orqali yuborildi.' : 'Tasdiqlash kodi Telegram orqali yuborildi.', 'success');
    } catch (e) { setError(e instanceof Error ? e.message : 'Kodni yuborib bo‘lmadi.'); }
    finally { setBusy(false); }
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault(); setError('');
    if (!/^\d{6}$/.test(code)) { setError('6 xonali tasdiqlash kodini kiriting.'); return; }
    setBusy(true);
    try { await verifyOtp({ phone, code, purpose }); showToast('Telefon raqamingiz tasdiqlandi.', 'success'); }
    catch (e) { setError(e instanceof Error ? e.message : 'Kod tasdiqlanmadi.'); }
    finally { setBusy(false); }
  }

  return <div className="max-w-md mx-auto px-4 py-12"><div className="bg-white dark:bg-slate-900 rounded-3xl p-7 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
    <div className="text-center"><HeartPulse className="mx-auto text-blue-600" size={38}/><h1 className="text-2xl font-extrabold mt-3">{purpose === 'login' ? 'Telefon orqali kirish' : 'Bemor hisobini yaratish'}</h1><p className="text-sm text-slate-500 mt-1">Email va parol talab qilinmaydi.</p></div>
    {error && <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-sm flex gap-2"><AlertCircle size={18}/>{error}</div>}
    {step === 'phone' ? <div className="space-y-4">
      {purpose === 'register' && <div className="grid grid-cols-2 gap-3"><input className="border rounded-xl p-3" value={firstName} onChange={e=>setFirstName(e.target.value)} placeholder="Ism"/><input className="border rounded-xl p-3" value={lastName} onChange={e=>setLastName(e.target.value)} placeholder="Familiya"/></div>}
      <label className="block text-sm font-semibold">Telefon raqamingizni kiriting<input className="mt-1 w-full border rounded-xl p-3" type="tel" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+998901234567" autoComplete="tel"/></label>
      <button disabled={busy} onClick={()=>send('sms')} className="w-full bg-blue-600 text-white rounded-xl p-3 font-bold flex justify-center gap-2"><Phone size={18}/>{busy ? 'Yuborilmoqda...' : 'Tasdiqlash kodini yuborish'}</button>
      <button disabled={busy} onClick={()=>send('telegram')} className="w-full border rounded-xl p-3 font-bold flex justify-center gap-2"><Bot size={18}/>Kodni Telegram orqali olish</button>
      <p className="text-xs text-slate-500">Telegram uchun avval DocNear botida telefon raqamingizni ulashing.</p>
      {telegramBotUrl && <a href={telegramBotUrl} target="_blank" rel="noreferrer" className="block text-center text-sm text-blue-600 font-bold">Telegram botni ochish</a>}
    </div> : <form onSubmit={verify} className="space-y-4">
      <label className="block text-sm font-semibold">Tasdiqlash kodini kiriting<input className="mt-1 w-full border rounded-xl p-3 tracking-[0.4em] text-center" inputMode="numeric" maxLength={6} value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,''))}/></label>
      <button disabled={busy} className="w-full bg-blue-600 text-white rounded-xl p-3 font-bold flex justify-center gap-2"><ShieldCheck size={18}/>{busy ? 'Tekshirilmoqda...' : 'Tasdiqlash'}</button>
      <button type="button" disabled={busy} onClick={()=>send('sms')} className="w-full text-blue-600 flex justify-center gap-2"><RefreshCw size={16}/>Kodni qayta yuborish</button>
    </form>}
    <p className="text-center text-sm">{purpose === 'login' ? <>Hisobingiz yo‘qmi? <Link className="text-blue-600 font-bold" to="/register">Ro‘yxatdan o‘tish</Link></> : <>Hisobingiz bormi? <Link className="text-blue-600 font-bold" to="/login">Kirish</Link></>}</p>
  </div></div>;
}

export const LoginPage = () => <PhoneAuthPage purpose="login"/>;
export const RegisterPage = () => <PhoneAuthPage purpose="register"/>;
export const ForgotPasswordPage = () => <div className="max-w-md mx-auto p-8 text-center"><Phone className="mx-auto"/><h1 className="text-xl font-bold mt-3">Parol talab qilinmaydi</h1><p className="mt-2">Telefon raqamingizga yuborilgan tasdiqlash kodi orqali kiring.</p><Link className="text-blue-600 font-bold" to="/login">Kirish sahifasiga qaytish</Link></div>;

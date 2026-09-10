import React, { useState, useEffect } from 'react';
import { Send, Check, Copy, Bot, User, Phone, Sparkles, ExternalLink, RefreshCw, X, ShieldCheck } from 'lucide-react';
import { telegramAuthService, TelegramAuthSession } from '../../services/telegramAuthService';

interface TelegramBotSimulatorProps {
  phone: string;
  firstName: string;
  lastName: string;
  onCodeReceived?: (code: string) => void;
  onClose?: () => void;
}

interface Message {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  time: string;
  isAction?: boolean;
  codeCard?: string;
  showSharePhoneBtn?: boolean;
}

export const TelegramBotSimulator: React.FC<TelegramBotSimulatorProps> = ({
  phone,
  firstName,
  lastName,
  onCodeReceived,
  onClose,
}) => {
  const [session, setSession] = useState<TelegramAuthSession>(() =>
    telegramAuthService.getActiveSession(phone) || telegramAuthService.startVerification(phone, firstName, lastName)
  );

  const [hasStarted, setHasStarted] = useState<boolean>(false);
  const [phoneShared, setPhoneShared] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm1',
      sender: 'bot',
      text: `Assalomu alaykum, ${firstName || 'Foydalanuvchi'}!\nDocNear tibbiyot platformasining rasmiy autentifikatsiya botiga xush kelibsiz.\n\nDavom etish uchun quyidagi /start tugmasini bosing.`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [inputVal, setInputVal] = useState<string>('');

  const botUsername = telegramAuthService.getBotUsername();

  const handleStart = () => {
    setHasStarted(true);
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setMessages((prev) => [
      ...prev,
      {
        id: `u-${Date.now()}`,
        sender: 'user',
        text: '/start',
        time: nowTime,
      },
    ]);

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: `b-${Date.now()}`,
          sender: 'bot',
          text: `Iltimos, ro'yxatdan o'tgan telefon raqamingizni (${phone}) tasdiqlash uchun 'Telefon raqamni yuborish' tugmasini bosing yoki raqamingizni xabar sifatida yozib yuboring.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          showSharePhoneBtn: true,
        },
      ]);
    }, 600);
  };

  const handleSharePhone = () => {
    setPhoneShared(true);
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // User shares phone
    setMessages((prev) => [
      ...prev.map((m) => ({ ...m, showSharePhoneBtn: false })),
      {
        id: `u-${Date.now()}`,
        sender: 'user',
        text: `Mening kontaktim: ${phone}`,
        time: nowTime,
      },
    ]);

    // Bot generates and issues confirmation code
    setTimeout(() => {
      const activeSession = telegramAuthService.getActiveSession(phone) || telegramAuthService.startVerification(phone, firstName, lastName);
      setSession(activeSession);

      setMessages((prev) => [
        ...prev,
        {
          id: `b-${Date.now()}`,
          sender: 'bot',
          text: `Telefon raqamingiz muvaffaqiyatli qabul qilindi va tasdiqlandi!\n\nSizning 6 xonali tasdiqlash kodingiz:`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          codeCard: activeSession.code,
        },
      ]);

      if (onCodeReceived) {
        onCodeReceived(activeSession.code);
      }
    }, 700);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;

    const userText = inputVal.trim();
    setInputVal('');
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setMessages((prev) => [
      ...prev,
      {
        id: `u-${Date.now()}`,
        sender: 'user',
        text: userText,
        time: nowTime,
      },
    ]);

    if (!hasStarted && userText.toLowerCase().includes('start')) {
      handleStart();
      return;
    }

    if (hasStarted && !phoneShared) {
      handleSharePhone();
      return;
    }

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: `b-${Date.now()}`,
          sender: 'bot',
          text: `Sizning tasdiqlash kodingiz: ${session.code}. Uni ro'yxatdan o'tish oynasiga kiriting.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          codeCard: session.code,
        },
      ]);
    }, 600);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    if (onCodeReceived) {
      onCodeReceived(code);
    }
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="bg-slate-900 text-slate-100 rounded-3xl overflow-hidden border border-slate-700 shadow-2xl flex flex-col max-w-md w-full mx-auto">
      {/* Header */}
      <div className="bg-[#242F3D] px-4 py-3 border-b border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-sky-400 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20">
            <Bot size={22} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="font-bold text-sm text-white">DocNear Security Bot</h4>
              <ShieldCheck size={14} className="text-sky-400" />
            </div>
            <p className="text-[11px] text-sky-300">@{botUsername} • bot</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={`https://t.me/${botUsername}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-lg bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 text-xs flex items-center gap-1 transition-colors"
            title="Telegram ilovasida ochish"
          >
            <ExternalLink size={13} />
            <span className="hidden sm:inline text-[11px] font-semibold">Telegram'da</span>
          </a>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/60 transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="p-4 bg-[#0E1621] space-y-3 min-h-[300px] max-h-[360px] overflow-y-auto flex flex-col justify-start text-xs">
        <div className="text-center my-1">
          <span className="px-2.5 py-1 rounded-full bg-slate-800/80 text-[10px] text-slate-400 border border-slate-700">
            DocNear Rasmiy Verifikatsiya Boti
          </span>
        </div>

        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'} max-w-[88%] ${
              m.sender === 'user' ? 'self-end' : 'self-start'
            }`}
          >
            <div
              className={`p-3 rounded-2xl ${
                m.sender === 'user'
                  ? 'bg-blue-600 text-white rounded-br-xs'
                  : 'bg-[#182533] text-slate-100 border border-slate-700/60 rounded-bl-xs'
              }`}
            >
              <p className="whitespace-pre-line leading-relaxed">{m.text}</p>

              {/* Code Card presentation */}
              {m.codeCard && (
                <div className="mt-3 p-3 bg-blue-950/80 rounded-xl border border-blue-500/40 text-center space-y-2">
                  <div className="text-[10px] uppercase font-bold text-sky-400 tracking-wider">
                    Tasdiqlash Kodi
                  </div>
                  <div className="text-2xl font-black font-mono tracking-widest text-white py-1">
                    {m.codeCard}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyCode(m.codeCard!)}
                    className="w-full py-1.5 px-3 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check size={14} className="text-emerald-950" />
                        <span>Kodi nusxalandi & Kiritildi!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        <span>Kodni nusxalash & Kiritish</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Inline phone share prompt */}
              {m.showSharePhoneBtn && (
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={handleSharePhone}
                    className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-colors cursor-pointer"
                  >
                    <Phone size={14} />
                    <span>Telefon raqamni yuborish ({phone})</span>
                  </button>
                </div>
              )}
            </div>
            <span className="text-[10px] text-slate-500 mt-1 px-1">{m.time}</span>
          </div>
        ))}
      </div>

      {/* Bot Bottom Controls */}
      <div className="p-3 bg-[#17212B] border-t border-slate-700/80 space-y-2">
        {!hasStarted ? (
          <button
            type="button"
            onClick={handleStart}
            className="w-full py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20 transition-all cursor-pointer"
          >
            <Sparkles size={16} />
            <span>/start buyrug'ini yuborish</span>
          </button>
        ) : !phoneShared ? (
          <button
            type="button"
            onClick={handleSharePhone}
            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
          >
            <Phone size={15} />
            <span>Telefon raqamni yuborish ({phone})</span>
          </button>
        ) : (
          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Xabar yozing..."
              className="flex-1 px-3 py-2 rounded-xl bg-[#242F3D] border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
            />
            <button
              type="submit"
              className="p-2 rounded-xl bg-sky-500 text-slate-950 hover:bg-sky-400 transition-colors cursor-pointer"
            >
              <Send size={15} />
            </button>
          </form>
        )}

        <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 pt-1">
          <span>Raqam: <strong className="text-slate-200">{phone}</strong></span>
          <button
            type="button"
            onClick={() => {
              const newS = telegramAuthService.resendCode(phone, firstName, lastName);
              setSession(newS);
              handleStart();
            }}
            className="text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw size={11} />
            <span>Qayta boshlash</span>
          </button>
        </div>
      </div>
    </div>
  );
};

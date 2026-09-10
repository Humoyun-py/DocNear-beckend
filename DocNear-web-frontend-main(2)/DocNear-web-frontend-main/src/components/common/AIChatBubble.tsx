import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Sparkles,
  X,
  Send,
  Minimize2,
  Maximize2,
  Stethoscope,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  HelpCircle,
  Volume2,
  VolumeX,
  Check,
  ChevronRight,
  MessageSquare,
  ShieldCheck,
  ExternalLink,
  Mic,
  MicOff,
  Copy,
  Pill,
  Activity,
  Heart,
  Baby,
  Smile,
  Apple,
  Trash2,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { triggerHaptic } from '../../utils/haptics';
import { getSpecialtyName } from '../../utils/specialtyTranslations';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  recommendedSpecialties?: string[];
  suggestedQuestions?: string[];
  isEmergencyWarning?: boolean;
  timestamp: number;
}

export const AIChatBubble: React.FC = () => {
  const { language, t } = useLanguage();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [inputValue, setInputValue] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasUnread, setHasUnread] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState<boolean>(false);

  const getInitialWelcomeMessage = (): ChatMessage => ({
    id: 'welcome-msg',
    role: 'model',
    content:
      language === 'uz'
        ? "Assalomu alaykum! Men **DocNear AI** universal tibbiy maslahatchisiman.\n\nMenga **istalgan tibbiy va salomatlik savollaringizni** berishingiz mumkin:\n\n* **Alomatlar & Tashxis:** Qayeringiz og'riyotgani yoki bezovtalik sababini tahlil qilamiz.\n* **Dori va Vitaminlar:** Qo'llash usullari, nojo'ya ta'siri va biologik qo'shimchalar.\n* **MRT, UZI & Qon tahlillari:** Tekshiruvlarga to'g'ri tayyorlanish va natijalarni tushunish.\n* **Bolalar & Oila salomatligi:** Isitma, emlash va parvarish.\n* **To'g'ri ovqatlanish & Turmush tarzi:** Parhez, uyqu va stressni kamaytirish.\n\nSizni qanday savol yoki alomat qiziqtirmoqda?"
        : language === 'ru'
        ? "Здравствуйте! Я универсальный медицинский ассистент **DocNear AI**.\n\nВы можете задать мне **абсолютно любой вопрос о здоровье, симптомах, лекарствах и диагностике**:\n\n* **Симптомы и врачи:** Определение причины недомогания и подбор врача.\n* **Лекарства и витамины:** Назначение, совместимость и дозировки.\n* **МРТ, УЗИ и анализы:** Подготовка к процедурам и расшифровка показателей.\n* **Питание и сон:** Диеты, снижение стресса и здоровый образ жизни.\n\nКакой вопрос вас интересует?"
        : "Hello! I am **DocNear AI**, your universal healthcare & medical intelligence assistant.\n\nYou can ask me **anything regarding health, symptoms, medications, lab tests, or wellness**:\n\n* **Symptoms & Doctor Triaging**\n* **Medications, Vitamins & Supplements**\n* **Medical procedures (MRI, CT, Ultrasound, Blood tests)**\n* **Nutrition, Healthy Sleep & Preventive Care**\n\nHow can I help you today?",
    recommendedSpecialties: ['General Practice', 'Cardiology', 'Neurology', 'Pediatrics'],
    suggestedQuestions:
      language === 'uz'
        ? [
            "MRT tahliliga qanday tayyorlanish kerak?",
            "Vitamin D va Magniyni qanday ichish kerak?",
            "Ko'krak qafasida og'riq va qon bosimi",
            "Bosh og'rig'i va charchoq sabablari",
          ]
        : language === 'ru'
        ? [
            "Как подготовиться к МРТ исследованию?",
            "Как правильно принимать витамин D и магний?",
            "Боли в груди и перепады давления",
            "Причины частой головной боли и усталости",
          ]
        : [
            "How to prepare for an MRI scan?",
            "How to properly take Vitamin D & Magnesium?",
            "Chest pain and fluctuating blood pressure",
            "Causes of persistent tension headaches",
          ],
    timestamp: Date.now(),
  });

  const [messages, setMessages] = useState<ChatMessage[]>(() => [getInitialWelcomeMessage()]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isMinimized, isLoading]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
    }
  }, [isOpen, isMinimized]);

  // Stop TTS on unmount or close
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputValue).trim();
    if (!query || isLoading) return;

    triggerHaptic('light');

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Build brief context history
      const historyPayload = messages.slice(-5).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/gemini/medical-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          history: historyPayload,
          language: language || 'uz',
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'model',
        content: data.reply || (language === 'uz' ? "Ma'lumot tayyorlandi." : 'Guidance provided.'),
        recommendedSpecialties: data.recommendedSpecialties || [],
        suggestedQuestions: data.suggestedQuestions || [],
        isEmergencyWarning: data.isEmergencyWarning || false,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, aiMsg]);
      triggerHaptic(data.isEmergencyWarning ? 'warning' : 'medium');
    } catch (err) {
      console.error('Chat error:', err);
      const fallbackMsg: ChatMessage = {
        id: `ai-err-${Date.now()}`,
        role: 'model',
        content:
          language === 'uz'
            ? "Tizim ma'lumotlar bazasidan javob tayyorlandi:\n\n* Shoshilinch hollarda darhol **103 (Tez tibbiy yordam)** ga murojaat qiling.\n* Alomatlaringiz bo'yicha eng yaqin klinikalarni topish uchun quyidagi mutaxassislik tugmasini bosing."
            : "Emergency warning: For acute symptoms, call 103 immediately. You can search for doctors by specialty below.",
        recommendedSpecialties: ['General Practice', 'Cardiology'],
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
      triggerHaptic('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpecialtyClick = (specialty: string) => {
    triggerHaptic('selection');
    setIsOpen(false);
    navigate(`/search?specialty=${encodeURIComponent(specialty)}`);
  };

  const toggleOpen = () => {
    triggerHaptic('medium');
    setIsOpen((prev) => !prev);
    if (!isOpen) {
      setHasUnread(false);
    }
  };

  const handleClearChat = () => {
    triggerHaptic('medium');
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setSpeakingId(null);
    setMessages([getInitialWelcomeMessage()]);
  };

  const handleCopyText = (id: string, text: string) => {
    triggerHaptic('light');
    const cleanText = text.replace(/[*#_]/g, '');
    navigator.clipboard?.writeText(cleanText);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSpeakText = (id: string, text: string) => {
    if (!('speechSynthesis' in window)) return;
    triggerHaptic('light');

    if (speakingId === id) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*#_]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);

    if (language === 'ru') {
      utterance.lang = 'ru-RU';
    } else if (language === 'uz') {
      utterance.lang = 'uz-UZ';
    } else {
      utterance.lang = 'en-US';
    }

    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);

    setSpeakingId(id);
    window.speechSynthesis.speak(utterance);
  };

  // Speech Recognition (Voice Input)
  const toggleSpeechRecognition = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert(language === 'uz' ? 'Brauzeringiz ovozli qidiruvni qo‘llab-quvvatlamaydi' : 'Voice input not supported in this browser');
      return;
    }

    triggerHaptic('medium');

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = language === 'uz' ? 'uz-UZ' : language === 'ru' ? 'ru-RU' : 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0]?.transcript || '';
        if (transcript.trim()) {
          setInputValue(transcript);
          handleSendMessage(transcript);
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.error('Speech recognition error:', e);
      setIsListening(false);
    }
  };

  // Preset topic categories for quick prompts
  const quickTopicCategories = [
    {
      label: language === 'uz' ? 'Alomatlar' : language === 'ru' ? 'Симптомы' : 'Symptoms',
      query:
        language === 'uz'
          ? "Alomatlarim bo'yicha qaysi shifokorga ko'rinish kerakligini qanday bilaman?"
          : "Как определить нужного врача по симптомам?",
    },
    {
      label: language === 'uz' ? 'Dori & Vitaminlar' : language === 'ru' ? 'Витамины' : 'Vitamins',
      query:
        language === 'uz'
          ? "Vitamin D3 va Magniy preparatlarini to'g'ri qabul qilish qoidalari qanday?"
          : "Как правильно принимать витамины D3 и магний?",
    },
    {
      label: language === 'uz' ? 'MRT & UZI' : language === 'ru' ? 'МРТ и УЗИ' : 'MRI & Tests',
      query:
        language === 'uz'
          ? "MRT va UZI tekshiruvlariga qanday tayyorgarlik ko'rish kerak?"
          : "Как правильно подготовиться к МРТ и УЗИ?",
    },
    {
      label: language === 'uz' ? 'Bolalar' : language === 'ru' ? 'Дети' : 'Pediatrics',
      query:
        language === 'uz'
          ? "Bolada isitma ko'tarilganda qanday xavfsiz choralar ko'rish kerak?"
          : "Что делать при высокой температуре у ребенка?",
    },
    {
      label: language === 'uz' ? 'Parhez & Uyqu' : language === 'ru' ? 'Питание' : 'Nutrition',
      query:
        language === 'uz'
          ? "Uyqusizlik va doimiy charchoqni ketkazish uchun nimalar tavsiya etiladi?"
          : "Советы при бессоннице и хронической усталости",
    },
  ];

  // Helper to render markdown bold and bullet points nicely
  const renderFormattedContent = (content: string) => {
    const lines = content.split('\n');
    return (
      <div className="space-y-1.5 text-xs sm:text-sm leading-relaxed">
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          if (!trimmed) return <div key={idx} className="h-1" />;

          // Heading
          if (trimmed.startsWith('### ')) {
            return (
              <h4 key={idx} className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm mt-2 mb-1">
                {trimmed.replace('### ', '')}
              </h4>
            );
          }

          // Bullet points
          if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
            const bulletText = trimmed.substring(2);
            return (
              <div key={idx} className="flex items-start gap-1.5 ml-1">
                <span className="text-blue-500 font-bold leading-none mt-1">•</span>
                <span dangerouslySetInnerHTML={{ __html: formatBoldSpans(bulletText) }} />
              </div>
            );
          }

          return (
            <p
              key={idx}
              dangerouslySetInnerHTML={{ __html: formatBoldSpans(trimmed) }}
              className="text-slate-800 dark:text-slate-200"
            />
          );
        })}
      </div>
    );
  };

  const formatBoldSpans = (text: string) => {
    return text.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-900 dark:text-white">$1</strong>');
  };

  return (
    <div id="docnear-ai-chat-container" className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-40 pointer-events-auto">
      {/* Floating Launcher Button */}
      {!isOpen && (
        <button
          id="btn-open-ai-chat"
          onClick={toggleOpen}
          className="group relative flex items-center gap-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-3 rounded-full shadow-lg hover:shadow-blue-500/25 border border-blue-400/30 transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
          title="DocNear AI Tibbiy Maslahatchi"
          aria-label="Open AI Medical Assistant"
        >
          <div className="relative">
            <Bot size={22} className="group-hover:rotate-12 transition-transform" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 border-2 border-white rounded-full animate-pulse" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-xs font-bold leading-tight flex items-center gap-1">
              DocNear AI <Sparkles size={11} className="text-yellow-300 animate-spin" />
            </span>
            <span className="text-[10px] text-blue-100 font-medium">
              {language === 'uz' ? 'Har qanday tibbiy savol' : language === 'ru' ? 'AI Врач & Советы' : 'Universal Medical AI'}
            </span>
          </div>

          {hasUnread && (
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-500 rounded-full border-2 border-white" />
          )}
        </button>
      )}

      {/* Chat Window Modal */}
      {isOpen && (
        <div
          id="ai-chat-window"
          className={`bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col transition-all duration-200 ${
            isMinimized
              ? 'w-72 h-14'
              : isExpanded
              ? 'w-[96vw] sm:w-[600px] h-[680px] max-h-[90vh]'
              : 'w-[92vw] sm:w-[440px] h-[560px] max-h-[85vh]'
          }`}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-3.5 flex items-center justify-between shadow-sm shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30">
                <Bot size={18} />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-xs sm:text-sm leading-tight">DocNear AI Assistant</h3>
                  <span className="px-1.5 py-0.2 bg-emerald-500/30 text-emerald-200 text-[10px] font-bold rounded-full border border-emerald-300/30">
                    Online
                  </span>
                </div>
                <p className="text-[11px] text-blue-100 leading-none mt-0.5">
                  {language === 'uz' ? 'Tibbiyot, dorilar, tahlillar & shifokorlar' : 'Universal Medical & Healthcare Guide'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleClearChat}
                className="w-7 h-7 rounded-lg hover:bg-white/15 flex items-center justify-center transition-colors text-white/90 hover:text-white cursor-pointer"
                title={language === 'uz' ? 'Yangi suhbat boshlash' : 'New chat'}
                aria-label="Clear chat"
              >
                <RefreshCw size={13} />
              </button>
              <button
                onClick={() => setIsExpanded((p) => !p)}
                className="w-7 h-7 rounded-lg hover:bg-white/15 flex items-center justify-center transition-colors text-white/90 hover:text-white cursor-pointer hidden sm:flex"
                title={isExpanded ? 'Normal view' : 'Expand view'}
                aria-label="Toggle Expand"
              >
                {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              </button>
              <button
                onClick={() => setIsMinimized((p) => !p)}
                className="w-7 h-7 rounded-lg hover:bg-white/15 flex items-center justify-center transition-colors text-white/90 hover:text-white cursor-pointer"
                title={isMinimized ? 'Expand' : 'Minimize'}
                aria-label="Toggle Minimize"
              >
                {isMinimized ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
              </button>
              <button
                onClick={toggleOpen}
                className="w-7 h-7 rounded-lg hover:bg-white/15 flex items-center justify-center transition-colors text-white/90 hover:text-white cursor-pointer"
                title="Close chat"
                aria-label="Close Chat"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Quick Topic Prompts Bar */}
              <div className="bg-slate-100/90 dark:bg-slate-800/80 px-3 py-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
                {quickTopicCategories.map((topic, tIdx) => (
                  <button
                    key={tIdx}
                    onClick={() => handleSendMessage(topic.query)}
                    className="px-2.5 py-1 rounded-full bg-white dark:bg-slate-700 hover:bg-blue-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-[11px] font-semibold whitespace-nowrap border border-slate-200 dark:border-slate-600 shadow-2xs transition-colors cursor-pointer active:scale-95 shrink-0"
                  >
                    {topic.label}
                  </button>
                ))}
              </div>

              {/* Message List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/70 dark:bg-slate-950/70">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${
                      msg.role === 'user' ? 'items-end' : 'items-start'
                    }`}
                  >
                    {/* Role Icon & Label */}
                    <div className="flex items-center gap-1.5 mb-1 px-1 text-[10px] text-slate-400 font-medium">
                      {msg.role === 'user' ? (
                        <span>{language === 'uz' ? 'Siz' : language === 'ru' ? 'Вы' : 'You'}</span>
                      ) : (
                        <>
                          <Bot size={11} className="text-blue-600 dark:text-blue-400" />
                          <span>DocNear AI</span>
                        </>
                      )}
                    </div>

                    {/* Bubble Content */}
                    <div
                      className={`relative p-3.5 rounded-2xl max-w-[88%] shadow-xs transition-all ${
                        msg.role === 'user'
                          ? 'bg-blue-600 text-white rounded-tr-xs'
                          : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700/80 rounded-tl-xs'
                      }`}
                    >
                      {msg.isEmergencyWarning && (
                        <div className="mb-2.5 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-start gap-2 text-rose-700 dark:text-rose-300 text-xs font-bold">
                          <AlertTriangle size={16} className="text-rose-600 shrink-0 mt-0.5" />
                          <span>
                            {language === 'uz'
                              ? "Ogohlantirish: Shoshilinch yoki hayotga xavf tug'diruvchi holatda darhol 103 ga qo'ng'iroq qiling!"
                              : 'Warning: In case of acute or life-threatening symptoms, call emergency 103 immediately!'}
                          </span>
                        </div>
                      )}

                      {renderFormattedContent(msg.content)}

                      {/* Clickable Recommended Specialty Badges */}
                      {msg.recommendedSpecialties && msg.recommendedSpecialties.length > 0 && (
                        <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-700/80">
                          <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1">
                            <Stethoscope size={12} className="text-blue-600" />
                            {language === 'uz' ? 'Tavsiya etilgan mutaxassislar:' : 'Recommended specialties:'}
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {msg.recommendedSpecialties.map((spec) => (
                              <button
                                key={spec}
                                onClick={() => handleSpecialtyClick(spec)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-bold border border-blue-200 dark:border-blue-700/60 transition-colors cursor-pointer active:scale-95"
                                title={`Find ${spec} doctors`}
                              >
                                <span>{getSpecialtyName(spec, language)}</span>
                                <ArrowRight size={11} className="text-blue-500" />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Model Message Action Buttons (Copy & Read Aloud) */}
                      {msg.role === 'model' && (
                        <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleSpeakText(msg.id, msg.content)}
                            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                            title={speakingId === msg.id ? 'Stop audio' : 'Read aloud'}
                          >
                            {speakingId === msg.id ? (
                              <VolumeX size={13} className="text-rose-500 animate-pulse" />
                            ) : (
                              <Volume2 size={13} />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopyText(msg.id, msg.content)}
                            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                            title="Copy response"
                          >
                            {copiedId === msg.id ? (
                              <Check size={13} className="text-emerald-500" />
                            ) : (
                              <Copy size={13} />
                            )}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Suggested follow-up questions */}
                    {msg.suggestedQuestions && msg.suggestedQuestions.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5 max-w-[90%]">
                        {msg.suggestedQuestions.map((sq, sIdx) => (
                          <button
                            key={sIdx}
                            onClick={() => handleSendMessage(sq)}
                            className="text-[11px] font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700 hover:border-blue-300 transition-all cursor-pointer text-left shadow-2xs flex items-center gap-1"
                          >
                            <MessageSquare size={11} className="text-blue-500 shrink-0" />
                            <span>{sq}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {isLoading && (
                  <div className="flex items-start gap-2 text-slate-500 text-xs py-2 animate-pulse">
                    <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 flex items-center justify-center">
                      <Bot size={13} />
                    </div>
                    <div className="bg-white dark:bg-slate-800 px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce" />
                      <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:0.2s]" />
                      <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:0.4s]" />
                      <span className="text-[11px] text-slate-400 ml-1">
                        {language === 'uz' ? "Javob tayyorlanmoqda..." : "Analyzing medical guidance..."}
                      </span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Footer */}
              <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex items-center gap-2"
                >
                  <div className="flex-1 relative flex items-center">
                    <input
                      ref={inputRef}
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder={
                        language === 'uz'
                          ? "Istalgan tibbiy savol yoki alomatni yozing..."
                          : language === 'ru'
                          ? "Задайте любой вопрос по здоровью..."
                          : "Ask any medical or wellness question..."
                      }
                      className="w-full px-3.5 py-2 pr-9 rounded-xl text-xs sm:text-sm bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 border border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-colors"
                    />

                    {/* Voice Mic Button */}
                    <button
                      type="button"
                      onClick={toggleSpeechRecognition}
                      className={`absolute right-2 p-1 rounded-lg transition-colors cursor-pointer ${
                        isListening
                          ? 'text-rose-600 bg-rose-100 animate-pulse'
                          : 'text-slate-400 hover:text-blue-600 dark:hover:text-blue-400'
                      }`}
                      title={isListening ? 'Listening...' : 'Voice Input'}
                    >
                      {isListening ? <MicOff size={15} /> : <Mic size={15} />}
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={!inputValue.trim() || isLoading}
                    className="w-9 h-9 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white flex items-center justify-center shadow-xs transition-transform active:scale-90 cursor-pointer disabled:cursor-not-allowed shrink-0"
                    title="Yuborish"
                  >
                    <Send size={16} />
                  </button>
                </form>

                <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400 px-1">
                  <span className="flex items-center gap-1">
                    <ShieldCheck size={11} className="text-emerald-500" />
                    DocNear AI Medical Knowledge
                  </span>
                  <span>{language === 'uz' ? '24/7 Maslahatchi' : '24/7 Health AI'}</span>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

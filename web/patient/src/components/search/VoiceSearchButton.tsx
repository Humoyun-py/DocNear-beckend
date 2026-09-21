import React, { useEffect, useState } from 'react';
import { Mic, MicOff, Volume2, AlertCircle, Sparkles, X } from 'lucide-react';
import { useVoiceSearch } from '../../hooks/useVoiceSearch';
import { useLanguage } from '../../context/LanguageContext';

interface VoiceSearchButtonProps {
  onSearchQuery: (query: string) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const VoiceSearchButton: React.FC<VoiceSearchButtonProps> = ({
  onSearchQuery,
  className = '',
  size = 'md',
}) => {
  const { language, t } = useLanguage();
  const [showListeningModal, setShowListeningModal] = useState(false);
  const [liveSpokenText, setLiveSpokenText] = useState('');

  const {
    isListening,
    transcript,
    isSupported,
    errorMessage,
    startListening,
    stopListening,
    toggleListening,
  } = useVoiceSearch({
    language,
    onTranscript: (text, isFinal) => {
      setLiveSpokenText(text);
      if (isFinal && text.trim().length > 0) {
        setTimeout(() => {
          onSearchQuery(text.trim());
          setShowListeningModal(false);
        }, 600);
      }
    },
    onError: (err) => {
      console.warn('Voice error:', err);
    },
  });

  const handleMicClick = () => {
    if (!isListening) {
      setLiveSpokenText('');
      setShowListeningModal(true);
      startListening();
    } else {
      stopListening();
      setShowListeningModal(false);
    }
  };

  const handleCloseModal = () => {
    stopListening();
    setShowListeningModal(false);
  };

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-11 h-11 text-base',
  };

  const micIconSizes = {
    sm: 15,
    md: 17,
    lg: 20,
  };

  return (
    <>
      <button
        type="button"
        onClick={handleMicClick}
        title={
          isListening
            ? language === 'uz'
              ? 'Tinglanmoqda... To‘xtatish uchun bosing'
              : 'Listening... Click to stop'
            : language === 'uz'
            ? 'Ovozli qidiruv (Mikrofon)'
            : language === 'ru'
            ? 'Голосовой поиск (Микрофон)'
            : 'Voice Search (Microphone)'
        }
        className={`relative rounded-xl flex items-center justify-center transition-all cursor-pointer ${
          sizeClasses[size]
        } ${
          isListening
            ? 'bg-rose-500 text-white ring-4 ring-rose-300/60 animate-pulse shadow-md shadow-rose-200'
            : 'bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 border border-slate-200/80 hover:border-blue-200'
        } ${className}`}
      >
        {isListening ? (
          <>
            <span className="absolute inset-0 rounded-xl bg-rose-400 animate-ping opacity-30"></span>
            <Mic size={micIconSizes[size]} className="animate-bounce" />
          </>
        ) : (
          <Mic size={micIconSizes[size]} />
        )}
      </button>

      {/* Voice Listening Overlay Modal for seamless feedback */}
      {showListeningModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-2xl text-center space-y-5 relative transition-colors duration-200">
            <button
              type="button"
              onClick={handleCloseModal}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X size={18} />
            </button>

            {/* Glowing Microphone Visualizer */}
            <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping"></div>
              <div className="absolute -inset-2 rounded-full bg-blue-500/10 animate-pulse"></div>
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Mic size={36} className={isListening ? 'animate-pulse' : ''} />
              </div>
            </div>

            {/* Status Heading */}
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-bold border border-blue-100 dark:border-blue-800">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                <span>
                  {language === 'uz'
                    ? 'Ovozli qidiruv tinglanmoqda...'
                    : language === 'ru'
                    ? 'Слушаю вас...'
                    : 'Listening for voice search...'}
                </span>
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-white pt-1">
                {language === 'uz'
                  ? 'Shifokor yoki mutaxassislikni ayting'
                  : language === 'ru'
                  ? 'Назовите специальность или врача'
                  : 'Say doctor name or specialty'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {language === 'uz'
                  ? 'Masalan: "Kardiolog", "Stomatologiya", "Dr. Rakhimova"'
                  : language === 'ru'
                  ? 'Например: "Кардиолог", "Стоматолог", "Доктор Рахимова"'
                  : 'For example: "Cardiologist", "Dental Clinic", "Dr. Rakhimova"'}
              </p>
            </div>

            {/* Real-time transcribed text */}
            <div className="min-h-[52px] p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center text-sm font-medium text-slate-800 dark:text-slate-100">
              {liveSpokenText ? (
                <span className="font-semibold text-blue-700 dark:text-blue-400">"{liveSpokenText}"</span>
              ) : (
                <span className="text-slate-400 dark:text-slate-500 italic text-xs">
                  {language === 'uz'
                    ? 'Gapiring, biz qidiramiz...'
                    : language === 'ru'
                    ? 'Говорите...'
                    : 'Speak now...'}
                </span>
              )}
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 text-left">
                <AlertCircle size={15} className="shrink-0 text-rose-500 dark:text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Manual confirm / cancel buttons */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleCloseModal}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                {t('cancel')}
              </button>
              {liveSpokenText && (
                <button
                  type="button"
                  onClick={() => {
                    onSearchQuery(liveSpokenText);
                    handleCloseModal();
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  {t('findDoctorsBtn')}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

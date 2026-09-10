import React, { useState } from 'react';
import { Share2, Check, Copy } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAppointments } from '../../context/AppointmentContext';

export interface ShareButtonProps {
  title: string;
  text?: string;
  url?: string;
  variant?: 'circle' | 'pill' | 'outline' | 'ghost' | 'icon';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

export const ShareButton: React.FC<ShareButtonProps> = ({
  title,
  text,
  url,
  variant = 'circle',
  size = 'md',
  className = '',
  label,
}) => {
  const { t } = useLanguage();
  const { showToast } = useAppointments();
  const [isCopied, setIsCopied] = useState(false);

  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
  const shareText = text || title;

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const shareData = {
      title,
      text: shareText,
      url: shareUrl,
    };

    // Try Web Share API first
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        if (navigator.canShare && navigator.canShare(shareData)) {
          await navigator.share(shareData);
          showToast(t('sharedSuccessfully') || 'Shared successfully!', 'success');
          return;
        } else {
          await navigator.share({
            title: shareData.title,
            url: shareData.url,
          });
          showToast(t('sharedSuccessfully') || 'Shared successfully!', 'success');
          return;
        }
      } catch (err: unknown) {
        // If user cancelled (AbortError), don't trigger clipboard fallback or error
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }
        // If sharing failed due to permission or invalid data, fallback to clipboard
      }
    }

    // Fallback: Copy link to clipboard
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setIsCopied(true);
        showToast(t('linkCopied') || 'Link copied to clipboard!', 'info');
        setTimeout(() => setIsCopied(false), 2500);
      } catch (copyErr) {
        console.error('Failed to copy to clipboard:', copyErr);
        showToast('Unable to copy link', 'error');
      }
    } else {
      // Very legacy fallback
      try {
        const tempInput = document.createElement('input');
        tempInput.value = shareUrl;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
        setIsCopied(true);
        showToast(t('linkCopied') || 'Link copied to clipboard!', 'info');
        setTimeout(() => setIsCopied(false), 2500);
      } catch {
        showToast('Unable to share link', 'error');
      }
    }
  };

  const iconSizes = {
    sm: 14,
    md: 18,
    lg: 20,
  };

  const currentIconSize = iconSizes[size];

  if (variant === 'circle') {
    return (
      <button
        type="button"
        onClick={handleShare}
        aria-label={label || t('share') || 'Share'}
        title={isCopied ? t('linkCopied') || 'Link copied!' : label || t('share') || 'Share'}
        className={`w-10 h-10 rounded-full bg-white/90 dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-800 backdrop-blur-md flex items-center justify-center text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-all shadow-md active:scale-95 cursor-pointer border border-slate-200/60 dark:border-slate-700/60 ${className}`}
      >
        {isCopied ? (
          <Check size={currentIconSize} className="text-emerald-600 dark:text-emerald-400" />
        ) : (
          <Share2 size={currentIconSize} />
        )}
      </button>
    );
  }

  if (variant === 'pill') {
    return (
      <button
        type="button"
        onClick={handleShare}
        aria-label={label || t('share') || 'Share'}
        className={`px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 border border-slate-200 dark:border-slate-700 text-xs font-semibold flex items-center gap-2 transition-all shadow-2xs active:scale-98 cursor-pointer ${className}`}
      >
        {isCopied ? (
          <>
            <Check size={currentIconSize} className="text-emerald-600 dark:text-emerald-400" />
            <span className="text-emerald-700 dark:text-emerald-400 font-bold">{t('linkCopied') || 'Copied!'}</span>
          </>
        ) : (
          <>
            <Share2 size={currentIconSize} />
            <span>{label || t('share') || 'Share'}</span>
          </>
        )}
      </button>
    );
  }

  if (variant === 'outline') {
    return (
      <button
        type="button"
        onClick={handleShare}
        aria-label={label || t('share') || 'Share'}
        className={`p-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer active:scale-95 flex items-center justify-center ${className}`}
      >
        {isCopied ? (
          <Check size={currentIconSize} className="text-emerald-600 dark:text-emerald-400" />
        ) : (
          <Share2 size={currentIconSize} />
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      aria-label={label || t('share') || 'Share'}
      className={`inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer ${className}`}
    >
      {isCopied ? (
        <>
          <Check size={currentIconSize} className="text-emerald-600 dark:text-emerald-400" />
          <span className="text-emerald-600 dark:text-emerald-400">{t('linkCopied') || 'Copied!'}</span>
        </>
      ) : (
        <>
          <Share2 size={currentIconSize} />
          {label && <span>{label}</span>}
        </>
      )}
    </button>
  );
};

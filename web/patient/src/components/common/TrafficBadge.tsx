import React, { useState } from 'react';
import { Users, Info, Zap, Clock, ShieldAlert } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface TrafficBadgeProps {
  level?: 'Quiet' | 'Moderate' | 'Busy';
  summary?: string;
  peakHours?: string;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
  className?: string;
}

export const TrafficBadge: React.FC<TrafficBadgeProps> = ({
  level = 'Moderate',
  summary,
  peakHours,
  size = 'sm',
  showTooltip = true,
  className = '',
}) => {
  const { t, language } = useLanguage();
  const [isHovered, setIsHovered] = useState(false);

  const getBadgeConfig = () => {
    switch (level) {
      case 'Quiet':
        return {
          label: t('trafficQuiet') || 'Quiet',
          shortLabel: language === 'uz' ? 'Kam odam' : language === 'ru' ? 'Свободно' : 'Quiet',
          bg: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800',
          dot: 'bg-emerald-500',
          iconColor: 'text-emerald-600 dark:text-emerald-400',
          defaultDesc: t('trafficQuietDesc') || 'Low wait times & quick check-in (< 5 mins)',
          icon: Zap,
        };
      case 'Busy':
        return {
          label: t('trafficBusy') || 'Busy',
          shortLabel: language === 'uz' ? 'Gavjum' : language === 'ru' ? 'Высокая загрузка' : 'Busy',
          bg: 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200/80 dark:border-rose-800',
          dot: 'bg-rose-500',
          iconColor: 'text-rose-600 dark:text-rose-400',
          defaultDesc: t('trafficBusyDesc') || 'Peak patient flow, booking ahead recommended',
          icon: ShieldAlert,
        };
      case 'Moderate':
      default:
        return {
          label: t('trafficModerate') || 'Moderate',
          shortLabel: language === 'uz' ? 'O‘rtacha' : language === 'ru' ? 'Умеренно' : 'Moderate',
          bg: 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-200/80 dark:border-amber-800',
          dot: 'bg-amber-500',
          iconColor: 'text-amber-600 dark:text-amber-400',
          defaultDesc: t('trafficModerateDesc') || 'Normal patient flow with standard waiting times',
          icon: Users,
        };
    }
  };

  const config = getBadgeConfig();
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[11px] gap-1.5',
    md: 'px-2.5 py-1 text-xs gap-1.5 font-semibold',
    lg: 'px-3 py-1.5 text-xs sm:text-sm gap-2 font-bold',
  }[size];

  return (
    <div
      className={`relative inline-flex items-center ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`inline-flex items-center rounded-full border font-semibold transition-all cursor-help select-none ${config.bg} ${sizeClasses}`}
        title={summary || config.defaultDesc}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${config.dot} animate-pulse shrink-0`} />
        <Icon size={size === 'lg' ? 14 : 12} className={config.iconColor} />
        <span>{config.label}</span>
      </div>

      {/* Floating Info Tooltip */}
      {showTooltip && isHovered && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-56 p-2.5 bg-slate-900/95 backdrop-blur-md text-white text-xs rounded-xl shadow-xl border border-slate-800 pointer-events-none transition-opacity duration-150 animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between gap-1 mb-1 pb-1 border-b border-slate-800">
            <span className="font-bold flex items-center gap-1.5 text-[11px] text-white">
              <span className={`w-2 h-2 rounded-full ${config.dot}`} />
              {config.label}
            </span>
            {peakHours && (
              <span className="text-[10px] text-amber-300 font-mono flex items-center gap-1">
                <Clock size={10} />
                {peakHours}
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-300 leading-snug font-normal">
            {summary || config.defaultDesc}
          </p>
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900/95" />
        </div>
      )}
    </div>
  );
};

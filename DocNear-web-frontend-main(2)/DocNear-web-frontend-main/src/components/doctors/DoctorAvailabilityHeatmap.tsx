import React, { useState } from 'react';
import { Doctor, DaySchedule, TimeSlot } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { formatScheduleDay, isTimeSlotInPast } from '../../utils/dateTimeUtils';
import {
  Calendar,
  Clock,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Info,
  ChevronRight,
} from 'lucide-react';

interface DoctorAvailabilityHeatmapProps {
  doctor: Doctor;
  selectedDate: string;
  onSelectDate: (date: string, dayLabel: string, initialSlot?: string) => void;
  className?: string;
}

type PeriodKey = 'morning' | 'afternoon' | 'evening';

export const DoctorAvailabilityHeatmap: React.FC<DoctorAvailabilityHeatmapProps> = ({
  doctor,
  selectedDate,
  onSelectDate,
  className = '',
}) => {
  const { language, t } = useLanguage();
  const [hoveredCell, setHoveredCell] = useState<{
    date: string;
    dayLabel: string;
    period: PeriodKey;
    availableCount: number;
    totalCount: number;
  } | null>(null);

  const periods: { id: PeriodKey; label: string; timeRange: string }[] = [
    {
      id: 'morning',
      label: language === 'uz' ? 'Ertalab' : language === 'ru' ? 'Утро' : 'Morning',
      timeRange: '08:00 - 12:00',
    },
    {
      id: 'afternoon',
      label: language === 'uz' ? 'Tushdan keyin' : language === 'ru' ? 'День' : 'Afternoon',
      timeRange: '12:00 - 16:00',
    },
    {
      id: 'evening',
      label: language === 'uz' ? 'Kechqurun' : language === 'ru' ? 'Вечер' : 'Evening',
      timeRange: '16:00 - 20:00',
    },
  ];

  // Analyze schedule data
  let totalAvailableSlots = 0;
  let totalSlots = 0;
  let mostOpenCell: { dayLabel: string; periodLabel: string; count: number; date: string } | null = null;
  let busiestCell: { dayLabel: string; periodLabel: string; date: string } | null = null;
  let maxOpenCount = -1;
  let minOpenCount = 999;

  doctor.weeklySchedule.forEach((day) => {
    periods.forEach((period) => {
      const periodSlots = day.slots.filter((s) => {
        if (s.period === period.id) return true;
        const hour = parseInt(s.time.split(':')[0], 10);
        if (period.id === 'morning' && hour < 12) return true;
        if (period.id === 'afternoon' && hour >= 12 && hour < 16) return true;
        if (period.id === 'evening' && hour >= 16) return true;
        return false;
      });

      const openCount = periodSlots.filter((s) => s.isAvailable).length;
      totalAvailableSlots += openCount;
      totalSlots += periodSlots.length;

      if (openCount > maxOpenCount) {
        maxOpenCount = openCount;
        mostOpenCell = {
          dayLabel: day.dayLabel,
          periodLabel: period.label,
          count: openCount,
          date: day.date,
        };
      }

      if (periodSlots.length > 0 && openCount < minOpenCount) {
        minOpenCount = openCount;
        busiestCell = {
          dayLabel: day.dayLabel,
          periodLabel: period.label,
          date: day.date,
        };
      }
    });
  });

  const availabilityPercentage =
    totalSlots > 0 ? Math.round((totalAvailableSlots / totalSlots) * 100) : 0;

  const getHeatStyle = (availableCount: number, totalInPeriod: number) => {
    if (totalInPeriod === 0 || availableCount === 0) {
      return {
        bg: 'bg-slate-100/90 dark:bg-slate-800/60 hover:bg-slate-200/90 dark:hover:bg-slate-700/60 text-slate-400 dark:text-slate-500 border-slate-200/60 dark:border-slate-700/60',
        dot: 'bg-slate-300 dark:bg-slate-600',
        badge: '0 slots',
        status: 'full',
      };
    }
    if (availableCount >= 3) {
      return {
        bg: 'bg-emerald-500/15 dark:bg-emerald-950/40 hover:bg-emerald-500/25 dark:hover:bg-emerald-900/50 text-emerald-950 dark:text-emerald-300 border-emerald-300/80 dark:border-emerald-700/80',
        dot: 'bg-emerald-500 animate-pulse',
        badge: `${availableCount} open`,
        status: 'open',
      };
    }
    return {
      bg: 'bg-amber-400/20 dark:bg-amber-950/40 hover:bg-amber-400/30 dark:hover:bg-amber-900/50 text-amber-950 dark:text-amber-300 border-amber-300/80 dark:border-amber-700/80',
      dot: 'bg-amber-500',
      badge: `${availableCount} left`,
      status: 'limited',
    };
  };

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6 ${className}`}>
      {/* Header & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800">
              <Calendar size={18} />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {language === 'uz'
                ? 'Haftalik qabul bandlik xaritasi (Heat-map)'
                : language === 'ru'
                ? 'Тепловая карта доступности на неделю'
                : 'Weekly Availability & Rush Hour Heat-map'}
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {language === 'uz'
              ? 'Shifokorning eng bo‘sh va eng band qabul vaqtlarini ko‘ring va qulay vaqtni tanlang'
              : language === 'ru'
              ? 'Наглядный график загруженности: выберите время с минимальным ожиданием'
              : 'Visual density chart showing peak rush hours and open slots for minimum wait time'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2 text-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></span>
            <div>
              <span className="font-bold text-emerald-800 dark:text-emerald-300">{totalAvailableSlots}</span>
              <span className="text-emerald-600 dark:text-emerald-400 text-[11px] ml-1">
                {language === 'uz' ? 'bo‘sh vaqt' : language === 'ru' ? 'свободных мест' : 'open slots'}
              </span>
            </div>
          </div>

          <div className="px-3 py-1.5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex items-center gap-2 text-xs">
            <Sparkles size={14} className="text-blue-600 dark:text-blue-400 shrink-0" />
            <div>
              <span className="font-bold text-blue-800 dark:text-blue-300">{availabilityPercentage}%</span>
              <span className="text-blue-600 dark:text-blue-400 text-[11px] ml-1">
                {language === 'uz' ? 'bo‘shlik' : language === 'ru' ? 'доступность' : 'available'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Heatmap Visual Grid */}
      <div className="space-y-2">
        <div className="overflow-x-auto no-scrollbar pb-2">
          <div className="min-w-[620px]">
            {/* Column Headers (Days) */}
            <div className="grid grid-cols-8 gap-2 mb-2">
              <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-end justify-center pb-1">
                {language === 'uz' ? 'Vaqt' : language === 'ru' ? 'Время' : 'Period'}
              </div>

              {doctor.weeklySchedule.map((day) => {
                const isCurrentSelected = selectedDate === day.date;
                const localized = formatScheduleDay(day.date, language);
                return (
                  <button
                    key={day.date}
                    type="button"
                    onClick={() => onSelectDate(day.date, localized.displayLabel)}
                    className={`py-2 px-1 rounded-2xl text-center transition-all cursor-pointer border ${
                      isCurrentSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-slate-750'
                    }`}
                  >
                    <span className="text-[11px] font-bold block leading-tight truncate">
                      {localized.shortDay}
                    </span>
                    <span className="text-[10px] opacity-80 block truncate">
                      {localized.dayNum} {localized.monthShort}
                    </span>
                    {day.isToday && (
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold mt-0.5 inline-block ${
                          isCurrentSelected ? 'bg-white text-blue-700 dark:bg-slate-900 dark:text-blue-300' : 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300'
                        }`}
                      >
                        {t('today')}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Row Periods */}
            {periods.map((period) => (
              <div key={period.id} className="grid grid-cols-8 gap-2 mb-2 items-center">
                {/* Period Row Label */}
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-750 text-center">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block truncate">{period.label}</span>
                  <span className="text-[9px] text-slate-400 dark:text-slate-500 block font-medium truncate">{period.timeRange}</span>
                </div>

                {/* Heatmap Cells for each day */}
                {doctor.weeklySchedule.map((day) => {
                  const periodSlots = day.slots.filter((s) => {
                    if (s.period === period.id) return true;
                    const hour = parseInt(s.time.split(':')[0], 10);
                    if (period.id === 'morning' && hour < 12) return true;
                    if (period.id === 'afternoon' && hour >= 12 && hour < 16) return true;
                    if (period.id === 'evening' && hour >= 16) return true;
                    return false;
                  });

                  const availableSlots = periodSlots.filter(
                    (s) => s.isAvailable && !isTimeSlotInPast(day.date, s.time)
                  );
                  const availableCount = availableSlots.length;
                  const totalInPeriod = periodSlots.length;
                  const heat = getHeatStyle(availableCount, totalInPeriod);
                  const isDaySelected = selectedDate === day.date;

                  return (
                    <button
                      key={`${day.date}-${period.id}`}
                      type="button"
                      onMouseEnter={() =>
                        setHoveredCell({
                          date: day.date,
                          dayLabel: day.dayLabel,
                          period: period.id,
                          availableCount,
                          totalCount: totalInPeriod,
                        })
                      }
                      onMouseLeave={() => setHoveredCell(null)}
                      onClick={() => {
                        const firstAvailable = availableSlots[0]?.time;
                        onSelectDate(day.date, day.dayLabel, firstAvailable);
                      }}
                      className={`h-14 rounded-2xl border transition-all flex flex-col items-center justify-center p-1.5 relative cursor-pointer group ${heat.bg} ${
                        isDaySelected ? 'ring-2 ring-blue-500 ring-offset-1' : ''
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        <span className={`w-2 h-2 rounded-full ${heat.dot}`}></span>
                        <span className="text-xs font-extrabold">{availableCount}</span>
                      </div>
                      <span className="text-[9px] font-bold opacity-75 capitalize">
                        {heat.status === 'open'
                          ? language === 'uz'
                            ? 'Bo‘sh'
                            : language === 'ru'
                            ? 'Свободно'
                            : 'Open'
                          : heat.status === 'limited'
                          ? language === 'uz'
                            ? 'Kam'
                            : language === 'ru'
                            ? 'Мало'
                            : 'Limited'
                          : language === 'uz'
                          ? 'Band'
                          : language === 'ru'
                          ? 'Занято'
                          : 'Full'}
                      </span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
              <span className="w-3 h-3 rounded-md bg-emerald-500/20 border border-emerald-400 flex items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              </span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {language === 'uz' ? 'Ko‘p bo‘sh joylar (3+)' : language === 'ru' ? 'Много мест (3+)' : 'Open (3+ slots)'}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
              <span className="w-3 h-3 rounded-md bg-amber-400/25 border border-amber-400 flex items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
              </span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {language === 'uz' ? 'Cheklangan (1-2 ta)' : language === 'ru' ? 'Мало мест (1-2)' : 'Limited (1-2)'}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
              <span className="w-3 h-3 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700"></span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {language === 'uz' ? 'Band / Yopiq' : language === 'ru' ? 'Занято' : 'Booked'}
              </span>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
            <Info size={13} />
            <span>
              {language === 'uz'
                ? 'Katakchani bosing va shu vaqtga yoziling'
                : language === 'ru'
                ? 'Нажмите на ячейку для бронирования'
                : 'Click any cell to pick that time window'}
            </span>
          </div>
        </div>
      </div>

      {/* Rush Hour Insights: Busiest vs Most Open Slots */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
        {/* Most Open Window */}
        {mostOpenCell && (
          <div className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/80 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-emerald-500 text-white shrink-0 shadow-xs">
              <TrendingDown size={18} />
            </div>
            <div className="space-y-0.5">
              <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                {language === 'uz' ? 'Eng qulay vaqt (Kutishsiz)' : language === 'ru' ? 'Рекомендуемое время (Без очередей)' : 'Fastest Appointment (Lowest Wait)'}
              </span>
              <p className="text-xs font-bold text-slate-900 dark:text-white">
                {(mostOpenCell as any).dayLabel} — {(mostOpenCell as any).periodLabel}
              </p>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                {language === 'uz'
                  ? `${(mostOpenCell as any).count} ta bo‘sh vaqt mavjud. Tezkor qabul.`
                  : language === 'ru'
                  ? `${(mostOpenCell as any).count} свободных слотов. Минимальное время ожидания.`
                  : `${(mostOpenCell as any).count} open slots available. Minimal clinic queue.`}
              </p>
            </div>
          </div>
        )}

        {/* Busiest Peak Window */}
        {busiestCell && (
          <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/80 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-500 text-white shrink-0 shadow-xs">
              <Flame size={18} />
            </div>
            <div className="space-y-0.5">
              <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider">
                {language === 'uz' ? 'Eng tig‘iz vaqt (Tig‘iz oqim)' : language === 'ru' ? 'Пиковые часы (Высокий спрос)' : 'Peak Rush Hours (High Demand)'}
              </span>
              <p className="text-xs font-bold text-slate-900 dark:text-white">
                {(busiestCell as any).dayLabel} — {(busiestCell as any).periodLabel}
              </p>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                {language === 'uz'
                  ? 'Ushbu vaqtda talab yuqori. Oldindan band qilish tavsiya etiladi.'
                  : language === 'ru'
                  ? 'Высокая загруженность. Рекомендуем бронировать заранее.'
                  : 'High patient traffic. Advance online booking strongly advised.'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

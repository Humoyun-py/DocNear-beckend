import { Language } from '../i18n/translations';
import { DaySchedule, TimeSlot } from '../types';

export const WEEKDAYS: Record<Language, { short: string[]; full: string[] }> = {
  uz: {
    short: ['Yak', 'Dush', 'Sesh', 'Chor', 'Pay', 'Jum', 'Shan'],
    full: ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'],
  },
  ru: {
    short: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
    full: ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'],
  },
  en: {
    short: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    full: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  },
};

export const MONTHS: Record<Language, { short: string[]; full: string[] }> = {
  uz: {
    short: ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyun', 'Iyul', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'],
    full: [
      'yanvar',
      'fevral',
      'mart',
      'aprel',
      'may',
      'iyun',
      'iyul',
      'avgust',
      'sentabr',
      'oktabr',
      'noyabr',
      'dekabr',
    ],
  },
  ru: {
    short: ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'],
    full: [
      'января',
      'февраля',
      'марта',
      'апреля',
      'мая',
      'июня',
      'июля',
      'августа',
      'сентября',
      'октября',
      'ноября',
      'декабря',
    ],
  },
  en: {
    short: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    full: [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ],
  },
};

/**
 * Returns today's date formatted as YYYY-MM-DD in local time
 */
export function getTodayDateString(offsetDays: number = 0): string {
  const d = new Date();
  if (offsetDays !== 0) {
    d.setDate(d.getDate() + offsetDays);
  }
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parses YYYY-MM-DD into a local Date object safely without UTC shift
 */
export function parseDateString(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

/**
 * Formats a date string (YYYY-MM-DD) with translated weekday and month
 */
export function formatScheduleDay(
  dateStr: string,
  lang: Language = 'uz'
): {
  shortDay: string;
  fullDay: string;
  monthShort: string;
  monthFull: string;
  dayNum: number;
  displayLabel: string;
  fullDateDisplay: string;
} {
  const dateObj = parseDateString(dateStr);
  const dayOfWeek = dateObj.getDay(); // 0 is Sunday, 6 is Saturday
  const monthIndex = dateObj.getMonth();
  const dayNum = dateObj.getDate();
  const year = dateObj.getFullYear();

  const langMap = WEEKDAYS[lang] || WEEKDAYS.uz;
  const monthMap = MONTHS[lang] || MONTHS.uz;

  const shortDay = langMap.short[dayOfWeek];
  const fullDay = langMap.full[dayOfWeek];
  const monthShort = monthMap.short[monthIndex];
  const monthFull = monthMap.full[monthIndex];

  let displayLabel = '';
  let fullDateDisplay = '';

  if (lang === 'uz') {
    displayLabel = `${shortDay.toUpperCase()} ${dayNum} ${monthShort.toUpperCase()}`;
    fullDateDisplay = `${fullDay}, ${dayNum}-${monthFull}, ${year}`;
  } else if (lang === 'ru') {
    displayLabel = `${shortDay.toUpperCase()} ${dayNum} ${monthShort.toUpperCase()}`;
    fullDateDisplay = `${fullDay}, ${dayNum} ${monthFull} ${year}`;
  } else {
    displayLabel = `${shortDay.toUpperCase()} ${dayNum} ${monthShort.toUpperCase()}`;
    fullDateDisplay = `${fullDay}, ${monthShort} ${dayNum}, ${year}`;
  }

  return {
    shortDay,
    fullDay,
    monthShort,
    monthFull,
    dayNum,
    displayLabel,
    fullDateDisplay,
  };
}

/**
 * Check whether a specific time slot on a given date is in the past
 */
export function isTimeSlotInPast(
  dateStr: string,
  slotTime: string,
  bufferMinutes: number = 0
): boolean {
  if (!dateStr || !slotTime) return false;

  const todayStr = getTodayDateString();

  // If date is before today, it is strictly past
  if (dateStr < todayStr) {
    return true;
  }

  // If date is after today, it is strictly in the future
  if (dateStr > todayStr) {
    return false;
  }

  // Date is today: compare hours and minutes against current local time
  const parts = slotTime.split(':').map((p) => parseInt(p.trim(), 10));
  if (parts.length < 2 || isNaN(parts[0]) || isNaN(parts[1])) {
    return false;
  }

  const [slotHour, slotMinute] = parts;
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes() + bufferMinutes;
  const slotMinutes = slotHour * 60 + slotMinute;

  return slotMinutes <= nowMinutes;
}

/**
 * Checks if all slots for a given day are in the past
 */
export function areAllDaySlotsPassed(dateStr: string, slots: TimeSlot[]): boolean {
  return slots.every((slot) => !slot.isAvailable || isTimeSlotInPast(dateStr, slot.time));
}

/**
 * Generates dynamic 7-day schedules starting from today
 */
export function generateDynamicWeeklySchedule(seed: number = 0): DaySchedule[] {
  const result: DaySchedule[] = [];

  const standardMorningSlots = [
    { time: '09:00', period: 'morning' as const },
    { time: '09:30', period: 'morning' as const },
    { time: '10:15', period: 'morning' as const },
    { time: '11:00', period: 'morning' as const },
    { time: '11:45', period: 'morning' as const },
  ];

  const standardAfternoonSlots = [
    { time: '13:00', period: 'afternoon' as const },
    { time: '14:00', period: 'afternoon' as const },
    { time: '14:45', period: 'afternoon' as const },
    { time: '15:30', period: 'afternoon' as const },
    { time: '16:15', period: 'afternoon' as const },
  ];

  const standardEveningSlots = [
    { time: '17:00', period: 'evening' as const },
    { time: '17:45', period: 'evening' as const },
    { time: '18:30', period: 'evening' as const },
  ];

  const allSlotTemplates = [
    ...standardMorningSlots,
    ...standardAfternoonSlots,
    ...standardEveningSlots,
  ];

  for (let i = 0; i < 7; i++) {
    const dateStr = getTodayDateString(i);
    const dateObj = parseDateString(dateStr);
    const dayOfWeek = dateObj.getDay();
    const isSunday = dayOfWeek === 0;
    const isSaturday = dayOfWeek === 6;
    const isToday = i === 0;

    const formatted = formatScheduleDay(dateStr, 'uz');

    let slots: TimeSlot[];

    if (isSunday) {
      slots = [
        { time: '10:00', isAvailable: seed % 2 === 0, period: 'morning' },
        { time: '11:30', isAvailable: true, period: 'morning' },
        { time: '14:00', isAvailable: false, period: 'afternoon' },
        { time: '15:30', isAvailable: seed % 3 !== 0, period: 'afternoon' },
      ];
    } else {
      slots = allSlotTemplates.map((template, idx) => {
        // Pseudo-random availability based on doctor seed, date, and index
        const hash = (seed * 17 + dayOfWeek * 7 + dateObj.getDate() + idx) % 10;
        let isAvailable = hash > 2; // ~70% available by default
        if (template.period === 'evening' && isSaturday) {
          isAvailable = false;
        }
        return {
          time: template.time,
          isAvailable,
          period: template.period,
        };
      });
    }

    result.push({
      date: dateStr,
      dayLabel: formatted.displayLabel,
      isToday,
      slots,
    });
  }

  return result;
}

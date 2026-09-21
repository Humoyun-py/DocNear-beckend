export function today(): string {
  return new Intl.DateTimeFormat('en-CA', {timeZone: 'Asia/Tashkent', year: 'numeric', month: '2-digit', day: '2-digit'}).format(new Date());
}
export function upcomingDays() {
  return Array.from({length: 7}, (_, offset) => {
    const value = new Date(today() + 'T12:00:00+05:00');
    value.setUTCDate(value.getUTCDate() + offset);
    const date = value.toISOString().slice(0, 10);
    return {date, name: value.toLocaleDateString('en-US', {weekday: 'long', timeZone: 'Asia/Tashkent'}), dayShort: value.toLocaleDateString('en-US', {weekday: 'short', timeZone: 'Asia/Tashkent'}), num: date.slice(8)};
  });
}

export const normalizeUzPhone = (value: string) => {
  if (/[^\d+\s().-]/.test(value)) return '';
  let digits = value.replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.length === 10 && digits.startsWith('0')) digits = digits.slice(1);
  if (digits.length === 9) digits = '998' + digits;
  return '+' + digits;
};

export const validE164Phone = (value: string) => /^\+[1-9]\d{7,14}$/.test(value);

export const formatUzPhoneInput = (value: string) => {
  let digits = value.replace(/\D/g, '');
  if (digits.length <= 3 && '998'.startsWith(digits)) return '+998';
  if (digits.startsWith('998')) digits = digits.slice(3);
  else if (digits.startsWith('0')) digits = digits.slice(1);
  digits = digits.slice(0, 9);
  const groups = [digits.slice(0, 2), digits.slice(2, 5), digits.slice(5, 7), digits.slice(7, 9)]
    .filter(Boolean);
  return '+998' + (groups.length ? ' ' + groups.join(' ') : '');
};

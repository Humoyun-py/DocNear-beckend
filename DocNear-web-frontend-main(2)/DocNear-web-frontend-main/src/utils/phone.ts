export const normalizeUzPhone = (value: string) => {
  let digits = value.replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.length === 10 && digits.startsWith('0')) digits = digits.slice(1);
  if (digits.length === 9) digits = '998' + digits;
  return '+' + digits;
};

export const validE164Phone = (value: string) => /^\+[1-9]\d{7,14}$/.test(value);

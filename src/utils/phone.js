// 0812… / 812… / 62812… → 62812… (WhatsApp links need the country code)
export function intlPhone(digits) {
  if (digits.startsWith('0')) return '62' + digits.slice(1);
  return digits.startsWith('62') ? digits : '62' + digits;
}

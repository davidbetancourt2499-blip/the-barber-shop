/**
 * THE BARBER SHOP — PHONE UTILITIES
 * Detecta si un visitante es nacional (Ecuador) o extranjero y
 * formatea los números de contacto en consecuencia.
 *
 * Nacional  -> formato local  "09 983 267 552"
 * Extranjero -> formato internacional "+593 98 326 7552"
 */

const ECUADOR_COUNTRY_CODE = '593';
const ECUADOR_NATIONAL_PREFIX = '09';

/**
 * Normaliza un número quitando espacios, guiones, paréntesis y "+".
 */
export function normalizePhone(raw) {
  if (!raw) return '';
  return String(raw).replace(/[\s\-().+]/g, '');
}

/**
 * Detecta si un número corresponde a Ecuador.
 * Acepta: 09XXXXXXXXX, +5939XXXXXXXX, 5939XXXXXXXX
 */
export function isEcuadorianNumber(raw) {
  const digits = normalizePhone(raw);
  if (/^09\d{8}$/.test(digits)) return true;           // 099831...  (10 dígitos)
  if (/^5939\d{8}$/.test(digits)) return true;          // 593983...
  return false;
}

/**
 * Detecta la nacionalidad del visitante.
 * 1) Si escribió un número de teléfono: decide por el número.
 * 2) Si no: usa el idioma/región del navegador (es-EC → nacional).
 */
export function detectVisitorIsNational(inputPhone) {
  if (inputPhone && isEcuadorianNumber(inputPhone)) return true;
  if (inputPhone && normalizePhone(inputPhone).length > 0) return false;

  const locales = (navigator.languages || [navigator.language || '']).map(l => l.toLowerCase());
  return locales.some(l => l === 'es-ec' || l.startsWith('es-ec'));
}

/**
 * Formatea un número de Ecuador para mostrarse.
 * national=true  -> "09X XXX XXXX"
 * national=false -> "+593 XX XXX XXXX"
 */
export function formatEcuadorianPhone(raw, national) {
  const digits = normalizePhone(raw);
  let nationalDigits = digits;

  if (/^5939\d{8}$/.test(digits)) {
    nationalDigits = '0' + digits.slice(3);
  }
  if (!/^09\d{8}$/.test(nationalDigits)) {
    return raw || '';
  }

  if (national) {
    return `${nationalDigits.slice(0, 3)} ${nationalDigits.slice(3, 6)} ${nationalDigits.slice(6)}`;
  }

  const intlLocal = nationalDigits.slice(1);
  return `+${ECUADOR_COUNTRY_CODE} ${intlLocal.slice(0, 2)} ${intlLocal.slice(2, 5)} ${intlLocal.slice(5)}`;
}

/**
 * Formatea cualquier teléfono para mostrarse, aplicando la lógica
 * nacional vs extranjero cuando es un número ecuatoriano.
 */
export function formatPhoneDisplay(raw, national) {
  if (!raw) return '';
  if (isEcuadorianNumber(raw)) {
    return formatEcuadorianPhone(raw, national);
  }
  return raw;
}

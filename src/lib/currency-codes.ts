/**
 * ENK-051: amounts are always shown with their ISO 4217 code.
 * Legacy storage keys ("RMB", "FCFA") remain readable so existing wallets and records keep working.
 */
const LEGACY_TO_ISO: Record<string, string> = {
  RMB: 'CNY',
  FCFA: 'XAF',
};

export const CURRENCY_REGIONAL_LABELS: Record<string, string> = {
  CDF: 'Franc congolais',
  USD: 'Dollar américain',
  EUR: 'Euro',
  CNY: 'Yuan renminbi (RMB)',
  XAF: 'Franc CFA BEAC (CEMAC)',
  XOF: 'Franc CFA BCEAO (UEMOA)',
};

export function toIsoCurrency(code: string): string {
  const upper = (code || '').trim().toUpperCase();
  return LEGACY_TO_ISO[upper] || upper;
}

export function currencyRegionalLabel(code: string): string {
  const iso = toIsoCurrency(code);
  return CURRENCY_REGIONAL_LABELS[iso] || iso;
}

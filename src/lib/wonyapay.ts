import { decodeSecret } from '@/lib/decode-secrets';

export function getWonyaPayConfig() {
  return {
    baseUrl: (process.env.WONYAPAY_BASE_URL || 'https://app-api.wonyasoft.com').trim(),
    token: (process.env.WONYAPAY_TOKEN || decodeSecret(process.env.WONYAPAY_TOKEN_ENCODED)).trim(),
    refPartenaire: (process.env.WONYAPAY_REF_PARTENAIRE || decodeSecret(process.env.WONYAPAY_REF_PARTENAIRE_ENCODED)).trim(),
  };
}

export function normalizeWonyaPhoneNumber(phoneNumber: string) {
  const digits = phoneNumber.replace(/\D/g, '');

  if (digits.length === 10) return digits;
  if (digits.length === 12 && digits.startsWith('243')) return `0${digits.slice(3)}`;

  return digits;
}

export function generateWonyaRefTransa() {
  const seed = `${Date.now()}${Math.random().toString(36).slice(2)}`.toUpperCase().replace(/[^A-Z0-9]/g, '');
  return seed.slice(0, 20).padEnd(20, '0');
}

export function isCompletedWonyaStatus(status: string | undefined) {
  // Selon la doc WonyaPay: C2B succès = "Succes", B2C succès = "Reçu"
  return ['succes', 'reçu', 'recu', 'completed', 'success', 'successful', 'paid', 'confirmed'].includes((status || '').toLowerCase());
}

export function isFailedWonyaStatus(status: string | undefined) {
  // Selon la doc WonyaPay: échec = "Echec"
  return ['echec', 'échec', 'failed', 'error', 'erreur'].includes((status || '').toLowerCase());
}

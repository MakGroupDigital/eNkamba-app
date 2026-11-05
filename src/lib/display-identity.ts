/**
 * ENK-025: never show a raw e-mail address or phone number as someone's name.
 * A chosen name is shown as-is; an identifier is masked so the person stays recognisable
 * without exposing the full personal data.
 */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE = /^\+?[\d\s().-]{7,}$/;

export function maskEmail(value: string) {
  const [local, domain] = value.split('@');
  return `${local.charAt(0)}•••@${domain}`;
}

export function maskPhone(value: string) {
  const digits = value.replace(/\D/g, '');
  if (digits.length < 4) return '•••';
  return `${value.trim().startsWith('+') ? '+' : ''}${digits.slice(0, 3)} ••• ${digits.slice(-2)}`;
}

export function displayIdentity(value: string | null | undefined, fallback = 'Utilisateur Kenz') {
  const text = (value || '').trim();
  if (!text) return fallback;
  if (EMAIL.test(text)) return maskEmail(text);
  if (PHONE.test(text)) return maskPhone(text);
  return text;
}

/** Chosen name for storage: prefers real names and never persists an e-mail as a display name. */
export function preferredDisplayName(...candidates: Array<string | null | undefined>) {
  const chosen = candidates.map((value) => (value || '').trim()).find((value) => value && !EMAIL.test(value));
  return chosen || 'Utilisateur Kenz';
}

/** "jean-marc" → "Jean-Marc", "MARTIN" → "Martin" (ENK-017). */
export function capitalizeName(value: string) {
  return value
    .toLocaleLowerCase('fr')
    .split(/([\s'’-])/)
    .map((part) => (part ? part.charAt(0).toLocaleUpperCase('fr') + part.slice(1) : part))
    .join('');
}

/** First name for greetings; empty when the account has no chosen name (never derived from the e-mail). */
export function greetingFirstName(displayName?: string | null) {
  const first = (displayName || '').trim().split(/\s+/)[0] || '';
  if (!first || EMAIL.test(first)) return '';
  return capitalizeName(first);
}

/**
 * Email Authentication Helper
 * 
 * Gère l'authentification par email avec code OTP
 * En développement: affiche le code dans la console
 * En production: envoie le code par email via Cloud Function
 */

interface EmailAuthData {
  email: string;
  code: string;
  timestamp: number;
  attempts: number;
}

const EMAIL_AUTH_STORAGE_KEY = 'enkamba_email_auth';
const CODE_EXPIRY_TIME = 5 * 60 * 1000; // 5 minutes
const MAX_ATTEMPTS = 5;

/**
 * Génère un code OTP aléatoire 6 chiffres
 */
export function generateOTPCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Sauvegarde les données d'authentification email en localStorage
 */
export function saveEmailAuthData(email: string, code: string): void {
  const data: EmailAuthData = {
    email,
    code,
    timestamp: Date.now(),
    attempts: 0,
  };
  localStorage.setItem(EMAIL_AUTH_STORAGE_KEY, JSON.stringify(data));
}

/**
 * Récupère les données d'authentification email
 */
export function getEmailAuthData(): EmailAuthData | null {
  const data = localStorage.getItem(EMAIL_AUTH_STORAGE_KEY);
  if (!data) return null;
  return JSON.parse(data);
}

/**
 * Supprime les données d'authentification email
 */
export function clearEmailAuthData(): void {
  localStorage.removeItem(EMAIL_AUTH_STORAGE_KEY);
}

/**
 * Vérifie si le code a expiré
 */
export function isCodeExpired(data: EmailAuthData): boolean {
  return Date.now() - data.timestamp > CODE_EXPIRY_TIME;
}

/**
 * Vérifie si le nombre de tentatives est dépassé
 */
export function isMaxAttemptsReached(data: EmailAuthData): boolean {
  return data.attempts >= MAX_ATTEMPTS;
}

/**
 * Envoie le code par email
 * 
 * En développement: affiche le code dans la console
 * En production: appelle une Cloud Function
 */
export async function sendEmailCode(email: string, code: string): Promise<void> {
  if (process.env.NODE_ENV === 'development') {
    // Développement: afficher le code dans la console
    console.log(`📧 Code d'authentification pour ${email}: ${code}`);
    return;
  }

  // Production: appeler la Cloud Function
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL}/sendEmailCode`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, code }),
      }
    );

    if (!response.ok) {
      throw new Error(`Erreur ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Erreur lors de l\'envoi du code par email:', error);
    throw new Error('Impossible d\'envoyer le code par email. Veuillez réessayer.');
  }
}

/**
 * Vérifie le code OTP
 */
export function verifyOTPCode(
  storedCode: string,
  enteredCode: string
): boolean {
  return storedCode === enteredCode.trim();
}

/**
 * Incrémente le nombre de tentatives
 */
export function incrementAttempts(data: EmailAuthData): void {
  data.attempts += 1;
  localStorage.setItem(EMAIL_AUTH_STORAGE_KEY, JSON.stringify(data));
}

/**
 * Obtient le nombre de tentatives restantes
 */
export function getRemainingAttempts(data: EmailAuthData): number {
  return Math.max(0, MAX_ATTEMPTS - data.attempts);
}

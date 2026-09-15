/**
 * Configuration WonyaPay simplifiée selon la documentation officielle
 * Base URL: https://app-api.wonyasoft.com
 */

export interface WonyaPayConfig {
  baseUrl: string;
  token: string;
  refPartenaire: string;
}

export interface WonyaPayRequest {
  RefPartenaire: string;
  RefTransa: string;
  Montant: number;
  Devise: 'CDF' | 'USD';
  Action: 'C2B' | 'B2C';
  MobileMoney: string; // Format: 10 chiffres (ex: 0997654321)
  Motif?: string;
}

export interface WonyaPayResponse {
  success: boolean;
  message: string;
  data?: {
    refTransa: string;
    montant: number;
    devise: string;
    frais?: number;
    montantTotal?: number;
    commission?: string;
    network?: string;
    action: string;
    status: string;
    transactionId?: string;
  };
}

/**
 * Récupère la configuration WonyaPay depuis les variables d'environnement
 */
export function getWonyaPayConfig(): WonyaPayConfig {
  const baseUrl = process.env.WONYAPAY_BASE_URL || 'https://app-api.wonyasoft.com';
  const token = process.env.WONYAPAY_TOKEN || '';
  const refPartenaire = process.env.WONYAPAY_REF_PARTENAIRE || '';

  if (!token || !refPartenaire) {
    throw new Error('Configuration WonyaPay manquante: WONYAPAY_TOKEN et WONYAPAY_REF_PARTENAIRE requis');
  }

  return { baseUrl, token, refPartenaire };
}

/**
 * Normalise un numéro de téléphone au format WonyaPay (10 chiffres)
 * Exemple: 0997654321
 */
export function normalizePhoneNumber(phoneNumber: string): string {
  const digits = phoneNumber.replace(/\D/g, '');
  
  // Si déjà 10 chiffres et commence par 0
  if (digits.length === 10 && digits.startsWith('0')) {
    return digits;
  }
  
  // Si 9 chiffres, ajouter 0 au début
  if (digits.length === 9) {
    return `0${digits}`;
  }
  
  // Si format international (+243...)
  if (digits.length === 12 && digits.startsWith('243')) {
    return `0${digits.slice(3)}`;
  }
  
  // Si format international avec 0 (2430...)
  if (digits.length === 13 && digits.startsWith('2430')) {
    return digits.slice(3);
  }
  
  throw new Error(`Format de numéro invalide: ${phoneNumber}. Attendu: 10 chiffres (ex: 0997654321)`);
}

// Cache local pour éviter les doublons dans la même session
const usedRefTransa = new Set<string>();

/**
 * Génère une référence de transaction unique (20 caractères alphanumériques)
 * Utilise différentes stratégies selon l'environnement pour maximiser l'unicité
 */
export function generateRefTransa(prefix?: string): string {
  const isProduction = process.env.NODE_ENV === 'production';
  const maxAttempts = 10;
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    let refTransa: string;
    
    if (isProduction) {
      // En production : utiliser une stratégie plus robuste
      refTransa = generateProductionRefTransa(prefix);
    } else {
      // En développement : utiliser la stratégie de test
      refTransa = generateTestRefTransa(prefix);
    }
    
    // Vérifier que cette RefTransa n'a pas été utilisée dans cette session
    if (!usedRefTransa.has(refTransa)) {
      usedRefTransa.add(refTransa);
      return refTransa;
    }
    
    // Si doublon local, attendre un peu et réessayer
    if (attempt < maxAttempts - 1) {
      // Attendre de 1 à 10ms de façon aléatoire
      const delay = Math.floor(Math.random() * 10) + 1;
      // Note: En environnement synchrone, on utilise une approche différente
      const start = Date.now();
      while (Date.now() - start < delay) {
        // Busy wait très court
      }
    }
  }
  
  // Fallback si tous les essais échouent (très improbable)
  return generateFallbackRefTransa(prefix);
}

/**
 * Génère une RefTransa pour l'environnement de production
 */
function generateProductionRefTransa(prefix?: string): string {
  const now = new Date();
  
  // Utiliser un timestamp très précis avec microsecondes
  const timestamp = now.getTime().toString(); // millisecondes depuis epoch
  const microseconds = (performance.now() * 1000000).toString().replace('.', '').substring(0, 6);
  
  // Générer une partie aléatoire cryptographiquement forte si possible
  let randomPart: string;
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint32Array(2);
    crypto.getRandomValues(array);
    randomPart = array[0].toString(36).toUpperCase() + array[1].toString(36).toUpperCase();
  } else {
    randomPart = Math.random().toString(36).substring(2, 8).toUpperCase() + 
                 Math.random().toString(36).substring(2, 8).toUpperCase();
  }
  
  // Ajouter un préfixe si fourni
  const prefixPart = prefix ? prefix.substring(0, 3).toUpperCase() : 'PRD';
  
  // Combiner tous les éléments
  const combined = `${prefixPart}${timestamp}${microseconds}${randomPart}`;
  
  // Prendre les 20 premiers caractères alphanumériques
  return combined.replace(/[^A-Z0-9]/g, '').substring(0, 20).padEnd(20, '0');
}

/**
 * Génère une RefTransa pour l'environnement de test/développement
 */
function generateTestRefTransa(prefix?: string): string {
  const now = new Date();
  
  // Utiliser un timestamp avec plus de précision pour les tests
  const timestamp = now.getTime().toString();
  const nanoseconds = (performance.now() * 1000000).toString().replace('.', '').substring(0, 8);
  
  // Générer plusieurs parties aléatoires
  const random1 = Math.random().toString(36).substring(2, 6).toUpperCase();
  const random2 = Math.random().toString(36).substring(2, 6).toUpperCase();
  
  // Ajouter un compteur basé sur les millisecondes + un offset aléatoire
  const counter = (now.getMilliseconds() + Math.floor(Math.random() * 1000)).toString().padStart(4, '0');
  
  // Ajouter un préfixe si fourni
  const prefixPart = prefix ? prefix.substring(0, 3).toUpperCase() : 'TST';
  
  // Combiner tous les éléments
  const combined = `${prefixPart}${timestamp}${nanoseconds}${random1}${random2}${counter}`;
  
  // Prendre les 20 premiers caractères alphanumériques
  return combined.replace(/[^A-Z0-9]/g, '').substring(0, 20).padEnd(20, '0');
}

/**
 * Génère une RefTransa de fallback en cas d'échec des autres méthodes
 */
function generateFallbackRefTransa(prefix?: string): string {
  const prefixPart = prefix ? prefix.substring(0, 3).toUpperCase() : 'FBK';
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2).toUpperCase();
  
  const combined = `${prefixPart}${timestamp}${random}`;
  return combined.replace(/[^A-Z0-9]/g, '').substring(0, 20).padEnd(20, '0');
}

/**
 * Nettoie le cache des RefTransa utilisées (utile pour les tests)
 */
export function clearRefTransaCache(): void {
  usedRefTransa.clear();
}

/**
 * Effectue une transaction WonyaPay (C2B ou B2C) avec retry automatique en cas de doublon
 */
export async function processWonyaPayTransaction(
  request: WonyaPayRequest,
  config: WonyaPayConfig
): Promise<WonyaPayResponse> {
  try {
    // Validation des paramètres
    if (!request.RefPartenaire || !request.RefTransa || !request.Montant || !request.Devise || !request.Action || !request.MobileMoney) {
      throw new Error('Paramètres manquants pour la transaction WonyaPay');
    }

    if (request.Montant <= 0) {
      throw new Error('Le montant doit être supérieur à 0');
    }

    if (!['CDF', 'USD'].includes(request.Devise)) {
      throw new Error('Devise invalide. Utilisez CDF ou USD');
    }

    if (!['C2B', 'B2C'].includes(request.Action)) {
      throw new Error('Action invalide. Utilisez C2B ou B2C');
    }

    // Normaliser le numéro de téléphone
    const normalizedPhone = normalizePhoneNumber(request.MobileMoney);
    
    // Retry logic pour éviter les doublons RefTransa
    let attempt = 0;
    const maxAttempts = 3;
    
    while (attempt < maxAttempts) {
      attempt++;
      
      // Générer une nouvelle RefTransa à chaque tentative
      const refTransa = generateRefTransa();
      
      const payload = {
        ...request,
        RefTransa: refTransa,
        MobileMoney: normalizedPhone
      };

      console.log(`WonyaPay Request (tentative ${attempt}):`, {
        RefPartenaire: payload.RefPartenaire,
        RefTransa: payload.RefTransa,
        Montant: payload.Montant,
        Devise: payload.Devise,
        Action: payload.Action,
        MobileMoney: payload.MobileMoney,
        Motif: payload.Motif || 'Transaction Kenz'
      });

      const response = await fetch(`${config.baseUrl}/payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.token}`
        },
        body: JSON.stringify(payload)
      });

      let responseData;
      try {
        responseData = await response.json();
      } catch (error) {
        console.error('Erreur parsing réponse WonyaPay:', error);
        throw new Error('Réponse WonyaPay invalide');
      }

      console.log(`WonyaPay Response (tentative ${attempt}):`, {
        status: response.status,
        ok: response.ok,
        data: responseData
      });

      // Si succès, retourner la réponse
      if (response.ok) {
        return {
          ...responseData,
          refTransa // Inclure la RefTransa utilisée dans la réponse
        };
      }

      // Si erreur 409 (doublon) et qu'on peut encore essayer, continuer
      if (response.status === 409 && attempt < maxAttempts) {
        console.log(`RefTransa ${refTransa} déjà utilisé, nouvelle tentative...`);
        // Attendre un peu avant de réessayer
        await new Promise(resolve => setTimeout(resolve, 100 * attempt));
        continue;
      }

      // Pour toute autre erreur, ou si on a épuisé les tentatives
      const errorMessage = responseData.message || responseData.error || 'Erreur WonyaPay';
      const errorDetails = responseData.errors ? JSON.stringify(responseData.errors) : '';
      
      switch (response.status) {
        case 400:
          throw new Error(`${errorMessage}${errorDetails ? ` - Détails: ${errorDetails}` : ''}`);
        case 401:
          throw new Error('Token d\'authentification invalide ou manquant');
        case 404:
          throw new Error('Caisse introuvable');
        case 409:
          throw new Error('RefTransa déjà utilisé (doublon) - Toutes les tentatives épuisées');
        case 500:
          throw new Error('Erreur serveur WonyaPay');
        default:
          throw new Error(`${errorMessage}${errorDetails ? ` - Détails: ${errorDetails}` : ''} (Status: ${response.status})`);
      }
    }

    throw new Error('Nombre maximum de tentatives atteint');

  } catch (error) {
    console.error('Erreur transaction WonyaPay:', error);
    throw error;
  }
}

/**
 * Vérifie le statut d'une transaction
 */
export async function getTransactionStatus(
  refTransa: string,
  config: WonyaPayConfig
): Promise<any> {
  try {
    const response = await fetch(`${config.baseUrl}/transactionStatus/status/${refTransa}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Erreur lors de la vérification du statut: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Erreur vérification statut:', error);
    throw error;
  }
}

/**
 * Vérifie si le statut WonyaPay indique une transaction complétée
 * Selon la documentation: C2B succès = "Succes", B2C succès = "Reçu"
 */
export function isCompletedWonyaStatus(status: string | undefined): boolean {
  if (!status) return false;
  const normalizedStatus = status.toLowerCase().trim();
  return ['succes', 'success', 'reçu', 'recu', 'completed', 'successful', 'paid', 'confirmed'].includes(normalizedStatus);
}

/**
 * Vérifie si le statut WonyaPay indique une transaction échouée
 * Selon la documentation: échec = "Echec"
 */
export function isFailedWonyaStatus(status: string | undefined): boolean {
  if (!status) return false;
  const normalizedStatus = status.toLowerCase().trim();
  return ['echec', 'échec', 'failed', 'error', 'erreur', 'rejected', 'cancelled'].includes(normalizedStatus);
}

/**
 * Vérifie si le statut WonyaPay indique une transaction en attente
 */
export function isPendingWonyaStatus(status: string | undefined): boolean {
  if (!status) return true;
  const normalizedStatus = status.toLowerCase().trim();
  return ['pending', 'en_attente', 'attente', 'processing', 'initiated', 'initie'].includes(normalizedStatus);
}

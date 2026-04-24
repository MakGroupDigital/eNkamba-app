/**
 * Service de conversion de devises vers CDF
 * Utilise les taux de change en temps réel
 */

// Cache des taux de change (valide 1 heure)
let exchangeRatesCache: { [key: string]: number } | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 heure en millisecondes

// Taux de change par défaut (fallback si l'API échoue)
const DEFAULT_RATES: { [key: string]: number } = {
  USD: 2850, // 1 USD = 2850 CDF (approximatif)
  EUR: 3100, // 1 EUR = 3100 CDF (approximatif)
  CDF: 1,    // 1 CDF = 1 CDF
  FC: 1,     // Franc Congolais = CDF
};

/**
 * Récupère les taux de change depuis une API
 */
async function fetchExchangeRates(): Promise<{ [key: string]: number }> {
  try {
    // Vérifier le cache
    const now = Date.now();
    if (exchangeRatesCache && (now - lastFetchTime) < CACHE_DURATION) {
      return exchangeRatesCache;
    }

    // Utiliser l'API exchangerate-api (gratuite)
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/CDF', {
      next: { revalidate: 3600 } // Cache Next.js de 1 heure
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des taux');
    }

    const data = await response.json();
    
    // Inverser les taux car l'API donne CDF vers autres devises
    // On veut autres devises vers CDF
    const rates: { [key: string]: number } = {
      CDF: 1,
      FC: 1,
    };

    if (data.rates) {
      // Convertir les taux (inverser)
      if (data.rates.USD) rates.USD = 1 / data.rates.USD;
      if (data.rates.EUR) rates.EUR = 1 / data.rates.EUR;
    }

    // Mettre en cache
    exchangeRatesCache = rates;
    lastFetchTime = now;

    return rates;
  } catch (error) {
    console.error('Erreur récupération taux de change:', error);
    
    // Retourner les taux par défaut en cas d'erreur
    return DEFAULT_RATES;
  }
}

/**
 * Convertit un montant d'une devise vers CDF
 * @param amount - Montant à convertir
 * @param fromCurrency - Devise source (USD, EUR, CDF, etc.)
 * @returns Montant en CDF
 */
export async function convertToCDF(amount: number, fromCurrency: string): Promise<number> {
  // Si déjà en CDF, retourner directement
  const currency = (fromCurrency || 'CDF').toUpperCase().trim();
  if (currency === 'CDF' || currency === 'FC') {
    return amount;
  }

  try {
    const rates = await fetchExchangeRates();
    const rate = rates[currency];

    if (!rate) {
      console.warn(`Taux de change non trouvé pour ${currency}, utilisation du taux par défaut`);
      return amount * (DEFAULT_RATES[currency] || 1);
    }

    return amount * rate;
  } catch (error) {
    console.error('Erreur conversion devise:', error);
    // Fallback sur les taux par défaut
    return amount * (DEFAULT_RATES[currency] || 1);
  }
}

/**
 * Convertit un montant de manière synchrone (utilise le cache ou les taux par défaut)
 * @param amount - Montant à convertir
 * @param fromCurrency - Devise source
 * @returns Montant en CDF
 */
export function convertToCDFSync(amount: number, fromCurrency: string): number {
  const currency = (fromCurrency || 'CDF').toUpperCase().trim();
  
  if (currency === 'CDF' || currency === 'FC') {
    return amount;
  }

  // Utiliser le cache si disponible
  if (exchangeRatesCache && exchangeRatesCache[currency]) {
    return amount * exchangeRatesCache[currency];
  }

  // Sinon utiliser les taux par défaut
  return amount * (DEFAULT_RATES[currency] || 1);
}

/**
 * Formate un prix en CDF
 * @param amount - Montant en CDF
 * @returns Chaîne formatée (ex: "2 850 CDF")
 */
export function formatCDF(amount: number): string {
  return `${Math.round(amount).toLocaleString('fr-FR')} CDF`;
}

/**
 * Initialise le cache des taux de change (à appeler au démarrage)
 */
export async function initializeExchangeRates(): Promise<void> {
  try {
    await fetchExchangeRates();
  } catch (error) {
    console.error('Erreur initialisation taux de change:', error);
  }
}

/**
 * Obtient le taux de change actuel pour une devise
 * @param currency - Code de la devise (USD, EUR, etc.)
 * @returns Taux de change vers CDF
 */
export async function getExchangeRate(currency: string): Promise<number> {
  const rates = await fetchExchangeRates();
  return rates[currency.toUpperCase()] || DEFAULT_RATES[currency.toUpperCase()] || 1;
}

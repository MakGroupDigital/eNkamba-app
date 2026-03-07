/**
 * Récupère le taux de change USD vers CDF
 * Utilise l'API Exchange Rate (gratuite, sans clé)
 */
export async function getUsdToCdfRate(): Promise<number> {
  try {
    // API gratuite sans clé requise
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    
    if (!response.ok) {
      throw new Error('Erreur lors de la récupération du taux de change');
    }

    const data = await response.json();
    
    // Le taux CDF n'est pas toujours disponible, utiliser un taux de secours
    const cdfRate = data.rates?.CDF || 2800; // Taux de secours approximatif
    
    return cdfRate;
  } catch (error) {
    console.error('Erreur récupération taux de change:', error);
    // Taux de secours en cas d'erreur (approximatif)
    return 2800;
  }
}

/**
 * Convertit USD en CDF
 */
export async function convertUsdToCdf(usdAmount: number): Promise<{ cdfAmount: number; rate: number }> {
  const rate = await getUsdToCdfRate();
  const cdfAmount = Math.round(usdAmount * rate);
  
  return {
    cdfAmount,
    rate,
  };
}

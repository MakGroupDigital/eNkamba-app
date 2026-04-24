'use client';

import { useEffect } from 'react';
import { initializeExchangeRates } from '@/lib/currency-converter';

/**
 * Composant pour initialiser les taux de change au démarrage de l'application
 */
export function CurrencyInitializer() {
  useEffect(() => {
    // Initialiser les taux de change
    initializeExchangeRates().catch((error) => {
      console.error('Erreur initialisation taux de change:', error);
    });

    // Rafraîchir les taux toutes les heures
    const interval = setInterval(() => {
      initializeExchangeRates().catch((error) => {
        console.error('Erreur rafraîchissement taux de change:', error);
      });
    }, 60 * 60 * 1000); // 1 heure

    return () => clearInterval(interval);
  }, []);

  return null; // Ce composant ne rend rien
}

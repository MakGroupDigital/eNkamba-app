import { useState, useEffect } from 'react';
import { convertToCDF, formatCDF, initializeExchangeRates } from '@/lib/currency-converter';

/**
 * Hook pour convertir et afficher les prix en CDF
 */
export function useCurrencyConverter() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Initialiser les taux de change au montage
    initializeExchangeRates().then(() => {
      setIsReady(true);
    });
  }, []);

  /**
   * Convertit un prix vers CDF
   */
  const convertPrice = async (amount: number, currency: string): Promise<number> => {
    return await convertToCDF(amount, currency);
  };

  /**
   * Formate un prix en CDF
   */
  const formatPrice = (amount: number): string => {
    return formatCDF(amount);
  };

  return {
    isReady,
    convertPrice,
    formatPrice,
  };
}

/**
 * Hook pour convertir un produit avec son prix en CDF
 */
export function useProductWithCDF(product: any) {
  const [priceInCDF, setPriceInCDF] = useState<number>(0);
  const [isConverting, setIsConverting] = useState(true);

  useEffect(() => {
    if (!product) {
      setIsConverting(false);
      return;
    }

    const convert = async () => {
      try {
        setIsConverting(true);
        const price = Number(product.price || 0);
        const currency = product.currency || 'CDF';
        const converted = await convertToCDF(price, currency);
        setPriceInCDF(converted);
      } catch (error) {
        console.error('Erreur conversion prix:', error);
        setPriceInCDF(Number(product.price || 0));
      } finally {
        setIsConverting(false);
      }
    };

    convert();
  }, [product]);

  return {
    priceInCDF,
    isConverting,
    formattedPrice: formatCDF(priceInCDF),
  };
}

import { useState, useEffect } from 'react';

interface ExchangeRates {
  EUR: number;
  USD: number;
  CNY: number;
  XOF: number;
}

export function useCurrencyConversion(balanceCDF: number) {
  const [rates, setRates] = useState<ExchangeRates>({
    EUR: 0.00038,
    USD: 0.00036,
    CNY: 0.0026,
    XOF: 0.22,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRates = async () => {
      try {
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/CDF');
        if (response.ok) {
          const data = await response.json();
          setRates({
            EUR: data.rates?.EUR || rates.EUR,
            USD: data.rates?.USD || rates.USD,
            CNY: data.rates?.CNY || rates.CNY,
            XOF: data.rates?.XOF || rates.XOF,
          });
        }
      } catch (error) {
        console.error('Erreur récupération taux:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRates();
  }, []);

  const conversions = {
    EUR: balanceCDF * rates.EUR,
    USD: balanceCDF * rates.USD,
    CNY: balanceCDF * rates.CNY,
    XOF: balanceCDF * rates.XOF,
  };

  return { conversions, rates, isLoading };
}

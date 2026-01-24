import { useState, useEffect, useCallback } from 'react';

const REFERRAL_CODE_KEY = 'enkamba_referral_code';

export function useReferralCode() {
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Charger le code de parrainage au montage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(REFERRAL_CODE_KEY);
      setReferralCode(stored);
    } catch (error) {
      console.error('Erreur lecture code parrainage:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Générer un code de parrainage unique
  const generateReferralCode = useCallback(() => {
    const code = `ENK${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
    return code;
  }, []);

  // Créer ou récupérer le code de parrainage
  const getOrCreateReferralCode = useCallback(() => {
    if (referralCode) {
      return referralCode;
    }

    const newCode = generateReferralCode();
    try {
      localStorage.setItem(REFERRAL_CODE_KEY, newCode);
      setReferralCode(newCode);
    } catch (error) {
      console.error('Erreur sauvegarde code parrainage:', error);
    }

    return newCode;
  }, [referralCode, generateReferralCode]);

  // Définir un code de parrainage (utilisé lors de l'inscription avec lien)
  const setReferralCodeFromLink = useCallback((code: string) => {
    try {
      localStorage.setItem(REFERRAL_CODE_KEY, code);
      setReferralCode(code);
    } catch (error) {
      console.error('Erreur sauvegarde code parrainage:', error);
    }
  }, []);

  return {
    referralCode,
    isLoading,
    generateReferralCode,
    getOrCreateReferralCode,
    setReferralCodeFromLink,
  };
}

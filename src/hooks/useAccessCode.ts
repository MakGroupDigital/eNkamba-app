import { useState, useEffect } from 'react';

const ACCESS_CODE_SESSION_KEY = 'enkamba_access_verified';
const CORRECT_CODE = process.env.NEXT_PUBLIC_ACCESS_CODE || 'eNkamba2000';

export function useAccessCode() {
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if access code is verified in current session
  useEffect(() => {
    // Utiliser sessionStorage au lieu de localStorage pour forcer la vérification à chaque ouverture
    const verified = sessionStorage.getItem(ACCESS_CODE_SESSION_KEY);
    if (verified === 'true') {
      setIsVerified(true);
    }
    setIsLoading(false);
  }, []);

  const verifyCode = (code: string): boolean => {
    if (code === CORRECT_CODE) {
      // Sauvegarder dans sessionStorage (expire à la fermeture du navigateur)
      sessionStorage.setItem(ACCESS_CODE_SESSION_KEY, 'true');
      setIsVerified(true);
      setError(null);
      return true;
    } else {
      setError('Code d\'accès incorrect');
      return false;
    }
  };

  const logout = () => {
    sessionStorage.removeItem(ACCESS_CODE_SESSION_KEY);
    setIsVerified(false);
  };

  return {
    isVerified,
    isLoading,
    error,
    verifyCode,
    logout,
  };
}

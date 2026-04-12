import { useState, useEffect } from 'react';

const ACCESS_CODE_STORAGE_KEY = 'enkamba_access_verified';
const CORRECT_CODE = process.env.NEXT_PUBLIC_ACCESS_CODE || 'eNkamba2026';

export function useAccessCode() {
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if access code is already verified on mount
  useEffect(() => {
    const verified = localStorage.getItem(ACCESS_CODE_STORAGE_KEY);
    if (verified === 'true') {
      setIsVerified(true);
    }
    setIsLoading(false);
  }, []);

  const verifyCode = (code: string): boolean => {
    if (code === CORRECT_CODE) {
      localStorage.setItem(ACCESS_CODE_STORAGE_KEY, 'true');
      setIsVerified(true);
      setError(null);
      return true;
    } else {
      setError('Code d\'accès incorrect');
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem(ACCESS_CODE_STORAGE_KEY);
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

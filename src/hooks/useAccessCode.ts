import { useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const ACCESS_CODE_SESSION_KEY = 'enkamba_access_verified';
const ACCESS_CODE_VERSION_KEY = 'enkamba_access_version';
const FALLBACK_CODE = process.env.NEXT_PUBLIC_ACCESS_CODE || 'Martin2026';
const ACCESS_CONFIG_REF = doc(db, 'app_config', 'access_control');

type AccessConfig = {
  codeHash?: string;
  version?: string;
};

async function hashAccessCode(code: string) {
  const encoded = new TextEncoder().encode(code);
  const digest = await crypto.subtle.digest('SHA-256', encoded);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export function useAccessCode() {
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accessConfig, setAccessConfig] = useState<AccessConfig>({
    version: 'env-fallback',
  });

  useEffect(() => {
    let mounted = true;

    const unsubscribe = onSnapshot(
      ACCESS_CONFIG_REF,
      (snapshot) => {
        const data = snapshot.exists() ? (snapshot.data() as AccessConfig) : {};
        const version = data.version || 'env-fallback';

        if (!mounted) return;
        setAccessConfig({
          codeHash: data.codeHash,
          version,
        });

        const verified = sessionStorage.getItem(ACCESS_CODE_SESSION_KEY);
        const verifiedVersion = sessionStorage.getItem(ACCESS_CODE_VERSION_KEY);
        setIsVerified(verified === 'true' && verifiedVersion === version);
        setIsLoading(false);
      },
      (configError) => {
        console.warn('Access config unavailable, using env fallback:', configError);
        if (!mounted) return;

        setAccessConfig({ version: 'env-fallback' });
        const verified = sessionStorage.getItem(ACCESS_CODE_SESSION_KEY);
        const verifiedVersion = sessionStorage.getItem(ACCESS_CODE_VERSION_KEY);
        setIsVerified(verified === 'true' && verifiedVersion === 'env-fallback');
        setIsLoading(false);
      },
    );

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const verifyCode = useCallback(async (code: string): Promise<boolean> => {
    const submittedHash = await hashAccessCode(code);
    const matchesFirestoreCode = accessConfig.codeHash && submittedHash === accessConfig.codeHash;
    const matchesFallbackCode = !accessConfig.codeHash && code === FALLBACK_CODE;

    if (matchesFirestoreCode || matchesFallbackCode) {
      sessionStorage.setItem(ACCESS_CODE_SESSION_KEY, 'true');
      sessionStorage.setItem(ACCESS_CODE_VERSION_KEY, accessConfig.version || 'env-fallback');
      setIsVerified(true);
      setError(null);
      return true;
    }

    setError('Code d\'accès incorrect');
    return false;
  }, [accessConfig.codeHash, accessConfig.version]);

  const logout = () => {
    sessionStorage.removeItem(ACCESS_CODE_SESSION_KEY);
    sessionStorage.removeItem(ACCESS_CODE_VERSION_KEY);
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

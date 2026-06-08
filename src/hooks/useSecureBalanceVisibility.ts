'use client';

import { useCallback, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export function useSecureBalanceVisibility() {
  const { toast } = useToast();
  const [isBalanceVisible, setIsBalanceVisible] = useState(false);
  const [isPinOpen, setIsPinOpen] = useState(false);
  const [isBiometricChecking, setIsBiometricChecking] = useState(false);

  const requestUnlock = useCallback(async () => {
    if (isBalanceVisible || isBiometricChecking) return;

    setIsBiometricChecking(true);

    try {
      const publicKeyAvailable =
        typeof window !== 'undefined' &&
        'PublicKeyCredential' in window &&
        typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function' &&
        await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();

      if (publicKeyAvailable && navigator.credentials?.get) {
        const challenge = new Uint8Array(32);
        crypto.getRandomValues(challenge);

        await navigator.credentials.get({
          publicKey: {
            challenge,
            timeout: 60000,
            userVerification: 'required',
          },
        });

        setIsBalanceVisible(true);
        return;
      }
    } catch {
      toast({
        title: 'Vérification biométrique indisponible',
        description: 'Veuillez confirmer avec votre code PIN eNkamba.',
      });
    } finally {
      setIsBiometricChecking(false);
    }

    setIsPinOpen(true);
  }, [isBalanceVisible, isBiometricChecking, toast]);

  const lockBalance = useCallback(() => {
    setIsBalanceVisible(false);
  }, []);

  const handlePinSuccess = useCallback(() => {
    setIsPinOpen(false);
    setIsBalanceVisible(true);
  }, []);

  return {
    isBalanceVisible,
    isBiometricChecking,
    isPinOpen,
    setIsPinOpen,
    requestUnlock,
    lockBalance,
    handlePinSuccess,
  };
}

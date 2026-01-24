import { useState, useEffect, useCallback } from 'react';

const KYC_STATUS_KEY = 'enkamba_kyc_status';

export interface KycStatus {
  isCompleted: boolean;
  currentStep?: string;
  completedAt?: number;
}

export function useKycStatus() {
  const [kycStatus, setKycStatus] = useState<KycStatus>({ isCompleted: false });
  const [isLoading, setIsLoading] = useState(true);

  // Charger le statut KYC au montage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(KYC_STATUS_KEY);
      if (stored) {
        setKycStatus(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Erreur lecture KYC status:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Marquer KYC comme complété
  const completeKyc = useCallback(() => {
    const status: KycStatus = {
      isCompleted: true,
      completedAt: Date.now(),
    };
    setKycStatus(status);
    try {
      localStorage.setItem(KYC_STATUS_KEY, JSON.stringify(status));
    } catch (error) {
      console.error('Erreur sauvegarde KYC status:', error);
    }
  }, []);

  // Réinitialiser le statut KYC
  const resetKyc = useCallback(() => {
    setKycStatus({ isCompleted: false });
    try {
      localStorage.removeItem(KYC_STATUS_KEY);
    } catch (error) {
      console.error('Erreur suppression KYC status:', error);
    }
  }, []);

  return {
    kycStatus,
    isKycCompleted: kycStatus.isCompleted,
    isLoading,
    completeKyc,
    resetKyc,
  };
}

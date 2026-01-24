import { useState, useEffect, useCallback } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';

const KYC_STATUS_KEY = 'enkamba_kyc_status';

export interface KycStatus {
  isCompleted: boolean;
  currentStep?: string;
  completedAt?: number;
}

export function useKycStatus() {
  const { user, isLoading: authLoading } = useAuth();
  const [kycStatus, setKycStatus] = useState<KycStatus>({ isCompleted: false });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger le statut KYC au montage et quand l'utilisateur change
  useEffect(() => {
    const loadKycStatus = async () => {
      try {
        // Attendre que l'auth soit chargée AVANT de faire quoi que ce soit
        if (authLoading) {
          return;
        }

        setIsLoading(true);
        setError(null);

        // Si pas d'utilisateur, arrêter
        if (!user?.uid) {
          setIsLoading(false);
          return;
        }

        // Appeler la Cloud Function pour récupérer le statut KYC depuis Firebase
        // C'est la source de vérité - TOUJOURS vérifier Firebase en priorité
        try {
          const getKycStatusFn = httpsCallable(functions, 'getKycStatus');
          const result = await getKycStatusFn({ userId: user.uid });
          const data = result.data as any;

          const newStatus: KycStatus = {
            isCompleted: data.isCompleted || false,
            completedAt: data.completedAt,
          };

          setKycStatus(newStatus);

          // Sauvegarder aussi en localStorage pour fallback
          try {
            localStorage.setItem(KYC_STATUS_KEY, JSON.stringify(newStatus));
          } catch (e) {
            console.warn('Erreur sauvegarde localStorage:', e);
          }
        } catch (firebaseErr: any) {
          console.warn('Cloud Function non disponible:', firebaseErr.message);
          // Fallback sur localStorage SEULEMENT si Firebase échoue
          try {
            const stored = localStorage.getItem(KYC_STATUS_KEY);
            if (stored) {
              const parsed = JSON.parse(stored);
              setKycStatus(parsed);
            } else {
              // Pas de données du tout, réinitialiser
              setKycStatus({ isCompleted: false });
            }
          } catch (e) {
            console.warn('Erreur lecture localStorage:', e);
            setKycStatus({ isCompleted: false });
          }
        }

        setIsLoading(false);
      } catch (err: any) {
        console.error('Erreur chargement KYC status:', err);
        setError(err.message);
        setIsLoading(false);
      }
    };

    loadKycStatus();
  }, [user?.uid, authLoading]);

  // Marquer KYC comme complété
  const completeKyc = useCallback(async (kycData: {
    identityType: string;
    identityNumber: string;
    fullName: string;
    dateOfBirth: string;
    country: string;
    linkedAccount?: any;
  }) => {
    try {
      if (!user?.uid) {
        throw new Error('Utilisateur non authentifié');
      }

      setIsLoading(true);
      setError(null);

      // Appeler la Cloud Function pour compléter le KYC
      const completeKycFn = httpsCallable(functions, 'completeKyc');
      const result = await completeKycFn({
        userId: user.uid,
        ...kycData,
      });

      const data = result.data as any;

      // Vérifier que la Cloud Function a réussi AVANT de mettre à jour le statut local
      if (!data.success) {
        throw new Error(data.message || 'Erreur lors de la vérification KYC');
      }

      // Mettre à jour le statut local SEULEMENT si la Cloud Function a réussi
      const newStatus: KycStatus = {
        isCompleted: true,
        completedAt: Date.now(),
      };

      setKycStatus(newStatus);
      
      // Sauvegarder aussi en localStorage pour fallback
      try {
        localStorage.setItem(KYC_STATUS_KEY, JSON.stringify(newStatus));
      } catch (e) {
        console.warn('Erreur sauvegarde localStorage:', e);
      }

      setIsLoading(false);

      return {
        success: true,
        message: data.message,
      };
    } catch (err: any) {
      console.error('Erreur complétude KYC:', err);
      setError(err.message);
      setIsLoading(false);
      throw err;
    }
  }, [user?.uid]);

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
    isKycCompleted: kycStatus.isCompleted,
    kycStatus,
    isLoading,
    error,
    completeKyc,
    resetKyc,
  };
}

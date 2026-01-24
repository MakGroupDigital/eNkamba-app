import { useState, useEffect } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';

export interface UserProfile {
  uid: string;
  email: string;
  phone?: string;
  fullName?: string;
  dateOfBirth?: string;
  country?: string;
  kycStatus?: string;
  kycCompletedAt?: number;
  kyc?: {
    identity?: {
      type: string;
      fullName: string;
      dateOfBirth: string;
      country: string;
    };
    linkedAccount?: {
      type: 'mobile_money' | 'bank';
      operator?: string;
      phoneNumber?: string;
      accountName?: string;
      bankName?: string;
      accountNumber?: string;
      swiftCode?: string;
    };
  };
  createdAt?: number;
  lastLogin?: number;
}

export function useUserProfile() {
  const { user, isLoading: authLoading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        if (authLoading) {
          return;
        }

        setIsLoading(true);
        setError(null);

        if (!user?.uid) {
          setIsLoading(false);
          return;
        }

        // Appeler une Cloud Function pour récupérer le profil utilisateur
        try {
          const getUserProfileFn = httpsCallable(functions, 'getUserProfile');
          const result = await getUserProfileFn({ userId: user.uid });
          const data = result.data as any;

          if (data.success) {
            setProfile(data.profile);
          } else {
            throw new Error(data.message || 'Erreur lors de la récupération du profil');
          }
        } catch (firebaseErr: any) {
          console.warn('Erreur récupération profil:', firebaseErr.message);
          setError(firebaseErr.message);
        }

        setIsLoading(false);
      } catch (err: any) {
        console.error('Erreur chargement profil:', err);
        setError(err.message);
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [user?.uid, authLoading]);

  return {
    profile,
    isLoading,
    error,
  };
}

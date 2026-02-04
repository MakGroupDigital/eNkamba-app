import { useState, useEffect } from 'react';
import { httpsCallable } from 'firebase/functions';
import { doc, getDoc } from 'firebase/firestore';
import { functions, db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';

export interface UserProfile {
  uid: string;
  email: string;
  phone?: string;
  fullName?: string;
  dateOfBirth?: string;
  country?: string;
  profileImage?: string;
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

        // Essayer d'abord Firestore directement (évite CORS en dev)
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setProfile({
              uid: user.uid,
              email: user.email || userData.email || '',
              phone: userData.phone,
              fullName: userData.fullName || user.displayName || '',
              dateOfBirth: userData.dateOfBirth,
              country: userData.country,
              profileImage: user.photoURL || userData.profileImage,
              kycStatus: userData.kycStatus,
              kycCompletedAt: userData.kycCompletedAt,
              kyc: userData.kyc,
              createdAt: userData.createdAt?.toMillis?.() || Date.now(),
              lastLogin: userData.lastLogin?.toMillis?.() || Date.now(),
            });
          } else {
            // Créer un profil basique depuis Firebase Auth
            setProfile({
              uid: user.uid,
              email: user.email || '',
              fullName: user.displayName || '',
              profileImage: user.photoURL || undefined,
              createdAt: Date.now(),
              lastLogin: Date.now(),
            });
          }
        } catch (firestoreErr: any) {
          console.warn('Erreur Firestore, essai Cloud Function:', firestoreErr.message);
          
          // Fallback: Essayer Cloud Function
          try {
            const getUserProfileFn = httpsCallable(functions, 'getUserProfile');
            const result = await getUserProfileFn({ userId: user.uid });
            const data = result.data as any;

            if (data.success) {
              setProfile(data.profile);
            } else {
              throw new Error(data.message || 'Erreur lors de la récupération du profil');
            }
          } catch (cloudErr: any) {
            console.error('Erreur Cloud Function:', cloudErr);
            // En dernier recours, utiliser les données de Firebase Auth
            setProfile({
              uid: user.uid,
              email: user.email || '',
              fullName: user.displayName || '',
              profileImage: user.photoURL || undefined,
              createdAt: Date.now(),
              lastLogin: Date.now(),
            });
          }
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

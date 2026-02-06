import { useState, useEffect } from 'react';
import { httpsCallable } from 'firebase/functions';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { functions, db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';

export interface UserProfile {
  uid: string;
  email: string;
  phone?: string;
  phoneNumber?: string;
  fullName?: string;
  name?: string;
  dateOfBirth?: string;
  country?: string;
  profileImage?: string;
  kycStatus?: string;
  kycCompletedAt?: number;
  accountNumber?: string;
  cardNumber?: string;
  walletBalance?: number;
  currency?: string;
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

// Fonction pour générer un accountNumber unique
function generateAccountNumber(uid: string): string {
  const hash = uid.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return `ENK${String(hash).padStart(12, '0')}`;
}

// Fonction pour générer un cardNumber unique
function generateCardNumber(uid: string): string {
  const hash = uid.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const part1 = String(hash).padStart(4, '0').slice(0, 4);
  const part2 = String(hash * 2).padStart(4, '0').slice(0, 4);
  const part3 = String(hash * 3).padStart(4, '0').slice(0, 4);
  const part4 = String(hash * 4).padStart(4, '0').slice(0, 4);
  return `${part1} ${part2} ${part3} ${part4}`;
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
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            
            // Vérifier si accountNumber et cardNumber existent, sinon les générer
            let needsUpdate = false;
            const updates: any = {};
            
            if (!userData.accountNumber) {
              updates.accountNumber = generateAccountNumber(user.uid);
              needsUpdate = true;
            }
            
            if (!userData.cardNumber) {
              updates.cardNumber = generateCardNumber(user.uid);
              needsUpdate = true;
            }
            
            if (!userData.walletBalance && userData.walletBalance !== 0) {
              updates.walletBalance = 0;
              needsUpdate = true;
            }
            
            if (!userData.currency) {
              updates.currency = 'CDF';
              needsUpdate = true;
            }
            
            // Mettre à jour si nécessaire
            if (needsUpdate) {
              await updateDoc(userDocRef, updates);
              // Recharger les données
              const updatedDoc = await getDoc(userDocRef);
              const updatedData = updatedDoc.data();
              
              setProfile({
                uid: user.uid,
                email: user.email || updatedData?.email || '',
                phone: updatedData?.phone,
                phoneNumber: updatedData?.phoneNumber,
                fullName: updatedData?.fullName || user.displayName || '',
                name: updatedData?.name,
                dateOfBirth: updatedData?.dateOfBirth,
                country: updatedData?.country,
                profileImage: user.photoURL || updatedData?.profileImage,
                kycStatus: updatedData?.kycStatus,
                kycCompletedAt: updatedData?.kycCompletedAt,
                accountNumber: updatedData?.accountNumber,
                cardNumber: updatedData?.cardNumber,
                walletBalance: updatedData?.walletBalance || 0,
                currency: updatedData?.currency || 'CDF',
                kyc: updatedData?.kyc,
                createdAt: updatedData?.createdAt?.toMillis?.() || Date.now(),
                lastLogin: updatedData?.lastLogin?.toMillis?.() || Date.now(),
              });
            } else {
              setProfile({
                uid: user.uid,
                email: user.email || userData.email || '',
                phone: userData.phone,
                phoneNumber: userData.phoneNumber,
                fullName: userData.fullName || user.displayName || '',
                name: userData.name,
                dateOfBirth: userData.dateOfBirth,
                country: userData.country,
                profileImage: user.photoURL || userData.profileImage,
                kycStatus: userData.kycStatus,
                kycCompletedAt: userData.kycCompletedAt,
                accountNumber: userData.accountNumber,
                cardNumber: userData.cardNumber,
                walletBalance: userData.walletBalance || 0,
                currency: userData.currency || 'CDF',
                kyc: userData.kyc,
                createdAt: userData.createdAt?.toMillis?.() || Date.now(),
                lastLogin: userData.lastLogin?.toMillis?.() || Date.now(),
              });
            }
          } else {
            // Créer un profil complet avec accountNumber et cardNumber
            const newProfile = {
              uid: user.uid,
              email: user.email || '',
              fullName: user.displayName || '',
              name: user.displayName || '',
              profileImage: user.photoURL || undefined,
              accountNumber: generateAccountNumber(user.uid),
              cardNumber: generateCardNumber(user.uid),
              walletBalance: 0,
              currency: 'CDF',
              createdAt: Date.now(),
              lastLogin: Date.now(),
            };
            
            // Créer le document dans Firestore
            await setDoc(userDocRef, {
              ...newProfile,
              createdAt: new Date(),
              lastLogin: new Date(),
            });
            
            setProfile(newProfile);
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
              name: user.displayName || '',
              profileImage: user.photoURL || undefined,
              accountNumber: generateAccountNumber(user.uid),
              cardNumber: generateCardNumber(user.uid),
              walletBalance: 0,
              currency: 'CDF',
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

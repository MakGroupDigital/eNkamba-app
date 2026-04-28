'use client';

import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import type { BusinessUser } from '@/types/business-dashboard.types';

export function useBusinessStatus() {
  const [user, setUser] = useState<User | null>(null);
  const [businessUser, setBusinessUser] = useState<BusinessUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    async function fetchBusinessStatus() {
      if (!user?.uid) {
        setIsLoading(false);
        return;
      }

      try {
        const businessDocRef = doc(db, 'businessUsers', user.uid);
        const businessDoc = await getDoc(businessDocRef);

        if (businessDoc.exists()) {
          const data = businessDoc.data();
          setBusinessUser({
            uid: user.uid,
            businessName: data.businessName || 'Compte entreprise',
            businessType: data.businessType,
            status: data.status,
            rejectionReason: data.rejectionReason,
            approvedAt: typeof data.approvedAt === 'number' ? data.approvedAt : data.approvedAt?.toMillis?.(),
            businessId: data.businessId,
            subCategory: data.subCategory,
            isBusiness: data.isBusiness,
          } as BusinessUser);
        } else {
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);

          if (!userDoc.exists()) {
            setBusinessUser(null);
          } else {
            const data = userDoc.data();
            if (!data.businessStatus || !data.businessType) {
              setBusinessUser(null);
            } else {
              setBusinessUser({
                uid: user.uid,
                businessName: data.businessName || 'Compte entreprise',
                businessType: data.businessType,
                status: data.businessStatus,
                rejectionReason: data.rejectionReason,
                approvedAt: typeof data.approvedAt === 'number' ? data.approvedAt : data.approvedAt?.toMillis?.(),
                businessId: data.businessId,
                subCategory: data.subCategory,
                isBusiness: data.isBusiness,
              } as BusinessUser);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching business status:', err);
        setError('Erreur lors du chargement du statut business');
      } finally {
        setIsLoading(false);
      }
    }

    fetchBusinessStatus();
  }, [user?.uid]);

  return {
    businessUser,
    isLoading,
    error,
    isApproved: businessUser?.status === 'APPROVED',
    refetch: () => {
      if (user?.uid) {
        setIsLoading(true);
        setError(null);
        // Re-fetch logic here
      }
    }
  };
}

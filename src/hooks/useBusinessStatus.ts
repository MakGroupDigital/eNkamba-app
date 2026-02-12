import { useState, useEffect } from 'react';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { BusinessUser, BusinessStatus } from '@/types/business-dashboard.types';

export function useBusinessStatus() {
  const { user } = useAuth();
  const [businessUser, setBusinessUser] = useState<BusinessUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.uid) {
      setIsLoading(false);
      return;
    }

    try {
      // Real-time listener for business status
      const unsubscribe = onSnapshot(
        doc(db, 'users', user.uid),
        (docSnapshot) => {
          if (docSnapshot.exists()) {
            const userData = docSnapshot.data();
            if (userData.isBusiness) {
              setBusinessUser({
                uid: user.uid,
                businessId: userData.businessId,
                businessName: userData.businessName || '',
                businessType: userData.businessType,
                subCategory: userData.subCategory || '',
                status: userData.businessStatus || 'PENDING',
                rejectionReason: userData.rejectionReason,
                approvedAt: userData.approvedAt,
                isBusiness: true,
              });
            }
          }
          setIsLoading(false);
        },
        (err) => {
          console.error('Error listening to business status:', err);
          setError('Erreur lors du chargement du statut');
          setIsLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.error('Error setting up listener:', err);
      setError('Erreur lors du chargement du statut');
      setIsLoading(false);
    }
  }, [user?.uid]);

  return {
    businessUser,
    isLoading,
    error,
    isApproved: businessUser?.status === 'APPROVED',
    isPending: businessUser?.status === 'PENDING',
    isRejected: businessUser?.status === 'REJECTED',
  };
}

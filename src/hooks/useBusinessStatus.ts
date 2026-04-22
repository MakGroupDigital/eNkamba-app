'use client';

import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import type { BusinessStatus, BusinessType } from '@/types/business-dashboard.types';

export interface BusinessUser {
  uid: string;
  businessName: string;
  businessType: BusinessType;
  status: BusinessStatus;
  submittedAt: string;
  reviewedAt?: string;
  rejectionReason?: string;
  documents?: {
    businessLicense?: string;
    taxCertificate?: string;
    identityDocument?: string;
  };
  contactInfo?: {
    email: string;
    phone: string;
    address: string;
  };
}

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
          setBusinessUser(businessDoc.data() as BusinessUser);
        } else {
          setBusinessUser(null);
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

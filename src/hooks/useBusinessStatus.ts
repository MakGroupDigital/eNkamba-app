'use client';

import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import type { BusinessStatus, BusinessType, BusinessUser } from '@/types/business-dashboard.types';

function normalizeBusinessStatus(status: unknown): BusinessStatus {
  if (status === 'APPROVED' || status === 'VERIFIED') return 'APPROVED';
  if (status === 'REJECTED') return 'REJECTED';
  if (status === 'UNDER_REVIEW') return 'UNDER_REVIEW';
  return 'PENDING';
}

function normalizeBusinessType(type: unknown): BusinessType | null {
  if (type === 'COMMERCE' || type === 'LOGISTICS' || type === 'PAYMENT') return type;
  return null;
}

function getTime(value: any): number {
  if (!value) return 0;
  if (typeof value?.toMillis === 'function') return value.toMillis();
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

function candidateTime(data: any): number {
  return Math.max(
    getTime(data.approvedAt),
    getTime(data.verifiedAt),
    getTime(data.updatedAt),
    getTime(data.submittedAt),
    getTime(data.createdAt)
  );
}

function buildBusinessUserCandidate(uid: string, data: any, businessId?: string): (BusinessUser & { priorityTime: number }) | null {
  const businessType = normalizeBusinessType(data.businessType || data.type);
  const status = normalizeBusinessStatus(data.status || data.businessStatus);
  if (!businessType) return null;

  return {
    uid,
    businessName: data.businessName || 'Compte entreprise',
    businessType,
    status,
    rejectionReason: data.rejectionReason,
    approvedAt: getTime(data.approvedAt || data.verifiedAt) || undefined,
    businessId: businessId || data.businessId,
    subCategory: data.subCategory,
    isBusiness: data.isBusiness ?? status === 'APPROVED',
    priorityTime: candidateTime(data),
  };
}

export function useBusinessStatus(preferredBusinessType?: BusinessType | null) {
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
        const candidates: Array<BusinessUser & { priorityTime: number }> = [];

        const businessDocRef = doc(db, 'businessUsers', user.uid);
        const businessDoc = await getDoc(businessDocRef);
        if (businessDoc.exists()) {
          const candidate = buildBusinessUserCandidate(user.uid, businessDoc.data());
          if (candidate) candidates.push(candidate);
        }

        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const candidate = buildBusinessUserCandidate(user.uid, userDoc.data());
          if (candidate) candidates.push(candidate);
        }

        const requestsSnapshot = await getDocs(query(collection(db, 'business_requests'), where('userId', '==', user.uid)));
        requestsSnapshot.docs.forEach((requestDoc) => {
          const candidate = buildBusinessUserCandidate(user.uid, requestDoc.data(), requestDoc.id);
          if (candidate) candidates.push(candidate);
        });

        if (!candidates.length) {
          setBusinessUser(null);
          return;
        }

        const ranked = candidates.sort((left, right) => {
          const leftPreferred = preferredBusinessType && left.businessType === preferredBusinessType ? 1 : 0;
          const rightPreferred = preferredBusinessType && right.businessType === preferredBusinessType ? 1 : 0;
          if (rightPreferred !== leftPreferred) return rightPreferred - leftPreferred;

          const leftApproved = left.status === 'APPROVED' ? 1 : 0;
          const rightApproved = right.status === 'APPROVED' ? 1 : 0;
          if (rightApproved !== leftApproved) return rightApproved - leftApproved;

          return right.priorityTime - left.priorityTime;
        });

        const { priorityTime, ...resolvedBusinessUser } = ranked[0];
        setBusinessUser(resolvedBusinessUser);
      } catch (err) {
        console.error('Error fetching business status:', err);
        setError('Erreur lors du chargement du statut business');
      } finally {
        setIsLoading(false);
      }
    }

    fetchBusinessStatus();
  }, [preferredBusinessType, user?.uid]);

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

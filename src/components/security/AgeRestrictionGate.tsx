'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { calculateAgeFromDateOfBirth, isUnderMinimumAge } from '@/lib/age-policy';
import { isEnkambaNativeRuntime } from '@/lib/native-runtime';

const NATIVE_PROFILE_COMPLETED_PREFIX = 'enkamba-native-profile-completed';

export function AgeRestrictionGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname() || '';
  const { user } = useAuth();
  const { profile, isLoading } = useUserProfile();

  useEffect(() => {
    if (isLoading || !user?.uid || !profile?.dateOfBirth) return;
    if (pathname.startsWith('/age-restricted')) return;
    if (!isUnderMinimumAge(profile.dateOfBirth)) return;

    const age = calculateAgeFromDateOfBirth(profile.dateOfBirth);
    void setDoc(doc(db, 'users', user.uid), {
      age,
      ageRestrictionStatus: 'blocked_under_16',
      ageRestrictionReason: 'date_of_birth_under_minimum',
      ageRestrictionUpdatedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true });
    router.replace('/age-restricted');
  }, [isLoading, pathname, profile?.dateOfBirth, router, user?.uid]);

  useEffect(() => {
    if (isLoading || !user?.uid || !profile) return;
    if (pathname.startsWith('/complete-profile') || pathname.startsWith('/age-restricted')) return;

    const phone = profile.phone || profile.phoneNumber || user.phoneNumber || '';
    const isPhoneAccount = Boolean(phone);
    const hasUsableName = Boolean((profile.fullName || profile.displayName || profile.name || '').trim());
    const hasUsername = Boolean((profile.username || '').trim());
    const hasContactEmail = Boolean((profile.email || user.email || '').trim());
    const isNativeRuntime = isEnkambaNativeRuntime();
    const nativeProfileCompleted = Boolean(
      profile.profileCompleted ||
      (typeof window !== 'undefined' &&
        window.localStorage.getItem(`${NATIVE_PROFILE_COMPLETED_PREFIX}:${user.uid}`) === 'true')
    );

    if (isNativeRuntime && nativeProfileCompleted) return;

    if (isPhoneAccount && (!hasUsableName || !hasUsername || !hasContactEmail)) {
      router.replace('/complete-profile');
    }
  }, [isLoading, pathname, profile, router, user?.email, user?.phoneNumber, user?.uid]);

  return <>{children}</>;
}

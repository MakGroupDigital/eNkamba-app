import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export const ENKAMBA_AUTH_SESSION_KEY = 'enkamba_authenticated_session';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (typeof window !== 'undefined' && currentUser) {
        localStorage.setItem(ENKAMBA_AUTH_SESSION_KEY, 'true');
        localStorage.setItem('enkamba_last_authenticated_at', String(Date.now()));
      }
      setUser(currentUser);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { user, isLoading };
}

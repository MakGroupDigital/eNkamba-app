import { useEffect, useMemo, useState } from 'react';
import { collection, limit, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { NkampaStore } from '@/lib/nkampa-store';

export function useNkampaStore(ownerId?: string | null) {
  const [store, setStore] = useState<NkampaStore | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(!!ownerId);
  const [hasChecked, setHasChecked] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const stableOwnerId = useMemo(() => ownerId || null, [ownerId]);

  useEffect(() => {
    if (!stableOwnerId) {
      setStore(null);
      setIsLoading(false);
      setHasChecked(true);
      setError(null);
      return;
    }

    setIsLoading(true);
    setHasChecked(false);
    const q = query(collection(db, 'nkampa_stores'), where('ownerId', '==', stableOwnerId), limit(1));
    const unsub = onSnapshot(
      q,
      (snap) => {
        if (snap.empty) {
          setStore(null);
          setIsLoading(false);
          setHasChecked(true);
          return;
        }
        const doc = snap.docs[0];
        setStore({ id: doc.id, ...(doc.data() as any) } as NkampaStore);
        setIsLoading(false);
        setHasChecked(true);
      },
      (err) => {
        console.error('Erreur chargement boutique:', err);
        setError('Erreur chargement boutique');
        setIsLoading(false);
        setHasChecked(true);
      }
    );

    return () => unsub();
  }, [stableOwnerId]);

  return { store, isLoading, hasChecked, error };
}

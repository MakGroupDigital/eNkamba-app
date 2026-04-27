import { useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { NkampaStore } from '@/lib/nkampa-store';

type UseNkampaStoresOptions = {
  statuses?: NkampaStore['status'][];
};

export function useNkampaStores(options: UseNkampaStoresOptions = {}) {
  const [stores, setStores] = useState<NkampaStore[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const statusesKey = useMemo(() => (options.statuses || []).slice().sort().join('|'), [options.statuses]);

  useEffect(() => {
    setIsLoading(true);
    setError(null);

    try {
      const base = collection(db, 'nkampa_stores');
      const q =
        options.statuses && options.statuses.length > 0
          ? query(base, where('status', 'in', options.statuses as any))
          : query(base);

      const unsub = onSnapshot(
        q,
        (snap) => {
          const next: NkampaStore[] = [];
          snap.forEach((d) => next.push({ id: d.id, ...(d.data() as any) } as NkampaStore));
          setStores((prevStores) => (
            JSON.stringify(prevStores) === JSON.stringify(next) ? prevStores : next
          ));
          setIsLoading(false);
        },
        (err) => {
          console.error('Erreur chargement boutiques:', err);
          setError('Erreur chargement boutiques');
          setIsLoading(false);
        }
      );

      return () => unsub();
    } catch (err) {
      console.error('Erreur chargement boutiques:', err);
      setError('Erreur chargement boutiques');
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusesKey]);

  return { stores, isLoading, error };
}

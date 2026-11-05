import { auth } from '@/lib/firebase';

/**
 * Équivalent de httpsCallable(functions, name) exécuté par l'API Kenz (/api/fn/{name}).
 * Même forme de résultat ({ data }) et d'erreur (code « functions/… », message) que le SDK Firebase.
 */
export function serverCallable<Req = unknown, Res = unknown>(name: string) {
  return async (data?: Req): Promise<{ data: Res }> => {
    const token = await auth.currentUser?.getIdToken().catch(() => null);
    const response = await fetch(`/api/fn/${name}/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ data: data ?? null }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload?.error) {
      const status = String(payload?.error?.status || 'INTERNAL').toLowerCase().replace(/_/g, '-');
      const error = new Error(payload?.error?.message || 'Opération impossible pour le moment.') as Error & { code: string; details?: unknown };
      error.code = `functions/${status}`;
      error.details = payload?.error?.details;
      throw error;
    }
    return { data: payload.result as Res };
  };
}

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './useAuth';

export type AgentRelayStatus = 'none' | 'in_progress' | 'submitted' | 'approved' | 'rejected';

export interface AgentRelayApplication {
  id: string;
  agentType: string;
  status: AgentRelayStatus;
  currentStep?: number;
  submittedAt?: any;
  reviewedAt?: any;
  rejectionReason?: string;
  fullName?: string;
  phoneNumber?: string;
}

export function useAgentRelayStatus() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [status, setStatus] = useState<AgentRelayStatus>('none');
  const [application, setApplication] = useState<AgentRelayApplication | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const normalizeStatus = (raw: unknown): AgentRelayStatus => {
      if (raw === 'in_progress' || raw === 'submitted' || raw === 'approved' || raw === 'rejected') return raw;
      return 'in_progress';
    };

    const statusPriority: Record<AgentRelayStatus, number> = {
      none: 0,
      rejected: 1,
      in_progress: 2,
      submitted: 3,
      approved: 4,
    };

    const getDocTime = (data: any): number => {
      const candidates = [data.reviewedAt, data.submittedAt, data.updatedAt, data.createdAt];
      for (const candidate of candidates) {
        if (!candidate) continue;
        if (typeof candidate?.toMillis === 'function') return candidate.toMillis();
        if (candidate instanceof Date) return candidate.getTime();
        if (typeof candidate === 'number') return candidate;
        if (typeof candidate === 'string') {
          const parsed = Date.parse(candidate);
          if (!Number.isNaN(parsed)) return parsed;
        }
      }
      return 0;
    };

    // Tant que l'auth n'est pas résolue, ne pas conclure à "none"
    // (sinon on provoque une redirection erronée / flicker).
    if (isAuthLoading) {
      setIsLoading(true);
      return;
    }

    if (!user?.uid) {
      setStatus('none');
      setApplication(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const q = query(collection(db, 'agentRelayApplications'), where('userId', '==', user.uid));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (snapshot.empty) {
          setStatus('none');
          setApplication(null);
          setIsLoading(false);
          return;
        }

        // Important: un user peut avoir plusieurs demandes (types différents, anciennes demandes, etc.).
        // Pour éviter une boucle de redirection, on sélectionne la "meilleure" demande avec une priorité
        // de statut (approved > submitted > in_progress > rejected), puis par date la plus récente.
        const docs = snapshot.docs
          .map((docSnap) => {
            const data = docSnap.data();
            const normalized = normalizeStatus(data.status);
            return {
              docSnap,
              data,
              normalizedStatus: normalized,
              priority: statusPriority[normalized],
              time: getDocTime(data),
            };
          })
          .sort((a, b) => {
            if (b.priority !== a.priority) return b.priority - a.priority;
            return b.time - a.time;
          });

        const best = docs[0];
        const latestDoc = best.docSnap;
        const data = best.data;

        const app: AgentRelayApplication = {
          id: latestDoc.id,
          agentType: data.agentType,
          status: best.normalizedStatus,
          currentStep: data.currentStep,
          submittedAt: data.submittedAt,
          reviewedAt: data.reviewedAt,
          rejectionReason: data.rejectionReason,
          fullName: data.fullName,
          phoneNumber: data.phoneNumber,
        };

        setApplication(app);
        setStatus(app.status);
        setIsLoading(false);
      },
      (err) => {
        console.error('Erreur vérification statut:', err);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid, isAuthLoading]);

  return { status, application, isLoading };
}

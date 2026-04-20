import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
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
  const { user } = useAuth();
  const [status, setStatus] = useState<AgentRelayStatus>('none');
  const [application, setApplication] = useState<AgentRelayApplication | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      if (!user?.uid) {
        setIsLoading(false);
        return;
      }

      try {
        // Chercher toutes les applications de l'utilisateur
        const q = query(
          collection(db, 'agentRelayApplications'),
          where('userId', '==', user.uid)
        );

        const snapshot = await getDocs(q);

        if (snapshot.empty) {
          setStatus('none');
          setApplication(null);
        } else {
          // Trier manuellement par createdAt (plus récent en premier)
          const docs = snapshot.docs.sort((a, b) => {
            const aTime = a.data().createdAt?.toMillis() || 0;
            const bTime = b.data().createdAt?.toMillis() || 0;
            return bTime - aTime;
          });

          const latestDoc = docs[0];
          const data = latestDoc.data();

          const app: AgentRelayApplication = {
            id: latestDoc.id,
            agentType: data.agentType,
            status: data.status || 'in_progress',
            currentStep: data.currentStep,
            submittedAt: data.submittedAt,
            reviewedAt: data.reviewedAt,
            rejectionReason: data.rejectionReason,
            fullName: data.fullName,
            phoneNumber: data.phoneNumber
          };

          setApplication(app);
          setStatus(app.status);
        }
      } catch (err) {
        console.error('Erreur vérification statut:', err);
      } finally {
        setIsLoading(false);
      }
    };

    checkStatus();
  }, [user]);

  return { status, application, isLoading };
}

import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';

export interface Conversation {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
  avatar?: string;
  unread?: number;
  isGroup?: boolean;
  href?: string;
  participants?: string[];
  participantNames?: string[];
  lastMessageTime?: Timestamp;
}

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger les conversations depuis Firebase
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (!currentUser) {
        setConversations([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const q = query(
          collection(db, 'conversations'),
          where('participants', 'array-contains', currentUser.uid)
        );

        const unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
          const convos: Conversation[] = [];
          
          snapshot.forEach((doc) => {
            const data = doc.data();
            
            // Trouver le nom de l'autre participant
            const otherParticipantIdx = data.participants?.findIndex((id: string) => id !== currentUser.uid);
            const otherParticipantName = otherParticipantIdx !== -1 && otherParticipantIdx !== undefined
              ? data.participantNames?.[otherParticipantIdx] || 'Utilisateur'
              : 'Utilisateur';

            // Formater le temps
            const lastMessageTime = data.lastMessageTime?.toDate?.() || new Date();
            const now = new Date();
            const diffMs = now.getTime() - lastMessageTime.getTime();
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMs / 3600000);
            const diffDays = Math.floor(diffMs / 86400000);

            let timeStr = '';
            if (diffMins < 1) timeStr = 'À l\'instant';
            else if (diffMins < 60) timeStr = `${diffMins}m`;
            else if (diffHours < 24) timeStr = `${diffHours}h`;
            else if (diffDays < 7) timeStr = `${diffDays}j`;
            else timeStr = lastMessageTime.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' });

            convos.push({
              id: doc.id,
              name: otherParticipantName,
              lastMessage: data.lastMessage || 'Aucun message',
              time: timeStr,
              avatar: undefined,
              unread: data.unreadCount || 0,
              isGroup: (data.participants?.length || 0) > 2,
              href: `/dashboard/miyiki-chat/${doc.id}`,
              participants: data.participants,
              participantNames: data.participantNames,
              lastMessageTime: data.lastMessageTime,
            });
          });

          // Trier par dernier message (plus récent en premier)
          convos.sort((a, b) => {
            const aTime = a.lastMessageTime?.toMillis?.() || 0;
            const bTime = b.lastMessageTime?.toMillis?.() || 0;
            return bTime - aTime;
          });

          setConversations(convos);
          setIsLoading(false);
        });

        return () => unsubscribeSnapshot();
      } catch (err) {
        console.error('Erreur chargement conversations:', err);
        setError('Erreur lors du chargement des conversations');
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Ajouter une nouvelle conversation (pour compatibilité)
  const addConversation = useCallback((conversation: Conversation) => {
    setConversations(prev => [conversation, ...prev]);
  }, []);

  // Mettre à jour une conversation
  const updateConversation = useCallback((id: string, updates: Partial<Conversation>) => {
    setConversations(prev => 
      prev.map(conv => conv.id === id ? { ...conv, ...updates } : conv)
    );
  }, []);

  // Supprimer une conversation
  const deleteConversation = useCallback((id: string) => {
    setConversations(prev => prev.filter(conv => conv.id !== id));
  }, []);

  // Réinitialiser les conversations
  const resetConversations = useCallback(() => {
    setConversations([]);
  }, []);

  return {
    conversations,
    isLoading,
    error,
    hasConversations: conversations.length > 0,
    addConversation,
    updateConversation,
    deleteConversation,
    resetConversations,
    reload: () => {}, // Firebase gère automatiquement via onSnapshot
  };
}

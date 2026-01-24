import { useState, useCallback, useEffect } from 'react';
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  serverTimestamp,
  Timestamp,
  deleteDoc,
  getDocs,
} from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';

export interface AiMessage {
  id: string;
  aiChatId: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: Timestamp;
}

export interface AiChat {
  id: string;
  userId: string;
  title: string;
  createdAt: Timestamp;
  expiresAt: Timestamp; // 6 mois après création
  lastMessageTime: Timestamp;
}

const SIX_MONTHS_MS = 6 * 30 * 24 * 60 * 60 * 1000; // Approximation

export function useFirestoreAiChat() {
  const [aiChats, setAiChats] = useState<AiChat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState(auth.currentUser);

  // Écouter les changements d'authentification
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Charger les chats IA de l'utilisateur
  useEffect(() => {
    if (!currentUser) {
      setAiChats([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const q = query(
        collection(db, 'aiChats'),
        where('userId', '==', currentUser.uid),
        orderBy('lastMessageTime', 'desc')
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const chats: AiChat[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          // Vérifier si le chat a expiré
          const expiresAt = data.expiresAt?.toDate?.() || new Date(data.expiresAt);
          if (new Date() < expiresAt) {
            chats.push({
              id: doc.id,
              ...data,
            } as AiChat);
          }
        });
        setAiChats(chats);
        setIsLoading(false);
      });

      return () => unsubscribe();
    } catch (err) {
      console.error('Erreur chargement chats IA:', err);
      setError('Erreur lors du chargement des chats IA');
      setIsLoading(false);
    }
  }, [currentUser]);

  // Créer un nouveau chat IA
  const createAiChat = useCallback(
    async (title: string = 'Nouveau chat') => {
      if (!currentUser) throw new Error('Utilisateur non authentifié');

      try {
        const now = new Date();
        const expiresAt = new Date(now.getTime() + SIX_MONTHS_MS);

        const docRef = await addDoc(collection(db, 'aiChats'), {
          userId: currentUser.uid,
          title,
          createdAt: serverTimestamp(),
          expiresAt: Timestamp.fromDate(expiresAt),
          lastMessageTime: serverTimestamp(),
        });

        return docRef.id;
      } catch (err) {
        console.error('Erreur création chat IA:', err);
        throw err;
      }
    },
    [currentUser]
  );

  // Envoyer un message IA
  const sendAiMessage = useCallback(
    async (aiChatId: string, userMessage: string, aiResponse: string) => {
      if (!currentUser) throw new Error('Utilisateur non authentifié');

      try {
        // Ajouter le message utilisateur
        await addDoc(
          collection(db, 'aiChats', aiChatId, 'messages'),
          {
            role: 'user',
            text: userMessage,
            timestamp: serverTimestamp(),
          }
        );

        // Ajouter la réponse IA
        await addDoc(
          collection(db, 'aiChats', aiChatId, 'messages'),
          {
            role: 'assistant',
            text: aiResponse,
            timestamp: serverTimestamp(),
          }
        );
      } catch (err) {
        console.error('Erreur envoi message IA:', err);
        throw err;
      }
    },
    [currentUser]
  );

  // Charger les messages d'un chat IA
  const loadAiMessages = useCallback(
    (aiChatId: string, callback: (messages: AiMessage[]) => void) => {
      try {
        const q = query(
          collection(db, 'aiChats', aiChatId, 'messages'),
          orderBy('timestamp', 'asc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
          const messages: AiMessage[] = [];
          snapshot.forEach((doc) => {
            messages.push({
              id: doc.id,
              aiChatId,
              ...doc.data(),
            } as AiMessage);
          });
          callback(messages);
        });

        return unsubscribe;
      } catch (err) {
        console.error('Erreur chargement messages IA:', err);
        throw err;
      }
    },
    []
  );

  // Supprimer un chat IA
  const deleteAiChat = useCallback(async (aiChatId: string) => {
    try {
      // Supprimer tous les messages
      const messagesSnapshot = await getDocs(
        collection(db, 'aiChats', aiChatId, 'messages')
      );
      for (const messageDoc of messagesSnapshot.docs) {
        await deleteDoc(messageDoc.ref);
      }

      // Supprimer le chat
      await deleteDoc(doc(db, 'aiChats', aiChatId));
    } catch (err) {
      console.error('Erreur suppression chat IA:', err);
      throw err;
    }
  }, []);

  // Nettoyer les chats expirés (à appeler périodiquement)
  const cleanupExpiredChats = useCallback(async () => {
    if (!currentUser) return;

    try {
      const q = query(
        collection(db, 'aiChats'),
        where('userId', '==', currentUser.uid)
      );

      const snapshot = await getDocs(q);
      for (const docSnapshot of snapshot.docs) {
        const data = docSnapshot.data();
        const expiresAt = data.expiresAt?.toDate?.() || new Date(data.expiresAt);
        if (new Date() > expiresAt) {
          await deleteAiChat(docSnapshot.id);
        }
      }
    } catch (err) {
      console.error('Erreur nettoyage chats expirés:', err);
    }
  }, [currentUser, deleteAiChat]);

  return {
    aiChats,
    isLoading,
    error,
    createAiChat,
    sendAiMessage,
    loadAiMessages,
    deleteAiChat,
    cleanupExpiredChats,
  };
}

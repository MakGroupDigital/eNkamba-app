import { useState, useCallback, useEffect } from 'react';
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
  doc,
  serverTimestamp,
  Timestamp,
  getDocs,
} from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: Timestamp;
  isRead: boolean;
}

export interface Conversation {
  id: string;
  participants: string[];
  participantNames: string[];
  lastMessage: string;
  lastMessageTime: Timestamp;
  createdAt: Timestamp;
  unreadCount: number;
}

export function useFirestoreConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
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

  // Charger les conversations de l'utilisateur
  useEffect(() => {
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
        where('participants', 'array-contains', currentUser.uid),
        orderBy('lastMessageTime', 'desc')
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const convos: Conversation[] = [];
        snapshot.forEach((doc) => {
          convos.push({
            id: doc.id,
            ...doc.data(),
          } as Conversation);
        });
        setConversations(convos);
        setIsLoading(false);
      });

      return () => unsubscribe();
    } catch (err) {
      console.error('Erreur chargement conversations:', err);
      setError('Erreur lors du chargement des conversations');
      setIsLoading(false);
    }
  }, [currentUser]);

  // Créer une nouvelle conversation
  const createConversation = useCallback(
    async (otherUserId: string, otherUserName: string) => {
      if (!currentUser) throw new Error('Utilisateur non authentifié');

      try {
        // Vérifier si la conversation existe déjà
        const q = query(
          collection(db, 'conversations'),
          where('participants', 'array-contains', currentUser.uid)
        );

        const snapshot = await getDocs(q);
        for (const doc of snapshot.docs) {
          const data = doc.data();
          if (data.participants.includes(otherUserId)) {
            return doc.id; // Conversation existe déjà
          }
        }

        // Créer une nouvelle conversation
        const docRef = await addDoc(collection(db, 'conversations'), {
          participants: [currentUser.uid, otherUserId],
          participantNames: [currentUser.displayName || 'Utilisateur', otherUserName],
          lastMessage: '',
          lastMessageTime: serverTimestamp(),
          createdAt: serverTimestamp(),
        });

        return docRef.id;
      } catch (err) {
        console.error('Erreur création conversation:', err);
        throw err;
      }
    },
    [currentUser]
  );

  // Envoyer un message
  const sendMessage = useCallback(
    async (conversationId: string, text: string) => {
      if (!currentUser) throw new Error('Utilisateur non authentifié');

      try {
        // Ajouter le message
        await addDoc(
          collection(db, 'conversations', conversationId, 'messages'),
          {
            senderId: currentUser.uid,
            senderName: currentUser.displayName || 'Utilisateur',
            text,
            timestamp: serverTimestamp(),
            isRead: false,
          }
        );

        // Mettre à jour le dernier message de la conversation
        await updateDoc(doc(db, 'conversations', conversationId), {
          lastMessage: text,
          lastMessageTime: serverTimestamp(),
        });
      } catch (err) {
        console.error('Erreur envoi message:', err);
        throw err;
      }
    },
    [currentUser]
  );

  // Charger les messages d'une conversation
  const loadMessages = useCallback(
    (conversationId: string, callback: (messages: Message[]) => void) => {
      try {
        const q = query(
          collection(db, 'conversations', conversationId, 'messages'),
          orderBy('timestamp', 'asc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
          const messages: Message[] = [];
          snapshot.forEach((doc) => {
            messages.push({
              id: doc.id,
              conversationId,
              ...doc.data(),
            } as Message);
          });
          callback(messages);
        });

        return unsubscribe;
      } catch (err) {
        console.error('Erreur chargement messages:', err);
        throw err;
      }
    },
    []
  );

  return {
    conversations,
    isLoading,
    error,
    createConversation,
    sendMessage,
    loadMessages,
  };
}

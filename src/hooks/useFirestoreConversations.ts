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
  setDoc,
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
      // Simple query without orderBy to avoid requiring a composite index
      const q = query(
        collection(db, 'conversations'),
        where('participants', 'array-contains', currentUser.uid)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const convos: Conversation[] = [];
        snapshot.forEach((doc) => {
          convos.push({
            id: doc.id,
            ...doc.data(),
          } as Conversation);
        });
        
        // Sort by lastMessageTime client-side
        convos.sort((a, b) => {
          const aTime = a.lastMessageTime?.toMillis?.() || 0;
          const bTime = b.lastMessageTime?.toMillis?.() || 0;
          return bTime - aTime;
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
    async (conversationId: string, text: string, messageType: 'text' | 'voice' | 'video' | 'location' | 'money' | 'file' = 'text', metadata?: any) => {
      if (!currentUser) throw new Error('Utilisateur non authentifié');

      try {
        // S'assurer que la conversation existe
        try {
          const docSnap = await getDocs(query(collection(db, 'conversations'), where('id', '==', conversationId)));
          
          if (docSnap.empty) {
            // Créer une conversation par défaut
            await addDoc(collection(db, 'conversations'), {
              id: conversationId,
              participants: [currentUser.uid, conversationId],
              participantNames: [currentUser.displayName || 'Vous', 'Utilisateur'],
              lastMessage: text || `[${messageType}]`,
              lastMessageTime: serverTimestamp(),
              createdAt: serverTimestamp(),
              unreadCount: 0,
            });
          }
        } catch (e) {
          console.error('Erreur vérification conversation:', e);
        }

        // Construire le message en filtrant les valeurs undefined
        const messageData: any = {
          senderId: currentUser.uid,
          senderName: currentUser.displayName || 'Utilisateur',
          text: text || `[${messageType}]`,
          messageType,
          timestamp: serverTimestamp(),
          isRead: false,
        };

        // Ajouter metadata seulement si défini
        if (metadata) {
          messageData.metadata = metadata;
        }

        // Ajouter le message
        await addDoc(
          collection(db, 'conversations', conversationId, 'messages'),
          messageData
        );

        // Mettre à jour le dernier message (utiliser setDoc with merge pour éviter l'erreur)
        try {
          const messagePreview = text || `[${messageType}]`;
          await updateDoc(doc(db, 'conversations', conversationId), {
            lastMessage: messagePreview,
            lastMessageTime: serverTimestamp(),
          });
        } catch (updateErr) {
          console.warn('Mise à jour conversation (non critique):', updateErr);
        }
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

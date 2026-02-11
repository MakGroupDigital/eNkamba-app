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
  getDoc,
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
    async (otherUserIdentifier: string, otherUserName: string, identifierType: 'uid' | 'email' | 'phone' = 'uid') => {
      if (!currentUser) throw new Error('Utilisateur non authentifié');

      let otherUserId = otherUserIdentifier;
      // Si l'identifiant n'est pas un uid, le convertir
      if (identifierType !== 'uid') {
        const usersRef = collection(db, 'users');
        let q;
        if (identifierType === 'email') {
          q = query(usersRef, where('email', '==', otherUserIdentifier.toLowerCase()));
        } else if (identifierType === 'phone') {
          q = query(usersRef, where('phoneNumber', '==', otherUserIdentifier));
        }
        const snapshot = await getDocs(q);
        if (snapshot.empty) throw new Error('Utilisateur destinataire introuvable');
        const userDoc = snapshot.docs[0];
        otherUserId = userDoc.id;
        // Optionnel: récupérer le nom réel
        if (!otherUserName) {
          const userData = userDoc.data();
          otherUserName = userData.fullName || userData.displayName || userData.email || 'Utilisateur';
        }
      }

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
    async (
      conversationId: string,
      text: string,
      messageType: 'text' | 'voice' | 'video' | 'location' | 'money' | 'file' = 'text',
      metadata?: any,
      otherUserId?: string,
      otherUserName?: string
    ) => {
      if (!currentUser) throw new Error('Utilisateur non authentifié');

      try {
        // Vérifier que la conversation existe
        const convRef = doc(db, 'conversations', conversationId);
        let convSnap = await getDoc(convRef);
        
        if (!convSnap.exists()) {
          // Créer la conversation si possible
          if (!otherUserId) {
            throw new Error("La conversation n'existe pas et l'identifiant du destinataire est inconnu.");
          }
          await setDoc(convRef, {
            participants: [currentUser.uid, otherUserId],
            participantNames: [currentUser.displayName || 'Utilisateur', otherUserName || 'Utilisateur'],
            lastMessage: text || `[${messageType}]`,
            lastMessageTime: serverTimestamp(),
            createdAt: serverTimestamp(),
            unreadCount: 0,
          });
          convSnap = await getDoc(convRef);
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

        // Ajouter metadata seulement si défini et valide
        if (metadata && typeof metadata === 'object') {
          // Nettoyer metadata pour ne garder que les données sérialisables
          const cleanMetadata: any = {};
          for (const [key, value] of Object.entries(metadata)) {
            // Ne garder que les types sérialisables (y compris les objets imbriqués)
            if (value === null || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
              cleanMetadata[key] = value;
            } else if (Array.isArray(value) && value.every(v => typeof v === 'string' || typeof v === 'number')) {
              cleanMetadata[key] = value;
            } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
              // Permettre les objets imbriqués (comme repliedMessage)
              cleanMetadata[key] = value;
            }
          }
          if (Object.keys(cleanMetadata).length > 0) {
            messageData.metadata = cleanMetadata;
          }
        }

        // Ajouter le message
        await addDoc(
          collection(db, 'conversations', conversationId, 'messages'),
          messageData
        );

        // Mettre à jour le dernier message
        try {
          const messagePreview = text || `[${messageType}]`;
          await updateDoc(convRef, {
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

  // Supprimer un message
  const deleteMessage = useCallback(
    async (conversationId: string, messageId: string) => {
      if (!currentUser) throw new Error('Utilisateur non authentifié');

      try {
        const messageRef = doc(db, 'conversations', conversationId, 'messages', messageId);
        const messageSnap = await getDoc(messageRef);

        if (!messageSnap.exists()) {
          throw new Error('Message introuvable');
        }

        const messageData = messageSnap.data();
        
        // Vérifier que l'utilisateur est l'auteur du message
        if (messageData.senderId !== currentUser.uid) {
          throw new Error('Vous ne pouvez supprimer que vos propres messages');
        }

        // Marquer le message comme supprimé au lieu de le supprimer complètement
        await updateDoc(messageRef, {
          text: 'Message supprimé',
          isDeleted: true,
          deletedAt: serverTimestamp(),
        });
      } catch (err) {
        console.error('Erreur suppression message:', err);
        throw err;
      }
    },
    [currentUser]
  );

  // Modifier un message
  const updateMessage = useCallback(
    async (conversationId: string, messageId: string, newText: string) => {
      if (!currentUser) throw new Error('Utilisateur non authentifié');

      try {
        const messageRef = doc(db, 'conversations', conversationId, 'messages', messageId);
        const messageSnap = await getDoc(messageRef);

        if (!messageSnap.exists()) {
          throw new Error('Message introuvable');
        }

        const messageData = messageSnap.data();
        
        // Vérifier que l'utilisateur est l'auteur du message
        if (messageData.senderId !== currentUser.uid) {
          throw new Error('Vous ne pouvez modifier que vos propres messages');
        }

        // Mettre à jour le message
        await updateDoc(messageRef, {
          text: newText,
          isEdited: true,
          editedAt: serverTimestamp(),
        });
      } catch (err) {
        console.error('Erreur modification message:', err);
        throw err;
      }
    },
    [currentUser]
  );

  return {
    conversations,
    isLoading,
    error,
    createConversation,
    sendMessage,
    deleteMessage,
    updateMessage,
    loadMessages,
  };
}

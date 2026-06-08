import { useState, useEffect, useCallback, useRef } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  Timestamp,
  getDocs,
  documentId,
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
  otherUserId?: string;
  lastMessageSenderId?: string;
  lastMessageReadByOther?: boolean;
  otherOnlineStatusVisible?: boolean;
  otherLastSeenVisible?: boolean;
  otherIsOnline?: boolean;
  otherLastSeen?: Timestamp;
  type?: string;
  source?: string;
  shopId?: string;
  shopName?: string;
  businessId?: string;
  businessName?: string;
  sellerId?: string;
  sellerName?: string;
}

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userAvatars, setUserAvatars] = useState<Record<string, string>>({});
  const [userNames, setUserNames] = useState<Record<string, string>>({});
  const [userPrivacy, setUserPrivacy] = useState<Record<string, {
    onlineStatus: boolean;
    readReceipts: boolean;
    lastSeen: boolean;
    isOnline: boolean;
    lastSeenAt?: Timestamp;
  }>>({});
  const userAvatarsRef = useRef<Record<string, string>>({});

  useEffect(() => {
    userAvatarsRef.current = userAvatars;
  }, [userAvatars]);

  useEffect(() => {
    if (!Object.keys(userAvatars).length && !Object.keys(userNames).length) return;
    setConversations((prev) => {
      let changed = false;
      const next = prev.map((c) => {
        if (c.isGroup || !c.otherUserId) return c;
        const avatar = c.avatar || userAvatars[c.otherUserId];
        const name = userNames[c.otherUserId] || c.name;
        const privacy = userPrivacy[c.otherUserId];
        const nextReadByOther = privacy?.readReceipts === false ? false : c.lastMessageReadByOther;
        if (
          avatar !== c.avatar ||
          name !== c.name ||
          nextReadByOther !== c.lastMessageReadByOther ||
          privacy?.onlineStatus !== c.otherOnlineStatusVisible ||
          privacy?.lastSeen !== c.otherLastSeenVisible ||
          privacy?.isOnline !== c.otherIsOnline ||
          privacy?.lastSeenAt !== c.otherLastSeen
        ) {
          changed = true;
          return {
            ...c,
            avatar,
            name,
            lastMessageReadByOther: nextReadByOther,
            otherOnlineStatusVisible: privacy?.onlineStatus ?? true,
            otherLastSeenVisible: privacy?.lastSeen ?? true,
            otherIsOnline: privacy?.isOnline ?? false,
            otherLastSeen: privacy?.lastSeenAt,
          };
        }
        return c;
      });
      return changed ? next : prev;
    });
  }, [userAvatars, userNames, userPrivacy]);

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
          const otherUserIds = new Set<string>();
          
          snapshot.forEach((doc) => {
            const data = doc.data();
            const hiddenByUid = (data.hiddenByUid || {}) as Record<string, boolean>;
            if (hiddenByUid[currentUser.uid]) return;
            
            // Déterminer si c'est un groupe
            const isGroup = data.isGroup === true || (data.participants?.length || 0) > 2;
            
            // Pour les groupes, utiliser le nom du groupe
            // Pour les conversations 1-1, trouver le nom de l'autre participant
            let displayName: string;
            
            if (isGroup) {
              // Pour les groupes, utiliser le champ 'name' du document
              displayName = data.name || 'Groupe sans nom';
            } else {
              // Pour les conversations 1-1, trouver l'autre participant
              const otherParticipantIdx = data.participants?.findIndex((id: string) => id !== currentUser.uid);
              const otherUid =
                otherParticipantIdx !== -1 && otherParticipantIdx !== undefined ? data.participants?.[otherParticipantIdx] : undefined;
              if (otherUid) otherUserIds.add(otherUid);
              displayName =
                otherParticipantIdx !== -1 && otherParticipantIdx !== undefined
                  ? data.participantNames?.[otherParticipantIdx] || 'Utilisateur'
                  : 'Utilisateur';
            }

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
              name: displayName,
              lastMessage: data.lastMessage || 'Aucun message',
              time: timeStr,
              avatar: (() => {
                if (data.avatar) return data.avatar as string;
                return undefined;
              })(),
              unread: (() => {
                const byUid = (data.unreadCountByUid || {}) as Record<string, number>;
                const val = byUid[currentUser.uid];
                if (typeof val === 'number') return val;
                return data.unreadCount || 0;
              })(),
              isGroup: isGroup,
              href: `/dashboard/miyiki-chat/${doc.id}`,
              participants: data.participants,
              participantNames: data.participantNames,
              lastMessageTime: data.lastMessageTime,
              otherUserId: (() => {
                if (isGroup) return undefined;
                const otherParticipantIdx = data.participants?.findIndex((id: string) => id !== currentUser.uid);
                const otherUid =
                  otherParticipantIdx !== -1 && otherParticipantIdx !== undefined ? data.participants?.[otherParticipantIdx] : undefined;
                return otherUid || undefined;
              })(),
              lastMessageSenderId: data.lastMessageSenderId || undefined,
                lastMessageReadByOther: (() => {
                  if (isGroup) return false;
                const otherParticipantIdx = data.participants?.findIndex((id: string) => id !== currentUser.uid);
                const otherUid =
                  otherParticipantIdx !== -1 && otherParticipantIdx !== undefined ? data.participants?.[otherParticipantIdx] : undefined;
                if (!otherUid) return false;
                if (data.lastMessageSenderId !== currentUser.uid) return false;
                const lastRead = data.lastReadAtByUid?.[otherUid];
                const lastMsg = data.lastMessageTime;
                  const lastReadMs = lastRead?.toMillis?.() || 0;
                  const lastMsgMs = lastMsg?.toMillis?.() || 0;
                  return lastReadMs >= lastMsgMs && lastMsgMs > 0;
                })(),
                otherOnlineStatusVisible: true,
              otherLastSeenVisible: true,
              otherIsOnline: false,
              type: typeof data.type === 'string' ? data.type : undefined,
              source: typeof data.source === 'string' ? data.source : undefined,
              shopId: typeof data.shopId === 'string' ? data.shopId : undefined,
              shopName: typeof data.shopName === 'string' ? data.shopName : undefined,
              businessId: typeof data.businessId === 'string' ? data.businessId : undefined,
              businessName: typeof data.businessName === 'string' ? data.businessName : undefined,
              sellerId: typeof data.sellerId === 'string' ? data.sellerId : undefined,
              sellerName: typeof data.sellerName === 'string' ? data.sellerName : undefined,
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

          // Charger en batch les photos/noms des autres utilisateurs (modèle B)
          const ids = Array.from(otherUserIds).filter((id) => id && !userAvatarsRef.current[id]);
          if (ids.length) {
            (async () => {
              try {
                const chunks: string[][] = [];
                for (let i = 0; i < ids.length; i += 10) chunks.push(ids.slice(i, i + 10));

                const nextAvatars: Record<string, string> = {};
                const nextNames: Record<string, string> = {};
                for (const chunk of chunks) {
                  const usersQ = query(collection(db, 'users'), where(documentId(), 'in', chunk));
                  const usersSnap = await getDocs(usersQ);
                  usersSnap.forEach((u) => {
                    const ud: any = u.data() || {};
                    const avatarUrl =
                      ud.profileImage ||
                      ud.photoURL ||
                      ud.avatarUrl ||
                      ud.profilePhotoUrl ||
                      ud.kyc?.profileImage ||
                      '';
                    const name = ud.fullName || ud.displayName || ud.name || ud.email || '';
                    if (avatarUrl) nextAvatars[u.id] = String(avatarUrl);
                    if (name) nextNames[u.id] = String(name);
                  });
                }

                if (Object.keys(nextAvatars).length) {
                  setUserAvatars((prev) => ({ ...prev, ...nextAvatars }));
                }
                if (Object.keys(nextNames).length) {
                  setUserNames((prev) => ({ ...prev, ...nextNames }));
                }
              } catch (e) {
                console.error('Erreur chargement profils chat:', e);
              }
            })();
          }

          const privacyIds = Array.from(otherUserIds).filter((id) => id && !userPrivacy[id]);
          if (privacyIds.length) {
            (async () => {
              try {
                const nextPrivacy: Record<string, {
                  onlineStatus: boolean;
                  readReceipts: boolean;
                  lastSeen: boolean;
                  isOnline: boolean;
                  lastSeenAt?: Timestamp;
                }> = {};

                await Promise.all(
                  privacyIds.map(async (uid) => {
                    const [settingsSnap, presenceSnap] = await Promise.all([
                      getDocs(query(collection(db, 'users', uid, 'settings'), where(documentId(), '==', 'chat'))),
                      getDocs(query(collection(db, 'users', uid, 'presence'), where(documentId(), '==', 'chat'))),
                    ]);
                    const settingsData: any = settingsSnap.docs[0]?.data() || {};
                    const presenceData: any = presenceSnap.docs[0]?.data() || {};
                    nextPrivacy[uid] = {
                      onlineStatus: settingsData.onlineStatus !== false,
                      readReceipts: settingsData.readReceipts !== false,
                      lastSeen: settingsData.lastSeen !== false,
                      isOnline: presenceData.isOnline === true,
                      lastSeenAt: presenceData.lastSeen,
                    };
                  })
                );

                if (Object.keys(nextPrivacy).length) {
                  setUserPrivacy((prev) => ({ ...prev, ...nextPrivacy }));
                }
              } catch (e) {
                console.error('Erreur chargement confidentialité chat:', e);
              }
            })();
          }
        });

        return () => unsubscribeSnapshot();
      } catch (err) {
        console.error('Erreur chargement conversations:', err);
        setError('Erreur lors du chargement des conversations');
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [userPrivacy]);

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

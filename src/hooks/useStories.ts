import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, arrayUnion, Timestamp, orderBy, getDocs } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { Story, StoryReply, ContactStories, StoryType, StoryDuration } from '@/types/story.types';
import { uploadToCloudinary } from '@/lib/cloudinary-upload';

export function useStories() {
  const currentUser = auth.currentUser;
  const [stories, setStories] = useState<ContactStories[]>([]);
  const [myStories, setMyStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser?.uid) {
      setLoading(false);
      return;
    }

    // Écouter les stories (non expirées)
    const now = Timestamp.now();
    const q = query(
      collection(db, 'stories'),
      where('expiresAt', '>', now),
      orderBy('expiresAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allStories: Story[] = [];
      const userStoriesMap = new Map<string, Story[]>();

      snapshot.forEach((docSnapshot) => {
        const story = { id: docSnapshot.id, ...docSnapshot.data() } as Story;
        allStories.push(story);

        if (story.userId === currentUser.uid) {
          return; // Mes stories séparées
        }

        if (!userStoriesMap.has(story.userId)) {
          userStoriesMap.set(story.userId, []);
        }
        userStoriesMap.get(story.userId)!.push(story);
      });

      // Mes stories
      const myStoriesList = allStories.filter(s => s.userId === currentUser.uid);
      setMyStories(myStoriesList);

      // Stories des contacts
      const contactStoriesList: ContactStories[] = [];
      userStoriesMap.forEach((userStories, userId) => {
        const sortedStories = userStories.sort((a, b) => 
          b.createdAt.toMillis() - a.createdAt.toMillis()
        );
        const hasUnviewed = sortedStories.some(s => !s.views.includes(currentUser.uid));
        
        contactStoriesList.push({
          userId,
          userName: sortedStories[0].userName,
          userAvatar: sortedStories[0].userAvatar,
          stories: sortedStories,
          hasUnviewed,
          lastStoryTime: sortedStories[0].createdAt,
        });
      });

      // Trier par dernière story
      contactStoriesList.sort((a, b) => 
        b.lastStoryTime.toMillis() - a.lastStoryTime.toMillis()
      );

      setStories(contactStoriesList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser?.uid]);

  const createStory = async (
    type: StoryType,
    durationMinutes: StoryDuration,
    mediaFile?: File,
    location?: { latitude: number; longitude: number; address?: string },
    caption?: string
  ): Promise<string> => {
    if (!currentUser?.uid) throw new Error('Non authentifié');
    if (type !== 'location' && !mediaFile) {
      throw new Error('Média requis pour publier cette story');
    }

    let mediaUrl: string | null = null;
    let thumbnailUrl: string | null = null;

    // Upload du média vers Cloudinary si présent
    if (mediaFile) {
      const resourceType = type === 'photo' ? 'image' : type === 'video' ? 'video' : 'raw';
      const uploadResult = await uploadToCloudinary(mediaFile, resourceType);
      mediaUrl = uploadResult.secureUrl;
      thumbnailUrl = uploadResult.thumbnailUrl || null;
      if (!mediaUrl || !mediaUrl.includes('cloudinary.com')) {
        throw new Error('Upload Cloudinary invalide');
      }
    }

    const now = Timestamp.now();
    const expiresAt = Timestamp.fromMillis(now.toMillis() + durationMinutes * 60 * 1000);

    // Construire l'objet en évitant les undefined
    const storyData: any = {
      userId: currentUser.uid,
      userName: currentUser.displayName || 'Utilisateur',
      type,
      duration: durationMinutes,
      createdAt: now,
      expiresAt,
      views: [],
      replies: [],
    };

    // Ajouter les champs optionnels seulement s'ils existent
    if (currentUser.photoURL) storyData.userAvatar = currentUser.photoURL;
    if (mediaUrl) storyData.mediaUrl = mediaUrl;
    if (thumbnailUrl) storyData.thumbnailUrl = thumbnailUrl;
    if (location) storyData.location = location;
    if (caption) storyData.caption = caption;

    const docRef = await addDoc(collection(db, 'stories'), storyData);
    return docRef.id;
  };

  const markAsViewed = async (storyId: string) => {
    if (!currentUser?.uid) return;

    const storyRef = doc(db, 'stories', storyId);
    await updateDoc(storyRef, {
      views: arrayUnion(currentUser.uid),
    });
  };

  const replyToStory = async (storyId: string, message: string, storyOwnerId: string, storyOwnerName: string, storyMediaUrl?: string, storyType?: StoryType) => {
    if (!currentUser?.uid) throw new Error('Non authentifié');

    // 1. Ajouter la réponse dans la story elle-même
    const reply: Omit<StoryReply, 'id'> = {
      userId: currentUser.uid,
      userName: currentUser.displayName || 'Utilisateur',
      userAvatar: currentUser.photoURL || undefined,
      message,
      createdAt: Timestamp.now(),
    };

    const storyRef = doc(db, 'stories', storyId);
    await updateDoc(storyRef, {
      replies: arrayUnion(reply),
    });

    // 2. Chercher ou créer une conversation avec le propriétaire de la story
    let conversationId: string | null = null;

    // Chercher une conversation existante
    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', currentUser.uid)
    );

    const snapshot = await getDocs(q);
    for (const docSnapshot of snapshot.docs) {
      const data = docSnapshot.data();
      if (data.participants.includes(storyOwnerId)) {
        conversationId = docSnapshot.id;
        break;
      }
    }

    // Si pas de conversation existante, en créer une
    if (!conversationId) {
      const docRef = await addDoc(collection(db, 'conversations'), {
        participants: [currentUser.uid, storyOwnerId],
        participantNames: [currentUser.displayName || 'Utilisateur', storyOwnerName],
        lastMessage: '',
        lastMessageTime: Timestamp.now(),
        createdAt: Timestamp.now(),
        unreadCount: 0,
      });
      conversationId = docRef.id;
    }

    // 3. Envoyer le message dans la conversation avec la référence à la story
    const messageData: any = {
      senderId: currentUser.uid,
      senderName: currentUser.displayName || 'Utilisateur',
      text: message,
      messageType: 'story_reply',
      timestamp: Timestamp.now(),
      isRead: false,
      metadata: {
        storyId,
        storyOwnerId,
        storyOwnerName,
      },
    };

    // Ajouter le média de la story si disponible
    if (storyMediaUrl) {
      messageData.metadata.storyMediaUrl = storyMediaUrl;
    }

    if (storyType) {
      messageData.metadata.storyType = storyType;
    }

    await addDoc(collection(db, 'conversations', conversationId, 'messages'), messageData);

    // 4. Mettre à jour le dernier message de la conversation
    const convRef = doc(db, 'conversations', conversationId);
    await updateDoc(convRef, {
      lastMessage: `Réponse à story: ${message}`,
      lastMessageTime: Timestamp.now(),
    });

    return conversationId;
  };

  return {
    stories,
    myStories,
    loading,
    createStory,
    markAsViewed,
    replyToStory,
  };
}

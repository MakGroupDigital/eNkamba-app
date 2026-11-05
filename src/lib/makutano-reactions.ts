import { collection, doc, getDoc, getDocs, increment, limit, orderBy, query, runTransaction, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// ENK-005: several reactions, one per user per post. Stored in the existing `likes` subcollection
// (legacy documents without `reaction` count as "like"), `likes` stays the total for older clients.
export type ReactionType = 'like' | 'love' | 'solidarity' | 'haha' | 'wow' | 'sad';

export const REACTIONS: Array<{ type: ReactionType; emoji: string; label: string }> = [
  { type: 'like', emoji: '👍', label: "J'aime" },
  { type: 'love', emoji: '❤️', label: "J'adore" },
  { type: 'solidarity', emoji: '🤝', label: 'Solidarité' },
  { type: 'haha', emoji: '😂', label: 'Rire' },
  { type: 'wow', emoji: '😮', label: 'Waouh' },
  { type: 'sad', emoji: '😢', label: 'Triste' },
];

export const reactionMeta = (type: ReactionType | null | undefined) => REACTIONS.find((item) => item.type === type) || REACTIONS[0];

export type Reactor = { userId: string; name: string; avatar: string; reaction: ReactionType };

export type ReactionActor = { uid: string; name: string; avatar: string };

const asReaction = (value: unknown): ReactionType =>
  REACTIONS.some((item) => item.type === value) ? (value as ReactionType) : 'like';

export async function loadMyReaction(postId: string, uid: string): Promise<ReactionType | null> {
  const snapshot = await getDoc(doc(db, 'makutano_posts', postId, 'likes', uid));
  return snapshot.exists() ? asReaction(snapshot.data()?.reaction) : null;
}

/** Atomically sets (or clears with `null`) the actor's reaction and keeps total + per-type counters in step. */
export async function setPostReaction(postId: string, actor: ReactionActor, next: ReactionType | null) {
  const postRef = doc(db, 'makutano_posts', postId);
  const reactionRef = doc(db, 'makutano_posts', postId, 'likes', actor.uid);

  await runTransaction(db, async (transaction) => {
    const current = await transaction.get(reactionRef);
    const previous = current.exists() ? asReaction(current.data()?.reaction) : null;
    if (previous === next) return;

    const updates: Record<string, ReturnType<typeof increment>> = {};
    if (previous) updates[`reactionCounts.${previous}`] = increment(-1);
    if (next) updates[`reactionCounts.${next}`] = increment(1);
    if (!previous && next) updates.likes = increment(1);
    if (previous && !next) updates.likes = increment(-1);

    if (next) {
      transaction.set(reactionRef, {
        userId: actor.uid,
        reaction: next,
        userName: actor.name,
        userAvatar: actor.avatar,
        createdAt: current.exists() ? current.data()?.createdAt || serverTimestamp() : serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      transaction.delete(reactionRef);
    }
    transaction.update(postRef, updates);
  });
}

/** People who reacted, newest first. Legacy entries without a stored name are resolved from their profile. */
export async function loadReactors(postId: string, max = 60): Promise<Reactor[]> {
  let snapshot;
  try {
    snapshot = await getDocs(query(collection(db, 'makutano_posts', postId, 'likes'), orderBy('createdAt', 'desc'), limit(max)));
  } catch {
    snapshot = await getDocs(query(collection(db, 'makutano_posts', postId, 'likes'), limit(max)));
  }

  return Promise.all(
    snapshot.docs.map(async (reactionDoc) => {
      const data = reactionDoc.data() as any;
      const userId = data.userId || reactionDoc.id;
      let name = data.userName || '';
      let avatar = data.userAvatar || '';
      if (!name) {
        const profile = await getDoc(doc(db, 'users', userId)).catch(() => null);
        const profileData = profile?.exists() ? (profile.data() as any) : {};
        name = profileData.fullName || profileData.displayName || profileData.name || 'Utilisateur Kenz';
        avatar = avatar || profileData.profileImage || profileData.photoURL || '';
      }
      return { userId, name, avatar, reaction: asReaction(data.reaction) };
    })
  );
}

'use client';
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, limit, onSnapshot, query, serverTimestamp, setDoc, where } from 'firebase/firestore';
import { ArrowLeft, Ban, Grid3X3, Heart, MapPin, MessageCircle, MoreHorizontal, PlayCircle, Send, ShieldAlert, UserCheck } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { VerifiedAccountBadge } from '@/components/verified-account-badge';

type PublicUser = {
  id: string;
  name: string;
  avatar: string;
  location: string;
  bio: string;
  verified?: boolean;
};

type PublicPost = {
  id: string;
  text: string;
  mediaUrl: string;
  mediaType: 'image' | 'video' | 'audio';
  mediaItems?: Array<{ url: string; type: 'image' | 'video' | 'audio' }>;
  likes: number;
  comments: number;
  category: string;
  createdAt: any;
};

function inferMediaType(mediaUrl: string): 'image' | 'video' | 'audio' {
  const lowerUrl = mediaUrl.toLowerCase();
  if (lowerUrl.includes('.mp3') || lowerUrl.includes('.wav') || lowerUrl.includes('/audio/')) return 'audio';
  if (lowerUrl.includes('.mp4') || lowerUrl.includes('.webm') || lowerUrl.includes('/video/')) return 'video';
  return 'image';
}

function getTimestamp(createdAt: any) {
  if (!createdAt) return 0;
  if (typeof createdAt.toMillis === 'function') return createdAt.toMillis();
  if (typeof createdAt.seconds === 'number') return createdAt.seconds * 1000;
  return 0;
}

function formatDate(createdAt: any) {
  const timestamp = getTimestamp(createdAt);
  if (!timestamp) return 'Makutano';
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short' }).format(new Date(timestamp));
}

export default function MakutanoPublicProfilePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const params = useParams<{ userId: string }>();
  const userId = params?.userId;
  const [publicUser, setPublicUser] = useState<PublicUser | null>(null);
  const [posts, setPosts] = useState<PublicPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<PublicPost | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [isChatOpening, setIsChatOpening] = useState(false);
  const [socialCounts, setSocialCounts] = useState({ followers: 0, following: 0, friends: 0 });
  const [showMoreActions, setShowMoreActions] = useState(false);
  const [relationshipControl, setRelationshipControl] = useState({
    restricted: false,
    blocked: false,
    blockedByTarget: false,
    isLoading: false,
  });
  const isOwnProfile = Boolean(user?.uid && publicUser?.id === user.uid);
  const canInteract = Boolean(user?.uid && publicUser && !isOwnProfile && !relationshipControl.blocked && !relationshipControl.blockedByTarget);

  useEffect(() => {
    if (!userId) return;

    let unsubscribePosts: (() => void) | undefined;
    let isMounted = true;

    const loadProfile = async () => {
      setIsLoading(true);
      try {
        const userSnap = await getDoc(doc(db, 'users', userId));
        const data = userSnap.exists() ? (userSnap.data() as any) : {};
        if (!isMounted) return;

        setPublicUser({
          id: userId,
          name: data.fullName || data.displayName || data.name || 'Utilisateur Kenz',
          avatar: data.profileImage || data.photoURL || data.profilePhotoUrl || data.kyc?.profileImage || '',
          location: data.city || data.country || data.location || 'Makutano',
          bio: data.bio || data.about || 'Profil public Makutano.',
          verified: data.kycStatus === 'verified',
        });

        const postsQuery = query(
          collection(db, 'makutano_posts'),
          where('authorId', '==', userId),
          limit(40)
        );

        unsubscribePosts = onSnapshot(
          postsQuery,
          (snapshot) => {
            setPosts(
              snapshot.docs
                .map((postDoc) => {
                  const postData = postDoc.data() as any;
                  const rawMediaItems = Array.isArray(postData.mediaItems) ? postData.mediaItems : [];
                  const mediaItems = rawMediaItems
                    .map((item: any) => {
                      const url = String(item?.url || item?.secureUrl || item?.mediaUrl || '').trim();
                      if (!url) return null;
                      const type = item?.type === 'video' || item?.type === 'audio' || item?.type === 'image'
                        ? item.type
                        : inferMediaType(url);
                      return { url, type };
                    })
                    .filter(Boolean) as Array<{ url: string; type: 'image' | 'video' | 'audio' }>;
                  const mediaUrl = postData.mediaUrl || postData.image || mediaItems[0]?.url || '';
                  return {
                    id: postDoc.id,
                    text: postData.text || postData.caption || '',
                    mediaUrl,
                    mediaType: postData.mediaType || mediaItems[0]?.type || inferMediaType(mediaUrl),
                    mediaItems: mediaItems.length ? mediaItems : undefined,
                    likes: Number(postData.likes || 0),
                    comments: Number(postData.comments || 0),
                    category: postData.category || 'Accueil',
                    createdAt: postData.createdAt,
                  };
                })
                .sort((left, right) => getTimestamp(right.createdAt) - getTimestamp(left.createdAt))
            );
            setIsLoading(false);
          },
          (error) => {
            console.error('Erreur chargement posts profil Makutano:', error);
            setIsLoading(false);
          }
        );
      } catch (error) {
        console.error('Erreur chargement profil Makutano:', error);
        if (isMounted) setIsLoading(false);
      }
    };

    void loadProfile();

    return () => {
      isMounted = false;
      unsubscribePosts?.();
    };
  }, [userId]);

  useEffect(() => {
    if (!user?.uid || !userId || user.uid === userId) {
      setRelationshipControl({ restricted: false, blocked: false, blockedByTarget: false, isLoading: false });
      return;
    }

    let cancelled = false;
    const loadRelationshipControl = async () => {
      setRelationshipControl((current) => ({ ...current, isLoading: true }));
      try {
        const [ownControlSnap, reverseControlSnap] = await Promise.all([
          getDoc(doc(db, 'makutano_relationship_controls', `${user.uid}_${userId}`)),
          getDoc(doc(db, 'makutano_relationship_controls', `${userId}_${user.uid}`)),
        ]);
        const ownData = ownControlSnap.exists() ? (ownControlSnap.data() as any) : {};
        const reverseData = reverseControlSnap.exists() ? (reverseControlSnap.data() as any) : {};
        if (!cancelled) {
          setRelationshipControl({
            restricted: ownData.restricted === true,
            blocked: ownData.blocked === true,
            blockedByTarget: reverseData.blocked === true,
            isLoading: false,
          });
        }
      } catch (error) {
        console.error('Erreur controle relation Makutano:', error);
        if (!cancelled) setRelationshipControl((current) => ({ ...current, isLoading: false }));
      }
    };

    void loadRelationshipControl();
    return () => {
      cancelled = true;
    };
  }, [user?.uid, userId]);

  useEffect(() => {
    if (!user?.uid || !userId || user.uid === userId) {
      setIsFollowing(false);
      return;
    }

    let cancelled = false;
    const loadFollowStatus = async () => {
      try {
        const followSnap = await getDoc(doc(db, 'makutano_follows', `${user.uid}_${userId}`));
        if (!cancelled) setIsFollowing(followSnap.exists());
      } catch (error) {
        console.error('Erreur statut suivi Makutano:', error);
      }
    };

    void loadFollowStatus();
    return () => {
      cancelled = true;
    };
  }, [user?.uid, userId]);

  useEffect(() => {
    if (!userId) return;

    let cancelled = false;
    const loadSocialCounts = async () => {
      try {
        const [followersSnap, followingSnap, contactsSnap] = await Promise.all([
          getDocs(query(collection(db, 'makutano_follows'), where('followingId', '==', userId))),
          getDocs(query(collection(db, 'makutano_follows'), where('followerId', '==', userId))),
          getDocs(query(collection(db, 'contacts'), where('userId', '==', userId))),
        ]);

        if (!cancelled) {
          setSocialCounts({
            followers: followersSnap.size,
            following: followingSnap.size,
            friends: contactsSnap.docs.filter((contactDoc) => (contactDoc.data() as any).isOnEnkamba).length,
          });
        }
      } catch (error) {
        console.error('Erreur compteurs sociaux Makutano:', error);
      }
    };

    void loadSocialCounts();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const stats = useMemo(() => {
    return {
      posts: posts.length,
      likes: posts.reduce((sum, post) => sum + post.likes, 0),
      comments: posts.reduce((sum, post) => sum + post.comments, 0),
    };
  }, [posts]);

  const handleFollow = async () => {
    if (!canInteract || !publicUser || isFollowLoading) return;

    const activeUser = user;
    if (!activeUser) return;

    setIsFollowLoading(true);
    const followId = `${activeUser.uid}_${publicUser.id}`;
    try {
      if (isFollowing) {
        await deleteDoc(doc(db, 'makutano_follows', followId));
        setIsFollowing(false);
        toast({ title: 'Suivi retiré', description: `Vous ne suivez plus ${publicUser.name}.` });
      } else {
        await setDoc(doc(db, 'makutano_follows', followId), {
          followerId: activeUser.uid,
          followingId: publicUser.id,
          followerName: activeUser.displayName || activeUser.email || 'Utilisateur Kenz',
          followingName: publicUser.name,
          createdAt: serverTimestamp(),
        });
        setIsFollowing(true);
        toast({ title: 'Profil suivi', description: `Vous suivez maintenant ${publicUser.name}.` });
      }
    } catch (error) {
      console.error('Erreur suivi Makutano:', error);
      toast({ title: 'Erreur', description: 'Impossible de mettre à jour le suivi.', variant: 'destructive' });
    } finally {
      setIsFollowLoading(false);
    }
  };

  const handleOpenChat = async () => {
    if (!canInteract || !user?.uid || !publicUser || isChatOpening) {
      if (relationshipControl.blocked || relationshipControl.blockedByTarget) {
        toast({ title: 'Discussion indisponible', description: 'Ce profil est bloqué.', variant: 'destructive' });
      }
      return;
    }

    setIsChatOpening(true);
    try {
      const conversationsQuery = query(
        collection(db, 'conversations'),
        where('participants', 'array-contains', user.uid)
      );
      const conversationsSnapshot = await getDocs(conversationsQuery);
      const existingConversation = conversationsSnapshot.docs.find((conversationDoc) => {
        const data = conversationDoc.data() as any;
        const participants: string[] = Array.isArray(data.participants) ? data.participants : [];
        const isGroup = data.isGroup === true || participants.length > 2;
        return !isGroup && participants.includes(publicUser.id);
      });

      if (existingConversation) {
        router.push(`/dashboard/miyiki-chat/${existingConversation.id}`);
        return;
      }

      const currentUserSnap = await getDoc(doc(db, 'users', user.uid));
      const currentUserData = currentUserSnap.exists() ? (currentUserSnap.data() as any) : {};
      const currentUserName = currentUserData.fullName || currentUserData.displayName || user.displayName || user.email || 'Utilisateur';

      const conversationRef = await addDoc(collection(db, 'conversations'), {
        participants: [user.uid, publicUser.id],
        participantNames: [currentUserName, publicUser.name],
        lastMessage: '',
        lastMessageTime: serverTimestamp(),
        createdAt: serverTimestamp(),
        unreadCountByUid: {
          [user.uid]: 0,
          [publicUser.id]: 0,
        },
        lastMessageSenderId: '',
        lastReadAtByUid: {
          [user.uid]: serverTimestamp(),
        },
        source: 'makutano_public_profile',
      });

      router.push(`/dashboard/miyiki-chat/${conversationRef.id}`);
    } catch (error) {
      console.error('Erreur ouverture chat Makutano:', error);
      toast({ title: 'Erreur', description: 'Impossible d’ouvrir la discussion.', variant: 'destructive' });
    } finally {
      setIsChatOpening(false);
    }
  };

  const updateRelationshipControl = async (updates: { restricted?: boolean; blocked?: boolean }) => {
    if (!user?.uid || !publicUser || isOwnProfile || relationshipControl.isLoading) return;

    setRelationshipControl((current) => ({ ...current, isLoading: true }));
    try {
      const nextRestricted = updates.restricted ?? relationshipControl.restricted;
      const nextBlocked = updates.blocked ?? relationshipControl.blocked;

      await setDoc(
        doc(db, 'makutano_relationship_controls', `${user.uid}_${publicUser.id}`),
        {
          ownerId: user.uid,
          targetId: publicUser.id,
          targetName: publicUser.name,
          restricted: nextBlocked ? false : nextRestricted,
          blocked: nextBlocked,
          updatedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
        },
        { merge: true }
      );

      if (nextBlocked) {
        await deleteDoc(doc(db, 'makutano_follows', `${user.uid}_${publicUser.id}`)).catch(() => undefined);
        setIsFollowing(false);
      }

      setRelationshipControl((current) => ({
        ...current,
        restricted: nextBlocked ? false : nextRestricted,
        blocked: nextBlocked,
        isLoading: false,
      }));

      toast({
        title: nextBlocked
          ? 'Profil bloqué'
          : updates.blocked === false
            ? 'Profil débloqué'
            : nextRestricted
              ? 'Profil restreint'
              : 'Restriction retirée',
        description: nextBlocked
          ? `${publicUser.name} ne sera plus affiché dans votre accueil Makutano.`
          : 'Préférence appliquée.',
      });
    } catch (error) {
      console.error('Erreur mise a jour controle relation Makutano:', error);
      setRelationshipControl((current) => ({ ...current, isLoading: false }));
      toast({ title: 'Erreur', description: 'Impossible d’appliquer cette action.', variant: 'destructive' });
    }
  };

  if (isLoading && !publicUser) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-primary/5 text-sm font-semibold text-muted-foreground">
        Chargement du profil...
      </main>
    );
  }

  if (!publicUser) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-primary/5 px-4">
        <div className="w-full max-w-sm rounded-[28px] border border-[#073B9A] bg-white p-6 text-center shadow-sm">
          <h1 className="text-lg font-black text-foreground">Profil introuvable</h1>
          <p className="mt-2 text-sm text-muted-foreground">Ce profil public n’est pas disponible.</p>
          <Button onClick={() => router.back()} className="mt-4 rounded-full bg-[#073B9A] hover:bg-[#073B9A]">
            Retour
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-primary/5 pb-10 text-foreground">
      <header className="sticky top-0 z-30 border-b border-[#073B9A]/70 bg-primary/5 px-4 py-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-foreground shadow-sm ring-1 ring-[#073B9A] transition hover:bg-primary/10"
            aria-label="Retour"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <p className="truncate text-sm font-black">Profil Makutano</p>
          <div className="h-10 w-10" />
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-4 pt-5">
        <div className="overflow-hidden rounded-[34px] border border-[#073B9A] bg-white shadow-[0_24px_80px_rgba(18,33,22,0.08)]">
          <div className="h-28 bg-[radial-gradient(circle_at_18%_20%,rgba(245, 27, 43,0.38),transparent_28%),radial-gradient(circle_at_82%_15%,rgba(7, 59, 154,0.42),transparent_30%),linear-gradient(135deg,#073B9A,#073B9A)]" />
          <div className="px-5 pb-5 sm:px-7">
            <div className="-mt-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex min-w-0 items-end gap-4">
                <Avatar className="h-24 w-24 border-4 border-white shadow-xl ring-1 ring-[#073B9A]">
                  <AvatarImage src={publicUser.avatar} />
                  <AvatarFallback className="bg-primary/10 text-3xl font-black text-[#073B9A]">
                    {publicUser.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 pb-1">
	                  <h1 className="flex min-w-0 items-center gap-2 text-2xl font-black tracking-tight sm:text-3xl">
	                    <span className="truncate">{publicUser.name}</span>
	                    <VerifiedAccountBadge verified={publicUser.verified} label />
	                  </h1>
                  <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
                    <MapPin className="h-4 w-4 text-[#073B9A]" />
                    {publicUser.location}
                  </p>
                </div>
              </div>
              <div className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-[#073B9A]">
                Public
              </div>
            </div>

            <p className="mt-5 max-w-2xl text-sm leading-6 text-muted-foreground">{publicUser.bio}</p>

            {!isOwnProfile && (
              <div className="mt-5 flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  onClick={() => void handleFollow()}
                  disabled={!canInteract || isFollowLoading}
                  className={`h-11 rounded-full px-5 font-black shadow-sm ${
                    isFollowing
                      ? 'bg-primary/10 text-[#073B9A] hover:bg-primary/20'
                      : 'bg-[#073B9A] text-white hover:bg-[#073B9A]'
                  }`}
                >
                  <UserCheck className="mr-2 h-4 w-4" />
                  {isFollowLoading ? '...' : isFollowing ? 'Suivi' : 'Suivre'}
                </Button>
                <div className="rounded-full bg-white px-4 py-2 text-sm font-black text-slate-900 ring-1 ring-[#073B9A]/15">
                  {socialCounts.followers.toLocaleString('fr-FR')} abonnés
                </div>
                <Button
                  type="button"
                  onClick={() => void handleOpenChat()}
                  disabled={!canInteract || isChatOpening}
                  className="h-11 rounded-full bg-white px-4 font-black text-[#073B9A] shadow-sm ring-1 ring-[#073B9A]/20 hover:bg-primary/5"
                >
                  <Send className="mr-2 h-4 w-4" />
                  {isChatOpening ? 'Ouverture...' : 'Écrire'}
                </Button>
                <div className="relative">
                  <Button
                    type="button"
                    onClick={() => setShowMoreActions((current) => !current)}
                    className="h-11 w-11 rounded-full bg-white p-0 text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
                    aria-label="Plus d'actions"
                  >
                    <MoreHorizontal className="h-5 w-5" />
                  </Button>
                  {showMoreActions && (
                    <div className="absolute right-0 top-12 z-20 w-52 overflow-hidden rounded-2xl border border-slate-100 bg-white p-1.5 text-left shadow-2xl">
                      <button
                        type="button"
                        onClick={() => {
                          setShowMoreActions(false);
                          void updateRelationshipControl({ restricted: !relationshipControl.restricted });
                        }}
                        disabled={!user?.uid || relationshipControl.blocked || relationshipControl.blockedByTarget || relationshipControl.isLoading}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 hover:bg-primary/5 disabled:opacity-50"
                      >
                        <ShieldAlert className="h-4 w-4 text-[#F51B2B]" />
                        {relationshipControl.restricted ? 'Retirer restriction' : 'Restreindre'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowMoreActions(false);
                          void updateRelationshipControl({ blocked: !relationshipControl.blocked });
                        }}
                        disabled={!user?.uid || relationshipControl.blockedByTarget || relationshipControl.isLoading}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-red-700 hover:bg-red-50 disabled:opacity-50"
                      >
                        <Ban className="h-4 w-4" />
                        {relationshipControl.blocked ? 'Débloquer' : 'Bloquer'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {(relationshipControl.blocked || relationshipControl.blockedByTarget) && !isOwnProfile && (
              <div className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 ring-1 ring-red-100">
                {relationshipControl.blocked
                  ? 'Vous avez bloqué ce profil. Ses publications sont masquées dans votre accueil.'
                  : 'Ce profil vous a bloqué. Les interactions sont indisponibles.'}
              </div>
            )}

            <div className="mt-5 grid grid-cols-3 gap-2 sm:max-w-md">
              <StatPill value={socialCounts.following} label="Suivis" />
              <StatPill value={socialCounts.friends} label="Amis" />
              <StatPill value={stats.posts} label="Posts" />
              <StatPill value={stats.likes} label="Likes" />
              <StatPill value={stats.comments} label="Coms" />
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <div>
            <h2 className="text-base font-black">Publications</h2>
          </div>
          <div className="flex h-9 items-center gap-2 rounded-full bg-white px-3 text-xs font-black text-[#073B9A] ring-1 ring-[#073B9A]">
            <Grid3X3 className="h-4 w-4" />
            {posts.length}
          </div>
        </div>

        {relationshipControl.blocked || relationshipControl.blockedByTarget ? (
          <div className="mt-4 rounded-[28px] border border-dashed border-red-200 bg-red-50 p-8 text-center text-sm font-semibold text-red-700">
            Publications masquées pour ce profil.
          </div>
        ) : posts.length === 0 ? (
          <div className="mt-4 rounded-[28px] border border-dashed border-primary/20 bg-white p-8 text-center text-sm text-muted-foreground">
            Aucune publication publique pour le moment.
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 md:gap-3">
            {posts.map((post) => (
              <button
                key={post.id}
                type="button"
                onClick={() => setSelectedPost(post)}
                className="group relative aspect-[4/5] overflow-hidden rounded-[22px] bg-primary/10 text-left shadow-sm ring-1 ring-[#073B9A] transition hover:-translate-y-0.5 hover:shadow-xl"
              >
                {(post.mediaItems?.[0]?.url || post.mediaUrl) ? (
                  post.mediaType === 'video' ? (
                    <video src={post.mediaItems?.[0]?.url || post.mediaUrl} className="h-full w-full object-cover" muted playsInline preload="metadata" />
                  ) : post.mediaType === 'audio' ? (
                    <div className="flex h-full w-full flex-col justify-between bg-[#073B9A] p-4 text-white">
                      <PlayCircle className="h-9 w-9" />
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">Audio</p>
                        <p className="mt-1 line-clamp-2 text-sm font-bold">{post.text || 'Publication audio'}</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <img src={post.mediaItems?.[0]?.url || post.mediaUrl} alt={post.text || 'Publication'} className="h-full w-full object-cover" loading="lazy" />
                      {(post.mediaItems?.length || 0) > 1 && (
                        <span className="absolute right-2 top-2 rounded-full bg-black/55 px-2 py-1 text-[10px] font-black text-white">
                          {post.mediaItems?.length} photos
                        </span>
                      )}
                    </>
                  )
                ) : (
                  <div className="flex h-full w-full items-center justify-center p-4 text-center text-sm font-bold text-[#073B9A]">
                    {post.text || 'Publication'}
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 text-white">
                  <div className="flex items-center justify-between gap-2 text-[11px] font-bold">
                    <span className="rounded-full bg-white/18 px-2 py-1 backdrop-blur">{post.category}</span>
                    <span>{formatDate(post.createdAt)}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {selectedPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm">
          <div className="max-h-full w-full max-w-3xl overflow-hidden rounded-[30px] bg-white shadow-2xl">
            <div className="flex items-center justify-between gap-3 border-b border-[#DCE6F8] px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-black">{selectedPost.category}</p>
                <p className="text-xs font-semibold text-muted-foreground">{formatDate(selectedPost.createdAt)}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPost(null)}
                className="rounded-full bg-primary/5 px-4 py-2 text-sm font-black text-foreground hover:bg-primary/10"
              >
                Fermer
              </button>
            </div>

            <div className="flex max-h-[70vh] snap-x snap-mandatory overflow-x-auto bg-black [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {(selectedPost.mediaItems?.length ? selectedPost.mediaItems : selectedPost.mediaUrl ? [{ url: selectedPost.mediaUrl, type: selectedPost.mediaType }] : []).map((media, index) => (
                media.type === 'video' ? (
                  <video key={`${media.url}-${index}`} src={media.url} controls autoPlay={index === 0} className="max-h-[70vh] w-full shrink-0 snap-center object-contain" />
                ) : media.type === 'audio' ? (
                  <div key={`${media.url}-${index}`} className="flex min-h-[260px] w-full shrink-0 snap-center items-center justify-center bg-[#073B9A] p-6">
                    <audio src={media.url} controls autoPlay={index === 0} className="w-full max-w-xl" />
                  </div>
                ) : (
                  <img key={`${media.url}-${index}`} src={media.url} alt={selectedPost.text || 'Publication'} className="max-h-[70vh] w-full shrink-0 snap-center object-contain" />
                )
              ))}
            </div>

            <div className="space-y-3 p-4">
              {selectedPost.text && <p className="text-sm leading-6 text-foreground">{selectedPost.text}</p>}
              <div className="flex items-center gap-4 text-xs font-black text-muted-foreground">
                <span className="flex items-center gap-1"><Heart className="h-4 w-4 text-[#073B9A]" /> {selectedPost.likes}</span>
                <span className="flex items-center gap-1"><MessageCircle className="h-4 w-4 text-[#073B9A]" /> {selectedPost.comments}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function StatPill({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-2xl bg-primary/5 px-3 py-3 text-center ring-1 ring-[#073B9A]">
      <p className="text-xl font-black text-foreground">{value}</p>
      <p className="text-[11px] font-black uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
    </div>
  );
}

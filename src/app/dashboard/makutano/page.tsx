'use client';
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  MessageCircle,
  Share2,
  Heart,
  Music2,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, increment, limit, onSnapshot, orderBy, query, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import {
  MakutanoIcon,
  HomeNavIcon,
  AgentIcon,
  MapPinIcon,
} from '@/components/icons/service-icons';

// Icônes spécifiques pour Makutano
const BookIcon = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bookGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#9C27B0" />
        <stop offset="100%" stopColor="#7B1FA2" />
      </linearGradient>
    </defs>
    <path d="M8 8H22V40H8C6 40 4 38 4 36V12C4 10 6 8 8 8Z" fill="url(#bookGrad)" />
    <path d="M26 8H40C42 8 44 10 44 12V36C44 38 42 40 40 40H26V8Z" fill="#32BB78" />
    <line x1="24" y1="8" x2="24" y2="40" stroke="#0E5A59" strokeWidth="2" />
    <rect x="10" y="14" width="8" height="2" rx="1" fill="#fff" fillOpacity="0.5" />
    <rect x="10" y="20" width="6" height="2" rx="1" fill="#fff" fillOpacity="0.5" />
    <rect x="30" y="14" width="8" height="2" rx="1" fill="#fff" fillOpacity="0.5" />
    <rect x="30" y="20" width="6" height="2" rx="1" fill="#fff" fillOpacity="0.5" />
  </svg>
);

const IdeaIcon = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="ideaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FF8C00" />
        <stop offset="100%" stopColor="#E67E00" />
      </linearGradient>
    </defs>
    <path d="M24 4C14 4 6 12 6 22C6 28 10 34 16 36V40C16 42 18 44 20 44H28C30 44 32 42 32 40V36C38 34 42 28 42 22C42 12 34 4 24 4Z" fill="url(#ideaGrad)" />
    <rect x="18" y="40" width="12" height="2" rx="1" fill="#0E5A59" />
    <rect x="20" y="44" width="8" height="2" rx="1" fill="#0E5A59" />
    <path d="M18 22C18 18 20 16 24 16" stroke="#fff" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.6" />
    <path d="M30 10L32 6M36 14L40 12M38 22H42" stroke="#FFE066" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const navItems = [
  { name: 'Accueil', icon: HomeNavIcon },
  { name: 'Savoir', icon: BookIcon },
  { name: 'Entrepreneur', icon: AgentIcon },
  { name: 'Projets', icon: IdeaIcon },
  { name: 'Local', icon: MapPinIcon },
];

interface Post {
  id: string;
  author: { name: string; location: string; avatar: string };
  text: string;
  mediaUrl: string;
  mediaType: 'image' | 'video' | 'audio';
  likes: number;
  comments: number;
  isLiked: boolean;
  createdAt?: any;
  category: 'Accueil' | 'Savoir' | 'Entrepreneur' | 'Projets' | 'Local';
}

interface PostComment {
  id: string;
  text: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
}

const postCategories: Array<Post['category']> = ['Savoir', 'Entrepreneur', 'Projets', 'Local', 'Accueil'];

function inferMediaType(mediaUrl: string): 'image' | 'video' | 'audio' {
  const lowerUrl = mediaUrl.toLowerCase();
  if (
    lowerUrl.includes('.mp3') ||
    lowerUrl.includes('.wav') ||
    lowerUrl.includes('.ogg') ||
    lowerUrl.includes('.m4a') ||
    lowerUrl.includes('/audio/')
  ) {
    return 'audio';
  }
  if (
    lowerUrl.includes('.mp4') ||
    lowerUrl.includes('.webm') ||
    lowerUrl.includes('.mov') ||
    lowerUrl.includes('.m3u8') ||
    lowerUrl.includes('/video/')
  ) {
    return 'video';
  }
  return 'image';
}

function MakutanoAudioPlayer({ src, isActive }: { src: string; isActive: boolean }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isActive) {
      audio.play().catch(() => undefined);
      return;
    }

    audio.pause();
    audio.currentTime = 0;
  }, [isActive, src]);

  return (
    <div className="relative flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-700 via-teal-700 to-cyan-700">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.18),transparent_60%)]" />
      <div className="relative z-10 flex w-[78%] flex-col items-center gap-5 rounded-2xl border border-white/25 bg-black/25 p-5 backdrop-blur-md">
        <div className="flex items-end gap-1.5">
          <span className="h-4 w-1.5 animate-pulse rounded-full bg-emerald-200 [animation-delay:0ms]" />
          <span className="h-7 w-1.5 animate-pulse rounded-full bg-emerald-100 [animation-delay:120ms]" />
          <span className="h-10 w-1.5 animate-pulse rounded-full bg-white [animation-delay:240ms]" />
          <span className="h-6 w-1.5 animate-pulse rounded-full bg-emerald-100 [animation-delay:360ms]" />
          <span className="h-9 w-1.5 animate-pulse rounded-full bg-emerald-200 [animation-delay:480ms]" />
          <span className="h-5 w-1.5 animate-pulse rounded-full bg-white [animation-delay:600ms]" />
          <span className="h-8 w-1.5 animate-pulse rounded-full bg-emerald-100 [animation-delay:720ms]" />
        </div>
        <div className="rounded-full bg-white/20 p-3">
          <Music2 className="h-6 w-6 text-white" />
        </div>
        <audio ref={audioRef} src={src} controls loop className="w-full" />
      </div>
    </div>
  );
}

function MakutanoVideoPlayer({ src, isActive }: { src: string; isActive: boolean }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isActive) {
      video.play().catch(() => undefined);
      return;
    }

    video.pause();
    video.currentTime = 0;
  }, [isActive, src]);

  return (
    <video
      ref={videoRef}
      src={src}
      className="h-full w-full object-cover"
      muted
      loop
      playsInline
      preload="metadata"
    />
  );
}

export default function MakutanoPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const [activeTab, setActiveTab] = useState('Accueil');
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [commentsByPost, setCommentsByPost] = useState<Record<string, PostComment[]>>({});
  const [commentInputByPost, setCommentInputByPost] = useState<Record<string, string>>({});
  const [isLoadingCommentsByPost, setIsLoadingCommentsByPost] = useState<Record<string, boolean>>({});
  const [isSubmittingCommentByPost, setIsSubmittingCommentByPost] = useState<Record<string, boolean>>({});
  const [likedPostIds, setLikedPostIds] = useState<Set<string>>(new Set());
  const mainFeedRef = useRef<HTMLElement | null>(null);
  const postRefs = useRef<Record<string, HTMLElement | null>>({});

  const filteredPosts = useMemo(
    () => posts.filter((post) => post.category === activeTab || activeTab === 'Accueil'),
    [posts, activeTab]
  );

  useEffect(() => {
    const postsQuery = query(
      collection(db, 'makutano_posts'),
      orderBy('createdAt', 'desc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(
      postsQuery,
      (snapshot) => {
        const loadedPosts: Post[] = snapshot.docs.map((docSnapshot) => {
          const data = docSnapshot.data() as any;
          const mediaUrl = data.mediaUrl || data.image || '';
          const category = postCategories.includes(data.category) ? data.category : 'Accueil';

          return {
            id: docSnapshot.id,
            author: {
              name: data.author?.name || data.authorName || 'Utilisateur eNkamba',
              location: data.author?.location || data.authorLocation || 'RDC',
              avatar: data.author?.avatar || data.authorAvatar || 'https://picsum.photos/seed/default-user/40/40',
            },
            text: data.text || data.caption || '',
            mediaUrl,
            mediaType: data.mediaType || inferMediaType(mediaUrl),
            likes: Number(data.likes || 0),
            comments: Number(data.comments || 0),
            isLiked: false,
            createdAt: data.createdAt,
            category,
          };
        });

        setPosts(loadedPosts);
        setIsLoadingPosts(false);
      },
      (error) => {
        console.error('Erreur chargement posts Makutano:', error);
        setIsLoadingPosts(false);
        toast({
          variant: 'destructive',
          title: 'Erreur',
          description: 'Impossible de récupérer les posts Makutano depuis Firebase.',
        });
      }
    );

    return () => unsubscribe();
  }, [toast]);

  useEffect(() => {
    let cancelled = false;

    const loadLikedPosts = async () => {
      if (!user?.uid || posts.length === 0) {
        setLikedPostIds(new Set());
        return;
      }

      try {
        const likedIds = new Set<string>();
        await Promise.all(
          posts.map(async (post) => {
            const likeDoc = await getDoc(doc(db, 'makutano_posts', post.id, 'likes', user.uid));
            if (likeDoc.exists()) likedIds.add(post.id);
          })
        );
        if (!cancelled) setLikedPostIds(likedIds);
      } catch (error) {
        console.error('Erreur chargement likes utilisateur:', error);
      }
    };

    void loadLikedPosts();
    return () => {
      cancelled = true;
    };
  }, [user?.uid, posts]);

  useEffect(() => {
    setPosts((prev) => prev.map((post) => ({ ...post, isLiked: likedPostIds.has(post.id) })));
  }, [likedPostIds]);

  const handleLike = async (postId: string) => {
    if (!user?.uid) {
      toast({
        variant: 'destructive',
        title: 'Connexion requise',
        description: 'Connecte-toi pour liker.',
      });
      return;
    }

    const wasLiked = likedPostIds.has(postId);

    setLikedPostIds((prev) => {
      const next = new Set(prev);
      if (wasLiked) next.delete(postId);
      else next.add(postId);
      return next;
    });
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id !== postId) return post;
        const nextLikes = wasLiked ? Math.max(0, Number(post.likes || 0) - 1) : Number(post.likes || 0) + 1;
        return {
          ...post,
          likes: nextLikes,
          isLiked: !wasLiked,
        };
      })
    );

    try {
      const postRef = doc(db, 'makutano_posts', postId);
      const likeRef = doc(db, 'makutano_posts', postId, 'likes', user.uid);

      if (wasLiked) {
        await deleteDoc(likeRef);
        await updateDoc(postRef, { likes: increment(-1) });
      } else {
        await setDoc(likeRef, {
          userId: user.uid,
          createdAt: serverTimestamp(),
        });
        await updateDoc(postRef, { likes: increment(1) });
      }
    } catch (error) {
      console.error('Erreur like/unlike:', error);
      setLikedPostIds((prev) => {
        const next = new Set(prev);
        if (wasLiked) next.add(postId);
        else next.delete(postId);
        return next;
      });
      setPosts((prev) =>
        prev.map((post) => {
          if (post.id !== postId) return post;
          const revertedLikes = wasLiked ? Number(post.likes || 0) + 1 : Math.max(0, Number(post.likes || 0) - 1);
          return {
            ...post,
            likes: revertedLikes,
            isLiked: wasLiked,
          };
        })
      );
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de mettre à jour le like.',
      });
    }
  };

  const loadComments = async (postId: string) => {
    setIsLoadingCommentsByPost((prev) => ({ ...prev, [postId]: true }));
    try {
      const commentsQuery = query(
        collection(db, 'makutano_posts', postId, 'comments'),
        orderBy('createdAt', 'desc'),
        limit(30)
      );
      const snapshot = await getDocs(commentsQuery);
      const loadedComments: PostComment[] = snapshot.docs.map((docSnapshot) => {
        const data = docSnapshot.data() as any;
        return {
          id: docSnapshot.id,
          text: data.text || '',
          authorId: data.authorId || '',
          authorName: data.author?.name || 'Utilisateur',
          authorAvatar: data.author?.avatar || '',
        };
      });
      setCommentsByPost((prev) => ({ ...prev, [postId]: loadedComments }));
    } catch (error) {
      console.error('Erreur chargement commentaires:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de charger les commentaires.',
      });
    } finally {
      setIsLoadingCommentsByPost((prev) => ({ ...prev, [postId]: false }));
    }
  };

  const handleComment = async (postId: string) => {
    const nextOpenPostId = activeCommentPostId === postId ? null : postId;
    setActiveCommentPostId(nextOpenPostId);
    if (nextOpenPostId && !commentsByPost[postId]) {
      await loadComments(postId);
    }
  };

  const submitComment = async (postId: string) => {
    const commentText = (commentInputByPost[postId] || '').trim();
    if (!commentText) return;

    if (!user?.uid) {
      toast({
        variant: 'destructive',
        title: 'Connexion requise',
        description: 'Connecte-toi pour commenter.',
      });
      return;
    }

    setIsSubmittingCommentByPost((prev) => ({ ...prev, [postId]: true }));
    try {
      const authorName = profile?.fullName || profile?.name || user.displayName || 'Utilisateur eNkamba';
      const authorAvatar = profile?.profileImage || user.photoURL || '';

      const commentRef = await addDoc(collection(db, 'makutano_posts', postId, 'comments'), {
        text: commentText,
        authorId: user.uid,
        author: {
          name: authorName,
          avatar: authorAvatar,
        },
        createdAt: serverTimestamp(),
      });

      setCommentInputByPost((prev) => ({ ...prev, [postId]: '' }));
      setCommentsByPost((prev) => ({
        ...prev,
        [postId]: [
          {
            id: commentRef.id,
            text: commentText,
            authorId: user.uid,
            authorName,
            authorAvatar,
          },
          ...(prev[postId] || []),
        ],
      }));

      setPosts((prev) =>
        prev.map((post) => (post.id === postId ? { ...post, comments: Number(post.comments || 0) + 1 } : post))
      );

      updateDoc(doc(db, 'makutano_posts', postId), {
        comments: increment(1),
      }).catch((error) => {
        console.warn('Impossible de mettre à jour le compteur de commentaires:', error);
      });

      setActiveCommentPostId(null);
    } catch (error) {
      console.error('Erreur ajout commentaire:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible d’ajouter le commentaire.',
      });
    } finally {
      setIsSubmittingCommentByPost((prev) => ({ ...prev, [postId]: false }));
    }
  };

  const handleShare = (id: string) => {
    toast({
      title: "Partage",
      description: "Lien de partage copié.",
    });
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-gradient-to-b from-emerald-50 via-white to-orange-50">
      {/* Header avec catégories */}
      <header className="sticky top-0 z-50 w-full border-b border-white/20 bg-gradient-to-r from-primary via-primary to-green-800 pt-[env(safe-area-inset-top)] text-white shadow-lg backdrop-blur">
        <div className="px-4 py-3">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center">
              <MakutanoIcon size={24} />
            </div>
            <div>
              <h1 className="font-headline text-xl font-bold">Makutano</h1>
              <p className="text-xs text-white/70">Réseau social</p>
            </div>
          </div>
        </div>
        
        {/* Navigation des catégories */}
        <div className="px-4 pb-4 flex gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {navItems.map(item => {
            const IconComponent = item.icon;
            return (
              <button
                key={item.name}
                onClick={() => setActiveTab(item.name)}
                className={cn(
                  'flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-all whitespace-nowrap',
                  activeTab === item.name
                    ? 'bg-white text-primary shadow-md'
                    : 'bg-white/10 text-white hover:bg-white/20'
                )}
              >
                <IconComponent size={16} />
                <span>{item.name}</span>
              </button>
            );
          })}
        </div>

        {/* Bouton créer post */}
        <div className="absolute right-4 top-[calc(env(safe-area-inset-top)+1rem)] z-30">
          <Button
            size="icon"
            className="relative h-12 w-12 rounded-full border border-white/50 bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-600 text-white shadow-2xl transition-transform hover:scale-110"
            onClick={() => router.push('/dashboard/makutano/create')}
          >
            <span className="pointer-events-none absolute inset-0 rounded-full bg-white/20 animate-ping" />
            <div className="relative z-10 flex items-center gap-0.5">
              <Plus className="h-5 w-5" />
              <Music2 className="h-3.5 w-3.5" />
            </div>
          </Button>
        </div>
      </header>

      {/* Feed vertical avec cartes compactes type Instagram */}
      <main
        ref={mainFeedRef}
        className="flex-1 overflow-y-auto px-4 pb-20 pt-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      >
        {isLoadingPosts ? (
          <div className="flex h-full items-center justify-center text-emerald-900/60">
            <p>Chargement des posts...</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="flex h-full items-center justify-center text-emerald-900/60">
            <p>Aucun post dans cette catégorie.</p>
          </div>
        ) : (
          <div className="mx-auto max-w-2xl space-y-4">
            {filteredPosts.map((post) => (
              <article
                key={post.id}
                ref={(node) => {
                  postRefs.current[post.id] = node;
                }}
                data-post-id={post.id}
                className="overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-md transition-shadow hover:shadow-lg"
              >
                {/* Header du post */}
                <div className="flex items-center justify-between p-4 pb-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 ring-2 ring-emerald-100">
                      <AvatarImage src={post.author.avatar} />
                      <AvatarFallback className="bg-emerald-100 text-emerald-700">
                        {post.author.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-sm text-gray-900">{post.author.name}</p>
                      <p className="text-xs text-gray-500">{post.author.location}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-semibold text-emerald-700">
                      {post.category}
                    </span>
                    <Button size="sm" variant="ghost" className="h-8 w-8 rounded-full p-0 text-emerald-600 hover:bg-emerald-50">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Média */}
                <div className="relative aspect-square w-full bg-gray-100">
                  {post.mediaUrl ? (
                    post.mediaType === 'audio' ? (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-500 to-teal-600 p-8">
                        <div className="w-full space-y-4 text-center">
                          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white/20 backdrop-blur">
                            <Music2 className="h-10 w-10 text-white" />
                          </div>
                          <div className="flex items-end justify-center gap-1">
                            {[...Array(12)].map((_, i) => (
                              <span
                                key={i}
                                className="w-1 animate-pulse rounded-full bg-white"
                                style={{
                                  height: `${20 + (i % 3) * 15}px`,
                                  animationDelay: `${i * 100}ms`,
                                }}
                              />
                            ))}
                          </div>
                          <audio src={post.mediaUrl} controls className="w-full" />
                        </div>
                      </div>
                    ) : post.mediaType === 'video' ? (
                      <video
                        src={post.mediaUrl}
                        className="h-full w-full object-cover"
                        controls
                        playsInline
                        preload="metadata"
                      />
                    ) : (
                      <img
                        src={post.mediaUrl}
                        alt={post.text}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    )
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-100 to-teal-100">
                      <p className="text-sm font-medium text-emerald-700">Média indisponible</p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-4 px-4 py-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      void handleLike(post.id);
                    }}
                    className="flex items-center gap-2 transition-colors hover:text-red-500"
                  >
                    <Heart
                      className={cn(
                        "h-6 w-6 transition-all",
                        post.isLiked ? "fill-red-500 text-red-500" : "text-gray-700"
                      )}
                    />
                    <span className="text-sm font-semibold text-gray-700">{post.likes}</span>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      void handleComment(post.id);
                    }}
                    className="flex items-center gap-2 transition-colors hover:text-emerald-600"
                  >
                    <MessageCircle className="h-6 w-6 text-gray-700" />
                    <span className="text-sm font-semibold text-gray-700">{post.comments}</span>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleShare(post.id);
                    }}
                    className="flex items-center gap-2 transition-colors hover:text-blue-600"
                  >
                    <Share2 className="h-6 w-6 text-gray-700" />
                  </button>
                </div>

                {/* Texte du post */}
                <div className="px-4 pb-3">
                  <p className="text-sm text-gray-900">
                    <span className="font-semibold">{post.author.name}</span>{' '}
                    {post.text}
                  </p>
                </div>

                {/* Section commentaires */}
                {activeCommentPostId === post.id && (
                  <div className="border-t border-gray-100 bg-gray-50 p-4">
                    <p className="mb-3 text-xs font-semibold text-gray-700">Commentaires</p>
                    <div className="mb-3 max-h-40 space-y-2 overflow-y-auto">
                      {isLoadingCommentsByPost[post.id] ? (
                        <p className="text-xs text-gray-500">Chargement...</p>
                      ) : (commentsByPost[post.id] || []).length === 0 ? (
                        <p className="text-xs text-gray-500">Aucun commentaire.</p>
                      ) : (
                        (commentsByPost[post.id] || []).map((comment) => (
                          <div key={comment.id} className="rounded-lg bg-white p-2">
                            <p className="text-xs font-semibold text-gray-900">{comment.authorName}</p>
                            <p className="text-xs text-gray-700">{comment.text}</p>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        value={commentInputByPost[post.id] || ''}
                        onChange={(e) =>
                          setCommentInputByPost((prev) => ({ ...prev, [post.id]: e.target.value }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            void submitComment(post.id);
                          }
                        }}
                        placeholder="Ajouter un commentaire..."
                        className="h-9 flex-1 text-sm"
                      />
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          void submitComment(post.id);
                        }}
                        disabled={isSubmittingCommentByPost[post.id]}
                        className="h-9 bg-emerald-600 hover:bg-emerald-700"
                      >
                        {isSubmittingCommentByPost[post.id] ? '...' : 'Publier'}
                      </Button>
                    </div>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

'use client';
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useStories } from '@/hooks/useStories';
import { useNkampaEcommerce } from '@/hooks/useNkampaEcommerce';
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, increment, limit, onSnapshot, orderBy, query, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { StoryViewer } from '@/components/stories/StoryViewer';
import {
  MakutanoIcon,
  MakutanoAudioIcon,
  MakutanoBookIcon,
  MakutanoCommentIcon,
  MakutanoCreateIcon,
  MakutanoIdeaIcon,
  MakutanoLikeIcon,
  MakutanoMoreIcon,
  MakutanoMusicIcon,
  MakutanoPauseIcon,
  MakutanoPlayIcon,
  MakutanoShareIcon,
  HomeNavIcon,
  AgentIcon,
  MapPinIcon,
} from '@/components/icons/service-icons';

const navItems = [
  { name: 'Accueil', icon: HomeNavIcon },
  { name: 'Savoir', icon: MakutanoBookIcon, link: '/dashboard/ai' },
  { name: 'Entrepreneur', icon: AgentIcon },
  { name: 'Projets', icon: MakutanoIdeaIcon },
  { name: 'Local', icon: MapPinIcon },
];

interface Post {
  id: string;
  author: { name: string; location: string; avatar: string };
  authorId?: string;
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
const RECOMMENDATION_STORAGE_PREFIX = 'makutano-recommendation-profile';

type RecommendationSignal = 'view' | 'like' | 'unlike' | 'comment' | 'share';

type RecommendationProfile = {
  categories: Partial<Record<Post['category'], number>>;
  mediaTypes: Partial<Record<Post['mediaType'], number>>;
  authors: Record<string, number>;
  postViews: Record<string, number>;
  postInteractions: Record<string, number>;
};

type StoryOffer = {
  id: string;
  name: string;
  storeName: string;
  image: string;
  href: string;
  popularityScore: number;
  createdAt: any;
};

const createEmptyRecommendationProfile = (): RecommendationProfile => ({
  categories: {},
  mediaTypes: {},
  authors: {},
  postViews: {},
  postInteractions: {},
});

function getPostTimestamp(createdAt: any) {
  if (!createdAt) return 0;
  if (typeof createdAt.toMillis === 'function') return createdAt.toMillis();
  if (typeof createdAt.seconds === 'number') return createdAt.seconds * 1000;
  if (createdAt instanceof Date) return createdAt.getTime();
  if (typeof createdAt === 'number') return createdAt;
  return 0;
}

function stableHash(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) % 100000;
  }
  return hash / 100000;
}

function scorePostForUser(post: Post, profile: RecommendationProfile) {
  const ageHours = Math.max(0, (Date.now() - getPostTimestamp(post.createdAt)) / 36e5);
  const freshnessScore = Math.max(0, 18 - ageHours * 0.35);
  const engagementScore = Math.log1p(Number(post.likes || 0)) * 2.3 + Math.log1p(Number(post.comments || 0)) * 3;
  const categoryScore = Number(profile.categories[post.category] || 0) * 5;
  const mediaScore = Number(profile.mediaTypes[post.mediaType] || 0) * 3.5;
  const authorScore = post.authorId ? Number(profile.authors[post.authorId] || 0) * 2.5 : 0;
  const personalInteractionScore = Number(profile.postInteractions[post.id] || 0) * 0.7;
  const fatiguePenalty = Math.min(18, Number(profile.postViews[post.id] || 0) * 5.5);
  const explorationScore = stableHash(post.id) * 2.2;

  return freshnessScore + engagementScore + categoryScore + mediaScore + authorScore + personalInteractionScore + explorationScore - fatiguePenalty;
}

function getProductPopularityScore(product: any) {
  const clicks = Number(product?.clickCount ?? product?.viewCount ?? product?.views ?? 0);
  const sold = Number(product?.sold ?? product?.sales ?? 0);
  const reviews = Number(product?.reviews ?? 0);
  const rating = Number(product?.rating ?? 0);
  const discount = Number(product?.discount ?? product?.discountPercent ?? 0);
  return clicks * 1000000 + sold * 10000 + reviews * 100 + Math.round(rating * 10) + discount;
}

function getProductHref(product: any) {
  if (product?.storeSlug) return `/shop/${product.storeSlug}/product/${product.id}`;
  return '/dashboard/nkampa';
}

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

function formatMediaTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
}

function MakutanoAudioPlayer({ src, isActive = false }: { src: string; isActive?: boolean }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isActive) {
      audio.play().catch(() => undefined);
      setIsPlaying(true);
      return;
    }

    audio.pause();
    setIsPlaying(false);
  }, [isActive, src]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      audio.play().catch(() => undefined);
      setIsPlaying(true);
      return;
    }

    audio.pause();
    setIsPlaying(false);
  };

  const handleSeek = (value: string) => {
    const audio = audioRef.current;
    if (!audio) return;
    const nextTime = Number(value);
    audio.currentTime = nextTime;
    setCurrentTime(nextTime);
  };

  return (
    <div className="relative flex min-h-[280px] w-full flex-col justify-between overflow-hidden bg-[#0E5A59] p-5 text-white">
      <div className="absolute inset-0 bg-[#0E5A59]" />
      <div className="relative z-10 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">Audio</p>
          <p className="mt-1 text-lg font-bold">Makutano</p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white">
          <MakutanoAudioIcon size={24} />
        </div>
      </div>

      <button
        type="button"
        onClick={togglePlay}
        className="relative z-10 mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white text-[#0E5A59] shadow-lg transition hover:scale-105"
        aria-label={isPlaying ? 'Mettre en pause' : 'Lire'}
      >
        {isPlaying ? <MakutanoPauseIcon size={40} /> : <MakutanoPlayIcon size={40} />}
      </button>

      <div className="relative z-10">
        <div className="mb-4 flex h-24 items-end justify-center gap-1.5">
          {Array.from({ length: 36 }).map((_, index) => (
            <span
              key={index}
              className={cn('w-1.5 rounded-full bg-white/75', isPlaying && 'animate-pulse')}
              style={{
                height: `${18 + ((index * 9) % 64)}px`,
                animationDelay: `${index * 28}ms`,
              }}
            />
          ))}
        </div>

        <input
          type="range"
          min={0}
          max={duration || 0}
          value={Math.min(currentTime, duration || 0)}
          onChange={(event) => handleSeek(event.target.value)}
          className="h-2 w-full accent-white"
          aria-label="Progression audio"
        />
        <div className="mt-2 flex items-center justify-between text-xs font-medium text-white/75">
          <span>{formatMediaTime(currentTime)}</span>
          <span>{formatMediaTime(duration)}</span>
        </div>
        <audio
          ref={audioRef}
          src={src}
          preload="metadata"
          onLoadedMetadata={(event) => setDuration(event.currentTarget.duration || 0)}
          onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime || 0)}
          onEnded={() => setIsPlaying(false)}
          className="hidden"
        />
      </div>
    </div>
  );
}

function MakutanoVideoPlayer({ src, isActive = false }: { src: string; isActive?: boolean }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isActive) {
      video.play().catch(() => undefined);
      setIsPlaying(true);
      return;
    }

    video.pause();
    setIsPlaying(false);
  }, [isActive, src]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().catch(() => undefined);
      setIsPlaying(true);
      return;
    }

    video.pause();
    setIsPlaying(false);
  };

  const handleSeek = (value: string) => {
    const video = videoRef.current;
    if (!video) return;
    const nextTime = Number(value);
    video.currentTime = nextTime;
    setCurrentTime(nextTime);
  };

  return (
    <div className="group relative max-h-[620px] min-h-[280px] overflow-hidden bg-[#0E5A59]">
      <video
        ref={videoRef}
        src={src}
        className="h-full max-h-[620px] min-h-[280px] w-full object-cover"
        playsInline
        preload="metadata"
        onClick={togglePlay}
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration || 0)}
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime || 0)}
        onEnded={() => setIsPlaying(false)}
      />

      {!isPlaying && (
        <button
          type="button"
          onClick={togglePlay}
          className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[#122116] shadow-lg transition hover:scale-105"
          aria-label="Lire la vidéo"
        >
          <MakutanoPlayIcon size={38} />
        </button>
      )}

      <div className="absolute bottom-0 left-0 right-0 bg-black/55 px-4 py-3 text-white backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={togglePlay}
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#32BB78] transition hover:bg-[#2a9d63]"
            aria-label={isPlaying ? 'Mettre en pause' : 'Lire'}
          >
            {isPlaying ? <MakutanoPauseIcon size={24} /> : <MakutanoPlayIcon size={24} />}
          </button>
          <input
            type="range"
            min={0}
            max={duration || 0}
            value={Math.min(currentTime, duration || 0)}
            onChange={(event) => handleSeek(event.target.value)}
            className="h-2 min-w-0 flex-1 accent-[#32BB78]"
            aria-label="Progression vidéo"
          />
          <span className="w-20 text-right text-xs font-medium">
            {formatMediaTime(currentTime)} / {formatMediaTime(duration)}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function MakutanoPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const { stories, myStories, loading: storiesLoading, markAsViewed, replyToStory } = useStories();
  const { products: ecommerceProducts, isLoading: ecommerceProductsLoading } = useNkampaEcommerce();
  const [activeTab, setActiveTab] = useState('Accueil');
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [commentsByPost, setCommentsByPost] = useState<Record<string, PostComment[]>>({});
  const [commentInputByPost, setCommentInputByPost] = useState<Record<string, string>>({});
  const [isLoadingCommentsByPost, setIsLoadingCommentsByPost] = useState<Record<string, boolean>>({});
  const [isSubmittingCommentByPost, setIsSubmittingCommentByPost] = useState<Record<string, boolean>>({});
  const [likedPostIds, setLikedPostIds] = useState<Set<string>>(new Set());
  const [activeMediaPostId, setActiveMediaPostId] = useState<string | null>(null);
  const [viewingStories, setViewingStories] = useState<{ stories: any[]; index: number } | null>(null);
  const [recommendationProfile, setRecommendationProfile] = useState<RecommendationProfile>(() => createEmptyRecommendationProfile());
  const mainFeedRef = useRef<HTMLElement | null>(null);
  const postRefs = useRef<Record<string, HTMLElement | null>>({});
  const viewedPostTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const recordedVisiblePostsRef = useRef<Set<string>>(new Set());

  const filteredPosts = useMemo(
    () => posts
      .filter((post) => post.category === activeTab || activeTab === 'Accueil')
      .map((post) => ({ post, score: scorePostForUser(post, recommendationProfile) }))
      .sort((a, b) => b.score - a.score || getPostTimestamp(b.post.createdAt) - getPostTimestamp(a.post.createdAt))
      .map(({ post }) => post),
    [posts, activeTab, recommendationProfile]
  );

  const storyOffers = useMemo<StoryOffer[]>(() => {
    return [...(ecommerceProducts || [])]
      .filter((product: any) => product?.id && (product?.image || product?.images?.[0]))
      .map((product: any) => ({
        id: product.id,
        name: product.name || 'Offre populaire',
        storeName: product.storeName || product.sellerName || product.shopName || 'Boutique',
        image: product.image || product.images?.[0] || 'https://picsum.photos/seed/nkampa-offer/200/200',
        href: getProductHref(product),
        popularityScore: getProductPopularityScore(product),
        createdAt: product.createdAt,
      }))
      .sort((left, right) => right.popularityScore - left.popularityScore || getPostTimestamp(right.createdAt) - getPostTimestamp(left.createdAt))
      .slice(0, 12);
  }, [ecommerceProducts]);

  const recommendationStorageKey = `${RECOMMENDATION_STORAGE_PREFIX}:${user?.uid || 'anonymous'}`;

  useEffect(() => {
    try {
      const storedProfile = window.localStorage.getItem(recommendationStorageKey);
      setRecommendationProfile(storedProfile ? { ...createEmptyRecommendationProfile(), ...JSON.parse(storedProfile) } : createEmptyRecommendationProfile());
    } catch {
      setRecommendationProfile(createEmptyRecommendationProfile());
    }
  }, [recommendationStorageKey]);

  const persistRecommendationProfile = (nextProfile: RecommendationProfile) => {
    try {
      window.localStorage.setItem(recommendationStorageKey, JSON.stringify(nextProfile));
    } catch {
      // The feed still works without local personalization persistence.
    }
  };

  const recordCategoryPreference = (category: Post['category'], weight = 0.7) => {
    setRecommendationProfile((currentProfile) => {
      const nextProfile: RecommendationProfile = {
        ...currentProfile,
        categories: {
          ...currentProfile.categories,
          [category]: Math.min(10, Number(currentProfile.categories[category] || 0) * 0.98 + weight),
        },
      };
      persistRecommendationProfile(nextProfile);
      return nextProfile;
    });
  };

  const recordPostSignal = (post: Post, signal: RecommendationSignal) => {
    const signalWeight: Record<RecommendationSignal, number> = {
      view: 0.45,
      like: 2.6,
      unlike: -1.8,
      comment: 3.4,
      share: 2.2,
    };
    const weight = signalWeight[signal];

    setRecommendationProfile((currentProfile) => {
      const authorId = post.authorId || 'unknown';
      const nextProfile: RecommendationProfile = {
        categories: {
          ...currentProfile.categories,
          [post.category]: Math.max(-3, Math.min(10, Number(currentProfile.categories[post.category] || 0) * 0.98 + weight)),
        },
        mediaTypes: {
          ...currentProfile.mediaTypes,
          [post.mediaType]: Math.max(-3, Math.min(10, Number(currentProfile.mediaTypes[post.mediaType] || 0) * 0.98 + weight * 0.8)),
        },
        authors: {
          ...currentProfile.authors,
          [authorId]: Math.max(-3, Math.min(10, Number(currentProfile.authors[authorId] || 0) * 0.98 + weight * 0.65)),
        },
        postViews: {
          ...currentProfile.postViews,
          [post.id]: Number(currentProfile.postViews[post.id] || 0) + (signal === 'view' ? 1 : 0),
        },
        postInteractions: {
          ...currentProfile.postInteractions,
          [post.id]: Math.max(-5, Math.min(20, Number(currentProfile.postInteractions[post.id] || 0) + weight)),
        },
      };
      persistRecommendationProfile(nextProfile);
      return nextProfile;
    });
  };

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
            authorId: data.authorId || data.author?.id || '',
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

  useEffect(() => {
    const mediaPosts = filteredPosts.filter((post) => post.mediaUrl && (post.mediaType === 'audio' || post.mediaType === 'video'));
    if (!mediaPosts.length) {
      setActiveMediaPostId(null);
      return;
    }

    setActiveMediaPostId((current) => {
      if (current && mediaPosts.some((post) => post.id === current)) return current;
      return mediaPosts[0]?.id || null;
    });
  }, [filteredPosts]);

  useEffect(() => {
    const root = mainFeedRef.current;
    if (!root) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        entries.forEach((entry) => {
          const visiblePostId = entry.target.getAttribute('data-post-id');
          if (!visiblePostId) return;

          if (!entry.isIntersecting || entry.intersectionRatio < 0.65) {
            if (viewedPostTimersRef.current[visiblePostId]) {
              clearTimeout(viewedPostTimersRef.current[visiblePostId]);
              delete viewedPostTimersRef.current[visiblePostId];
            }
            return;
          }

          if (recordedVisiblePostsRef.current.has(visiblePostId) || viewedPostTimersRef.current[visiblePostId]) return;

          viewedPostTimersRef.current[visiblePostId] = setTimeout(() => {
            const visiblePost = filteredPosts.find((item) => item.id === visiblePostId);
            if (visiblePost) {
              recordPostSignal(visiblePost, 'view');
              recordedVisiblePostsRef.current.add(visiblePostId);
            }
            delete viewedPostTimersRef.current[visiblePostId];
          }, 1400);
        });

        const bestEntry = visibleEntries[0];
        const postId = bestEntry?.target.getAttribute('data-post-id');
        if (!postId) return;

        const post = filteredPosts.find((item) => item.id === postId);
        if (!post?.mediaUrl || (post.mediaType !== 'audio' && post.mediaType !== 'video')) return;

        setActiveMediaPostId(postId);
      },
      {
        root,
        threshold: [0.55, 0.7, 0.85],
      }
    );

    filteredPosts.forEach((post) => {
      const node = postRefs.current[post.id];
      if (node) observer.observe(node);
    });

    return () => {
      observer.disconnect();
      Object.values(viewedPostTimersRef.current).forEach((timer) => clearTimeout(timer));
      viewedPostTimersRef.current = {};
    };
  }, [filteredPosts]);

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
    const targetPost = posts.find((post) => post.id === postId);
    if (targetPost) recordPostSignal(targetPost, wasLiked ? 'unlike' : 'like');

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
    const targetPost = posts.find((post) => post.id === postId);
    if (nextOpenPostId && targetPost) recordPostSignal(targetPost, 'comment');
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
      const targetPost = posts.find((post) => post.id === postId);
      if (targetPost) recordPostSignal(targetPost, 'comment');

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
    const targetPost = posts.find((post) => post.id === id);
    if (targetPost) recordPostSignal(targetPost, 'share');
    toast({
      title: "Partage",
      description: "Lien de partage copié.",
    });
  };

  const handleCreateStory = () => {
    router.push('/dashboard/miyiki-chat/stories/create');
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-gradient-to-b from-emerald-50 via-white to-orange-50">
      {/* Header avec catégories */}
      <header className="sticky top-0 z-50 w-full bg-transparent px-3 pt-[calc(env(safe-area-inset-top)+0.75rem)] text-white">
        <div className="relative mx-auto max-w-xl overflow-hidden rounded-[2rem] border border-white/45 bg-[#32BB78]/95 shadow-[0_18px_45px_rgba(50,187,120,0.28)] backdrop-blur-xl">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/70" />
          <div className="pointer-events-none absolute -right-10 -top-14 h-28 w-28 rounded-full bg-white/25 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-12 left-8 h-24 w-24 rounded-full bg-[#1e9f5e]/35 blur-2xl" />

          <div className="relative px-4 pb-3 pt-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border border-white/30 bg-white/15 shadow-inner backdrop-blur">
                  <MakutanoIcon size={28} />
                </div>
                <div className="min-w-0">
                  <h1 className="font-headline text-[1.35rem] font-bold leading-tight tracking-normal">Réseau social</h1>
                  <p className="mt-0.5 text-xs font-medium text-white/75">Communauté eNkamba</p>
                </div>
              </div>

              {/* Bouton créer post */}
              <Button
                size="icon"
                className="relative h-12 w-12 flex-shrink-0 rounded-2xl border border-white/45 bg-white text-[#32BB78] shadow-[0_12px_28px_rgba(20,120,72,0.24)] transition-transform hover:scale-105 hover:bg-white/95"
                onClick={() => router.push('/dashboard/makutano/create')}
              >
                <span className="pointer-events-none absolute inset-1 rounded-[1.15rem] border border-white/20" />
                <div className="relative z-10 flex items-center gap-0.5">
                  <MakutanoCreateIcon size={24} />
                  <MakutanoMusicIcon size={17} />
                </div>
              </Button>
            </div>
          </div>

          {/* Navigation des catégories */}
          <div className="relative flex gap-2 overflow-x-auto px-4 pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {navItems.map(item => {
              const IconComponent = item.icon;

              // Si l'item a un lien, c'est un lien externe (vers IA)
              if (item.link) {
                return (
                  <button
                    key={item.name}
                    onClick={() => router.push(item.link)}
                    className="flex items-center gap-2 whitespace-nowrap rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-white/18"
                  >
                    <IconComponent size={16} />
                    <span>{item.name}</span>
                  </button>
                );
              }

              // Sinon, c'est un onglet de catégorie
              return (
                <button
                  key={item.name}
                  onClick={() => {
                    setActiveTab(item.name);
                    recordCategoryPreference(item.name as Post['category']);
                  }}
                  className={cn(
                    'flex items-center gap-2 whitespace-nowrap rounded-full border px-4 py-2 text-xs font-semibold transition-all',
                    activeTab === item.name
                      ? 'border-white bg-white text-[#32BB78] shadow-[0_8px_20px_rgba(255,255,255,0.22)]'
                      : 'border-white/15 bg-white/10 text-white hover:bg-white/18'
                  )}
                >
                  <IconComponent size={16} />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <section className="border-b border-[#dbe8df] bg-white px-3 py-3">
        <div className="mx-auto flex max-w-xl gap-3 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="flex w-[74px] flex-shrink-0 flex-col items-center gap-1.5">
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  if (myStories.length) setViewingStories({ stories: myStories, index: 0 });
                }}
                className={cn(
                  'rounded-full p-0.5',
                  myStories.length ? 'bg-gradient-to-tr from-[#32BB78] via-[#0E5A59] to-[#FF8C00]' : 'bg-[#dbe8df]'
                )}
                aria-label={myStories.length ? 'Voir ma story' : 'Aucune story'}
              >
                <Avatar className="h-16 w-16 border-2 border-white">
                  <AvatarImage src={profile?.photoURL || profile?.profileImage} />
                  <AvatarFallback className="bg-[#e8f4ec] text-[#22945d]">
                    {profile?.displayName?.charAt(0) || profile?.fullName?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
              </button>
              <button
                type="button"
                onClick={handleCreateStory}
                className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-[#32BB78] text-white"
                aria-label="Ajouter une story"
              >
                <MakutanoCreateIcon size={16} />
              </button>
            </div>
            <span className="max-w-full truncate text-[11px] font-medium text-[#122116]">Ma story</span>
          </div>

          {storiesLoading ? (
            <div className="flex items-center px-2 text-xs text-[#52635a]">Chargement...</div>
          ) : stories.length > 0 ? (
            stories.map((contactStory) => (
              <button
                key={contactStory.userId}
                onClick={() => setViewingStories({ stories: contactStory.stories, index: 0 })}
                className="flex w-[74px] flex-shrink-0 flex-col items-center gap-1.5"
              >
                <div className={cn(
                  'rounded-full p-0.5',
                  contactStory.hasUnviewed ? 'bg-gradient-to-tr from-[#32BB78] via-[#0E5A59] to-[#FF8C00]' : 'bg-[#dbe8df]'
                )}>
                  <Avatar className="h-16 w-16 border-2 border-white">
                    <AvatarImage src={contactStory.userAvatar} />
                    <AvatarFallback className="bg-[#e8f4ec] text-[#22945d]">
                      {contactStory.userName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <span className="max-w-full truncate text-[11px] font-medium text-[#122116]">
                  {contactStory.userName}
                </span>
              </button>
            ))
          ) : ecommerceProductsLoading ? (
            <div className="flex items-center px-2 text-xs text-[#52635a]">Chargement des offres...</div>
          ) : (
            storyOffers.map((offer) => (
              <button
                key={offer.id}
                type="button"
                onClick={() => router.push(offer.href)}
                className="flex w-[74px] flex-shrink-0 flex-col items-center gap-1.5"
              >
                <div className="rounded-full bg-gradient-to-tr from-[#32BB78] via-[#1e9f5e] to-[#FF8C00] p-0.5">
                  <div className="relative h-16 w-16 overflow-hidden rounded-full border-2 border-white bg-[#e8f4ec]">
                    <img
                      src={offer.image}
                      alt={offer.name}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                    <span className="absolute bottom-0 left-0 right-0 bg-[#32BB78]/90 px-1 py-0.5 text-[9px] font-bold text-white">
                      Offre
                    </span>
                  </div>
                </div>
                <span className="max-w-full truncate text-[11px] font-medium text-[#122116]">
                  {offer.storeName}
                </span>
              </button>
            ))
          )}
        </div>
      </section>

      {/* Feed vertical minimaliste */}
      <main
        ref={mainFeedRef}
        className="flex-1 overflow-y-auto bg-[#f6faf7] px-3 pb-24 pt-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] sm:px-4"
      >
        {isLoadingPosts ? (
          <div className="flex h-full items-center justify-center text-[#52635a]">
            <p className="text-sm">Chargement des publications...</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="flex h-full items-center justify-center text-[#52635a]">
            <p className="text-sm">Aucune publication dans cette catégorie.</p>
          </div>
        ) : (
          <div className="mx-auto max-w-xl space-y-3">
            {filteredPosts.map((post) => (
              <article
                key={post.id}
                ref={(node) => {
                  postRefs.current[post.id] = node;
                }}
                data-post-id={post.id}
                className="overflow-hidden rounded-2xl border border-[#dbe8df] bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                {/* Header du post */}
                <div className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar className="h-10 w-10 border border-[#e4eee8]">
                      <AvatarImage src={post.author.avatar} />
                      <AvatarFallback className="bg-[#e8f4ec] text-[#22945d]">
                        {post.author.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[#122116]">{post.author.name}</p>
                      <p className="truncate text-xs text-[#52635a]">{post.author.location || 'Makutano'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-[#e8f4ec] px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#22945d]">
                      {post.category}
                    </span>
                    <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full text-[#52635a] hover:bg-[#f0f6f2]">
                      <MakutanoMoreIcon size={18} />
                    </Button>
                  </div>
                </div>

                {/* Média */}
                <div className="relative mx-3 overflow-hidden rounded-[1.4rem] bg-[#eef5f1]">
                  {post.mediaUrl ? (
                    post.mediaType === 'audio' ? (
                      <MakutanoAudioPlayer src={post.mediaUrl} isActive={activeMediaPostId === post.id} />
                    ) : post.mediaType === 'video' ? (
                      <MakutanoVideoPlayer src={post.mediaUrl} isActive={activeMediaPostId === post.id} />
                    ) : (
                      <img
                        src={post.mediaUrl}
                        alt={post.text}
                        className="max-h-[620px] w-full object-cover"
                        loading="lazy"
                      />
                    )
                  ) : (
                    <div className="flex min-h-[220px] w-full items-center justify-center bg-[#e8f4ec]">
                      <p className="text-sm font-medium text-[#22945d]">Média indisponible</p>
                    </div>
                  )}
                </div>

                <div className="space-y-3 px-4 py-4">
                  {/* Texte du post */}
                  {post.text && (
                    <p className="text-sm leading-6 text-[#122116]">
                      <span className="font-semibold">{post.author.name}</span>{' '}
                      {post.text}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between border-t border-[#edf3ef] pt-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          void handleLike(post.id);
                        }}
                        className={cn(
                          'flex h-10 items-center gap-2 rounded-full px-3.5 text-sm font-semibold transition-all',
                          post.isLiked
                            ? 'bg-[#32BB78] text-white shadow-sm'
                            : 'bg-[#f4faf6] text-[#52635a] hover:bg-[#e8f4ec] hover:text-[#22945d]'
                        )}
                      >
                        <MakutanoLikeIcon size={18} />
                        <span>{post.likes}</span>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          void handleComment(post.id);
                        }}
                        className="flex h-10 items-center gap-2 rounded-full bg-[#f4faf6] px-3.5 text-sm font-semibold text-[#52635a] transition-colors hover:bg-[#e8f4ec] hover:text-[#22945d]"
                      >
                        <MakutanoCommentIcon size={18} />
                        <span>{post.comments}</span>
                      </button>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShare(post.id);
                      }}
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f4faf6] text-[#52635a] transition-colors hover:bg-[#e8f4ec] hover:text-[#22945d]"
                      aria-label="Partager"
                    >
                      <MakutanoShareIcon size={18} />
                    </button>
                  </div>
                </div>

                {/* Section commentaires */}
                {activeCommentPostId === post.id && (
                  <div className="border-t border-[#edf3ef] bg-[#fbfdfc] p-4">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#52635a]">Commentaires</p>
                    <div className="mb-3 max-h-44 space-y-2 overflow-y-auto pr-1">
                      {isLoadingCommentsByPost[post.id] ? (
                        <p className="text-xs text-[#52635a]">Chargement...</p>
                      ) : (commentsByPost[post.id] || []).length === 0 ? (
                        <p className="text-xs text-[#52635a]">Aucun commentaire.</p>
                      ) : (
                        (commentsByPost[post.id] || []).map((comment) => (
                          <div key={comment.id} className="rounded-xl border border-[#edf3ef] bg-white p-3">
                            <p className="text-xs font-semibold text-[#122116]">{comment.authorName}</p>
                            <p className="mt-1 text-xs leading-5 text-[#52635a]">{comment.text}</p>
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
                        className="h-10 flex-1 rounded-full border-[#dbe8df] bg-white text-sm focus-visible:ring-[#32BB78]"
                      />
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          void submitComment(post.id);
                        }}
                        disabled={isSubmittingCommentByPost[post.id]}
                        className="h-10 rounded-full bg-[#32BB78] px-4 hover:bg-[#2a9d63]"
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

      {viewingStories && (
        <StoryViewer
          stories={viewingStories.stories}
          initialIndex={viewingStories.index}
          onClose={() => setViewingStories(null)}
          onMarkViewed={markAsViewed}
          onReply={async (storyId, message) => {
            const story = viewingStories.stories.find((item) => item.id === storyId);
            if (!story) return;
            await replyToStory(
              storyId,
              message,
              story.userId,
              story.userName,
              story.mediaUrl,
              story.type
            );
          }}
        />
      )}
    </div>
  );
}

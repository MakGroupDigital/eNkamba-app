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
import { useNkampaStores } from '@/hooks/useNkampaStores';
import { useDashboardLocation } from '@/hooks/useDashboardLocation';
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, increment, limit, onSnapshot, orderBy, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { StoryViewer } from '@/components/stories/StoryViewer';
import {
  MakutanoAudioIcon,
  MakutanoBookIcon,
  MakutanoCommentIcon,
  MakutanoCreateIcon,
  MakutanoIdeaIcon,
  MakutanoLikeIcon,
  MakutanoMoreIcon,
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

type DiscoverUser = {
  id: string;
  name: string;
  avatar: string;
  location: string;
  bio: string;
};

type NearbyPlace = {
  id: string;
  name: string;
  label: string;
  image: string;
  href: string;
  location: string;
  score: number;
};

type FullscreenMedia = {
  src: string;
  type: 'image' | 'video' | 'audio';
  label: string;
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

function areStringSetsEqual(first: Set<string>, second: Set<string>) {
  if (first.size !== second.size) return false;
  for (const value of first) {
    if (!second.has(value)) return false;
  }
  return true;
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

function getPlaceLabel(store: any) {
  const category = String(store?.category || store?.storeCategory || store?.sellType || '').toLowerCase();
  const name = String(store?.storeName || '').toLowerCase();
  if (category.includes('hotel') || name.includes('hotel') || name.includes('hôtel')) return 'Hôtel proche';
  if (category.includes('restaurant') || name.includes('restaurant') || name.includes('resto')) return 'Restaurant proche';
  if (store?.profileType === 'business') return 'Entreprise proche';
  return 'Boutique proche';
}

function scoreNearbyStore(store: any, locationLabel: string) {
  const text = `${store?.storeName || ''} ${store?.category || ''} ${store?.description || ''} ${store?.location || ''}`.toLowerCase();
  const locationParts = locationLabel
    .toLowerCase()
    .split(/[,\s·]+/)
    .map((item) => item.trim())
    .filter((item) => item.length > 2);
  const localScore = locationParts.some((part) => text.includes(part)) ? 10000 : 0;
  const trustedScore = store?.status === 'active' || store?.status === 'approved' ? 1000 : 0;
  const businessScore = store?.profileType === 'business' ? 250 : 0;
  return localScore + trustedScore + businessScore + stableHash(String(store?.id || store?.slug || store?.storeName || 'store')) * 100;
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
    <div className="relative flex h-full w-full flex-col justify-between overflow-hidden bg-[#0A8B46] p-5 text-white">
      <div className="absolute inset-0 bg-[#0A8B46]" />
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
        className="relative z-10 mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white text-[#0A8B46] shadow-lg transition hover:scale-105"
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
    <div className="group relative h-full overflow-hidden bg-[#0A8B46]">
      <video
        ref={videoRef}
        src={src}
        className="h-full w-full object-cover"
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
          className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-foreground shadow-lg transition hover:scale-105"
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
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#0A8B46] transition hover:bg-[#0A8B46]"
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
            className="h-2 min-w-0 flex-1 accent-[#0A8B46]"
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
  const { stores: nearbyStores } = useNkampaStores({ statuses: ['active', 'approved'] });
  const { location } = useDashboardLocation();
  const [activeTab, setActiveTab] = useState('Accueil');
  const [posts, setPosts] = useState<Post[]>([]);
  const [postLimit, setPostLimit] = useState(80);
  const [feedRounds, setFeedRounds] = useState(4);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [commentsByPost, setCommentsByPost] = useState<Record<string, PostComment[]>>({});
  const [commentInputByPost, setCommentInputByPost] = useState<Record<string, string>>({});
  const [isLoadingCommentsByPost, setIsLoadingCommentsByPost] = useState<Record<string, boolean>>({});
  const [isSubmittingCommentByPost, setIsSubmittingCommentByPost] = useState<Record<string, boolean>>({});
  const [likedPostIds, setLikedPostIds] = useState<Set<string>>(new Set());
  const [activeMediaPostId, setActiveMediaPostId] = useState<string | null>(null);
  const [fullscreenMedia, setFullscreenMedia] = useState<FullscreenMedia | null>(null);
  const [viewingStories, setViewingStories] = useState<{ stories: any[]; index: number } | null>(null);
  const [recommendationProfile, setRecommendationProfile] = useState<RecommendationProfile>(() => createEmptyRecommendationProfile());
  const [storyOfferOffset, setStoryOfferOffset] = useState(0);
  const [blockedProfileIds, setBlockedProfileIds] = useState<Set<string>>(new Set());
  const [suggestedUsers, setSuggestedUsers] = useState<DiscoverUser[]>([]);
  const [followedProfileIds, setFollowedProfileIds] = useState<Set<string>>(new Set());
  const [isTopChromeHidden, setIsTopChromeHidden] = useState(false);
  const mainFeedRef = useRef<HTMLElement | null>(null);
  const postRefs = useRef<Record<string, HTMLElement | null>>({});
  const viewedPostTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const recordedVisiblePostsRef = useRef<Set<string>>(new Set());

  const filteredPosts = useMemo(
    () => posts
      .filter((post) => !post.authorId || !blockedProfileIds.has(post.authorId))
      .filter((post) => post.category === activeTab || activeTab === 'Accueil')
      .map((post) => ({ post, score: scorePostForUser(post, recommendationProfile) }))
      .sort((a, b) => b.score - a.score || getPostTimestamp(b.post.createdAt) - getPostTimestamp(a.post.createdAt))
      .map(({ post }) => post),
    [posts, activeTab, recommendationProfile, blockedProfileIds]
  );

  const visibleStories = useMemo(
    () => stories.filter((contactStory) => !blockedProfileIds.has(contactStory.userId)),
    [blockedProfileIds, stories]
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
      .slice(0, 24);
  }, [ecommerceProducts]);

  const rotatingStoryOffers = useMemo<StoryOffer[]>(() => {
    if (!storyOffers.length) return [];
    const visibleCount = Math.min(8, storyOffers.length);
    return Array.from({ length: visibleCount }, (_, index) => storyOffers[(storyOfferOffset + index) % storyOffers.length]);
  }, [storyOffers, storyOfferOffset]);

  const nearbyPlaces = useMemo<NearbyPlace[]>(() => {
    const locationLabel = location?.label || '';
    return [...(nearbyStores || [])]
      .filter((store: any) => store?.slug && store?.id)
      .map((store: any) => ({
        id: store.id,
        name: store.storeName || 'Adresse eNkamba',
        label: getPlaceLabel(store),
        image: store.coverUrl || store.logoUrl || 'https://picsum.photos/seed/nkampa-place/500/340',
        href: `/shop/${store.slug}`,
        location: store.location || locationLabel || 'Autour de vous',
        score: scoreNearbyStore(store, locationLabel),
      }))
      .sort((left, right) => right.score - left.score)
      .slice(0, 24);
  }, [location?.label, nearbyStores]);

  const feedItems = useMemo(() => {
    const items: Array<
      | { type: 'post'; post: Post }
      | { type: 'product'; offer: StoryOffer; key: string }
      | { type: 'people'; key: string }
      | { type: 'places'; key: string; label: string }
    > = [];

    filteredPosts.forEach((post, index) => {
      items.push({ type: 'post', post });

      if ((index + 1) % 3 === 0 && suggestedUsers.length > 0) {
        items.push({ type: 'people', key: `people-${index}` });
      }

      if (storyOffers.length > 0 && (index + 1) % 4 === 0) {
        const offer = storyOffers[index % storyOffers.length];
        items.push({ type: 'product', offer, key: `${offer.id}-${index}` });
      }

      if ((index + 1) % 5 === 0 && nearbyPlaces.length > 0) {
        items.push({ type: 'places', key: `places-${index}`, label: 'Proche de chez vous' });
      }
    });

    const recommendationRounds = Math.max(feedRounds, filteredPosts.length ? 1 : 6);
    for (let round = 0; round < recommendationRounds; round += 1) {
      if (suggestedUsers.length > 0) items.push({ type: 'people', key: `tail-people-${round}` });
      if (storyOffers.length > 0) {
        const offer = storyOffers[(round + storyOfferOffset) % storyOffers.length];
        items.push({ type: 'product', offer, key: `tail-product-${offer.id}-${round}` });
      }
      if (nearbyPlaces.length > 0) {
        items.push({ type: 'places', key: `tail-places-${round}`, label: round % 2 === 0 ? 'Entreprises, boutiques et lieux proches' : 'À découvrir autour de vous' });
      }
    }

    return items;
  }, [feedRounds, filteredPosts, nearbyPlaces.length, storyOfferOffset, storyOffers, suggestedUsers.length]);

  const recommendationStorageKey = `${RECOMMENDATION_STORAGE_PREFIX}:${user?.uid || 'anonymous'}`;
  const postIdsKey = useMemo(() => posts.map((post) => post.id).join('|'), [posts]);

  useEffect(() => {
    try {
      const storedProfile = window.localStorage.getItem(recommendationStorageKey);
      setRecommendationProfile(storedProfile ? { ...createEmptyRecommendationProfile(), ...JSON.parse(storedProfile) } : createEmptyRecommendationProfile());
    } catch {
      setRecommendationProfile(createEmptyRecommendationProfile());
    }
  }, [recommendationStorageKey]);

  useEffect(() => {
    if (storyOffers.length <= 1) {
      setStoryOfferOffset(0);
      return;
    }

    const interval = window.setInterval(() => {
      setStoryOfferOffset((current) => (current + 1) % storyOffers.length);
    }, 7000);

    return () => window.clearInterval(interval);
  }, [storyOffers.length]);

  useEffect(() => {
    const usersQuery = query(collection(db, 'users'), limit(36));
    const unsubscribe = onSnapshot(
      usersQuery,
      (snapshot) => {
        const nextUsers = snapshot.docs
          .map((userDoc) => {
            const data = userDoc.data() as any;
            return {
              id: userDoc.id,
              name: data.fullName || data.displayName || data.name || data.email || 'Utilisateur eNkamba',
              avatar: data.profileImage || data.photoURL || data.profilePhotoUrl || data.kyc?.profileImage || '',
              location: data.city || data.country || data.location || 'Makutano',
              bio: data.bio || data.about || 'Profil public eNkamba',
            };
          })
          .filter((item) => item.id !== user?.uid && !blockedProfileIds.has(item.id))
          .slice(0, 18);
        setSuggestedUsers(nextUsers);
      },
      (error) => {
        console.error('Erreur chargement suggestions Makutano:', error);
      }
    );

    return () => unsubscribe();
  }, [blockedProfileIds, user?.uid]);

  useEffect(() => {
    if (!user?.uid) {
      setFollowedProfileIds(new Set());
      return;
    }

    const followsQuery = query(collection(db, 'makutano_follows'), where('followerId', '==', user.uid));
    const unsubscribe = onSnapshot(
      followsQuery,
      (snapshot) => {
        setFollowedProfileIds(new Set(snapshot.docs.map((followDoc) => String((followDoc.data() as any).followingId || ''))));
      },
      (error) => {
        console.error('Erreur chargement suivis Makutano:', error);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

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

  const openPublicProfile = (authorId?: string) => {
    if (!authorId) {
      toast({
        title: 'Profil indisponible',
        description: 'Cette publication ne contient pas encore l’identifiant public de l’auteur.',
        variant: 'destructive',
      });
      return;
    }
    router.push(`/dashboard/makutano/profile/${authorId}`);
  };

  const openFullscreenMedia = (media: FullscreenMedia) => {
    setActiveMediaPostId(null);
    setFullscreenMedia(media);
  };

  const handleFollowSuggestedUser = async (targetUser: DiscoverUser) => {
    if (!user?.uid) {
      toast({
        title: 'Connexion requise',
        description: 'Connectez-vous pour suivre ce profil.',
        variant: 'destructive',
      });
      return;
    }

    const followId = `${user.uid}_${targetUser.id}`;
    const isAlreadyFollowing = followedProfileIds.has(targetUser.id);
    try {
      if (isAlreadyFollowing) {
        await deleteDoc(doc(db, 'makutano_follows', followId));
        return;
      }

      await setDoc(doc(db, 'makutano_follows', followId), {
        followerId: user.uid,
        followingId: targetUser.id,
        followerName: user.displayName || user.email || 'Utilisateur eNkamba',
        followingName: targetUser.name,
        createdAt: serverTimestamp(),
      });
      toast({
        title: 'Profil suivi',
        description: `Vous suivez maintenant ${targetUser.name}.`,
        className: 'bg-primary text-white border-none',
      });
    } catch (error) {
      console.error('Erreur suivi suggestion Makutano:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour le suivi.',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    const postsQuery = query(
      collection(db, 'makutano_posts'),
      orderBy('createdAt', 'desc'),
      limit(postLimit)
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
  }, [postLimit, toast]);

  useEffect(() => {
    let cancelled = false;
    const postIds = postIdsKey.split('|').filter(Boolean);

    const loadLikedPosts = async () => {
      if (!user?.uid || postIds.length === 0) {
        setLikedPostIds((current) => (current.size === 0 ? current : new Set()));
        return;
      }

      try {
        const likedIds = new Set<string>();
        await Promise.all(
          postIds.map(async (postId) => {
            const likeDoc = await getDoc(doc(db, 'makutano_posts', postId, 'likes', user.uid));
            if (likeDoc.exists()) likedIds.add(postId);
          })
        );
        if (!cancelled) {
          setLikedPostIds((current) => (areStringSetsEqual(current, likedIds) ? current : likedIds));
        }
      } catch (error) {
        console.error('Erreur chargement likes utilisateur:', error);
      }
    };

    void loadLikedPosts();
    return () => {
      cancelled = true;
    };
  }, [user?.uid, postIdsKey]);

  useEffect(() => {
    setPosts((prev) => {
      let changed = false;
      const nextPosts = prev.map((post) => {
        const nextIsLiked = likedPostIds.has(post.id);
        if (post.isLiked === nextIsLiked) return post;
        changed = true;
        return { ...post, isLiked: nextIsLiked };
      });
      return changed ? nextPosts : prev;
    });
  }, [likedPostIds]);

  useEffect(() => {
    if (!user?.uid) {
      setBlockedProfileIds(new Set());
      return;
    }

    const controlsQuery = query(
      collection(db, 'makutano_relationship_controls'),
      where('ownerId', '==', user.uid),
      where('blocked', '==', true)
    );

    const unsubscribe = onSnapshot(
      controlsQuery,
      (snapshot) => {
        setBlockedProfileIds(new Set(snapshot.docs.map((controlDoc) => String((controlDoc.data() as any).targetId || ''))));
      },
      (error) => {
        console.error('Erreur chargement profils bloques Makutano:', error);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  useEffect(() => {
    if (fullscreenMedia) setActiveMediaPostId(null);
  }, [fullscreenMedia]);

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
        if (!bestEntry || bestEntry.intersectionRatio < 0.78) {
          setActiveMediaPostId(null);
          return;
        }

        const postId = bestEntry?.target.getAttribute('data-post-id');
        if (!postId) return;

        const post = filteredPosts.find((item) => item.id === postId);
        if (!post?.mediaUrl || (post.mediaType !== 'audio' && post.mediaType !== 'video')) {
          setActiveMediaPostId(null);
          return;
        }
        if (fullscreenMedia) return;

        setActiveMediaPostId(postId);
      },
      {
        root,
        rootMargin: '-8% 0px -18% 0px',
        threshold: [0, 0.5, 0.65, 0.78, 0.9],
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
  }, [filteredPosts, fullscreenMedia]);

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

  const handleReportPost = async (post: Post) => {
    if (!user?.uid) {
      toast({
        variant: 'destructive',
        title: 'Connexion requise',
        description: 'Connectez-vous pour signaler une publication.',
      });
      return;
    }

    try {
      await addDoc(collection(db, 'makutano_reports'), {
        type: 'post',
        postId: post.id,
        authorId: post.authorId || '',
        reporterId: user.uid,
        reason: 'Signalement utilisateur',
        status: 'open',
        mediaType: post.mediaType,
        category: post.category,
        postPreview: post.text || '',
        createdAt: serverTimestamp(),
      });

      await updateDoc(doc(db, 'makutano_posts', post.id), {
        reportCount: increment(1),
        lastReportedAt: serverTimestamp(),
      }).catch(() => undefined);

      toast({
        title: 'Signalement envoyé',
        description: 'Notre équipe pourra vérifier cette publication.',
        className: 'bg-primary text-white border-none',
      });
    } catch (error) {
      console.error('Erreur signalement publication:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible d’envoyer le signalement.',
      });
    }
  };

  const handleCreateStory = () => {
    router.push('/dashboard/miyiki-chat/stories/create');
  };

  const openCreatePost = () => {
    router.push('/dashboard/makutano/create');
  };

  const handleFeedScroll = () => {
    const root = mainFeedRef.current;
    if (!root) return;
    setIsTopChromeHidden(root.scrollTop > 18);
    const remaining = root.scrollHeight - root.scrollTop - root.clientHeight;
    if (remaining < 900) {
      setPostLimit((current) => Math.min(current + 30, 300));
      setFeedRounds((current) => Math.min(current + 2, 30));
    }
  };

  return (
    <div className="flex h-[calc(100dvh-2.5rem)] min-h-0 flex-col overflow-hidden bg-[#f5f7f6]">
      <div
        className={cn(
          'relative z-50 w-full overflow-hidden bg-white/0 transition-[max-height,opacity,transform] duration-300 ease-out',
          isTopChromeHidden ? 'max-h-0 -translate-y-6 opacity-0' : 'max-h-[18rem] translate-y-0 opacity-100'
        )}
      >
      <header className="w-full bg-transparent px-3 pt-[calc(env(safe-area-inset-top)+0.65rem)]">
        <div className="mx-auto flex max-w-xl items-center gap-2 rounded-full border border-white/70 bg-white/90 px-2 py-2 shadow-[0_14px_38px_rgba(28,96,64,0.18)] backdrop-blur-xl">
          <nav
            className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto pr-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            aria-label="Navigation Makutano"
          >
            {navItems.map(item => {
              const IconComponent = item.icon;

              if (item.link) {
                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => router.push(item.link)}
                    className="flex h-10 items-center gap-2 whitespace-nowrap rounded-full px-3 text-xs font-bold text-[#0A8B46] transition hover:bg-[#0A8B46]/10 hover:text-[#0A8B46]"
                  >
                    <IconComponent size={16} />
                    <span>{item.name}</span>
                  </button>
                );
              }

              return (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => {
                    setActiveTab(item.name);
                    recordCategoryPreference(item.name as Post['category']);
                  }}
                  className={cn(
                    'flex h-10 items-center gap-2 whitespace-nowrap rounded-full px-3 text-xs font-bold transition',
                    activeTab === item.name
                      ? 'bg-[#0A8B46] text-white shadow-[0_8px_18px_rgba(50,187,120,0.24)]'
                      : 'text-[#0A8B46] hover:bg-[#0A8B46]/10 hover:text-[#0A8B46]'
                  )}
                >
                  <IconComponent size={16} />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </nav>

          {user?.uid && (
            <button
              type="button"
              onClick={() => router.push(`/dashboard/makutano/profile/${user.uid}`)}
              className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full border border-[#0A8B46]/20 bg-[#0A8B46]/10 shadow-inner transition hover:bg-[#0A8B46]/15"
              aria-label="Ouvrir mon profil"
            >
              <Avatar className="h-9 w-9 border border-white">
                <AvatarImage src={profile?.photoURL || profile?.profileImage} />
                <AvatarFallback className="bg-white text-xs font-black text-[#0A8B46]">
                  {profile?.displayName?.charAt(0) || profile?.fullName?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
            </button>
          )}
        </div>
      </header>

      <section className="border-b border-[#edf3ef] bg-white px-3 py-3">
        <div className="mx-auto max-w-xl rounded-2xl border border-[#edf3ef] bg-white p-3 shadow-[0_10px_24px_rgba(15,23,42,0.06)]">
          <div className="mb-3 flex items-center gap-3">
            <Avatar className="h-10 w-10 border border-[#e4eee8]">
              <AvatarImage src={profile?.photoURL || profile?.profileImage} />
              <AvatarFallback className="bg-primary/10 text-xs font-black text-[#0A8B46]">
                {profile?.displayName?.charAt(0) || profile?.fullName?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <button
              type="button"
              onClick={openCreatePost}
              className="flex h-11 min-w-0 flex-1 items-center rounded-full bg-slate-100 px-4 text-left text-sm font-semibold text-slate-500 transition hover:bg-[#0A8B46]/10 hover:text-[#0A8B46]"
            >
              Quoi de neuf ?
            </button>
          </div>
        </div>
      </section>

      <section className="border-b border-[#0A8B46] bg-white px-3 py-2">
        <div className="mx-auto flex max-w-xl gap-2.5 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="flex w-[66px] flex-shrink-0 flex-col items-center gap-1">
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  if (myStories.length) setViewingStories({ stories: myStories, index: 0 });
                }}
                className={cn(
                  'rounded-full p-0.5',
                  myStories.length ? 'bg-gradient-to-tr from-[#0A8B46] via-[#0A8B46] to-[#FFA500]' : 'bg-[#0A8B46]'
                )}
                aria-label={myStories.length ? 'Voir ma story' : 'Aucune story'}
              >
                <Avatar className="h-14 w-14 border-2 border-white">
                  <AvatarImage src={profile?.photoURL || profile?.profileImage} />
                  <AvatarFallback className="bg-primary/10 text-[#0A8B46]">
                    {profile?.displayName?.charAt(0) || profile?.fullName?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
              </button>
              <button
                type="button"
                onClick={handleCreateStory}
                className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-[#0A8B46] text-white"
                aria-label="Ajouter une story"
              >
                <MakutanoCreateIcon size={14} />
              </button>
            </div>
            <span className="max-w-full truncate text-[11px] font-medium text-foreground">Ma story</span>
          </div>

          {storiesLoading ? (
            <div className="flex items-center px-2 text-xs text-muted-foreground">Chargement...</div>
          ) : (
            visibleStories.map((contactStory) => (
              <button
                key={contactStory.userId}
                onClick={() => setViewingStories({ stories: contactStory.stories, index: 0 })}
                className="flex w-[66px] flex-shrink-0 flex-col items-center gap-1"
              >
                <div className={cn(
                  'rounded-full p-0.5',
                  contactStory.hasUnviewed ? 'bg-gradient-to-tr from-[#0A8B46] via-[#0A8B46] to-[#FFA500]' : 'bg-[#0A8B46]'
                )}>
                  <Avatar className="h-14 w-14 border-2 border-white">
                    <AvatarImage src={contactStory.userAvatar} />
                    <AvatarFallback className="bg-primary/10 text-[#0A8B46]">
                      {contactStory.userName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <span className="max-w-full truncate text-[11px] font-medium text-foreground">
                  {contactStory.userName}
                </span>
              </button>
            ))
          )}

          {ecommerceProductsLoading ? (
            <div className="flex w-[66px] flex-shrink-0 items-center px-2 text-xs text-muted-foreground">Offres...</div>
          ) : (
            rotatingStoryOffers.map((offer) => (
              <button
                key={`${offer.id}-${storyOfferOffset}`}
                type="button"
                onClick={() => router.push(offer.href)}
                className="flex w-[66px] flex-shrink-0 flex-col items-center gap-1"
              >
                <div className="rounded-full bg-gradient-to-tr from-[#0A8B46] via-[#0A8B46] to-[#FFA500] p-0.5">
                  <div className="relative h-14 w-14 overflow-hidden rounded-full border-2 border-white bg-primary/10">
                    <img
                      src={offer.image}
                      alt={offer.name}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                    <span className="absolute bottom-0 left-0 right-0 bg-[#0A8B46]/90 px-1 py-0.5 text-[9px] font-bold text-white">
                      Offre
                    </span>
                  </div>
                </div>
                <span className="max-w-full truncate text-[11px] font-medium text-foreground">
                  {offer.storeName}
                </span>
              </button>
            ))
          )}
        </div>
      </section>
      </div>

      {/* Feed vertical minimaliste */}
      <main
        ref={mainFeedRef}
        onScroll={handleFeedScroll}
        className="min-h-0 flex-1 overflow-y-auto scroll-smooth bg-[#f5f7f6] px-0 pb-24 pt-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] sm:px-4"
      >
        {isLoadingPosts ? (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <p className="text-sm">Chargement des publications...</p>
          </div>
        ) : feedItems.length === 0 ? (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <p className="text-sm">Préparation des recommandations...</p>
          </div>
        ) : (
          <div className="mx-auto max-w-xl space-y-3 sm:space-y-4">
            {feedItems.map((item) => {
              if (item.type === 'people') {
                return (
                  <section key={`people-${item.key}`} className="mx-0 overflow-hidden border-y border-slate-200 bg-white px-3 py-4 shadow-sm sm:rounded-2xl sm:border">
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <h2 className="text-sm font-black text-slate-950">Personnes que vous pourriez connaître</h2>
                        <p className="text-xs font-semibold text-slate-500">Profils publics Makutano</p>
                      </div>
                    </div>
                    <div className="flex gap-4 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                      {suggestedUsers.map((suggestedUser) => {
                        const isFollowing = followedProfileIds.has(suggestedUser.id);
                        return (
                          <div key={`${item.key}-${suggestedUser.id}`} className="w-32 shrink-0 text-center">
                            <button
                              type="button"
                              onClick={() => router.push(`/dashboard/makutano/profile/${suggestedUser.id}`)}
                              className="mx-auto block w-full rounded-2xl px-1 py-1 transition hover:bg-slate-50"
                            >
                              <Avatar className="mx-auto h-16 w-16 border-2 border-primary/15 shadow-sm">
                                <AvatarImage src={suggestedUser.avatar} />
                                <AvatarFallback className="bg-primary/10 text-sm font-black text-primary">
                                  {suggestedUser.name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <p className="mx-auto mt-2 min-h-[2rem] max-w-[7.25rem] whitespace-normal break-words text-center text-xs font-black leading-4 text-slate-900 line-clamp-2">
                                {suggestedUser.name}
                              </p>
                              <p className="line-clamp-1 text-[10px] font-semibold text-slate-500">{suggestedUser.location}</p>
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleFollowSuggestedUser(suggestedUser)}
                              className={`mt-2 h-8 w-full rounded-full px-3 text-[11px] font-black transition ${
                                isFollowing
                                  ? 'bg-slate-100 text-slate-600'
                                  : 'bg-primary text-white shadow-sm shadow-primary/20'
                              }`}
                            >
                              {isFollowing ? 'Suivi' : 'Ajouter'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                );
              }

              if (item.type === 'product') {
                const offer = item.offer;
                return (
                  <article key={`product-${item.key}`} className="mx-0 overflow-hidden border-y border-slate-200 bg-white shadow-sm sm:rounded-2xl sm:border">
                    <button
                      type="button"
                      onClick={() => router.push(offer.href)}
                      className="block w-full text-left"
                    >
                      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
                        <img
                          src={offer.image}
                          alt={offer.name}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                        <div className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-[10px] font-black uppercase text-primary shadow-sm">
                          Marché populaire
                        </div>
                      </div>
                      <div className="space-y-1.5 p-3">
                        <p className="line-clamp-2 text-sm font-black leading-5 text-slate-900">{offer.name}</p>
                        <p className="line-clamp-1 text-xs font-semibold text-slate-500">{offer.storeName}</p>
                        <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-[11px] font-black text-primary">
                          Voir le produit
                        </span>
                      </div>
                    </button>
                  </article>
                );
              }

              if (item.type === 'places') {
                return (
                  <section key={`places-${item.key}`} className="mx-0 overflow-hidden border-y border-slate-200 bg-white px-3 py-4 shadow-sm sm:rounded-2xl sm:border">
                    <div className="mb-3">
                      <h2 className="text-sm font-black text-slate-950">{item.label}</h2>
                      <p className="text-xs font-semibold text-slate-500">{location?.label || 'Selon votre localisation eNkamba'}</p>
                    </div>
                    <div className="flex gap-3 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                      {nearbyPlaces.map((place) => (
                        <button
                          key={`${item.key}-${place.id}`}
                          type="button"
                          onClick={() => router.push(place.href)}
                          className="w-40 shrink-0 overflow-hidden rounded-2xl border border-slate-100 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                        >
                          <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
                            <img src={place.image} alt={place.name} className="h-full w-full object-cover" loading="lazy" />
                            <span className="absolute left-2 top-2 rounded-full bg-white/95 px-2 py-1 text-[9px] font-black uppercase text-primary shadow-sm">
                              {place.label}
                            </span>
                          </div>
                          <div className="p-2.5">
                            <p className="line-clamp-1 text-xs font-black text-slate-900">{place.name}</p>
                            <p className="mt-1 line-clamp-1 text-[10px] font-semibold text-slate-500">{place.location}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </section>
                );
              }

              const post = item.post;
              return (
              <article
                key={post.id}
                ref={(node) => {
                  postRefs.current[post.id] = node;
                }}
                data-post-id={post.id}
                className="mx-0 overflow-hidden border-y border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md sm:rounded-2xl sm:border"
              >
                {/* Header du post */}
                <div className="flex flex-shrink-0 items-center justify-between gap-3 px-3.5 py-2.5">
                  <button
                    type="button"
                    onClick={() => openPublicProfile(post.authorId)}
                    className="flex min-w-0 items-center gap-3 rounded-xl text-left transition hover:bg-slate-100"
                    aria-label={`Ouvrir le profil de ${post.author.name}`}
                  >
                    <Avatar className="h-9 w-9 border border-[#e4eee8]">
                      <AvatarImage src={post.author.avatar} />
                      <AvatarFallback className="bg-primary/10 text-[#0A8B46]">
                        {post.author.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground hover:text-[#0A8B46]">{post.author.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{post.author.location || 'Makutano'}</p>
                    </div>
                  </button>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#0A8B46]">
                      {post.category}
                    </span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 rounded-full text-muted-foreground hover:bg-primary/10"
                      aria-label="Signaler cette publication"
                      title="Signaler"
                      onClick={(event) => {
                        event.stopPropagation();
                        void handleReportPost(post);
                      }}
                    >
                      <MakutanoMoreIcon size={18} />
                    </Button>
                  </div>
                </div>

                {/* Média */}
                <div className="relative overflow-hidden bg-slate-950">
                  {post.mediaUrl ? (
                    post.mediaType === 'audio' ? (
                      <div className="aspect-[4/5] max-h-[68dvh] w-full">
                        <MakutanoAudioPlayer src={post.mediaUrl} isActive={activeMediaPostId === post.id} />
                      </div>
                    ) : post.mediaType === 'video' ? (
                      <div className="aspect-[4/5] max-h-[68dvh] w-full sm:aspect-video">
                        <MakutanoVideoPlayer src={post.mediaUrl} isActive={activeMediaPostId === post.id} />
                      </div>
                    ) : (
                      <img
                        src={post.mediaUrl}
                        alt={post.text}
                        className="max-h-[68dvh] w-full bg-slate-950 object-contain"
                        loading="lazy"
                      />
                    )
                  ) : (
                    <div className="flex h-72 w-full items-center justify-center bg-primary/10">
                      <p className="text-sm font-medium text-[#0A8B46]">Média indisponible</p>
                    </div>
                  )}
                  {post.mediaUrl && (
                    <button
                      type="button"
                      onClick={() => openFullscreenMedia({ src: post.mediaUrl, type: post.mediaType, label: post.text || `Publication de ${post.author.name}` })}
                      className="absolute right-3 top-3 rounded-full bg-black/55 px-3 py-1.5 text-xs font-bold text-white shadow-lg backdrop-blur transition hover:bg-black/70"
                      aria-label="Afficher en plein écran"
                    >
                      Plein écran
                    </button>
                  )}
                </div>

                <div className="flex-shrink-0 space-y-2 px-3.5 py-3">
                  {/* Texte du post */}
                  {post.text && (
                    <p className="line-clamp-2 text-sm leading-5 text-foreground">
                      <span className="font-semibold">{post.author.name}</span>{' '}
                      {post.text}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between border-t border-[#edf3ef] pt-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          void handleLike(post.id);
                        }}
                        className={cn(
                          'flex h-9 items-center gap-2 rounded-full px-3 text-sm font-semibold transition-all',
                          post.isLiked
                            ? 'bg-[#0A8B46] text-white shadow-sm'
                            : 'bg-primary/5 text-muted-foreground hover:bg-primary/10 hover:text-[#0A8B46]'
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
                        className="flex h-9 items-center gap-2 rounded-full bg-primary/5 px-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-primary/10 hover:text-[#0A8B46]"
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
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/5 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-[#0A8B46]"
                      aria-label="Partager"
                    >
                      <MakutanoShareIcon size={18} />
                    </button>
                  </div>
                </div>

                {/* Section commentaires */}
                {activeCommentPostId === post.id && (
                  <div className="border-t border-[#edf3ef] bg-[#fbfdfc] p-4">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Commentaires</p>
                    <div className="mb-3 max-h-44 space-y-2 overflow-y-auto pr-1">
                      {isLoadingCommentsByPost[post.id] ? (
                        <p className="text-xs text-muted-foreground">Chargement...</p>
                      ) : (commentsByPost[post.id] || []).length === 0 ? (
                        <p className="text-xs text-muted-foreground">Aucun commentaire.</p>
                      ) : (
                        (commentsByPost[post.id] || []).map((comment) => (
                          <div key={comment.id} className="rounded-xl border border-[#edf3ef] bg-white p-3">
                            <p className="text-xs font-semibold text-foreground">{comment.authorName}</p>
                            <p className="mt-1 text-xs leading-5 text-muted-foreground">{comment.text}</p>
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
                        className="h-10 flex-1 rounded-full border-[#0A8B46] bg-white text-sm focus-visible:ring-[#0A8B46]"
                      />
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          void submitComment(post.id);
                        }}
                        disabled={isSubmittingCommentByPost[post.id]}
                        className="h-10 rounded-full bg-[#0A8B46] px-4 hover:bg-[#0A8B46]"
                      >
                        {isSubmittingCommentByPost[post.id] ? '...' : 'Publier'}
                      </Button>
                    </div>
                  </div>
                )}
                </article>
              );
            })}
          </div>
        )}
      </main>

      {fullscreenMedia && (
        <div className="fixed inset-0 z-[80] flex flex-col bg-black text-white">
          <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
            <p className="min-w-0 flex-1 truncate text-sm font-semibold">{fullscreenMedia.label}</p>
            <button
              type="button"
              onClick={() => setFullscreenMedia(null)}
              className="rounded-full bg-white/10 px-4 py-2 text-sm font-bold transition hover:bg-white/20"
              aria-label="Fermer le plein écran"
            >
              Fermer
            </button>
          </div>
          <div className="flex min-h-0 flex-1 items-center justify-center p-3">
            {fullscreenMedia.type === 'video' ? (
              <video
                src={fullscreenMedia.src}
                controls
                autoPlay
                className="max-h-full max-w-full rounded-2xl object-contain"
              />
            ) : fullscreenMedia.type === 'audio' ? (
              <div className="w-full max-w-xl rounded-3xl bg-[#0A8B46] p-6 shadow-2xl">
                <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-white/60">Audio Makutano</p>
                <audio src={fullscreenMedia.src} controls autoPlay className="w-full" />
              </div>
            ) : (
              <img
                src={fullscreenMedia.src}
                alt={fullscreenMedia.label}
                className="max-h-full max-w-full rounded-2xl object-contain"
              />
            )}
          </div>
        </div>
      )}

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

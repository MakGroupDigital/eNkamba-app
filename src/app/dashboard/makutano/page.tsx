'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
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
import { collection, onSnapshot, orderBy, query, limit } from 'firebase/firestore';
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

function MakutanoAudioPlayer({ src }: { src: string }) {
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
        <audio src={src} controls autoPlay loop className="w-full" />
      </div>
    </div>
  );
}

export default function MakutanoPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('Accueil');
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);

  const filteredPosts = posts.filter(post => post.category === activeTab || activeTab === 'Accueil');

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

  const handleLike = (id: string) => {
    setPosts(posts.map(post => {
      if (post.id === id) {
        return {
          ...post,
          likes: post.isLiked ? post.likes - 1 : post.likes + 1,
          isLiked: !post.isLiked
        };
      }
      return post;
    }));
  };

  const handleComment = (id: string) => {
    setPosts(posts.map(p => {
      if (p.id === id) {
        return { ...p, comments: p.comments + 1 };
      }
      return p;
    }));
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
      <header className="fixed left-0 right-0 top-0 z-50 w-full border-b border-white/20 bg-gradient-to-r from-primary via-primary to-green-800 text-white shadow-lg backdrop-blur">
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
        <div className="absolute top-4 right-4 z-30">
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

      {/* Feed vertical TikTok-style avec cartes compactes type Instagram */}
      <div className="pointer-events-none fixed left-4 top-44 z-10 hidden w-52 rounded-2xl border border-emerald-200/70 bg-white/80 p-4 shadow-xl backdrop-blur lg:block">
        <p className="mb-3 text-sm font-bold text-emerald-800">Rubriques</p>
        <div className="space-y-2 text-xs text-emerald-900">
          <div className="rounded-lg bg-emerald-100/80 px-3 py-2">Communauté locale</div>
          <div className="rounded-lg bg-orange-100/80 px-3 py-2">Opportunités business</div>
          <div className="rounded-lg bg-violet-100/80 px-3 py-2">Projets à financer</div>
          <div className="rounded-lg bg-sky-100/80 px-3 py-2">Conseils & savoir</div>
        </div>
      </div>

      <div className="pointer-events-none fixed right-4 top-44 z-10 hidden w-52 rounded-2xl border border-orange-200/70 bg-white/80 p-4 shadow-xl backdrop-blur lg:block">
        <p className="mb-3 text-sm font-bold text-orange-800">Tendances</p>
        <div className="space-y-2 text-xs text-orange-900">
          <div className="rounded-lg bg-orange-100/80 px-3 py-2">#MakutanoRDC</div>
          <div className="rounded-lg bg-emerald-100/80 px-3 py-2">#MarchéLocal</div>
          <div className="rounded-lg bg-blue-100/80 px-3 py-2">#Innovation</div>
          <div className="rounded-lg bg-fuchsia-100/80 px-3 py-2">#Solidarité</div>
        </div>
      </div>

      <main className="flex-1 overflow-y-scroll snap-y snap-mandatory px-3 pb-4 pt-40 md:pt-44 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {isLoadingPosts ? (
          <div className="flex h-full items-center justify-center text-emerald-900/60">
            <p>Chargement des posts Firebase...</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="flex h-full items-center justify-center text-emerald-900/60">
            <p>Aucun post réel trouvé dans cette catégorie.</p>
          </div>
        ) : (
          filteredPosts.map((post) => (
            <section
              key={post.id}
              className="group relative mx-auto mb-6 flex h-[78vh] w-full max-w-md snap-start items-center justify-center overflow-hidden rounded-3xl border border-emerald-200/80 bg-white shadow-2xl ring-1 ring-white/70"
            >
              {/* Image de fond */}
              <div className="absolute inset-0">
                {post.mediaUrl ? (
                  post.mediaType === 'audio' ? (
                    <MakutanoAudioPlayer src={post.mediaUrl} />
                  ) : post.mediaType === 'video' ? (
                    <video
                      src={post.mediaUrl}
                      className="h-full w-full object-cover"
                      autoPlay
                      muted
                      loop
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
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-200 to-teal-300 text-sm font-semibold text-emerald-900">
                    Média indisponible
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
              </div>

              {/* Contenu */}
              <div className="absolute inset-0 flex flex-col justify-between p-4 pb-24">
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-white/85 px-3 py-1 text-[11px] font-semibold text-emerald-700">
                    {post.category}
                  </span>
                  <span className="rounded-full bg-black/35 px-3 py-1 text-[11px] font-medium text-white backdrop-blur">
                    {post.mediaType === 'audio' ? 'Audio' : 'En direct'}
                  </span>
                </div>

                {/* Header du post */}
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 ring-2 ring-white">
                    <AvatarImage src={post.author.avatar} />
                    <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="text-white flex-1">
                    <p className="font-bold text-sm">{post.author.name}</p>
                    <p className="text-xs text-white/70">{post.author.location}</p>
                  </div>
                  <Button size="sm" className="bg-primary hover:bg-primary/90 text-white rounded-full h-8 w-8 p-0">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                {/* Texte du post */}
                <div className="max-w-[72%] rounded-2xl bg-black/30 p-3 text-white backdrop-blur-sm">
                  <p className="text-sm font-medium leading-relaxed drop-shadow-lg">{post.text}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full bg-white/85 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">Communauté</span>
                    <span className="rounded-full bg-white/85 px-2.5 py-1 text-[10px] font-semibold text-orange-700">Actualité</span>
                    <span className="rounded-full bg-white/85 px-2.5 py-1 text-[10px] font-semibold text-violet-700">Découverte</span>
                  </div>
                </div>
              </div>

              {/* Actions (droite) */}
              <div className="absolute bottom-20 right-3 z-10 flex flex-col gap-4 rounded-2xl bg-black/20 px-2 py-3 backdrop-blur-sm">
                <button
                  onClick={() => handleLike(post.id)}
                  className="flex flex-col items-center gap-2 group"
                >
                  <div className="rounded-full bg-white/20 p-2.5 backdrop-blur transition-all group-hover:bg-white/30">
                    <Heart
                      className={cn(
                        "h-5 w-5 text-white transition-all",
                        post.isLiked && "fill-red-500 text-red-500"
                      )}
                    />
                  </div>
                  <span className="text-white text-xs font-semibold drop-shadow">{post.likes}</span>
                </button>

                <button
                  onClick={() => handleComment(post.id)}
                  className="flex flex-col items-center gap-2 group"
                >
                  <div className="rounded-full bg-white/20 p-2.5 backdrop-blur transition-all group-hover:bg-white/30">
                    <MessageCircle className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-white text-xs font-semibold drop-shadow">{post.comments}</span>
                </button>

                <button
                  onClick={() => handleShare(post.id)}
                  className="flex flex-col items-center gap-2 group"
                >
                  <div className="rounded-full bg-white/20 p-2.5 backdrop-blur transition-all group-hover:bg-white/30">
                    <Share2 className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-white text-xs font-semibold drop-shadow">Partager</span>
                </button>
              </div>
            </section>
          ))
        )}
      </main>
    </div>
  );
}

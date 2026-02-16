'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  MessageCircle,
  Share2,
  Heart,
  Image as ImageIcon,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import Image from 'next/image';
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
  image: string;
  likes: number;
  comments: number;
  isLiked: boolean;
  category: 'Accueil' | 'Savoir' | 'Entrepreneur' | 'Projets' | 'Local';
}

const initialPosts: Post[] = [
  {
    id: '1',
    author: { name: 'Alice Kabila', location: 'Doctor, Kinshasa', avatar: 'https://picsum.photos/seed/alice/40/40' },
    text: 'Rassemblement au village ce matin pour discuter des nouveaux projets agricoles.',
    image: 'https://picsum.photos/seed/village-meeting/500/800',
    likes: 120,
    comments: 15,
    isLiked: false,
    category: 'Local',
  },
  {
    id: '2',
    author: { name: 'Joseph Tamale', location: 'Tailleur, Kinshasa', avatar: 'https://picsum.photos/seed/joseph/40/40' },
    text: 'Nouvelle collection de vêtements traditionnels disponible maintenant!',
    image: 'https://picsum.photos/seed/fashion/500/800',
    likes: 245,
    comments: 32,
    isLiked: false,
    category: 'Entrepreneur',
  },
  {
    id: '3',
    author: { name: 'Mukendi', location: 'Innovateur, Goma', avatar: 'https://picsum.photos/seed/mukendi/40/40' },
    text: 'Projet de four solaire local - Besoin de financement pour démarrer!',
    image: 'https://picsum.photos/seed/solar/500/800',
    likes: 752,
    comments: 24,
    isLiked: false,
    category: 'Projets',
  },
];

export default function MakutanoPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('Accueil');
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [postText, setPostText] = useState('');
  const [postImage, setPostImage] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);

  const filteredPosts = posts.filter(post => post.category === activeTab || activeTab === 'Accueil');

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

  const handleCreatePost = async () => {
    if (!postText.trim()) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Veuillez écrire quelque chose.",
      });
      return;
    }

    setIsPublishing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const newPost: Post = {
      id: Date.now().toString(),
      author: {
        name: 'Vous',
        location: 'Kinshasa, RDC',
        avatar: 'https://picsum.photos/seed/user/40/40'
      },
      text: postText,
      image: postImage || 'https://picsum.photos/seed/new-post/500/800',
      likes: 0,
      comments: 0,
      isLiked: false,
      category: 'Accueil',
    };

    setPosts([newPost, ...posts]);
    setIsPublishing(false);
    setShowCreatePost(false);
    setPostText('');
    setPostImage('');

    toast({
      title: "Post publié !",
      description: "Votre post a été publié.",
    });
  };

  return (
    <div className="flex flex-col h-screen bg-black overflow-hidden">
      {/* Header avec catégories */}
      <header className="sticky top-0 z-20 w-full bg-gradient-to-r from-primary via-primary to-green-800 text-white shadow-lg">
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
            className="h-12 w-12 rounded-full bg-gradient-to-r from-primary to-green-800 text-white shadow-xl hover:scale-110 transition-transform"
            onClick={() => setShowCreatePost(true)}
          >
            <Plus className="w-6 h-6" />
          </Button>
        </div>
      </header>

      {/* Feed vertical TikTok-style */}
      <main className="flex-1 overflow-y-scroll snap-y snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {filteredPosts.length === 0 ? (
          <div className="h-full flex items-center justify-center text-white/50">
            <p>Aucun post dans cette catégorie</p>
          </div>
        ) : (
          filteredPosts.map((post) => (
            <div key={post.id} className="relative w-full h-screen snap-start flex items-center justify-center bg-black">
              {/* Image de fond */}
              <div className="absolute inset-0">
                <Image
                  src={post.image}
                  alt={post.text}
                  fill
                  className="object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
              </div>

              {/* Contenu */}
              <div className="absolute inset-0 flex flex-col justify-between p-4 pb-32">
                {/* Header du post */}
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 ring-2 ring-white">
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
                <div className="text-white max-w-xs">
                  <p className="text-base font-medium leading-relaxed drop-shadow-lg">{post.text}</p>
                </div>
              </div>

              {/* Actions (droite) */}
              <div className="absolute right-4 bottom-24 flex flex-col gap-6 z-10">
                <button
                  onClick={() => handleLike(post.id)}
                  className="flex flex-col items-center gap-2 group"
                >
                  <div className="bg-white/20 backdrop-blur rounded-full p-3 group-hover:bg-white/30 transition-all">
                    <Heart
                      className={cn(
                        "w-6 h-6 text-white transition-all",
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
                  <div className="bg-white/20 backdrop-blur rounded-full p-3 group-hover:bg-white/30 transition-all">
                    <MessageCircle className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-white text-xs font-semibold drop-shadow">{post.comments}</span>
                </button>

                <button
                  onClick={() => handleShare(post.id)}
                  className="flex flex-col items-center gap-2 group"
                >
                  <div className="bg-white/20 backdrop-blur rounded-full p-3 group-hover:bg-white/30 transition-all">
                    <Share2 className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-white text-xs font-semibold drop-shadow">Partager</span>
                </button>
              </div>
            </div>
          ))
        )}
      </main>

      {/* Create Post Dialog */}
      <Dialog open={showCreatePost} onOpenChange={setShowCreatePost}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Créer un nouveau post</DialogTitle>
            <DialogDescription>
              Partagez vos pensées, photos et expériences avec la communauté.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Textarea
                placeholder="Quoi de neuf ?"
                value={postText}
                onChange={(e) => setPostText(e.target.value)}
                className="min-h-[120px] resize-none"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="post-image">URL de l'image (optionnel)</Label>
              <div className="flex gap-2">
                <Input
                  id="post-image"
                  placeholder="https://..."
                  value={postImage}
                  onChange={(e) => setPostImage(e.target.value)}
                />
                <Button variant="outline" size="icon">
                  <ImageIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowCreatePost(false);
              setPostText('');
              setPostImage('');
            }} disabled={isPublishing}>
              Annuler
            </Button>
            <Button
              onClick={handleCreatePost}
              disabled={isPublishing || !postText.trim()}
              className="bg-gradient-to-r from-primary to-green-800"
            >
              {isPublishing ? "Publication..." : "Publier"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

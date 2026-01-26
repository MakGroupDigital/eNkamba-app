'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  MoreHorizontal,
  MessageCircle,
  Share2,
  Heart,
  ArrowRight,
  Image as ImageIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import {
  MakutanoIcon,
  HomeNavIcon,
  AgentIcon,
  MapPinIcon,
  NewChatIcon,
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
  { name: 'Accueil', icon: HomeNavIcon, href: '#' },
  { name: 'Savoir', icon: BookIcon, href: '#' },
  { name: 'Entrepreneur', icon: AgentIcon, href: '#' },
  { name: 'Projets', icon: IdeaIcon, href: '#' },
  { name: 'Local', icon: MapPinIcon, href: '#' },
];

interface Post {
  id: string;
  author: { name: string; location: string; avatar: string };
  text: string;
  image: string;
  likes: number;
  comments: number;
  isLiked: boolean;
  translatable: boolean;
}

const initialPosts: Post[] = [
  {
    id: '1',
    author: { name: 'Alice Kabila', location: 'Doctor, Kinshasa', avatar: 'https://picsum.photos/seed/alice/40/40' },
    text: 'Rassemblement au village ce matin pour discuter des nouveaux projets agricoles.',
    image: 'https://picsum.photos/seed/village-meeting/500/300',
    likes: 120,
    comments: 15,
    isLiked: false,
    translatable: true,
  }
];

const PostCard = ({ post, onLike, onComment, onShare }: { post: Post; onLike: (id: string) => void; onComment: (id: string) => void; onShare: (id: string) => void }) => (
  <Card className="overflow-hidden rounded-2xl shadow-sm border-border/50 animate-in fade-in-up duration-500">
    <CardHeader className="flex flex-row items-center gap-3 p-3">
      <Avatar className="h-10 w-10">
        <AvatarImage src={post.author.avatar} />
        <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
      </Avatar>
      <div className="flex-grow">
        <p className="font-headline text-sm font-bold">{post.author.name}</p>
        <p className="text-xs text-muted-foreground">{post.author.location}</p>
      </div>
      <Button variant="ghost" size="icon" className="h-8 w-8">
        <MoreHorizontal className="h-5 w-5" />
      </Button>
    </CardHeader>
    <CardContent className="space-y-3 p-3 pt-0">
      <p className="text-sm">{post.text}</p>
      <div className="aspect-video overflow-hidden rounded-lg">
        <Image
          src={post.image}
          alt={post.text}
          width={500}
          height={300}
          className="h-full w-full object-cover transition-transform duration-300 hover:scale-110"
        />
      </div>
      <div className="flex items-center justify-between text-muted-foreground pt-2">
        <div className="flex gap-4">
          <button
            className={cn(
              "flex items-center gap-1.5 text-xs hover:text-primary transition-colors",
              post.isLiked && "text-red-500"
            )}
            onClick={() => onLike(post.id)}
          >
            <Heart className={cn("h-4 w-4", post.isLiked && "fill-current")} /> {post.likes}
          </button>
          <button
            className="flex items-center gap-1.5 text-xs hover:text-primary transition-colors"
            onClick={() => onComment(post.id)}
          >
            <MessageCircle className="h-4 w-4" /> {post.comments}
          </button>
          <button
            className="flex items-center gap-1.5 text-xs hover:text-primary transition-colors"
            onClick={() => onShare(post.id)}
          >
            <Share2 className="h-4 w-4" /> Partager
          </button>
        </div>
        {post.translatable && <button className="text-xs font-semibold text-primary hover:underline">Traduire en lingala {'>'}</button>}
      </div>
    </CardContent>
  </Card>
);

export default function MakutanoPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('Accueil');
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [postText, setPostText] = useState('');
  const [postImage, setPostImage] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);

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
    toast({
      title: "Like mis à jour",
      description: "Votre interaction a été enregistrée.",
    });
  };

  const handleComment = (id: string) => {
    const post = posts.find(p => p.id === id);
    if (post) {
      setPosts(posts.map(p => {
        if (p.id === id) {
          return { ...p, comments: p.comments + 1 };
        }
        return p;
      }));
      toast({
        title: "Commentaire",
        description: "Fonctionnalité de commentaire en cours de développement.",
      });
    }
  };

  const handleShare = (id: string) => {
    toast({
      title: "Partage",
      description: "Lien de partage copié dans le presse-papier.",
    });
  };

  const handleCreatePost = async () => {
    if (!postText.trim()) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Veuillez écrire quelque chose dans votre post.",
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
      image: postImage || 'https://picsum.photos/seed/new-post/500/300',
      likes: 0,
      comments: 0,
      isLiked: false,
      translatable: true,
    };

    setPosts([newPost, ...posts]);
    setIsPublishing(false);
    setShowCreatePost(false);
    setPostText('');
    setPostImage('');

    toast({
      title: "Post publié !",
      description: "Votre post a été publié avec succès.",
    });
  };

  return (
    <div className="flex flex-col min-h-full bg-muted/20 pb-24">
      {/* Header */}
      <header className="sticky top-0 z-10 w-full bg-gradient-to-r from-primary via-primary to-green-800 text-white shadow-lg">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              <MakutanoIcon size={32} />
            </div>
            <div>
              <h1 className="font-headline text-2xl font-bold">Makutano</h1>
              <p className="text-sm text-white/70">Réseau social eNkamba</p>
            </div>
          </div>
        </div>
        <div className="container mx-auto px-4 relative pb-8">
          <div className="flex w-full justify-center">
            <div className="bg-white/10 backdrop-blur rounded-full p-1 flex items-center gap-1">
              {navItems.map(item => {
                const IconComponent = item.icon;
                return (
                  <button
                    key={item.name}
                    onClick={() => setActiveTab(item.name)}
                    className={cn(
                      'flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold transition-all',
                      activeTab === item.name
                        ? 'bg-white text-primary shadow-md'
                        : 'text-white/80 hover:bg-white/20'
                    )}
                  >
                    <IconComponent size={16} />
                    <span>{item.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="absolute -bottom-6 right-1/2 translate-x-1/2 z-20">
            <Button
              size="icon"
              className="h-14 w-14 rounded-full bg-gradient-to-r from-primary to-green-800 text-white shadow-xl transition-transform hover:scale-110"
              onClick={() => setShowCreatePost(true)}
            >
              <NewChatIcon size={28} />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto flex-1 p-4 pt-10">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {/* Main Feed Column */}
          <div className="md:col-span-2 space-y-6">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onLike={handleLike}
                onComment={handleComment}
                onShare={handleShare}
              />
            ))}
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6 md:col-span-1 lg:col-span-2">
            <Card className="rounded-2xl animate-in fade-in-up duration-500" style={{animationDelay: '100ms'}}>
              <CardHeader className="flex-row items-center gap-2 p-3">
                <AgentIcon size={20} />
                <h3 className="font-headline font-bold text-sm">Entrepreneur</h3>
              </CardHeader>
              <CardContent className="p-3 pt-0 text-center">
                <Avatar className="h-20 w-20 mx-auto mb-2 ring-2 ring-primary p-1">
                  <AvatarImage src="https://picsum.photos/seed/joseph-t/100/100" />
                  <AvatarFallback>JT</AvatarFallback>
                </Avatar>
                <p className="font-bold">Joseph Tamale</p>
                <p className="text-xs text-muted-foreground mb-3">Tailleur sur mesure</p>
                <div className="space-y-2">
                  <Button
                    className="w-full h-8 text-xs"
                    variant="default"
                    onClick={() => toast({ title: "Redirection", description: "Ouverture du chat..." })}
                  >
                    Contacter via Chat
                  </Button>
                  <Button
                    className="w-full h-8 text-xs"
                    variant="outline"
                    onClick={() => toast({ title: "Ajouté", description: "Contact ajouté à votre liste." })}
                  >
                    Ajouter à mes contacts
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl animate-in fade-in-up duration-500" style={{animationDelay: '200ms'}}>
              <CardHeader className="flex-row items-center gap-2 p-3">
                <MapPinIcon size={20} />
                <h3 className="font-headline font-bold text-sm">Local</h3>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <div className="aspect-square bg-muted rounded-lg mb-2 relative overflow-hidden">
                  <Image src="https://picsum.photos/seed/map-kinshasa/400/400" alt="Map" width={400} height={400} className="w-full h-full object-cover" />
                </div>
                <Button
                  className="w-full h-8 text-xs"
                  variant="outline"
                  onClick={() => toast({ title: "Recherche", description: "Recherche de couturiers près de vous..." })}
                >
                  Trouver un couturier <ArrowRight className="ml-1 h-3 w-3"/>
                </Button>
              </CardContent>
            </Card>
            
            <div className="space-y-4 animate-in fade-in-up duration-500" style={{animationDelay: '300ms'}}>
              <h2 className="font-headline text-lg font-bold flex items-center gap-2">
                <IdeaIcon size={24} /> Projets
              </h2>
              <div className="grid grid-cols-1 gap-4">
                <Card className="rounded-2xl">
                  <CardContent className="p-3">
                    <div className="aspect-video bg-muted rounded-lg mb-2 overflow-hidden relative">
                      <Image src="https://picsum.photos/seed/solar-project-1/400/300" alt="Four solaire" width={400} height={300} className="w-full h-full object-cover"/>
                    </div>
                    <p className="font-bold text-sm mb-2">Four solaire local</p>
                    <div className="flex justify-between items-center text-xs text-muted-foreground mb-3">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <Heart className="h-3 w-3 text-red-500 fill-current" /> 752
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageCircle className="h-3 w-3" /> 24
                        </div>
                      </div>
                      <span>Mukendi</span>
                    </div>
                    <Button
                      className="w-full h-9 bg-gradient-to-r from-primary to-green-800 text-white hover:from-primary/90 hover:to-green-800/90"
                      onClick={() => {
                        // Préparer les données de paiement pour le financement du projet
                        const paymentData = {
                          context: 'makutano',
                          description: 'Financement du projet: Four solaire local',
                          metadata: {
                            projectId: 'solar-project-1',
                            projectName: 'Four solaire local',
                            creator: 'Mukendi',
                            type: 'project_funding'
                          }
                        };
                        
                        // Stocker les données
                        sessionStorage.setItem('makutano_payment_data', JSON.stringify(paymentData));
                        
                        // Rediriger vers le paiement
                        window.location.href = '/dashboard/pay?context=makutano';
                      }}
                    >
                      Financer via eNkamba Pay
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
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

'use client';

import { useState, useMemo, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useConversations } from '@/hooks/useConversations';
import { useFirestoreContacts } from '@/hooks/useFirestoreContacts';
import { useAllTransactions } from '@/hooks/useAllTransactions';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useStories } from '@/hooks/useStories';
import { ChatContactsDialog } from '@/components/chat-contacts-dialog';
import { StartChatEmptyState } from '@/components/start-chat-empty-state';
import { StoriesOnboarding } from '@/components/stories/StoriesOnboarding';
import { StoryViewer } from '@/components/stories/StoryViewer';
import {
  MiyikiChatIcon,
  NewChatIcon,
  SearchIcon,
} from "@/components/icons/service-icons";
import {
  ChatDiscussionsIcon,
  ChatStoriesIcon,
  ChatTransactionsIcon,
  ChatSettingsIcon,
  ChatFilterAllIcon,
  ChatFilterUnreadIcon,
  ChatFilterReadIcon,
  ChatFilterGroupsIcon,
} from "@/components/icons/chat-icons";
import { MessageSquare, CheckCheck, Circle, Users, Plus, TrendingUp, Settings, Edit, Zap, MapPin, ShoppingBag, Video, Mic, Image as ImageIcon } from 'lucide-react';
import { CreateGroupDialog } from '@/components/create-group-dialog';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useRouter } from 'next/navigation';

type ChatTab = 'discussions' | 'stories' | 'transactions' | 'settings';
type MessageFilter = 'all' | 'unread' | 'read' | 'groups';

const messageFilters = [
  { value: 'all' as MessageFilter, label: "Tout", icon: ChatFilterAllIcon },
  { value: 'unread' as MessageFilter, label: "Non lu", icon: ChatFilterUnreadIcon },
  { value: 'read' as MessageFilter, label: "Lu", icon: ChatFilterReadIcon },
  { value: 'groups' as MessageFilter, label: "Groupes", icon: ChatFilterGroupsIcon },
  { value: 'add' as MessageFilter, label: "Plus", icon: Plus, isAction: true },
];

export default function MiyikiChatPage() {
  const router = useRouter();
  const {
    conversations,
    isLoading: conversationsLoading,
    hasConversations,
  } = useConversations();
  const { contacts, isLoading: contactsLoading } = useFirestoreContacts();
  const { transactions, loading: transactionsLoading } = useAllTransactions();
  const { profile } = useUserProfile();
  const { stories, myStories, loading: storiesLoading, markAsViewed, replyToStory } = useStories();

  const [activeTab, setActiveTab] = useState<ChatTab>('discussions');
  const [showChatContactsDialog, setShowChatContactsDialog] = useState(false);
  const [showCreateGroupDialog, setShowCreateGroupDialog] = useState(false);
  const [activeFilter, setActiveFilter] = useState<MessageFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showStoriesOnboarding, setShowStoriesOnboarding] = useState(false);
  const [viewingStories, setViewingStories] = useState<{ stories: any[]; index: number } | null>(null);
  const [showActionsMenu, setShowActionsMenu] = useState(false);

  // Vérifier si c'est la première visite aux stories
  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('stories_onboarding_seen');
    if (!hasSeenOnboarding && activeTab === 'stories') {
      setShowStoriesOnboarding(true);
      localStorage.setItem('stories_onboarding_seen', 'true');
    }
  }, [activeTab]);
  const profileDisplayName = profile?.fullName || profile?.name || 'User';
  const profileAvatar = profile?.profileImage || undefined;

  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('stories_onboarding_seen');
    if (!hasSeenOnboarding && activeTab === 'stories') {
      setShowStoriesOnboarding(true);
      localStorage.setItem('stories_onboarding_seen', 'true');
    }
  }, [activeTab]);

  // Afficher le dialog quand on clique sur "Commencer"
  const handleStartChat = () => {
    setShowChatContactsDialog(true);
  };

  // Ouvrir le dialog de création de groupe
  const handleCreateGroup = () => {
    setShowCreateGroupDialog(true);
  };

  // Helper pour trouver le nom du contact à partir du numéro de téléphone
  function getContactNameByPhone(phone: string | undefined): string | undefined {
    if (!phone) return undefined;
    const normalized = phone.replace(/\D/g, '').replace(/^0/, '+243');
    const found = contacts.find(
      c => c.phoneNumber.replace(/\D/g, '').replace(/^0/, '+243') === normalized
    );
    return found?.name;
  }

  // Filtrer les conversations selon le filtre actif et la recherche
  const filteredConversations = useMemo(() => {
    let filtered = [...conversations];

    // Appliquer le filtre de type
    switch (activeFilter) {
      case 'unread':
        filtered = filtered.filter(c => c.unread && c.unread > 0);
        break;
      case 'read':
        filtered = filtered.filter(c => !c.unread || c.unread === 0);
        break;
      case 'groups':
        filtered = filtered.filter(c => c.isGroup);
        break;
      case 'all':
      default:
        // Pas de filtre
        break;
    }

    // Appliquer la recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c => {
        const name = c.name?.toLowerCase() || '';
        const lastMessage = c.lastMessage?.toLowerCase() || '';
        return name.includes(query) || lastMessage.includes(query);
      });
    }

    return filtered;
  }, [conversations, activeFilter, searchQuery]);

  // Render functions for each tab
  const renderDiscussions = () => {
    if (conversationsLoading || contactsLoading) {
      return (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Chargement des conversations...</p>
        </div>
      );
    }

    if (!hasConversations) {
      return <StartChatEmptyState onStartChat={handleStartChat} />;
    }

    if (filteredConversations.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="mb-4">
            <MessageSquare size={48} className="mx-auto text-muted-foreground opacity-50" />
          </div>
          <p className="text-muted-foreground text-lg font-semibold mb-2">
            Aucune conversation trouvée
          </p>
          <p className="text-sm text-muted-foreground">
            {searchQuery ? 'Essayez une autre recherche' : 'Changez de filtre pour voir plus de conversations'}
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {filteredConversations.map((convo, i) => {
          let displayName = convo.name;
          
          if (!convo.isGroup && convo.participants && convo.participants.length === 2) {
            const otherIdx = convo.participants.findIndex(
              id => id !== undefined && id !== '' && id !== (typeof window !== 'undefined' ? window.localStorage.getItem('uid') : undefined)
            );
            const phone = convo.participantNames?.[otherIdx];
            const contactName = getContactNameByPhone(phone);
            if (contactName) displayName = contactName;
          }
          
          return (
            <Link href={convo.href || `/dashboard/miyiki-chat/${convo.id}`} key={convo.id} className="block">
              <Card className="p-4 rounded-2xl transition-all duration-300 hover:shadow-lg hover:scale-[1.01]">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="h-14 w-14 border-2 border-primary/10">
                      <AvatarImage src={convo.avatar || undefined} alt={displayName} />
                      <AvatarFallback className="bg-primary/10 text-primary font-bold">{displayName?.charAt(0) || '?'}</AvatarFallback>
                    </Avatar>
                    {convo.isGroup && (
                      <div className="absolute -bottom-1 -right-1 bg-primary rounded-full p-1">
                        <Users size={12} className="text-white" />
                      </div>
                    )}
                    <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-background"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-bold text-foreground truncate">{displayName}</p>
                      {convo.isGroup && (
                        <Badge variant="outline" className="text-xs">Groupe</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{convo.lastMessage}</p>
                  </div>
                  <div className="text-right flex flex-col items-end gap-2">
                    <p className="text-xs text-muted-foreground whitespace-nowrap">{convo.time}</p>
                    {!!convo.unread && convo.unread > 0 ? (
                      <Badge className="bg-red-500 text-white rounded-full h-6 min-w-[24px] px-2 flex items-center justify-center text-xs">
                        {convo.unread}
                      </Badge>
                    ) : (
                      <div className="flex items-center gap-1 text-xs text-green-600">
                        <CheckCheck size={14} />
                        <span className="font-medium">Lu</span>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    );
  };

  const renderStories = () => {
    const handleCreateStory = () => {
      router.push('/dashboard/miyiki-chat/stories/create');
    };

    const handleViewStories = (contactStories: any, index: number = 0) => {
      setViewingStories({ stories: contactStories.stories, index });
    };

    if (storiesLoading) {
      return (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Chargement des stories...</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* Ma Story */}
        <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {/* Ma Story - Cliquer pour voir ou créer */}
          {myStories.length > 0 ? (
            <button
              onClick={() => setViewingStories({ stories: myStories, index: 0 })}
              className="flex-shrink-0 flex flex-col items-center gap-2"
            >
              <div className="relative">
                <div className="p-0.5 rounded-full bg-gradient-to-tr from-purple-500 via-pink-500 to-red-500">
                  <Avatar className="h-16 w-16 border-2 border-background">
                    <AvatarImage src={profile?.photoURL || profile?.profileImage} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {profile?.displayName?.charAt(0) || profile?.fullName?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="absolute -bottom-1 -right-1 bg-primary rounded-full p-1">
                  <Plus size={16} className="text-white" onClick={(e) => {
                    e.stopPropagation();
                    handleCreateStory();
                  }} />
                </div>
              </div>
              <span className="text-xs font-medium">Ma Story</span>
            </button>
          ) : (
            <button
              onClick={handleCreateStory}
              className="flex-shrink-0 flex flex-col items-center gap-2"
            >
              <div className="relative">
                <Avatar className="h-16 w-16 border-2 border-dashed border-primary">
                  <AvatarImage src={profile?.photoURL || profile?.profileImage} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {profile?.displayName?.charAt(0) || profile?.fullName?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 bg-primary rounded-full p-1">
                  <Plus size={16} className="text-white" />
                </div>
              </div>
              <span className="text-xs font-medium">Ma Story</span>
            </button>
          )}

          {/* Stories des contacts */}
          {stories.map((contactStory) => (
            <button
              key={contactStory.userId}
              onClick={() => handleViewStories(contactStory)}
              className="flex-shrink-0 flex flex-col items-center gap-2"
            >
              <div className="relative">
                <div className={`p-0.5 rounded-full ${contactStory.hasUnviewed ? 'bg-gradient-to-tr from-purple-500 via-pink-500 to-red-500' : 'bg-muted'}`}>
                  <Avatar className="h-16 w-16 border-2 border-background">
                    <AvatarImage src={contactStory.userAvatar} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {contactStory.userName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </div>
              <span className="text-xs font-medium max-w-[70px] truncate">
                {contactStory.userName}
              </span>
            </button>
          ))}
        </div>

        {/* Mes Stories publiées */}
        {myStories.length > 0 && (
          <Card className="p-4 rounded-2xl">
            <h3 className="font-bold mb-3">Mes Stories ({myStories.length})</h3>
            <div className="space-y-2">
              {myStories.map((story) => (
                <div key={story.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted/50">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    {story.type === 'photo' && <ImageIcon size={20} className="text-white" />}
                    {story.type === 'video' && <Video size={20} className="text-white" />}
                    {story.type === 'audio' && <Mic size={20} className="text-white" />}
                    {story.type === 'location' && <MapPin size={20} className="text-white" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{story.caption || 'Story sans légende'}</p>
                    <p className="text-xs text-muted-foreground">
                      {story.views.length} vue{story.views.length > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {stories.length === 0 && myStories.length === 0 && (
          <div className="text-center py-12">
            <Zap size={64} className="mx-auto text-primary mb-4" />
            <h3 className="text-xl font-bold mb-2">Aucune story</h3>
            <p className="text-muted-foreground mb-6">Soyez le premier à partager un moment</p>
            <Button onClick={handleCreateStory} className="rounded-full">
              <Plus size={20} className="mr-2" />
              Créer une story
            </Button>
          </div>
        )}
      </div>
    );
  };

  const renderTransactions = () => {
    if (transactionsLoading) {
      return (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Chargement des transactions...</p>
        </div>
      );
    }

    if (transactions.length === 0) {
      return (
        <div className="text-center py-12">
          <TrendingUp size={64} className="mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-bold mb-2">Aucune transaction</h3>
          <p className="text-muted-foreground">Vos transactions de paiement apparaîtront ici</p>
        </div>
      );
    }

    const getTransactionIcon = (type: string) => {
      switch (type) {
        case 'transfer_sent':
        case 'transfer_received':
          return <TrendingUp size={20} />;
        case 'deposit':
          return <Plus size={20} />;
        case 'withdrawal':
          return <TrendingUp size={20} className="rotate-180" />;
        case 'payment_link':
        case 'contact_payment':
          return <ShoppingBag size={20} />;
        default:
          return <TrendingUp size={20} />;
      }
    };

    const getTransactionLabel = (type: string) => {
      switch (type) {
        case 'transfer_sent': return 'Transfert envoyé';
        case 'transfer_received': return 'Transfert reçu';
        case 'deposit': return 'Dépôt';
        case 'withdrawal': return 'Retrait';
        case 'payment_link': return 'Paiement par lien';
        case 'contact_payment': return 'Paiement contact';
        case 'money_request_sent': return 'Demande envoyée';
        case 'money_request_received': return 'Demande reçue';
        default: return type;
      }
    };

    return (
      <div className="space-y-2">
        {transactions.map((tx, i) => {
          const isReceived = tx.type === 'transfer_received' || tx.type === 'deposit' || tx.type === 'money_request_received';
          const displayName = isReceived ? tx.senderName : tx.recipientName;
          
          return (
            <Card key={tx.id} className="p-4 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                    isReceived ? 'bg-green-100 text-green-600' : 'bg-primary/10 text-primary'
                  }`}>
                    {getTransactionIcon(tx.type)}
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-primary rounded-full p-1">
                    <span className="text-[8px] text-white font-bold">eNk</span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-bold text-foreground">eNkamba-Pay</p>
                    <Badge variant={tx.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                      {tx.status === 'completed' ? 'Confirmé' : tx.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {getTransactionLabel(tx.type)} {displayName && `• ${displayName}`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Transaction #{tx.id.slice(0, 8)}
                  </p>
                </div>
                <div className="text-right flex flex-col items-end gap-1">
                  <p className={`font-bold ${isReceived ? 'text-green-600' : 'text-foreground'}`}>
                    {isReceived ? '+' : '-'} {tx.amount.toLocaleString()} {tx.currency || 'CDF'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {tx.timestamp?.toDate ? formatDistanceToNow(tx.timestamp.toDate(), { addSuffix: true, locale: fr }) : tx.createdAt}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    );
  };

  const renderSettings = () => {
    return (
      <div className="space-y-4">
        <Card className="p-4 rounded-2xl">
          <h3 className="font-bold text-lg mb-4">Paramètres du chat</h3>
          <div className="space-y-3">
            <Button variant="ghost" className="w-full justify-start">
              <Edit size={20} className="mr-3" />
              Modifier le profil
            </Button>
            <Button variant="ghost" className="w-full justify-start">
              <Users size={20} className="mr-3" />
              Gérer les groupes
            </Button>
            <Button variant="ghost" className="w-full justify-start">
              <MapPin size={20} className="mr-3" />
              Partage de localisation
            </Button>
          </div>
        </Card>
        
        <Card className="p-4 rounded-2xl">
          <h3 className="font-bold text-lg mb-4">Confidentialité</h3>
          <div className="space-y-3">
            <Button variant="ghost" className="w-full justify-start">
              Statut en ligne
            </Button>
            <Button variant="ghost" className="w-full justify-start">
              Confirmation de lecture
            </Button>
          </div>
        </Card>
      </div>
    );
  };

  return (
    <div className="flex h-screen flex-col bg-background text-foreground animate-in fade-in duration-500">
      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
      
      {/* Header */}
      <header className="sticky top-0 z-10 flex h-16 items-center justify-between bg-gradient-to-r from-primary via-primary to-green-800 px-4 shadow-lg">
        <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              <MiyikiChatIcon size={28} className="text-white" />
            </div>
            <div>
              <h1 className="font-headline text-xl font-bold text-white">Miyiki-Chat</h1>
              <p className="text-xs text-white/70">Communication intelligente</p>
            </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Avatar className="h-10 w-10 border-2 border-white/30 shadow-lg cursor-pointer hover:scale-105 transition-transform">
              <AvatarImage src={profileAvatar} alt={profileDisplayName} />
              <AvatarFallback className="bg-white/20 text-white font-bold">
                {profileDisplayName.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            {/* Indicateur de connexion */}
            <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-white"></div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-32">
        <div className="container mx-auto max-w-4xl p-4 space-y-4">
          {/* Chat Navigation Tabs - Modern Design */}
          <div className="sticky top-0 z-40 -mx-4 px-4 pt-2 pb-3 bg-background/95 backdrop-blur-lg border-b border-border/50">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
              <button
                onClick={() => setActiveTab('discussions')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full font-medium text-sm transition-all whitespace-nowrap ${
                  activeTab === 'discussions'
                    ? 'bg-primary text-white shadow-lg shadow-primary/30'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                }`}
              >
                <ChatDiscussionsIcon size={20} />
                <span>Discussions</span>
                {conversations.filter(c => c.unread && c.unread > 0).length > 0 && (
                  <Badge className="bg-red-500 text-white rounded-full h-5 min-w-[20px] px-1.5 text-xs">
                    {conversations.filter(c => c.unread && c.unread > 0).length}
                  </Badge>
                )}
              </button>
              
              <button
                onClick={() => setActiveTab('stories')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full font-medium text-sm transition-all whitespace-nowrap ${
                  activeTab === 'stories'
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                }`}
              >
                <ChatStoriesIcon size={20} />
                <span>Stories</span>
              </button>
              
              <button
                onClick={() => setActiveTab('transactions')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full font-medium text-sm transition-all whitespace-nowrap ${
                  activeTab === 'transactions'
                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg shadow-green-600/30'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                }`}
              >
                <ChatTransactionsIcon size={20} />
                <span>Transactions</span>
                {transactions.length > 0 && (
                  <Badge className="bg-white/20 text-white rounded-full h-5 min-w-[20px] px-1.5 text-xs">
                    {transactions.length > 9 ? '9+' : transactions.length}
                  </Badge>
                )}
              </button>
              
              <button
                onClick={() => setActiveTab('settings')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full font-medium text-sm transition-all whitespace-nowrap ${
                  activeTab === 'settings'
                    ? 'bg-gradient-to-r from-slate-700 to-slate-900 text-white shadow-lg shadow-slate-700/30'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                }`}
              >
                <ChatSettingsIcon size={20} />
                <span>Paramètres</span>
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2">
              <SearchIcon size={20} className="text-muted-foreground" />
            </div>
            <Input
              placeholder={activeTab === 'discussions' ? "Rechercher message ou contact..." : activeTab === 'transactions' ? "Rechercher une transaction..." : "Rechercher..."}
              className="h-12 w-full rounded-full bg-muted/50 pl-14 text-base shadow-inner border-0 focus-visible:ring-2 focus-visible:ring-primary/20"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Message Filters - Only for discussions tab */}
          {activeTab === 'discussions' && (
            <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
              {messageFilters.map((filter) => {
                const IconComponent = filter.icon;
                const isActive = activeFilter === filter.value;
                const unreadCount = filter.value === 'unread' 
                  ? conversations.filter(c => c.unread && c.unread > 0).length 
                  : 0;
                
                // Bouton "Plus" pour actions
                if ((filter as any).isAction) {
                  return (
                    <Button 
                      key={filter.value}
                      variant="ghost"
                      size="sm"
                      className="flex-shrink-0 rounded-full h-9 px-3 space-x-2 border border-primary/30 bg-primary/5 text-primary hover:bg-primary/10"
                      onClick={() => setShowActionsMenu(true)}
                    >
                      <IconComponent size={16} />
                      <span className="font-medium text-xs">{filter.label}</span>
                    </Button>
                  );
                }
                
                return (
                  <Button 
                    key={filter.value} 
                    variant={isActive ? "secondary" : "ghost"} 
                    size="sm"
                    className={`flex-shrink-0 rounded-full h-9 px-3 space-x-2 border-transparent ${
                      isActive 
                        ? 'bg-primary/10 text-primary border border-primary/20' 
                        : 'text-muted-foreground hover:bg-muted/50'
                    }`}
                    onClick={() => setActiveFilter(filter.value)}
                  >
                    <IconComponent size={16} />
                    <span className="font-medium text-xs">{filter.label}</span>
                    {filter.value === 'unread' && unreadCount > 0 && (
                      <Badge className="bg-red-500 text-white rounded-full h-4 w-4 flex items-center justify-center text-[10px] p-0">
                        {unreadCount}
                      </Badge>
                    )}
                  </Button>
                );
              })}
            </div>
          )}

          {/* Content based on active tab */}
          {activeTab === 'discussions' && renderDiscussions()}
          {activeTab === 'stories' && renderStories()}
          {activeTab === 'transactions' && renderTransactions()}
          {activeTab === 'settings' && renderSettings()}
        </div>
      </main>

      {/* Chat Contacts Dialog */}
      <ChatContactsDialog
        open={showChatContactsDialog}
        onOpenChange={setShowChatContactsDialog}
      />

      {/* Create Group Dialog */}
      <CreateGroupDialog
        open={showCreateGroupDialog}
        onOpenChange={setShowCreateGroupDialog}
      />

      {/* Stories Onboarding */}
      {showStoriesOnboarding && (
        <StoriesOnboarding onClose={() => setShowStoriesOnboarding(false)} />
      )}

      {/* Story Viewer */}
      {viewingStories && (
        <StoryViewer
          stories={viewingStories.stories}
          initialIndex={viewingStories.index}
          onClose={() => setViewingStories(null)}
          onMarkViewed={markAsViewed}
          onReply={async (storyId, message) => {
            // Trouver la conversation avec l'auteur de la story
            const story = viewingStories.stories.find(s => s.id === storyId);
            if (story) {
              const conversation = conversations.find(c => 
                c.participants?.includes(story.userId)
              );
              await replyToStory(storyId, message, conversation?.id);
            }
          }}
        />
      )}

      {/* Actions Menu Dialog */}
      <Dialog open={showActionsMenu} onOpenChange={setShowActionsMenu}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Actions rapides</DialogTitle>
            <DialogDescription>
              Choisissez une action pour commencer
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 py-4">
            <button
              onClick={() => {
                setShowActionsMenu(false);
                handleCreateGroup();
              }}
              className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-primary/5 transition-all border-2 border-transparent hover:border-primary/20"
            >
              <div className="h-14 w-14 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg">
                <Users size={24} className="text-white" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-bold text-base">Créer un groupe</p>
                <p className="text-sm text-muted-foreground">Nouvelle conversation de groupe</p>
              </div>
            </button>
            
            <button
              onClick={() => {
                setShowActionsMenu(false);
                handleStartChat();
              }}
              className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-green-500/5 transition-all border-2 border-transparent hover:border-green-500/20"
            >
              <div className="h-14 w-14 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg">
                <NewChatIcon size={24} className="text-white" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-bold text-base">Ajouter un contact</p>
                <p className="text-sm text-muted-foreground">Démarrer une conversation</p>
              </div>
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

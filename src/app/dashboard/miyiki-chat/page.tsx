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
import { useUserProfile } from '@/hooks/useUserProfile';
import { useStories } from '@/hooks/useStories';
import { useChatSettings } from '@/hooks/useChatSettings';
import { useNotifications, type Notification } from '@/hooks/useNotifications';
import { ChatContactsDialog } from '@/components/chat-contacts-dialog';
import { StartChatEmptyState } from '@/components/start-chat-empty-state';
import { StoriesOnboarding } from '@/components/stories/StoriesOnboarding';
import { StoryViewer } from '@/components/stories/StoryViewer';
import { LocationSharingDialog } from '@/components/chat/LocationSharingDialog';
import {
  MiyikiChatIcon,
  NewChatIcon,
  SearchIcon,
} from "@/components/icons/service-icons";
import {
  ChatDiscussionsIcon,
  ChatStoriesIcon,
  ChatSettingsIcon,
  ChatFilterAllIcon,
  ChatFilterUnreadIcon,
  ChatFilterReadIcon,
  ChatFilterGroupsIcon,
  ChatCallIcon,
  ChatEditIcon,
  ChatEmptyIcon,
  ChatEyeIcon,
  ChatEyeOffIcon,
  ChatGroupCustomIcon,
  ChatLastSeenIcon,
  ChatLocationCustomIcon,
  ChatMicCustomIcon,
  ChatNotificationIcon,
  ChatPhotoIcon,
  ChatPlusIcon,
  ChatReadIcon,
  ChatSentIcon,
  ChatVideoCustomIcon,
} from "@/components/icons/chat-icons";
import { Settings } from 'lucide-react';
import { CreateGroupDialog } from '@/components/create-group-dialog';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useRouter } from 'next/navigation';

type ChatTab = 'discussions' | 'stories' | 'notifications' | 'settings';
type MessageFilter = 'all' | 'unread' | 'read' | 'groups';

const messageFilters = [
  { value: 'all' as MessageFilter, label: "Tout", icon: ChatFilterAllIcon },
  { value: 'unread' as MessageFilter, label: "Non lu", icon: ChatFilterUnreadIcon },
  { value: 'read' as MessageFilter, label: "Lu", icon: ChatFilterReadIcon },
  { value: 'groups' as MessageFilter, label: "Groupes", icon: ChatFilterGroupsIcon },
  { value: 'add' as MessageFilter, label: "Plus", icon: ChatPlusIcon, isAction: true },
];

export default function MiyikiChatPage() {
  const router = useRouter();
  const {
    conversations,
    isLoading: conversationsLoading,
    hasConversations,
  } = useConversations();
  const { contacts, isLoading: contactsLoading } = useFirestoreContacts();
  const { allNotifications, unreadCount, isLoading: notificationsLoading, markAsRead, acknowledgeNotification } = useNotifications();
  const { profile } = useUserProfile();
  const { stories, myStories, loading: storiesLoading, markAsViewed, replyToStory } = useStories();
  const { settings, loading: settingsLoading, updateSetting } = useChatSettings();

  const [activeTab, setActiveTab] = useState<ChatTab>('discussions');
  const [showChatContactsDialog, setShowChatContactsDialog] = useState(false);
  const [showCreateGroupDialog, setShowCreateGroupDialog] = useState(false);
  const [activeFilter, setActiveFilter] = useState<MessageFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showStoriesOnboarding, setShowStoriesOnboarding] = useState(false);
  const [viewingStories, setViewingStories] = useState<{ stories: any[]; index: number } | null>(null);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [showLocationDialog, setShowLocationDialog] = useState(false);

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
            <ChatEmptyIcon size={56} className="mx-auto opacity-80" />
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
                        <ChatGroupCustomIcon size={14} />
                      </div>
                    )}
                    {convo.otherOnlineStatusVisible && convo.otherIsOnline && (
                      <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-background"></div>
                    )}
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
                      (() => {
                        const currentUid = profile?.uid || (typeof window !== 'undefined' ? window.localStorage.getItem('uid') : null);
                        const sentByMe = Boolean(currentUid && convo.lastMessageSenderId === currentUid);
                        if (!sentByMe) return null;
                        return convo.lastMessageReadByOther ? (
                          <div className="flex items-center gap-1 text-xs text-green-600">
                            <ChatReadIcon size={15} />
                            <span className="font-medium">Lu</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <ChatSentIcon size={15} />
                            <span className="font-medium">Envoyé</span>
                          </div>
                        );
                      })()
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
            <div className="flex-shrink-0 flex flex-col items-center gap-2">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setViewingStories({ stories: myStories, index: 0 })}
                  className="p-0.5 rounded-full bg-gradient-to-tr from-purple-500 via-pink-500 to-red-500"
                  aria-label="Voir ma story"
                >
                  <Avatar className="h-16 w-16 border-2 border-background">
                    <AvatarImage src={profile?.photoURL || profile?.profileImage} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {profile?.displayName?.charAt(0) || profile?.fullName?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </button>
                <button
                  type="button"
                  onClick={handleCreateStory}
                  className="absolute -bottom-1 -right-1 bg-primary rounded-full p-1"
                  aria-label="Ajouter une story"
                >
                  <ChatPlusIcon size={18} />
                </button>
              </div>
              <span className="text-xs font-medium">Ma Story</span>
            </div>
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
                  <ChatPlusIcon size={18} />
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
              {myStories.map((story, storyIndex) => (
                <button
                  key={story.id}
                  onClick={() => setViewingStories({ stories: myStories, index: storyIndex })}
                  className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-muted/50 transition-all cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    {story.type === 'photo' && <ChatPhotoIcon size={24} />}
                    {story.type === 'video' && <ChatVideoCustomIcon size={24} />}
                    {story.type === 'audio' && <ChatMicCustomIcon size={24} />}
                    {story.type === 'location' && <ChatLocationCustomIcon size={24} />}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium">{story.caption || 'Story sans légende'}</p>
                    <p className="text-xs text-muted-foreground">
                      {story.views.length} vue{story.views.length > 1 ? 's' : ''}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </Card>
        )}

        {stories.length === 0 && myStories.length === 0 && (
          <div className="text-center py-12">
            <ChatStoriesIcon size={72} className="mx-auto mb-4 text-primary" />
            <h3 className="text-xl font-bold mb-2">Aucune story</h3>
            <p className="text-muted-foreground mb-6">Soyez le premier à partager un moment</p>
            <Button onClick={handleCreateStory} className="rounded-full">
              <ChatPlusIcon size={22} className="mr-2" />
              Créer une story
            </Button>
          </div>
        )}
      </div>
    );
  };

  const renderNotifications = () => {
    const filteredNotifications = searchQuery.trim()
      ? allNotifications.filter((notification) => {
          const query = searchQuery.toLowerCase();
          return (
            notification.title?.toLowerCase().includes(query) ||
            notification.message?.toLowerCase().includes(query) ||
            notification.senderName?.toLowerCase().includes(query)
          );
        })
      : allNotifications;

    const formatNotificationDate = (notification: Notification) => {
      const date =
        notification.timestamp?.toDate?.() ||
        (typeof notification.createdAt === 'string'
          ? new Date(notification.createdAt)
          : notification.createdAt?.toDate?.());

      if (!date || Number.isNaN(date.getTime())) return '';
      return formatDistanceToNow(date, { addSuffix: true, locale: fr });
    };

    const getNotificationIcon = (type: string) => {
      switch (type) {
        case 'transfer_received':
        case 'BUSINESS_APPROVED':
          return <ChatReadIcon size={24} />;
        case 'incoming_call':
          return <ChatCallIcon size={24} />;
        case 'payment_request':
          return <ChatNotificationIcon size={24} />;
        default:
          return <ChatNotificationIcon size={24} />;
      }
    };

    if (notificationsLoading) {
      return (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Chargement des notifications...</p>
        </div>
      );
    }

    if (filteredNotifications.length === 0) {
      return (
        <div className="text-center py-12">
          <ChatNotificationIcon size={72} className="mx-auto mb-4 opacity-80" />
          <h3 className="text-xl font-bold mb-2">Aucune notification</h3>
          <p className="text-muted-foreground">Les notifications de l’application apparaîtront ici</p>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {filteredNotifications.map((notification) => {
          return (
            <Card
              key={notification.id}
              className={`p-4 rounded-2xl transition-shadow ${notification.read ? 'bg-card' : 'bg-primary/5 border-primary/20'}`}
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="h-12 w-12 rounded-full flex items-center justify-center bg-primary/10 text-primary">
                    {getNotificationIcon(notification.type)}
                  </div>
                  {!notification.read && <div className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full bg-red-500 border-2 border-background" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-bold text-foreground truncate">{notification.title || 'Notification'}</p>
                    {!notification.read && <Badge className="text-xs">Nouveau</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {notification.message || notification.senderName || 'Notification eNkamba'}
                  </p>
                  {notification.amount && (
                    <p className="text-xs font-semibold text-primary mt-1">
                      {notification.amount.toLocaleString('fr-FR')} {notification.currency || 'CDF'}
                    </p>
                  )}
                </div>
                <div className="text-right flex flex-col items-end gap-2">
                  <p className="text-xs text-muted-foreground whitespace-nowrap">{formatNotificationDate(notification)}</p>
                  {notification.type === 'transfer_received' && !notification.acknowledged ? (
                    <Button size="sm" className="h-8 rounded-full" onClick={() => acknowledgeNotification(notification.id)}>
                      Confirmer
                    </Button>
                  ) : !notification.read ? (
                    <Button size="sm" variant="outline" className="h-8 rounded-full" onClick={() => markAsRead(notification.id)}>
                      Marquer lu
                    </Button>
                  ) : null}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    );
  };

  const renderSettings = () => {
    const handleLocationShare = (location: { latitude: number; longitude: number; address?: string }) => {
      console.log('Location shared:', location);
      // TODO: Envoyer la localisation dans une conversation
      alert(`Position partagée: ${location.latitude}, ${location.longitude}`);
    };

    return (
      <div className="space-y-4">
        <Card className="p-4 rounded-2xl">
          <h3 className="font-bold text-lg mb-4">Paramètres du chat</h3>
          <div className="space-y-3">
            <Button 
              variant="ghost" 
              className="w-full justify-start"
              onClick={() => router.push('/dashboard/settings/edit-profile')}
            >
              <ChatEditIcon size={22} className="mr-3" />
              Modifier le profil
            </Button>
            <Button 
              variant="ghost" 
              className="w-full justify-start"
              onClick={() => handleCreateGroup()}
            >
              <ChatGroupCustomIcon size={22} className="mr-3" />
              Gérer les groupes
            </Button>
            <Button 
              variant="ghost" 
              className="w-full justify-start"
              onClick={() => setShowLocationDialog(true)}
            >
              <ChatLocationCustomIcon size={22} className="mr-3" />
              Partager ma localisation
            </Button>
          </div>
        </Card>
        
        <Card className="p-4 rounded-2xl">
          <h3 className="font-bold text-lg mb-4">Confidentialité</h3>
          <div className="space-y-4">
            {/* Statut en ligne */}
            <div className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                  settings.onlineStatus ? 'bg-green-100 text-green-600' : 'bg-muted text-muted-foreground'
                }`}>
                  {settings.onlineStatus ? <ChatEyeIcon size={22} /> : <ChatEyeOffIcon size={22} />}
                </div>
                <div>
                  <p className="font-medium">Statut en ligne</p>
                  <p className="text-xs text-muted-foreground">
                    {settings.onlineStatus ? 'Visible par tous' : 'Masqué'}
                  </p>
                </div>
              </div>
              <Button
                variant={settings.onlineStatus ? "default" : "outline"}
                size="sm"
                onClick={() => updateSetting('onlineStatus', !settings.onlineStatus)}
                disabled={settingsLoading}
                className="rounded-full"
              >
                {settings.onlineStatus ? 'Activé' : 'Désactivé'}
              </Button>
            </div>

            {/* Confirmation de lecture */}
            <div className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                  settings.readReceipts ? 'bg-blue-100 text-blue-600' : 'bg-muted text-muted-foreground'
                }`}>
                  <ChatReadIcon size={22} />
                </div>
                <div>
                  <p className="font-medium">Confirmation de lecture</p>
                  <p className="text-xs text-muted-foreground">
                    {settings.readReceipts ? 'Les autres voient quand vous lisez' : 'Masqué'}
                  </p>
                </div>
              </div>
              <Button
                variant={settings.readReceipts ? "default" : "outline"}
                size="sm"
                onClick={() => updateSetting('readReceipts', !settings.readReceipts)}
                disabled={settingsLoading}
                className="rounded-full"
              >
                {settings.readReceipts ? 'Activé' : 'Désactivé'}
              </Button>
            </div>

            {/* Dernière connexion */}
            <div className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                  settings.lastSeen ? 'bg-purple-100 text-purple-600' : 'bg-muted text-muted-foreground'
                }`}>
                  <ChatLastSeenIcon size={22} />
                </div>
                <div>
                  <p className="font-medium">Dernière connexion</p>
                  <p className="text-xs text-muted-foreground">
                    {settings.lastSeen ? 'Visible par tous' : 'Masqué'}
                  </p>
                </div>
              </div>
              <Button
                variant={settings.lastSeen ? "default" : "outline"}
                size="sm"
                onClick={() => updateSetting('lastSeen', !settings.lastSeen)}
                disabled={settingsLoading}
                className="rounded-full"
              >
                {settings.lastSeen ? 'Activé' : 'Désactivé'}
              </Button>
            </div>

            {/* Partage de localisation */}
            <div className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                  settings.locationSharing ? 'bg-red-100 text-red-600' : 'bg-muted text-muted-foreground'
                }`}>
                  <ChatLocationCustomIcon size={22} />
                </div>
                <div>
                  <p className="font-medium">Partage de localisation</p>
                  <p className="text-xs text-muted-foreground">
                    {settings.locationSharing ? 'Activé en temps réel' : 'Désactivé'}
                  </p>
                </div>
              </div>
              <Button
                variant={settings.locationSharing ? "default" : "outline"}
                size="sm"
                onClick={() => updateSetting('locationSharing', !settings.locationSharing)}
                disabled={settingsLoading}
                className="rounded-full"
              >
                {settings.locationSharing ? 'Activé' : 'Désactivé'}
              </Button>
            </div>
          </div>
        </Card>

        <Card className="p-4 rounded-2xl bg-muted/30">
          <p className="text-sm text-muted-foreground text-center">
            💡 Ces paramètres affectent la façon dont les autres vous voient dans le chat
          </p>
        </Card>

        {/* Location Sharing Dialog */}
        <LocationSharingDialog
          open={showLocationDialog}
          onOpenChange={setShowLocationDialog}
          onShareLocation={handleLocationShare}
        />
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
              <h1 className="font-headline text-xl font-bold text-white">eChat</h1>
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
                onClick={() => setActiveTab('notifications')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full font-medium text-sm transition-all whitespace-nowrap ${
                  activeTab === 'notifications'
                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg shadow-green-600/30'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                }`}
              >
                <ChatNotificationIcon size={22} />
                <span>Notifications</span>
                {unreadCount > 0 && (
                  <Badge className="bg-white/20 text-white rounded-full h-5 min-w-[20px] px-1.5 text-xs">
                    {unreadCount > 9 ? '9+' : unreadCount}
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
              placeholder={activeTab === 'discussions' ? "Rechercher message ou contact..." : activeTab === 'notifications' ? "Rechercher une notification..." : "Rechercher..."}
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
          {activeTab === 'notifications' && renderNotifications()}
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
            // Trouver la story pour obtenir les infos du propriétaire
            const story = viewingStories.stories.find(s => s.id === storyId);
            if (story) {
              await replyToStory(
                storyId, 
                message, 
                story.userId, 
                story.userName,
                story.mediaUrl,
                story.type
              );
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
                <ChatGroupCustomIcon size={26} />
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

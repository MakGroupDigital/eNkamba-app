'use client';

import { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { useConversations } from '@/hooks/useConversations';
import { useFirestoreContacts } from '@/hooks/useFirestoreContacts';
import { ChatContactsDialog } from '@/components/chat-contacts-dialog';
import { StartChatEmptyState } from '@/components/start-chat-empty-state';
import {
  MiyikiChatIcon,
  NewChatIcon,
  SearchIcon,
} from "@/components/icons/service-icons";
import { MessageSquare, CheckCheck, Circle, Users, Plus } from 'lucide-react';
import { CreateGroupDialog } from '@/components/create-group-dialog';

type MessageFilter = 'all' | 'unread' | 'read' | 'groups';

const messageFilters = [
  { value: 'all' as MessageFilter, label: "Tout", icon: MessageSquare },
  { value: 'unread' as MessageFilter, label: "Non lu", icon: Circle },
  { value: 'read' as MessageFilter, label: "Lu", icon: CheckCheck },
  { value: 'groups' as MessageFilter, label: "Groupes", icon: Users },
];

export default function MiyikiChatPage() {
  const {
    conversations,
    isLoading: conversationsLoading,
    hasConversations,
  } = useConversations();
  const { contacts, isLoading: contactsLoading } = useFirestoreContacts();

  const [showChatContactsDialog, setShowChatContactsDialog] = useState(false);
  const [showCreateGroupDialog, setShowCreateGroupDialog] = useState(false);
  const [activeFilter, setActiveFilter] = useState<MessageFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

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

  return (
    <div className="flex h-screen flex-col bg-background text-foreground animate-in fade-in duration-500">
      {/* Header */}
      <header className="sticky top-0 z-10 flex h-16 items-center justify-between bg-gradient-to-r from-primary via-primary to-green-800 px-4 shadow-lg">
        <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              <MiyikiChatIcon size={28} className="text-white" />
            </div>
            <div>
              <h1 className="font-headline text-xl font-bold text-white">Miyiki-Chat</h1>
              <p className="text-xs text-white/70">Messagerie unifiée</p>
            </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            size="icon" 
            className="rounded-full bg-white/20 text-white hover:bg-white/30 w-10 h-10 shadow-lg"
            onClick={handleCreateGroup}
            title="Créer un groupe"
          >
            <Users size={20} />
            <span className="sr-only">Créer un groupe</span>
          </Button>
          <Button 
            size="icon" 
            className="rounded-full bg-accent text-accent-foreground hover:bg-accent/90 w-12 h-12 shadow-lg"
            onClick={handleStartChat}
          >
            <NewChatIcon size={24} />
            <span className="sr-only">Nouvelle conversation</span>
          </Button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto max-w-4xl p-4 space-y-6">
          {/* Search Bar */}
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2">
              <SearchIcon size={20} className="text-muted-foreground" />
            </div>
            <Input
              placeholder="Rechercher une conversation..."
              className="h-12 w-full rounded-full bg-muted pl-14 text-base shadow-inner"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Message Filters */}
          <div>
            <div className="flex space-x-2 overflow-x-auto pb-2 -mx-4 px-4">
              {messageFilters.map((filter) => {
                const IconComponent = filter.icon;
                const isActive = activeFilter === filter.value;
                const unreadCount = filter.value === 'unread' 
                  ? conversations.filter(c => c.unread && c.unread > 0).length 
                  : 0;
                
                return (
                  <Button 
                    key={filter.value} 
                    variant={isActive ? "secondary" : "ghost"} 
                    className={`flex-shrink-0 rounded-full h-12 px-4 space-x-2 border-transparent ${
                      isActive 
                        ? 'bg-gradient-to-r from-primary to-green-800 text-white shadow-md' 
                        : 'text-muted-foreground hover:bg-muted'
                    }`}
                    onClick={() => setActiveFilter(filter.value)}
                  >
                    <div className={isActive ? "" : "opacity-70"}>
                      <IconComponent size={20} />
                    </div>
                    <span className="font-headline text-sm">{filter.label}</span>
                    {filter.value === 'unread' && unreadCount > 0 && (
                      <Badge className="bg-red-500 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs p-0">
                        {unreadCount}
                      </Badge>
                    )}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Afficher les conversations réelles ou l'état vide */}
          {conversationsLoading || contactsLoading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Chargement des conversations...</p>
            </div>
          ) : !hasConversations ? (
            <StartChatEmptyState onStartChat={handleStartChat} />
          ) : filteredConversations.length === 0 ? (
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
          ) : (
            // Liste des conversations filtrées
            <div className="space-y-2">
              {filteredConversations.map((convo, i) => {
                // Pour les conversations 1-1 UNIQUEMENT, on tente de récupérer le nom du contact
                let displayName = convo.name;
                
                // Ne faire cette logique QUE si ce n'est PAS un groupe
                if (!convo.isGroup && convo.participants && convo.participants.length === 2) {
                  // On cherche le numéro de téléphone de l'autre participant
                  const otherIdx = convo.participants.findIndex(
                    id => id !== undefined && id !== '' && id !== (typeof window !== 'undefined' ? window.localStorage.getItem('uid') : undefined)
                  );
                  // On tente de trouver le nom du contact par le champ participantNames (si c'est un numéro)
                  const phone = convo.participantNames?.[otherIdx];
                  const contactName = getContactNameByPhone(phone);
                  if (contactName) displayName = contactName;
                }
                // Pour les groupes, on garde simplement convo.name tel quel
                
                return (
                  <Link href={convo.href || `/dashboard/miyiki-chat/${convo.id}`} key={convo.id} className="block">
                    <Card
                      className="p-3 rounded-2xl transition-all duration-300 hover:shadow-lg hover:scale-[1.02] animate-in fade-in-up"
                      style={{ animationDelay: `${i * 100}ms` }}
                    >
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <Avatar className="h-12 w-12 border-2 border-primary/10">
                            <AvatarImage src={convo.avatar || undefined} alt={displayName} />
                            <AvatarFallback>{displayName?.charAt(0) || '?'}</AvatarFallback>
                          </Avatar>
                          {convo.isGroup && (
                            <div className="absolute -bottom-1 -right-1 bg-primary rounded-full p-1">
                              <Users size={12} className="text-white" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-headline font-bold text-foreground">{displayName}</p>
                            {convo.isGroup && (
                              <Badge variant="outline" className="text-xs">Groupe</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">{convo.lastMessage}</p>
                        </div>
                        <div className="text-right flex flex-col items-end h-full">
                          <p className="text-xs text-muted-foreground mb-1">{convo.time}</p>
                          {!!convo.unread && convo.unread > 0 && (
                            <Badge className="bg-accent text-accent-foreground rounded-full h-6 w-6 flex items-center justify-center">{convo.unread}</Badge>
                          )}
                        </div>
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
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
    </div>
  );
}

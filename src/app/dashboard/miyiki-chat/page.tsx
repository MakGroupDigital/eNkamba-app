'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { useConversations } from '@/hooks/useConversations';
import { ChatContactsDialog } from '@/components/chat-contacts-dialog';
import { StartChatEmptyState } from '@/components/start-chat-empty-state';
import {
  MiyikiChatIcon,
  PaymentNavIcon,
  NkampaIcon,
  UgaviIcon,
  MakutanoIcon,
  EnkambaAIIcon,
  NewChatIcon,
  SearchIcon,
} from "@/components/icons/service-icons";

const filters = [
  { label: "ChatMbongo", icon: PaymentNavIcon, href: "#", color: "from-primary to-green-800" },
  { label: "ChatNkampa", icon: NkampaIcon, href: "#", color: "from-primary to-green-800" },
  { label: "ChatUgavi", icon: UgaviIcon, href: "#", color: "from-primary to-green-800" },
  { label: "ChatMakutano", icon: MakutanoIcon, href: "#", color: "from-primary to-green-800" },
  { label: "ChatAI", icon: EnkambaAIIcon, href: "/dashboard/ai", color: "from-primary to-green-800" },
];

export default function MiyikiChatPage() {
  const {
    conversations,
    isLoading: conversationsLoading,
    hasConversations,
  } = useConversations();

  const [showChatContactsDialog, setShowChatContactsDialog] = useState(false);

  // Afficher le dialog quand on clique sur "Commencer"
  const handleStartChat = () => {
    setShowChatContactsDialog(true);
  };

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
        <Button 
          size="icon" 
          className="rounded-full bg-accent text-accent-foreground hover:bg-accent/90 w-12 h-12 shadow-lg"
          onClick={handleStartChat}
        >
          <NewChatIcon size={24} />
          <span className="sr-only">Nouvelle conversation</span>
        </Button>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto max-w-4xl p-4 space-y-6">
          {/* Search Bar */}
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2">
              <SearchIcon size={20} className="text-muted-foreground" />
            </div>
            <Input
              placeholder="Rechercher dans l'écosystème eNkamba..."
              className="h-12 w-full rounded-full bg-muted pl-14 text-base shadow-inner"
            />
          </div>

          {/* Ecosystem Filters */}
          <div>
            <div className="flex space-x-2 overflow-x-auto pb-2 -mx-4 px-4">
              {filters.map((filter, index) => {
                const IconComponent = filter.icon;
                return (
                  <Button 
                    key={filter.label} 
                    variant={index === 0 ? "secondary" : "ghost"} 
                    className={`flex-shrink-0 rounded-full h-12 px-4 space-x-2 border-transparent ${index === 0 ? 'bg-gradient-to-r ' + filter.color + ' text-white shadow-md' : 'text-muted-foreground hover:bg-muted'}`}
                    asChild
                  >
                    <Link href={filter.href ?? '#'} className="flex items-center gap-2">
                      <div className={index === 0 ? "" : "opacity-70"}>
                        <IconComponent size={22} />
                      </div>
                      <span className="font-headline text-sm">{filter.label}</span>
                    </Link>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Afficher les conversations réelles ou l'état vide */}
          {conversationsLoading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Chargement des conversations...</p>
            </div>
          ) : !hasConversations ? (
            <StartChatEmptyState onStartChat={handleStartChat} />
          ) : (
            /* Conversations List */
            <div className="space-y-2">
              {conversations.map((convo, i) => (
                <Link href={convo.href || `/dashboard/miyiki-chat/${convo.id}`} key={convo.id} className="block">
                   <Card 
                    className="p-3 rounded-2xl transition-all duration-300 hover:shadow-lg hover:scale-[1.02] animate-in fade-in-up"
                    style={{animationDelay: `${i * 100}ms`}}
                  >
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12 border-2 border-primary/10">
                        <AvatarImage src={convo.avatar} alt={convo.name} />
                        <AvatarFallback>{convo.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-headline font-bold text-foreground">{convo.name}</p>
                        <p className="text-sm text-muted-foreground truncate">{convo.lastMessage}</p>
                      </div>
                      <div className="text-right flex flex-col items-end h-full">
                         <p className="text-xs text-muted-foreground mb-1">{convo.time}</p>
                         {convo.unread && (
                           <Badge className="bg-accent text-accent-foreground rounded-full h-6 w-6 flex items-center justify-center">{convo.unread}</Badge>
                         )}
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Chat Contacts Dialog */}
      <ChatContactsDialog
        open={showChatContactsDialog}
        onOpenChange={setShowChatContactsDialog}
      />
    </div>
  );
}

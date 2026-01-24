'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useFirestoreAiChat } from '@/hooks/useFirestoreAiChat';
import { AINavIcon, SettingsPageIcon } from '@/components/icons/service-icons';
import { Plus, Trash2, Menu, X } from 'lucide-react';
import Link from 'next/link';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

export default function AiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { aiChats, createAiChat, deleteAiChat } = useFirestoreAiChat();
  const [isCreating, setIsCreating] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleCreateChat = async () => {
    setIsCreating(true);
    try {
      const chatId = await createAiChat('Nouveau chat');
      window.location.href = `/dashboard/ai/chat/${chatId}`;
    } catch (error) {
      console.error('Erreur création chat:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteChat = async (chatId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce chat ?')) {
      try {
        await deleteAiChat(chatId);
      } catch (error) {
        console.error('Erreur suppression chat:', error);
      }
    }
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex w-64 flex-col bg-muted/50 border-r">
        {/* Logo */}
        <div className="p-4 border-b">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <AINavIcon size={20} className="text-white" />
            </div>
            <h1 className="font-headline font-bold text-foreground">eNkamba.ai</h1>
          </div>
        </div>

        {/* New Chat Button */}
        <div className="p-4 border-b">
          <Button
            onClick={handleCreateChat}
            disabled={isCreating}
            className="w-full rounded-lg"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nouveau chat
          </Button>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {aiChats.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">
              Aucun chat
            </p>
          ) : (
            aiChats.map((chat) => (
              <Link
                key={chat.id}
                href={`/dashboard/ai/chat/${chat.id}`}
                className="block group"
              >
                <div className="p-3 rounded-lg hover:bg-muted transition-colors">
                  <p className="text-sm font-medium truncate text-foreground group-hover:text-primary">
                    {chat.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {chat.createdAt?.toDate?.()?.toLocaleDateString?.() || ''}
                  </p>
                </div>
              </Link>
            ))
          )}
        </div>

        {/* Settings */}
        <div className="p-4 border-t space-y-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" className="w-full justify-start" size="sm">
                <SettingsPageIcon size={16} className="mr-2" />
                Paramètres
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <SheetHeader>
                <SheetTitle>Paramètres</SheetTitle>
                <SheetDescription>
                  Gérez vos préférences eNkamba.ai
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-4">
                <div className="space-y-2">
                  <h3 className="font-medium text-sm">À propos</h3>
                  <p className="text-xs text-muted-foreground">
                    eNkamba.ai est un assistant intelligent développé par Global solution et services sarl.
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="font-medium text-sm">Chats</h3>
                  <p className="text-xs text-muted-foreground">
                    Total: {aiChats.length} chat{aiChats.length > 1 ? 's' : ''}
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="font-medium text-sm">Confidentialité</h3>
                  <p className="text-xs text-muted-foreground">
                    Vos conversations sont sauvegardées et supprimées après 6 mois.
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="font-medium text-sm">Modèle</h3>
                  <p className="text-xs text-muted-foreground">
                    eNkamba.ai - Modèle propriétaire
                  </p>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="p-4 border-b">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                  <AINavIcon size={20} className="text-white" />
                </div>
                <h1 className="font-headline font-bold text-foreground">eNkamba.ai</h1>
              </div>
            </div>

            {/* New Chat Button */}
            <div className="p-4 border-b">
              <Button
                onClick={() => {
                  handleCreateChat();
                  setSidebarOpen(false);
                }}
                disabled={isCreating}
                className="w-full rounded-lg"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nouveau chat
              </Button>
            </div>

            {/* Chat History */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {aiChats.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-8">
                  Aucun chat
                </p>
              ) : (
                aiChats.map((chat) => (
                  <Link
                    key={chat.id}
                    href={`/dashboard/ai/chat/${chat.id}`}
                    className="block group"
                    onClick={() => setSidebarOpen(false)}
                  >
                    <div className="p-3 rounded-lg hover:bg-muted transition-colors">
                      <p className="text-sm font-medium truncate text-foreground group-hover:text-primary">
                        {chat.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {chat.createdAt?.toDate?.()?.toLocaleDateString?.() || ''}
                      </p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between h-16 border-b px-4 bg-muted/50">
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button size="icon" variant="ghost">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <div className="flex flex-col h-full">
                {/* Logo */}
                <div className="p-4 border-b">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                      <AINavIcon size={20} className="text-white" />
                    </div>
                    <h1 className="font-headline font-bold text-foreground">eNkamba.ai</h1>
                  </div>
                </div>

                {/* New Chat Button */}
                <div className="p-4 border-b">
                  <Button
                    onClick={() => {
                      handleCreateChat();
                      setSidebarOpen(false);
                    }}
                    disabled={isCreating}
                    className="w-full rounded-lg"
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Nouveau chat
                  </Button>
                </div>

                {/* Chat History */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {aiChats.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-8">
                      Aucun chat
                    </p>
                  ) : (
                    aiChats.map((chat) => (
                      <Link
                        key={chat.id}
                        href={`/dashboard/ai/chat/${chat.id}`}
                        className="block group"
                        onClick={() => setSidebarOpen(false)}
                      >
                        <div className="p-3 rounded-lg hover:bg-muted transition-colors">
                          <p className="text-sm font-medium truncate text-foreground group-hover:text-primary">
                            {chat.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {chat.createdAt?.toDate?.()?.toLocaleDateString?.() || ''}
                          </p>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <AINavIcon size={20} className="text-white" />
            </div>
            <h1 className="font-headline font-bold text-foreground">eNkamba.ai</h1>
          </div>
          <div className="w-10" />
        </div>

        {/* Content */}
        {children}
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChatNavIcon, SocialNavIcon } from '@/components/icons/service-icons';
import { VCFImportButton } from '@/components/contacts/VCFImportButton';
import { ContactQRScanner } from '@/components/contacts/ContactQRScanner';
import { MessageSquare, QrCode } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { Contact } from '@/hooks/useContacts';

interface ContactsListProps {
  enkambaContacts: Contact[];
  nonEnkambaContacts: Contact[];
  onSendInvitation: (contact: Contact) => void;
  onRefresh?: () => void;
  isLoading?: boolean;
}

export function ContactsList({
  enkambaContacts,
  nonEnkambaContacts,
  onSendInvitation,
  onRefresh,
  isLoading = false,
}: ContactsListProps) {
  const [activeTab, setActiveTab] = useState<'enkamba' | 'invite'>('enkamba');
  const [showQRScanner, setShowQRScanner] = useState(false);
  const router = useRouter();

  const handleStartChat = (contact: Contact) => {
    // Rediriger vers la page de chat avec ce contact
    router.push(`/dashboard/miyiki-chat/new?contact=${encodeURIComponent(contact.phoneNumber)}`);
  };

  return (
    <div className="space-y-4">
      {/* Boutons d'import */}
      <div className="grid grid-cols-2 gap-2">
        <VCFImportButton 
          onImportComplete={onRefresh}
          variant="outline"
          className="w-full"
        />
        <Button
          variant="outline"
          onClick={() => setShowQRScanner(true)}
          className="w-full gap-2"
        >
          <QrCode className="h-4 w-4" />
          Scanner QR
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'enkamba' | 'invite')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="enkamba" className="flex items-center gap-2">
            <ChatNavIcon size={16} />
            <span>Sur eNkamba ({enkambaContacts.length})</span>
          </TabsTrigger>
          <TabsTrigger value="invite" className="flex items-center gap-2">
            <SocialNavIcon size={16} />
            <span>Inviter ({nonEnkambaContacts.length})</span>
          </TabsTrigger>
        </TabsList>

        {/* Contacts sur eNkamba */}
        <TabsContent value="enkamba" className="space-y-2">
          {enkambaContacts.length === 0 ? (
            <div className="text-center py-8">
              <ChatNavIcon size={32} className="text-muted-foreground mx-auto mb-2 opacity-50" />
              <p className="text-muted-foreground">Aucun contact sur eNkamba</p>
              <p className="text-xs text-muted-foreground mt-1">
                Invitez vos amis pour commencer à discuter
              </p>
            </div>
          ) : (
            enkambaContacts.map((contact) => (
              <Card key={contact.id} className="p-3 rounded-xl hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {contact.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{contact.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{contact.phoneNumber}</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleStartChat(contact)}
                    disabled={isLoading}
                    className="flex-shrink-0 gap-1"
                  >
                    <MessageSquare size={14} />
                    <span className="text-xs">Discuter</span>
                  </Button>
                </div>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Contacts à inviter */}
        <TabsContent value="invite" className="space-y-2">
          {nonEnkambaContacts.length === 0 ? (
            <div className="text-center py-8">
              <SocialNavIcon size={32} className="text-muted-foreground mx-auto mb-2 opacity-50" />
              <p className="text-muted-foreground">Tous vos contacts sont sur eNkamba !</p>
              <p className="text-xs text-muted-foreground mt-1">
                Vous êtes bien connecté 🎉
              </p>
            </div>
          ) : (
            nonEnkambaContacts.map((contact) => (
              <Card key={contact.id} className="p-3 rounded-xl hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-muted text-muted-foreground font-semibold">
                      {contact.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{contact.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{contact.phoneNumber}</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => onSendInvitation(contact)}
                    disabled={isLoading}
                    className="flex-shrink-0 gap-1"
                    variant="outline"
                  >
                    <SocialNavIcon size={14} />
                    <span className="text-xs">Inviter</span>
                  </Button>
                </div>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Scanner QR Code */}
      <ContactQRScanner
        open={showQRScanner}
        onOpenChange={setShowQRScanner}
        onContactFound={(userId, displayName) => {
          if (onRefresh) onRefresh();
        }}
      />
    </div>
  );
}

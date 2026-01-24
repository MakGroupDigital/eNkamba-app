'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChatNavIcon, SocialNavIcon } from '@/components/icons/service-icons';
import type { Contact } from '@/hooks/useContacts';

interface ContactsListProps {
  enkambaContacts: Contact[];
  nonEnkambaContacts: Contact[];
  onSendInvitation: (contact: Contact) => void;
  isLoading?: boolean;
}

export function ContactsList({
  enkambaContacts,
  nonEnkambaContacts,
  onSendInvitation,
  isLoading = false,
}: ContactsListProps) {
  const [activeTab, setActiveTab] = useState<'enkamba' | 'invite'>('enkamba');

  return (
    <div className="space-y-4">
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
                    variant="ghost"
                    className="flex-shrink-0"
                    disabled={isLoading}
                  >
                    <ChatNavIcon size={16} />
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
                    className="flex-shrink-0"
                  >
                    <SocialNavIcon size={16} />
                  </Button>
                </div>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

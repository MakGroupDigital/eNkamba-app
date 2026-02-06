'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { useFirestoreContacts } from '@/hooks/useFirestoreContacts';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Users, Search, X } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CreateGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateGroupDialog({ open, onOpenChange }: CreateGroupDialogProps) {
  const { contacts, isLoading: contactsLoading } = useFirestoreContacts();
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [step, setStep] = useState<'name' | 'members'>('name');
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleClose = () => {
    setStep('name');
    setGroupName('');
    setGroupDescription('');
    setSelectedMembers([]);
    setSearchQuery('');
    onOpenChange(false);
  };

  const handleNextStep = () => {
    if (!groupName.trim()) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Veuillez entrer un nom de groupe',
      });
      return;
    }
    setStep('members');
  };

  const toggleMember = (contactId: string) => {
    setSelectedMembers(prev => 
      prev.includes(contactId)
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    );
  };

  const handleCreateGroup = async () => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Vous devez être connecté',
      });
      return;
    }

    if (selectedMembers.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Sélectionnez au moins un membre',
      });
      return;
    }

    setIsCreating(true);

    try {
      // Créer les participants (utilisateur actuel + membres sélectionnés)
      const participants = [user.uid, ...selectedMembers];
      
      // Récupérer les noms des participants
      const participantNames = [
        user.displayName || user.email || 'Vous',
        ...selectedMembers.map(memberId => {
          const contact = contacts.find(c => c.id === memberId);
          return contact?.name || contact?.phoneNumber || 'Inconnu';
        })
      ];

      // Créer le groupe dans Firestore
      const groupData = {
        name: groupName.trim(),
        description: groupDescription.trim() || '',
        isGroup: true,
        participants,
        participantNames,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        lastMessage: 'Groupe créé',
        lastMessageTime: serverTimestamp(),
        avatar: '', // Peut être ajouté plus tard
        admins: [user.uid], // Le créateur est admin
      };

      const conversationsRef = collection(db, 'conversations');
      const docRef = await addDoc(conversationsRef, groupData);

      toast({
        title: 'Succès',
        description: `Groupe "${groupName}" créé avec succès`,
        className: 'bg-green-600 text-white border-none',
      });

      handleClose();
      
      // Rediriger vers la conversation du groupe
      router.push(`/dashboard/miyiki-chat/${docRef.id}`);
    } catch (error: any) {
      console.error('Erreur création groupe:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.message || 'Impossible de créer le groupe',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const filteredContacts = contacts.filter(contact => {
    const query = searchQuery.toLowerCase();
    return (
      contact.name?.toLowerCase().includes(query) ||
      contact.phoneNumber?.toLowerCase().includes(query)
    );
  });

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Créer un groupe
          </DialogTitle>
          <DialogDescription>
            {step === 'name' 
              ? 'Donnez un nom à votre groupe' 
              : `Sélectionnez les membres (${selectedMembers.length} sélectionné${selectedMembers.length > 1 ? 's' : ''})`
            }
          </DialogDescription>
        </DialogHeader>

        {step === 'name' ? (
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Nom du groupe *</label>
              <Input
                placeholder="Ex: Famille, Amis, Travail..."
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                maxLength={50}
                autoFocus
              />
              <p className="text-xs text-muted-foreground mt-1">
                {groupName.length}/50 caractères
              </p>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Description (optionnel)</label>
              <Input
                placeholder="Décrivez votre groupe..."
                value={groupDescription}
                onChange={(e) => setGroupDescription(e.target.value)}
                maxLength={100}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {groupDescription.length}/100 caractères
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={handleClose}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                onClick={handleNextStep}
                className="flex-1 bg-primary hover:bg-primary/90"
              >
                Suivant
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {/* Barre de recherche */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un contact..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              )}
            </div>

            {/* Liste des contacts */}
            <ScrollArea className="h-[300px] pr-4">
              {contactsLoading ? (
                <div className="text-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mt-2">Chargement...</p>
                </div>
              ) : filteredContacts.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    {searchQuery ? 'Aucun contact trouvé' : 'Aucun contact disponible'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredContacts.map((contact) => (
                    <div
                      key={contact.id}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted cursor-pointer transition-colors"
                      onClick={() => toggleMember(contact.id)}
                    >
                      <Checkbox
                        checked={selectedMembers.includes(contact.id)}
                        onCheckedChange={() => toggleMember(contact.id)}
                      />
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>{contact.name?.charAt(0) || '?'}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{contact.name}</p>
                        <p className="text-xs text-muted-foreground">{contact.phoneNumber}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {/* Boutons d'action */}
            <div className="flex gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setStep('name')}
                className="flex-1"
                disabled={isCreating}
              >
                Retour
              </Button>
              <Button
                onClick={handleCreateGroup}
                className="flex-1 bg-primary hover:bg-primary/90"
                disabled={isCreating || selectedMembers.length === 0}
              >
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Création...
                  </>
                ) : (
                  `Créer (${selectedMembers.length})`
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Settings, 
  Users, 
  QrCode, 
  UserPlus, 
  X, 
  Check,
  Copy,
  Download,
  Crown,
  Shield,
  Trash2,
  LogOut,
  Edit2,
  Loader2
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useFirestoreContacts } from '@/hooks/useFirestoreContacts';
import { db } from '@/lib/firebase';
import { doc, updateDoc, arrayUnion, arrayRemove, getDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import QRCode from 'qrcode';
import Image from 'next/image';

interface GroupSettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId: string;
  groupData: {
    name: string;
    participants: string[];
    participantNames: string[];
    admins?: string[];
    createdBy?: string;
    createdAt?: any;
  };
  onUpdate?: () => void;
}

export function GroupSettingsDialog({
  isOpen,
  onClose,
  conversationId,
  groupData,
  onUpdate
}: GroupSettingsDialogProps) {
  const { user } = useAuth();
  const { contacts } = useFirestoreContacts();
  const { toast } = useToast();

  const [groupName, setGroupName] = useState(groupData.name);
  const [isEditingName, setIsEditingName] = useState(false);
  const [isSavingName, setIsSavingName] = useState(false);
  const [qrCode, setQrCode] = useState<string>('');
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [isAddingMembers, setIsAddingMembers] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const isAdmin = groupData.admins?.includes(user?.uid || '') || groupData.createdBy === user?.uid;
  const isCreator = groupData.createdBy === user?.uid;

  // Générer le QR code
  useEffect(() => {
    if (!conversationId) return;

    const generateQR = async () => {
      try {
        // Format: GROUP|conversationId|groupName
        const qrData = `GROUP|${conversationId}|${groupData.name}`;
        const qrDataUrl = await QRCode.toDataURL(qrData, {
          width: 300,
          margin: 2,
          color: {
            dark: '#32BB78',
            light: '#ffffff',
          },
        });
        setQrCode(qrDataUrl);
      } catch (error) {
        console.error('Erreur génération QR:', error);
      }
    };

    generateQR();
  }, [conversationId, groupData.name]);

  // Filtrer les contacts non membres
  const availableContacts = contacts.filter(
    contact => !groupData.participants.includes(contact.id)
  ).filter(contact => 
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.phoneNumber?.includes(searchQuery)
  );

  // Sauvegarder le nom du groupe
  const handleSaveGroupName = async () => {
    if (!groupName.trim() || groupName === groupData.name) {
      setIsEditingName(false);
      return;
    }

    setIsSavingName(true);
    try {
      const convRef = doc(db, 'conversations', conversationId);
      await updateDoc(convRef, {
        name: groupName.trim(),
        updatedAt: new Date()
      });

      toast({
        title: 'Succès',
        description: 'Nom du groupe modifié',
        className: 'bg-green-600 text-white border-none',
      });

      setIsEditingName(false);
      onUpdate?.();
    } catch (error) {
      console.error('Erreur modification nom:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de modifier le nom',
      });
    } finally {
      setIsSavingName(false);
    }
  };

  // Ajouter des membres
  const handleAddMembers = async () => {
    if (selectedContacts.length === 0) return;

    setIsAddingMembers(true);
    try {
      const convRef = doc(db, 'conversations', conversationId);
      const convSnap = await getDoc(convRef);

      if (!convSnap.exists()) {
        throw new Error('Conversation introuvable');
      }

      const currentData = convSnap.data();
      const newParticipantNames: string[] = [];

      // Récupérer les noms des nouveaux participants
      for (const contactId of selectedContacts) {
        const contact = contacts.find(c => c.id === contactId);
        if (contact) {
          newParticipantNames.push(contact.name);
        }
      }

      // Mettre à jour Firestore
      await updateDoc(convRef, {
        participants: arrayUnion(...selectedContacts),
        participantNames: [...(currentData.participantNames || []), ...newParticipantNames],
        updatedAt: new Date()
      });

      toast({
        title: 'Succès',
        description: `${selectedContacts.length} membre(s) ajouté(s)`,
        className: 'bg-green-600 text-white border-none',
      });

      setSelectedContacts([]);
      onUpdate?.();
    } catch (error) {
      console.error('Erreur ajout membres:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible d\'ajouter les membres',
      });
    } finally {
      setIsAddingMembers(false);
    }
  };

  // Retirer un membre
  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!isAdmin) return;
    if (memberId === user?.uid) return; // Ne peut pas se retirer soi-même

    try {
      const convRef = doc(db, 'conversations', conversationId);
      await updateDoc(convRef, {
        participants: arrayRemove(memberId),
        updatedAt: new Date()
      });

      // Retirer aussi le nom (nécessite de recharger et filtrer)
      const convSnap = await getDoc(convRef);
      if (convSnap.exists()) {
        const data = convSnap.data();
        const memberIndex = data.participants.indexOf(memberId);
        if (memberIndex !== -1) {
          const newNames = [...data.participantNames];
          newNames.splice(memberIndex, 1);
          await updateDoc(convRef, {
            participantNames: newNames
          });
        }
      }

      toast({
        title: 'Succès',
        description: `${memberName} retiré du groupe`,
        className: 'bg-green-600 text-white border-none',
      });

      onUpdate?.();
    } catch (error) {
      console.error('Erreur retrait membre:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de retirer le membre',
      });
    }
  };

  // Promouvoir en admin
  const handlePromoteToAdmin = async (memberId: string, memberName: string) => {
    if (!isCreator) return;

    try {
      const convRef = doc(db, 'conversations', conversationId);
      await updateDoc(convRef, {
        admins: arrayUnion(memberId),
        updatedAt: new Date()
      });

      toast({
        title: 'Succès',
        description: `${memberName} est maintenant administrateur`,
        className: 'bg-green-600 text-white border-none',
      });

      onUpdate?.();
    } catch (error) {
      console.error('Erreur promotion admin:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de promouvoir le membre',
      });
    }
  };

  // Quitter le groupe
  const handleLeaveGroup = async () => {
    if (!user) return;

    const confirmed = confirm('Êtes-vous sûr de vouloir quitter ce groupe ?');
    if (!confirmed) return;

    try {
      const convRef = doc(db, 'conversations', conversationId);
      await updateDoc(convRef, {
        participants: arrayRemove(user.uid),
        updatedAt: new Date()
      });

      toast({
        title: 'Succès',
        description: 'Vous avez quitté le groupe',
        className: 'bg-green-600 text-white border-none',
      });

      onClose();
      // Rediriger vers la liste des conversations
      window.location.href = '/dashboard/miyiki-chat';
    } catch (error) {
      console.error('Erreur quitter groupe:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de quitter le groupe',
      });
    }
  };

  // Copier le lien d'invitation
  const handleCopyInviteLink = () => {
    const inviteLink = `${window.location.origin}/join-group/${conversationId}`;
    navigator.clipboard.writeText(inviteLink);
    toast({
      title: 'Copié',
      description: 'Lien d\'invitation copié',
      className: 'bg-green-600 text-white border-none',
    });
  };

  // Télécharger le QR code
  const handleDownloadQR = () => {
    if (!qrCode) return;

    const link = document.createElement('a');
    link.href = qrCode;
    link.download = `groupe-${groupData.name}-qr.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: 'Succès',
      description: 'QR code téléchargé',
      className: 'bg-green-600 text-white border-none',
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#32BB78]" />
            Paramètres du groupe
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="info">Infos</TabsTrigger>
            <TabsTrigger value="members">Membres</TabsTrigger>
            <TabsTrigger value="invite">Inviter</TabsTrigger>
          </TabsList>

          {/* Onglet Infos */}
          <TabsContent value="info" className="space-y-4">
            {/* Nom du groupe */}
            <div className="space-y-2">
              <label className="text-sm font-semibold">Nom du groupe</label>
              {isEditingName ? (
                <div className="flex gap-2">
                  <Input
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="Nom du groupe"
                    disabled={!isAdmin || isSavingName}
                  />
                  <Button
                    onClick={handleSaveGroupName}
                    disabled={isSavingName}
                    size="icon"
                    className="bg-[#32BB78] hover:bg-[#2a9d63]"
                  >
                    {isSavingName ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  </Button>
                  <Button
                    onClick={() => {
                      setGroupName(groupData.name);
                      setIsEditingName(false);
                    }}
                    variant="outline"
                    size="icon"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span className="font-semibold">{groupData.name}</span>
                  {isAdmin && (
                    <Button
                      onClick={() => setIsEditingName(true)}
                      variant="ghost"
                      size="sm"
                      className="gap-2"
                    >
                      <Edit2 className="w-4 h-4" />
                      Modifier
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Statistiques */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-[#32BB78]/10 rounded-lg border border-[#32BB78]/20">
                <p className="text-sm text-muted-foreground">Membres</p>
                <p className="text-2xl font-bold text-[#32BB78]">{groupData.participants.length}</p>
              </div>
              <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-muted-foreground">Admins</p>
                <p className="text-2xl font-bold text-blue-600">{groupData.admins?.length || 1}</p>
              </div>
            </div>

            {/* Créé par */}
            {groupData.createdAt && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground">
                  Créé le {new Date(groupData.createdAt.toDate()).toLocaleDateString('fr-FR')}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-2 pt-4 border-t">
              <Button
                onClick={handleLeaveGroup}
                variant="outline"
                className="w-full gap-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
              >
                <LogOut className="w-4 h-4" />
                Quitter le groupe
              </Button>
            </div>
          </TabsContent>

          {/* Onglet Membres */}
          <TabsContent value="members" className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">{groupData.participants.length} membre(s)</p>
              {isAdmin && (
                <Button
                  onClick={() => {
                    // Basculer vers l'onglet inviter
                    const inviteTab = document.querySelector('[value="invite"]') as HTMLElement;
                    inviteTab?.click();
                  }}
                  size="sm"
                  className="bg-[#32BB78] hover:bg-[#2a9d63] gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  Ajouter
                </Button>
              )}
            </div>

            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {groupData.participants.map((participantId, index) => {
                const participantName = groupData.participantNames[index] || 'Membre';
                const isParticipantAdmin = groupData.admins?.includes(participantId);
                const isParticipantCreator = groupData.createdBy === participantId;
                const isCurrentUser = participantId === user?.uid;

                return (
                  <div
                    key={participantId}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback className="bg-[#32BB78] text-white">
                          {participantName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold flex items-center gap-2">
                          {participantName}
                          {isCurrentUser && <span className="text-xs text-muted-foreground">(Vous)</span>}
                        </p>
                        <div className="flex items-center gap-2">
                          {isParticipantCreator && (
                            <span className="text-xs flex items-center gap-1 text-yellow-600">
                              <Crown className="w-3 h-3" />
                              Créateur
                            </span>
                          )}
                          {isParticipantAdmin && !isParticipantCreator && (
                            <span className="text-xs flex items-center gap-1 text-blue-600">
                              <Shield className="w-3 h-3" />
                              Admin
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {isAdmin && !isCurrentUser && (
                      <div className="flex items-center gap-2">
                        {isCreator && !isParticipantAdmin && (
                          <Button
                            onClick={() => handlePromoteToAdmin(participantId, participantName)}
                            variant="ghost"
                            size="sm"
                            className="gap-2"
                          >
                            <Shield className="w-4 h-4" />
                            Promouvoir
                          </Button>
                        )}
                        <Button
                          onClick={() => handleRemoveMember(participantId, participantName)}
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </TabsContent>

          {/* Onglet Inviter */}
          <TabsContent value="invite" className="space-y-4">
            {/* QR Code */}
            <div className="flex flex-col items-center gap-4 p-6 bg-gradient-to-br from-[#32BB78]/10 to-[#2a9d63]/5 rounded-lg border border-[#32BB78]/20">
              <p className="text-sm font-semibold text-center">Scannez ce QR code pour rejoindre</p>
              {qrCode && (
                <div className="bg-white p-4 rounded-lg shadow-lg">
                  <Image src={qrCode} alt="QR Code" width={250} height={250} />
                </div>
              )}
              <div className="flex gap-2">
                <Button
                  onClick={handleDownloadQR}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <Download className="w-4 h-4" />
                  Télécharger
                </Button>
                <Button
                  onClick={handleCopyInviteLink}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Copier le lien
                </Button>
              </div>
            </div>

            {/* Ajouter des contacts */}
            {isAdmin && (
              <div className="space-y-3">
                <p className="text-sm font-semibold">Ajouter des contacts</p>
                
                {/* Recherche */}
                <Input
                  placeholder="Rechercher un contact..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />

                {/* Liste des contacts */}
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {availableContacts.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      {searchQuery ? 'Aucun contact trouvé' : 'Tous vos contacts sont déjà membres'}
                    </p>
                  ) : (
                    availableContacts.map((contact) => {
                      const isSelected = selectedContacts.includes(contact.id);
                      
                      return (
                        <div
                          key={contact.id}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedContacts(prev => prev.filter(id => id !== contact.id));
                            } else {
                              setSelectedContacts(prev => [...prev, contact.id]);
                            }
                          }}
                          className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                            isSelected 
                              ? 'bg-[#32BB78]/20 border-2 border-[#32BB78]' 
                              : 'bg-muted hover:bg-muted/80 border-2 border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarFallback className="bg-[#32BB78] text-white">
                                {contact.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-semibold">{contact.name}</p>
                              <p className="text-xs text-muted-foreground">{contact.phoneNumber}</p>
                            </div>
                          </div>
                          {isSelected && <Check className="w-5 h-5 text-[#32BB78]" />}
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Bouton ajouter */}
                {selectedContacts.length > 0 && (
                  <Button
                    onClick={handleAddMembers}
                    disabled={isAddingMembers}
                    className="w-full bg-[#32BB78] hover:bg-[#2a9d63] gap-2"
                  >
                    {isAddingMembers ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Ajout en cours...
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        Ajouter {selectedContacts.length} membre(s)
                      </>
                    )}
                  </Button>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

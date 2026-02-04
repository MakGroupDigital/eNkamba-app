
import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { QrCode } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Send, Mail } from 'lucide-react';
import { useFirestoreContacts } from '@/hooks/useFirestoreContacts';
import { useFirestoreConversations } from '@/hooks/useFirestoreConversations';

interface ChatContactsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChatContactsDialog({ open, onOpenChange }: ChatContactsDialogProps) {


  // Always declare hooks first
  const router = useRouter();
  const { contacts, isLoading, addContact, getContactStatus } = useFirestoreContacts();
  const { createConversation } = useFirestoreConversations();
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', phoneNumber: '', email: '' });
  const [contactStatuses, setContactStatuses] = useState<Map<string, any>>(new Map());

  // Ajouter un contact
  const handleAddContact = useCallback(async () => {
    if (!addForm.name || !addForm.phoneNumber) {
      alert('Veuillez remplir le nom et le numéro de téléphone');
      return;
    }
    setIsSubmitting(true);
    try {
      const statusInfo = await getContactStatus(addForm.phoneNumber, addForm.email);
      if (statusInfo.status === 'own') {
        alert('Ce numéro ou email appartient à votre compte eNkamba');
        setIsSubmitting(false);
        return;
      }
      const result = await addContact({
        name: addForm.name,
        phoneNumber: addForm.phoneNumber,
        email: addForm.email || undefined,
        isOnEnkamba: statusInfo.status === 'enkamba',
      });
      if (result) {
        setAddForm({ name: '', phoneNumber: '', email: '' });
        setShowAddForm(false);
      }
    } catch (error) {
      console.error('Erreur ajout contact:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [addForm, getContactStatus, addContact]);

  // Charger les statuts de tous les contacts à chaque changement
  useEffect(() => {
    let cancelled = false;
    async function loadStatuses() {
      const statuses = new Map();
      for (const contact of contacts) {
        try {
          const status = await getContactStatus(contact.phoneNumber, contact.email);
          statuses.set(contact.id, { contactId: contact.id, ...status });
        } catch (e) {
          statuses.set(contact.id, { contactId: contact.id, status: 'invite' });
        }
      }
      if (!cancelled) setContactStatuses(statuses);
    }
    if (contacts.length > 0) loadStatuses();
    else setContactStatuses(new Map());
    return () => { cancelled = true; };
  }, [contacts, getContactStatus]);
  const [creatingConversationId, setCreatingConversationId] = useState<string | null>(null);
  const [qrScanData, setQrScanData] = useState<any>(null);

  // ...existing logic for loading statuses, QR scan, handleAddContact, etc...

  // Inviter un contact non eNkamba
  const handleSendInvitation = useCallback((contact: any) => {
    try {
      const userReferralCode = localStorage.getItem('enkamba_referral_code') || 'ENKAMBA';
      const message = `Rejoins-moi sur eNkamba ! 🚀\n\nCode d'invitation: ${userReferralCode}\n\nTélécharge l'app et crée ton compte avec ce code pour nous connecter directement.\n\nhttps://enkamba.io/join?ref=${userReferralCode}`;

      const smsUrl = `sms:${contact.phoneNumber}?body=${encodeURIComponent(message)}`;
      window.location.href = smsUrl;
    } catch (error) {
      console.error('Erreur envoi invitation:', error);
    }
  }, []);

  // Créer une conversation et naviguer
  const handleStartChat = useCallback(async (contact: any) => {
    try {
      setCreatingConversationId(contact.id);
      let identifierType: 'uid' | 'email' | 'phone' = 'uid';
      let identifierValue = contact.id;
      // Si le contact a un email, on préfère l'email
      if (contact.email) {
        identifierType = 'email';
        identifierValue = contact.email;
      } else if (contact.phoneNumber) {
        identifierType = 'phone';
        identifierValue = contact.phoneNumber;
      }
      const conversationId = await createConversation(identifierValue, contact.name, identifierType);
      onOpenChange(false);
      router.push(`/dashboard/miyiki-chat/${conversationId}`);
    } catch (error) {
      console.error('Erreur création conversation:', error);
      alert('Erreur lors de la création de la conversation');
    } finally {
      setCreatingConversationId(null);
    }
  }, [createConversation, onOpenChange, router]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Démarrer une discussion</DialogTitle>
          <DialogDescription>Sélectionnez un contact ou ajoutez-en un nouveau</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Ajout bouton scanner QR code */}
          <div className="flex justify-end">
            <Button variant="outline" className="gap-2" onClick={() => {
              window.localStorage.setItem('enkamba_qr_return', window.location.pathname);
              router.push('/dashboard/scanner');
            }}>
              <QrCode className="h-4 w-4" />
              Scanner un QR code
            </Button>
          </div>
          {/* Tous les contacts avec action intelligente */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : contacts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">Aucun contact pour le moment</p>
              <Button onClick={() => setShowAddForm(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Ajouter un contact
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1 mb-3">
                <h3 className="font-semibold text-sm">Mes contacts</h3>
                <Badge variant="secondary">{contacts.length}</Badge>
              </div>
              {contacts.map(contact => {
                const cachedStatus = contactStatuses.get(contact.id);
                const status = cachedStatus || { contactId: contact.id, status: 'invite' as const };
                return (
                  <div key={contact.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors">
                    <div className="flex items-center gap-3 flex-1">
                      <Avatar>
                        <AvatarFallback className={`text-white font-semibold ${status.status === 'enkamba' ? 'bg-primary' : status.status === 'own' ? 'bg-blue-600' : 'bg-muted-foreground'}`}>{contact.name.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm">{contact.name}</p>
                          {status.status === 'own' && (
                            <Badge variant="default" className="bg-blue-600 text-white text-xs">Vous</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{contact.phoneNumber}</p>
                        {contact.email && <p className="text-xs text-muted-foreground">{contact.email}</p>}
                      </div>
                    </div>
                    {status.status === 'own' ? (
                      <Button size="sm" disabled className="gap-1 opacity-50">
                        <span>C'est vous</span>
                      </Button>
                    ) : status.status === 'enkamba' ? (
                      <Button 
                        size="sm" 
                        className="gap-1"
                        onClick={() => handleStartChat(contact)}
                        disabled={creatingConversationId === contact.id}
                      >
                        {creatingConversationId === contact.id ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Création...
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4" />
                            Discuter
                          </>
                        )}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1"
                        onClick={() => handleSendInvitation(contact)}
                      >
                        <Mail className="h-4 w-4" />
                        Inviter
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Ajouter un contact (pré-rempli si QR) */}
          <div className="pt-4 border-t">
            {showAddForm ? (
              <>
                {qrScanData && (
                  <div className="mb-2 p-2 rounded bg-green-50 text-green-900 text-xs">
                    Infos récupérées du QR code :<br />
                    <span className="font-bold">Nom :</span> {qrScanData.name}<br />
                    {qrScanData.email && (<><span className="font-bold">Email :</span> {qrScanData.email}<br /></>)}
                    {/* Le numéro de téléphone doit être complété si absent */}
                  </div>
                )}
                <>
                  <div className="space-y-4">
                    <h3 className="font-semibold text-sm">Ajouter un contact</h3>
                    <div>
                      <Label htmlFor="add-name">Nom *</Label>
                      <Input
                        id="add-name"
                        value={addForm.name}
                        onChange={(e) => setAddForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Jean Dupont"
                      />
                    </div>
                    <div>
                      <Label htmlFor="add-phone">Numéro de téléphone *</Label>
                      <Input
                        id="add-phone"
                        value={addForm.phoneNumber}
                        onChange={(e) => setAddForm(prev => ({ ...prev, phoneNumber: e.target.value }))}
                        placeholder="+243 812 345 678"
                      />
                    </div>
                    <div>
                      <Label htmlFor="add-email">Email (optionnel)</Label>
                      <Input
                        id="add-email"
                        type="email"
                        value={addForm.email}
                        onChange={(e) => setAddForm(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="jean@example.com"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setShowAddForm(false)}>
                        Annuler
                      </Button>
                      <Button onClick={handleAddContact} disabled={isSubmitting} className="flex-1">
                        {isSubmitting ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Ajout en cours...
                          </>
                        ) : (
                          'Ajouter le contact'
                        )}
                      </Button>
                    </div>
                  </div>
                </>
              </>
            ) : (
              <Button onClick={() => setShowAddForm(true)} className="w-full gap-2" variant="outline">
                <Plus className="h-4 w-4" />
                Ajouter un nouveau contact
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

'use client';

import { useState, useCallback, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useFirestoreContacts } from '@/hooks/useFirestoreContacts';
import { Loader2, Plus, Send, Mail } from 'lucide-react';
import Link from 'next/link';

interface ChatContactsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ContactStatus {
  contactId: string;
  status: 'own' | 'enkamba' | 'invite';
  referralCode?: string;
}

export function ChatContactsDialog({ open, onOpenChange }: ChatContactsDialogProps) {
  const {
    contacts,
    isLoading,
    addContact,
    getContactStatus,
  } = useFirestoreContacts();

  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', phoneNumber: '', email: '' });
  const [contactStatuses, setContactStatuses] = useState<Map<string, ContactStatus>>(new Map());

  // Charger les statuts de tous les contacts
  useEffect(() => {
    const loadContactStatuses = async () => {
      const statuses = new Map<string, ContactStatus>();
      
      for (const contact of contacts) {
        try {
          const status = await getContactStatus(contact.phoneNumber, contact.email);
          statuses.set(contact.id, {
            contactId: contact.id,
            status: status.status,
            referralCode: status.referralCode,
          });
        } catch (error) {
          console.error(`Erreur vérification statut pour ${contact.id}:`, error);
          // Par défaut, traiter comme 'invite'
          statuses.set(contact.id, {
            contactId: contact.id,
            status: 'invite',
          });
        }
      }
      
      setContactStatuses(statuses);
    };

    if (contacts.length > 0) {
      loadContactStatuses();
    }
  }, [contacts, getContactStatus]);

  // Ajouter un contact
  const handleAddContact = async () => {
    if (!addForm.name || !addForm.phoneNumber) {
      alert('Veuillez remplir le nom et le numéro de téléphone');
      return;
    }

    setIsSubmitting(true);
    try {
      // Vérifier le statut du contact (propre compte, enkamba, ou à inviter)
      const statusInfo = await getContactStatus(addForm.phoneNumber, addForm.email);
      
      // Ne pas ajouter si c'est son propre compte
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
  };

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Démarrer une discussion</DialogTitle>
          <DialogDescription>Sélectionnez un contact ou ajoutez-en un nouveau</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
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
                        <AvatarFallback className={`text-white font-semibold ${status.status === 'enkamba' ? 'bg-primary' : status.status === 'own' ? 'bg-blue-600' : 'bg-muted-foreground'}`}>
                          {contact.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
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
                      <Link href={`/dashboard/miyiki-chat/${contact.id}`}>
                        <Button size="sm" className="gap-1">
                          <Send className="h-4 w-4" />
                          Discuter
                        </Button>
                      </Link>
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

          {/* Ajouter un contact */}
          <div className="pt-4 border-t">
            {showAddForm ? (
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

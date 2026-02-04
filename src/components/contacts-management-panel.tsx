'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useFirestoreContacts } from '@/hooks/useFirestoreContacts';
import { Loader2, Plus, Edit2, Trash2, Phone, Mail } from 'lucide-react';

export function ContactsManagementPanel() {
  const {
    contacts,
    isLoading,
    error,
    addContact,
    updateContact,
    deleteContact,
  } = useFirestoreContacts();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states for add
  const [addForm, setAddForm] = useState({ name: '', phoneNumber: '', email: '' });

  // Form states for edit
  const [editForm, setEditForm] = useState({ name: '', email: '' });

  // Ajouter un contact
  const handleAddContact = async () => {
    if (!addForm.name || !addForm.phoneNumber) {
      alert('Veuillez remplir le nom et le numéro de téléphone');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await addContact({
        name: addForm.name,
        phoneNumber: addForm.phoneNumber,
        email: addForm.email || undefined,
        isOnEnkamba: false,
      });

      if (result) {
        setAddForm({ name: '', phoneNumber: '', email: '' });
        setShowAddDialog(false);
      }
    } catch (error) {
      console.error('Erreur ajout contact:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Ouvrir la dialog de modification
  const handleOpenEditDialog = (contact: any) => {
    setSelectedContact(contact);
    setEditForm({ name: contact.name, email: contact.email || '' });
    setShowEditDialog(true);
  };

  // Mettre à jour un contact
  const handleUpdateContact = async () => {
    if (!editForm.name) {
      alert('Veuillez entrer un nom');
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await updateContact(selectedContact.id, {
        name: editForm.name,
        email: editForm.email || undefined,
        isOnEnkamba: selectedContact.isOnEnkamba,
      });

      if (success) {
        setShowEditDialog(false);
        setSelectedContact(null);
      }
    } catch (error) {
      console.error('Erreur modification contact:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Supprimer un contact
  const handleDeleteContact = async (contactId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce contact ?')) return;

    setIsSubmitting(true);
    try {
      await deleteContact(contactId);
    } catch (error) {
      console.error('Erreur suppression contact:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const enkambaContacts = contacts.filter(c => c.isOnEnkamba);
  const nonEnkambaContacts = contacts.filter(c => !c.isOnEnkamba);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Mes Contacts</h2>
          <p className="text-sm text-muted-foreground">Gérez vos contacts pour le chat</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Ajouter un contact
        </Button>
      </div>

      {/* Error message */}
      {error && (
        <Card className="border-red-500/50 bg-red-50 dark:bg-red-950/30">
          <CardContent className="pt-6">
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Loading state */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : contacts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">Aucun contact pour le moment</p>
            <Button onClick={() => setShowAddDialog(true)}>Ajouter votre premier contact</Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* eNkamba Contacts */}
          {enkambaContacts.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-primary flex items-center gap-2">
                Contacts eNkamba
                <Badge variant="secondary">{enkambaContacts.length}</Badge>
              </h3>
              <div className="grid gap-3">
                {enkambaContacts.map(contact => (
                  <Card key={contact.id} className="border-primary/30">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <Avatar>
                            <AvatarFallback className="bg-primary text-white">
                              {contact.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-semibold">{contact.name}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                              <Phone className="h-3 w-3" />
                              {contact.phoneNumber}
                            </p>
                            {contact.email && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {contact.email}
                              </p>
                            )}
                          </div>
                        </div>
                        <Badge className="bg-primary">Sur eNkamba</Badge>
                        <div className="flex gap-2 ml-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenEditDialog(contact)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                            onClick={() => handleDeleteContact(contact.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Non-eNkamba Contacts */}
          {nonEnkambaContacts.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-muted-foreground flex items-center gap-2">
                Autres contacts
                <Badge variant="outline">{nonEnkambaContacts.length}</Badge>
              </h3>
              <div className="grid gap-3">
                {nonEnkambaContacts.map(contact => (
                  <Card key={contact.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <Avatar>
                            <AvatarFallback>
                              {contact.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-semibold">{contact.name}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                              <Phone className="h-3 w-3" />
                              {contact.phoneNumber}
                            </p>
                            {contact.email && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {contact.email}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenEditDialog(contact)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                            onClick={() => handleDeleteContact(contact.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Add Contact Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un contact</DialogTitle>
            <DialogDescription>Ajoutez un nouveau contact pour commencer à discuter</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="add-name">Nom</Label>
              <Input
                id="add-name"
                value={addForm.name}
                onChange={(e) => setAddForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Jean Dupont"
              />
            </div>
            <div>
              <Label htmlFor="add-phone">Numéro de téléphone</Label>
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleAddContact} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Ajouter'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Contact Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le contact</DialogTitle>
            <DialogDescription>Mettez à jour les informations du contact</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Nom</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Jean Dupont"
              />
            </div>
            <div>
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                placeholder="jean@example.com"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleUpdateContact} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Mettre à jour'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

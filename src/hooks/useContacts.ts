import { useState, useCallback, useEffect } from 'react';
import { Contacts } from '@capacitor-community/contacts';
import { useFirestoreContacts, FirestoreContact } from './useFirestoreContacts';

export interface Contact {
  id: string;
  name: string;
  phoneNumber: string;
  isOnEnkamba: boolean;
  avatar?: string;
  referralCode?: string;
}

export interface ContactsState {
  contacts: Contact[];
  enkambaContacts: Contact[];
  nonEnkambaContacts: Contact[];
  isLoading: boolean;
  hasPermission: boolean;
  error: string | null;
}

const CONTACTS_STORAGE_KEY = 'enkamba_contacts_cache';
const PERMISSION_STORAGE_KEY = 'enkamba_contacts_permission';

// Simulated eNkamba users (in production, this would come from Firebase)
const ENKAMBA_USERS = [
  { phoneNumber: '+243812345678', name: 'Jean Dupont', referralCode: 'JEAN123' },
  { phoneNumber: '+243987654321', name: 'Marie Martin', referralCode: 'MARIE456' },
  { phoneNumber: '+243812111111', name: 'Pierre Bernard', referralCode: 'PIERRE789' },
  { phoneNumber: '+243899999999', name: 'Alice Moreau', referralCode: 'ALICE999' },
  { phoneNumber: '+243888888888', name: 'Bob Leclerc', referralCode: 'BOB888' },
];

export function useContacts() {
  const [state, setState] = useState<ContactsState>({
    contacts: [],
    enkambaContacts: [],
    nonEnkambaContacts: [],
    isLoading: false,
    hasPermission: false,
    error: null,
  });

  // Utiliser le hook Firestore
  const {
    contacts: firestoreContacts,
    isLoading: firestoreLoading,
    error: firestoreError,
    addContact,
    updateContact,
    deleteContact,
  } = useFirestoreContacts();

  // Vérifier la permission au montage
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const savedPermission = localStorage.getItem(PERMISSION_STORAGE_KEY);
    if (savedPermission === 'true') {
      setState(prev => ({ ...prev, hasPermission: true }));
      loadCachedContacts();
    } else {
      // Charger les contacts Firestore par défaut
      loadFirestoreContacts();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Charger les contacts Firestore
  const loadFirestoreContacts = useCallback(() => {
    if (firestoreContacts && firestoreContacts.length > 0) {
      const enkamba = firestoreContacts.filter(c => c.isOnEnkamba);
      const nonEnkamba = firestoreContacts.filter(c => !c.isOnEnkamba);
      
      setState(prev => ({
        ...prev,
        contacts: firestoreContacts.map(fc => ({
          id: fc.id,
          name: fc.name,
          phoneNumber: fc.phoneNumber,
          isOnEnkamba: fc.isOnEnkamba,
          referralCode: fc.referralCode,
        })),
        enkambaContacts: enkamba.map(fc => ({
          id: fc.id,
          name: fc.name,
          phoneNumber: fc.phoneNumber,
          isOnEnkamba: fc.isOnEnkamba,
          referralCode: fc.referralCode,
        })),
        nonEnkambaContacts: nonEnkamba.map(fc => ({
          id: fc.id,
          name: fc.name,
          phoneNumber: fc.phoneNumber,
          isOnEnkamba: fc.isOnEnkamba,
          referralCode: fc.referralCode,
        })),
        isLoading: firestoreLoading,
        hasPermission: true,
        error: firestoreError,
      }));
    }
  }, [firestoreContacts, firestoreLoading, firestoreError]);

  // Synchroniser avec Firestore
  useEffect(() => {
    loadFirestoreContacts();
  }, [loadFirestoreContacts]); // eslint-disable-line react-hooks/exhaustive-deps

  // Charger les contacts en cache
  const loadCachedContacts = useCallback(() => {
    try {
      const cached = localStorage.getItem(CONTACTS_STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        setState(prev => ({
          ...prev,
          contacts: parsed.contacts || [],
          enkambaContacts: parsed.enkambaContacts || [],
          nonEnkambaContacts: parsed.nonEnkambaContacts || [],
          hasPermission: true,
        }));
      }
      // Charger aussi les contacts Firestore en arrière-plan
      loadFirestoreContacts();
    } catch (error) {
      console.error('Erreur chargement contacts en cache:', error);
      loadFirestoreContacts();
    }
  }, [loadFirestoreContacts]); // eslint-disable-line react-hooks/exhaustive-deps

  // Demander l'accès aux contacts avec Contact Picker API (Web) ou Capacitor (Mobile)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const requestContactsPermission = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      let processedContacts: { all: Contact[]; enkamba: Contact[]; nonEnkamba: Contact[] } = {
        all: [],
        enkamba: [],
        nonEnkamba: [],
      };
      let success = false;

      // 1. Essayer Contact Picker API (Chrome/Edge sur web)
      if ('contacts' in navigator && 'ContactsManager' in window) {
        try {
          const props = ['name', 'tel'];
          const opts = { multiple: true };
          // @ts-ignore - Contact Picker API
          const contacts = await navigator.contacts.select(props, opts);
          
          if (contacts && contacts.length > 0) {
            const formattedContacts = contacts.map((contact: any, index: number) => ({
              name: contact.name?.[0] || `Contact ${index + 1}`,
              phones: contact.tel?.map((tel: string) => ({ number: tel })) || [],
            }));
            processedContacts = processContacts(formattedContacts);
            success = true;
          }
        } catch (pickerError) {
          console.log('Contact Picker API non disponible ou refusé:', pickerError);
        }
      }

      // 2. Essayer Capacitor Contacts (pour mobile)
      if (!success) {
        try {
          const result = await Contacts.getContacts({
            projection: {
              name: true,
              phones: true,
              emails: true,
            },
          });

          if (result.contacts && result.contacts.length > 0) {
            processedContacts = processContacts(result.contacts);
            success = true;
          }
        } catch (capacitorError) {
          console.log('Capacitor Contacts non disponible:', capacitorError);
        }
      }

      // Sauvegarder
      localStorage.setItem(PERMISSION_STORAGE_KEY, 'true');
      if (success) {
        localStorage.setItem(CONTACTS_STORAGE_KEY, JSON.stringify({
          contacts: processedContacts.all,
          enkambaContacts: processedContacts.enkamba,
          nonEnkambaContacts: processedContacts.nonEnkamba,
          lastUpdated: Date.now(),
        }));
      }

      // Mettre à jour l'état
      if (success) {
        setState(prev => ({
          ...prev,
          contacts: processedContacts.all,
          enkambaContacts: processedContacts.enkamba,
          nonEnkambaContacts: processedContacts.nonEnkamba,
          hasPermission: true,
          isLoading: false,
        }));
      } else {
        // Fallback à Firestore
        setState(prev => ({
          ...prev,
          hasPermission: true,
          isLoading: false,
        }));
        loadFirestoreContacts();
      }
    } catch (error: any) {
      console.error('Erreur accès contacts:', error);
      // Fallback à Firestore en cas d'erreur
      setState(prev => ({
        ...prev,
        isLoading: false,
        hasPermission: true,
      }));
      loadFirestoreContacts();
    }
  }, [loadFirestoreContacts]); // eslint-disable-line react-hooks/exhaustive-deps

  // Traiter les contacts pour identifier ceux sur eNkamba
  const processContacts = (rawContacts: any[]) => {
    const all: Contact[] = [];
    const enkamba: Contact[] = [];
    const nonEnkamba: Contact[] = [];

    rawContacts.forEach((contact, index) => {
      // Extraire le premier numéro de téléphone
      const phoneNumber = contact.phones?.[0]?.number || '';
      const name = contact.name?.display || contact.name?.formatted || `Contact ${index + 1}`;

      if (!phoneNumber) return;

      const normalizedPhone = normalizePhoneNumber(phoneNumber);
      const enkambaUser = ENKAMBA_USERS.find(
        u => normalizePhoneNumber(u.phoneNumber) === normalizedPhone
      );

      const processedContact: Contact = {
        id: `${normalizedPhone}-${Date.now()}`,
        name,
        phoneNumber: normalizedPhone,
        isOnEnkamba: !!enkambaUser,
        referralCode: enkambaUser?.referralCode,
      };

      all.push(processedContact);

      if (enkambaUser) {
        enkamba.push(processedContact);
      } else {
        nonEnkamba.push(processedContact);
      }
    });

    return { all, enkamba, nonEnkamba };
  };

  // Normaliser le numéro de téléphone
  const normalizePhoneNumber = (phone: string): string => {
    // Supprimer tous les caractères non numériques
    const cleaned = phone.replace(/\D/g, '');
    
    // Si le numéro commence par 0, le remplacer par l'indicatif du pays (ex: +243)
    if (cleaned.startsWith('0')) {
      return '+243' + cleaned.substring(1);
    }
    
    // Si le numéro ne commence pas par +, ajouter +243 (RDC par défaut)
    if (!cleaned.startsWith('243') && !cleaned.startsWith('+')) {
      return '+243' + cleaned;
    }
    
    // Si le numéro commence par 243 sans +, ajouter +
    if (cleaned.startsWith('243') && !phone.startsWith('+')) {
      return '+' + cleaned;
    }
    
    return phone;
  };

  // Envoyer une invitation SMS
  const sendInvitation = useCallback(async (contact: Contact, referralCode: string) => {
    try {
      const message = `Rejoins-moi sur eNkamba ! 🚀\n\nCode d'invitation: ${referralCode}\n\nTélécharge l'app et crée ton compte avec ce code pour nous connecter directement.\n\nhttps://enkamba.io/join?ref=${referralCode}`;

      // Ouvrir l'app SMS native
      const smsUrl = `sms:${contact.phoneNumber}?body=${encodeURIComponent(message)}`;
      window.location.href = smsUrl;

      return true;
    } catch (error) {
      console.error('Erreur envoi invitation:', error);
      return false;
    }
  }, []);

  // Réinitialiser les permissions
  const resetPermissions = useCallback(() => {
    localStorage.removeItem(PERMISSION_STORAGE_KEY);
    localStorage.removeItem(CONTACTS_STORAGE_KEY);
    setState({
      contacts: [],
      enkambaContacts: [],
      nonEnkambaContacts: [],
      isLoading: false,
      hasPermission: false,
      error: null,
    });
  }, []);

  // Ajouter un contact via Firestore
  const addContactToFirestore = useCallback(async (name: string, phoneNumber: string, email?: string) => {
    return await addContact({
      name,
      phoneNumber,
      email,
      isOnEnkamba: false,
    });
  }, [addContact]);

  // Mettre à jour un contact via Firestore
  const updateContactInFirestore = useCallback(async (contactId: string, updates: Partial<Omit<FirestoreContact, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>) => {
    return await updateContact(contactId, updates);
  }, [updateContact]);

  // Supprimer un contact via Firestore
  const deleteContactFromFirestore = useCallback(async (contactId: string) => {
    return await deleteContact(contactId);
  }, [deleteContact]);

  return {
    ...state,
    requestContactsPermission,
    sendInvitation,
    resetPermissions,
    addContactToFirestore,
    updateContactInFirestore,
    deleteContactFromFirestore,
  };
}

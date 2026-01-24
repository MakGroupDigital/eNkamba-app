import { useState, useCallback, useEffect } from 'react';
import { Contacts } from '@capacitor-community/contacts';

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

  // Vérifier la permission au montage
  useEffect(() => {
    const savedPermission = localStorage.getItem(PERMISSION_STORAGE_KEY);
    if (savedPermission === 'true') {
      setState(prev => ({ ...prev, hasPermission: true }));
      loadCachedContacts();
    }
  }, []);

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
        }));
      }
    } catch (error) {
      console.error('Erreur chargement contacts en cache:', error);
    }
  }, []);

  // Demander l'accès aux contacts
  const requestContactsPermission = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Utiliser Capacitor Contacts pour accéder aux vrais contacts du téléphone
      const result = await Contacts.getContacts({
        projection: {
          name: true,
          phones: true,
          emails: true,
        },
      });

      if (!result.contacts || result.contacts.length === 0) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Aucun contact trouvé sur votre téléphone',
        }));
        return;
      }

      // Traiter les contacts
      const processedContacts = processContacts(result.contacts);

      // Sauvegarder
      localStorage.setItem(PERMISSION_STORAGE_KEY, 'true');
      localStorage.setItem(CONTACTS_STORAGE_KEY, JSON.stringify({
        contacts: processedContacts.all,
        enkambaContacts: processedContacts.enkamba,
        nonEnkambaContacts: processedContacts.nonEnkamba,
        lastUpdated: Date.now(),
      }));

      setState(prev => ({
        ...prev,
        contacts: processedContacts.all,
        enkambaContacts: processedContacts.enkamba,
        nonEnkambaContacts: processedContacts.nonEnkamba,
        hasPermission: true,
        isLoading: false,
      }));
    } catch (error: any) {
      console.error('Erreur accès contacts Capacitor:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Erreur lors de l\'accès aux contacts. Assurez-vous que l\'app a la permission d\'accéder aux contacts.',
      }));
    }
  }, []);

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

  return {
    ...state,
    requestContactsPermission,
    sendInvitation,
    resetPermissions,
  };
}

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  getDocs,
} from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';

export interface FirestoreContact {
  id: string;
  userId: string;
  name: string;
  phoneNumber: string;
  email?: string;
  isOnEnkamba: boolean;
  referralCode?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface FirestoreContactsState {
  contacts: FirestoreContact[];
  isLoading: boolean;
  error: string | null;
}

export interface ContactStatusResult {
  status: 'own' | 'enkamba' | 'invite';
  referralCode?: string;
  userId?: string;
  displayName?: string;
}

export function useFirestoreContacts() {
  const [state, setState] = useState<FirestoreContactsState>({
    contacts: [],
    isLoading: true,
    error: null,
  });

  const [currentUser, setCurrentUser] = useState(auth.currentUser);
  const statusCacheRef = useRef<Map<string, ContactStatusResult>>(new Map());

  useEffect(() => {
    statusCacheRef.current.clear();
  }, [currentUser?.uid, state.contacts.length]);

  // Écouter les changements d'authentification
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Charger les contacts depuis Firestore
  useEffect(() => {
    if (!currentUser) {
      setState({
        contacts: [],
        isLoading: false,
        error: null,
      });
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const q = query(
        collection(db, 'contacts'),
        where('userId', '==', currentUser.uid)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const contacts: FirestoreContact[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          // Ensure timestamps exist, use current time if missing
          const createdAt = data.createdAt || Timestamp.now();
          const updatedAt = data.updatedAt || Timestamp.now();
          
          contacts.push({
            id: doc.id,
            userId: data.userId,
            name: data.name,
            phoneNumber: data.phoneNumber,
            email: data.email,
            isOnEnkamba: data.isOnEnkamba,
            referralCode: data.referralCode,
            createdAt,
            updatedAt,
          });
        });
        
        // Sort by updatedAt, handling null values
        const sortedContacts = contacts.sort((a, b) => {
          const aTime = a.updatedAt ? a.updatedAt.toMillis() : 0;
          const bTime = b.updatedAt ? b.updatedAt.toMillis() : 0;
          return bTime - aTime;
        });
        
        setState({
          contacts: sortedContacts,
          isLoading: false,
          error: null,
        });
      });

      return () => unsubscribe();
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Erreur lors du chargement des contacts',
      }));
    }
  }, [currentUser]);

  // Normaliser le numéro de téléphone
  const normalizePhoneNumber = useCallback((phone: string): string => {
    const raw = (phone || '').trim();
    if (!raw) return '';

    const digits = raw.replace(/\D/g, '');
    if (!digits) return '';

    if (raw.startsWith('+')) {
      return `+${digits}`;
    }

    if (digits.startsWith('243')) {
      return `+${digits}`;
    }

    if (digits.startsWith('0')) {
      return `+243${digits.slice(1)}`;
    }

    if (digits.length === 9) {
      return `+243${digits}`;
    }

    return `+${digits}`;
  }, []);

  const getPhoneCandidates = useCallback((phone: string): string[] => {
    const normalized = normalizePhoneNumber(phone);
    if (!normalized) return [];

    const digits = normalized.replace(/\D/g, '');
    const candidates = new Set<string>([normalized, digits, `+${digits}`]);

    if (digits.startsWith('243')) {
      const local = digits.slice(3);
      if (local) {
        candidates.add(local);
        candidates.add(`0${local}`);
      }
    }

    if (digits.startsWith('0') && digits.length > 1) {
      const withoutZero = digits.slice(1);
      candidates.add(`+243${withoutZero}`);
      candidates.add(`243${withoutZero}`);
    }

    if (digits.length === 9) {
      candidates.add(`+243${digits}`);
      candidates.add(`243${digits}`);
      candidates.add(`0${digits}`);
    }

    return Array.from(candidates).filter(Boolean);
  }, [normalizePhoneNumber]);

  // Vérifier si un email existe dans la collection users (pour les comptes Google)
  const findUserInFirestore = useCallback(async (phoneNumber?: string, email?: string): Promise<ContactStatusResult | null> => {
    const usersRef = collection(db, 'users');

    try {
      if (email) {
        const normalizedEmail = email.trim().toLowerCase();
        if (normalizedEmail) {
          const qByEmail = query(usersRef, where('email', '==', normalizedEmail));
          const emailSnapshot = await getDocs(qByEmail);
          if (!emailSnapshot.empty) {
            const userDoc = emailSnapshot.docs[0];
            const userData = userDoc.data();
            return {
              status: 'enkamba',
              userId: userDoc.id,
              referralCode: userData.referralCode,
              displayName: userData.fullName || userData.displayName || userData.name || userData.email || 'Utilisateur',
            };
          }
        }
      }

      const candidates = getPhoneCandidates(phoneNumber || '');
      if (candidates.length === 0) {
        return null;
      }

      const phoneFields = ['phoneNumber', 'phone', 'kyc.linkedAccount.phoneNumber'] as const;
      for (const candidate of candidates) {
        for (const fieldName of phoneFields) {
          const qByPhone = query(usersRef, where(fieldName, '==', candidate));
          const phoneSnapshot = await getDocs(qByPhone);
          if (!phoneSnapshot.empty) {
            const userDoc = phoneSnapshot.docs[0];
            const userData = userDoc.data();
            return {
              status: 'enkamba',
              userId: userDoc.id,
              referralCode: userData.referralCode,
              displayName: userData.fullName || userData.displayName || userData.name || userData.email || 'Utilisateur',
            };
          }
        }
      }
    } catch (error) {
      console.error('Erreur lors de la recherche utilisateur pour contact:', error);
    }

    return null;
  }, [getPhoneCandidates]);

  // Vérifier le statut d'un contact: 'own' (son propre compte), 'enkamba' (utilisateur Kenz), ou 'invite' (à inviter)
  // Version synchrone pour les vérifications rapides
  const getContactStatusSync = useCallback((phoneNumber: string, email?: string): ContactStatusResult => {
    // 1. Vérifier si c'est le propre numéro/email de l'utilisateur
    if (currentUser?.phoneNumber) {
      const normalizedUserPhone = normalizePhoneNumber(currentUser.phoneNumber);
      const normalizedContactPhone = normalizePhoneNumber(phoneNumber);
      if (normalizedUserPhone && normalizedUserPhone === normalizedContactPhone) {
        return { status: 'own', userId: currentUser.uid };
      }
    }

    if (currentUser?.email && email && currentUser.email.toLowerCase() === email.toLowerCase()) {
      return { status: 'own', userId: currentUser.uid };
    }

    const normalized = normalizePhoneNumber(phoneNumber);
    const existingContact = state.contacts.find(
      (contact) => normalizePhoneNumber(contact.phoneNumber) === normalized && contact.isOnEnkamba
    );
    if (existingContact) {
      return { status: 'enkamba', referralCode: existingContact.referralCode };
    }

    return { status: 'invite' };
  }, [currentUser, normalizePhoneNumber, state.contacts]);

  // Version asynchrone qui vérifie aussi les emails dans Firestore
  const getContactStatus = useCallback(async (phoneNumber: string, email?: string): Promise<ContactStatusResult> => {
    // 1. Vérifier si c'est le propre numéro/email de l'utilisateur
    if (currentUser?.phoneNumber) {
      const normalizedUserPhone = normalizePhoneNumber(currentUser.phoneNumber);
      const normalizedContactPhone = normalizePhoneNumber(phoneNumber);
      if (normalizedUserPhone && normalizedUserPhone === normalizedContactPhone) {
        return { status: 'own', userId: currentUser.uid };
      }
    }

    if (currentUser?.email && email && currentUser.email.toLowerCase() === email.toLowerCase()) {
      return { status: 'own', userId: currentUser.uid };
    }

    const normalizedEmail = email?.trim().toLowerCase() || '';
    const cacheKey = `${normalizePhoneNumber(phoneNumber)}|${normalizedEmail}`;
    const cached = statusCacheRef.current.get(cacheKey);
    if (cached) {
      return cached;
    }

    const firestoreUser = await findUserInFirestore(phoneNumber, email);
    const result = firestoreUser || { status: 'invite' as const };
    statusCacheRef.current.set(cacheKey, result);
    return result;
  }, [currentUser, normalizePhoneNumber, findUserInFirestore]);

  // Vérifier si un contact est sur Kenz (legacy - version synchrone rapide)
  const checkIfOnEnkamba = useCallback((phoneNumber: string, email?: string): { isOnEnkamba: boolean; referralCode?: string } => {
    const statusInfo = getContactStatusSync(phoneNumber, email);
    return {
      isOnEnkamba: statusInfo.status === 'enkamba',
      referralCode: statusInfo.referralCode,
    };
  }, [getContactStatusSync]);

  // Ajouter un contact
  const addContact = useCallback(async (contactData: Omit<FirestoreContact, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!currentUser) {
      setState(prev => ({ ...prev, error: 'Utilisateur non authentifié' }));
      return null;
    }

    try {
      const normalizedPhone = normalizePhoneNumber(contactData.phoneNumber);
      const statusInfo = await getContactStatus(normalizedPhone, contactData.email);
      const isOnEnkamba = statusInfo.status === 'enkamba';

      const docRef = await addDoc(collection(db, 'contacts'), {
        userId: currentUser.uid,
        name: contactData.name,
        phoneNumber: normalizedPhone,
        email: contactData.email || '',
        isOnEnkamba,
        referralCode: statusInfo.referralCode || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return {
        id: docRef.id,
        userId: currentUser.uid,
        name: contactData.name,
        phoneNumber: normalizedPhone,
        email: contactData.email || '',
        isOnEnkamba,
        referralCode: statusInfo.referralCode,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };
    } catch (error: any) {
      const errorMsg = error.message || 'Erreur lors de l\'ajout du contact';
      setState(prev => ({ ...prev, error: errorMsg }));
      console.error('Erreur ajout contact:', error);
      return null;
    }
  }, [currentUser, normalizePhoneNumber, getContactStatus]);

  // Modifier un contact
  const updateContact = useCallback(async (contactId: string, updates: Partial<Omit<FirestoreContact, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>) => {
    if (!currentUser) {
      setState(prev => ({ ...prev, error: 'Utilisateur non authentifié' }));
      return false;
    }

    try {
      const updateData: any = { updatedAt: serverTimestamp() };
      
      if (updates.name) updateData.name = updates.name;
      if (updates.email) updateData.email = updates.email;
      
      const phoneToCheck = updates.phoneNumber ? normalizePhoneNumber(updates.phoneNumber) : undefined;
      const emailToCheck = updates.email;
      if (phoneToCheck) {
        const statusInfo = await getContactStatus(phoneToCheck, emailToCheck);
        updateData.phoneNumber = phoneToCheck;
        updateData.isOnEnkamba = statusInfo.status === 'enkamba';
        updateData.referralCode = statusInfo.referralCode || null;
      } else if (emailToCheck) {
        const existingContact = state.contacts.find((contact) => contact.id === contactId);
        if (existingContact?.phoneNumber) {
          const statusInfo = await getContactStatus(existingContact.phoneNumber, emailToCheck);
          updateData.isOnEnkamba = statusInfo.status === 'enkamba';
          updateData.referralCode = statusInfo.referralCode || null;
        }
      }

      await updateDoc(doc(db, 'contacts', contactId), updateData);
      return true;
    } catch (error: any) {
      const errorMsg = error.message || 'Erreur lors de la modification du contact';
      setState(prev => ({ ...prev, error: errorMsg }));
      console.error('Erreur modification contact:', error);
      return false;
    }
  }, [currentUser, normalizePhoneNumber, getContactStatus, state.contacts]);

  // Supprimer un contact
  const deleteContact = useCallback(async (contactId: string) => {
    if (!currentUser) {
      setState(prev => ({ ...prev, error: 'Utilisateur non authentifié' }));
      return false;
    }

    try {
      await deleteDoc(doc(db, 'contacts', contactId));
      return true;
    } catch (error: any) {
      const errorMsg = error.message || 'Erreur lors de la suppression du contact';
      setState(prev => ({ ...prev, error: errorMsg }));
      console.error('Erreur suppression contact:', error);
      return false;
    }
  }, [currentUser]);

  // Obtenir les contacts sur Kenz
  const getEnkambaContacts = useCallback(() => {
    return state.contacts.filter(c => c.isOnEnkamba);
  }, [state.contacts]);

  // Obtenir les contacts non sur Kenz
  const getNonEnkambaContacts = useCallback(() => {
    return state.contacts.filter(c => !c.isOnEnkamba);
  }, [state.contacts]);

  return {
    ...state,
    addContact,
    updateContact,
    deleteContact,
    getEnkambaContacts,
    getNonEnkambaContacts,
    normalizePhoneNumber,
    checkIfOnEnkamba,
    getContactStatus,
  };
}

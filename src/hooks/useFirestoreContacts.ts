import { useState, useCallback, useEffect } from 'react';
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
  getDoc,
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

const ENKAMBA_USERS = [
  { phoneNumber: '+243812345678', name: 'Jean Dupont', referralCode: 'JEAN123' },
  { phoneNumber: '+243987654321', name: 'Marie Martin', referralCode: 'MARIE456' },
  { phoneNumber: '+243812111111', name: 'Pierre Bernard', referralCode: 'PIERRE789' },
  { phoneNumber: '+243899999999', name: 'Alice Moreau', referralCode: 'ALICE999' },
  { phoneNumber: '+243888888888', name: 'Bob Leclerc', referralCode: 'BOB888' },
];

export function useFirestoreContacts() {
  const [state, setState] = useState<FirestoreContactsState>({
    contacts: [],
    isLoading: true,
    error: null,
  });

  const [currentUser, setCurrentUser] = useState(auth.currentUser);

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
    const cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.startsWith('0')) {
      return '+243' + cleaned.substring(1);
    }
    
    if (!cleaned.startsWith('243') && !cleaned.startsWith('+')) {
      return '+243' + cleaned;
    }
    
    if (cleaned.startsWith('243') && !phone.startsWith('+')) {
      return '+' + cleaned;
    }
    
    return phone;
  }, []);

  // Vérifier si un email existe dans la collection users (pour les comptes Google)
  const checkEmailInFirestore = useCallback(async (email: string): Promise<boolean> => {
    if (!email) return false;
    
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', email.toLowerCase()));
      const snapshot = await getDocs(q);
      return snapshot.size > 0;
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'email:', error);
      return false;
    }
  }, []);

  // Vérifier le statut d'un contact: 'own' (son propre compte), 'enkamba' (utilisateur eNkamba), ou 'invite' (à inviter)
  // Version synchrone pour les vérifications rapides
  const getContactStatusSync = useCallback((phoneNumber: string, email?: string): { status: 'own' | 'enkamba' | 'invite'; referralCode?: string } => {
    // 1. Vérifier si c'est le propre numéro/email de l'utilisateur
    if (currentUser?.phoneNumber) {
      const normalizedUserPhone = normalizePhoneNumber(currentUser.phoneNumber);
      const normalizedContactPhone = normalizePhoneNumber(phoneNumber);
      if (normalizedUserPhone === normalizedContactPhone) {
        return { status: 'own' };
      }
    }

    if (currentUser?.email && email && currentUser.email.toLowerCase() === email.toLowerCase()) {
      return { status: 'own' };
    }

    // 2. Vérifier si c'est un utilisateur eNkamba (liste hardcodée)
    const normalized = normalizePhoneNumber(phoneNumber);
    const enkambaUser = ENKAMBA_USERS.find(
      u => normalizePhoneNumber(u.phoneNumber) === normalized
    );
    if (enkambaUser) {
      return {
        status: 'enkamba',
        referralCode: enkambaUser.referralCode,
      };
    }

    // 3. Sinon, c'est un contact à inviter
    return { status: 'invite' };
  }, [currentUser, normalizePhoneNumber]);

  // Version asynchrone qui vérifie aussi les emails dans Firestore
  const getContactStatus = useCallback(async (phoneNumber: string, email?: string): Promise<{ status: 'own' | 'enkamba' | 'invite'; referralCode?: string }> => {
    // 1. Vérifier si c'est le propre numéro/email de l'utilisateur
    if (currentUser?.phoneNumber) {
      const normalizedUserPhone = normalizePhoneNumber(currentUser.phoneNumber);
      const normalizedContactPhone = normalizePhoneNumber(phoneNumber);
      if (normalizedUserPhone === normalizedContactPhone) {
        return { status: 'own' };
      }
    }

    if (currentUser?.email && email && currentUser.email.toLowerCase() === email.toLowerCase()) {
      return { status: 'own' };
    }

    // 2. Vérifier si c'est un utilisateur eNkamba (liste hardcodée)
    const normalized = normalizePhoneNumber(phoneNumber);
    const enkambaUser = ENKAMBA_USERS.find(
      u => normalizePhoneNumber(u.phoneNumber) === normalized
    );
    if (enkambaUser) {
      return {
        status: 'enkamba',
        referralCode: enkambaUser.referralCode,
      };
    }

    // 3. Vérifier si l'email existe dans la collection users (comptes Google)
    if (email) {
      const emailExists = await checkEmailInFirestore(email);
      if (emailExists) {
        return { status: 'enkamba' };
      }
    }

    // 4. Sinon, c'est un contact à inviter
    return { status: 'invite' };
  }, [currentUser, normalizePhoneNumber, checkEmailInFirestore]);

  // Vérifier si un contact est sur eNkamba (legacy - version synchrone rapide)
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
      const enkambaInfo = checkIfOnEnkamba(normalizedPhone);

      const docRef = await addDoc(collection(db, 'contacts'), {
        userId: currentUser.uid,
        name: contactData.name,
        phoneNumber: normalizedPhone,
        email: contactData.email || '',
        isOnEnkamba: enkambaInfo.isOnEnkamba,
        referralCode: enkambaInfo.referralCode || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return {
        id: docRef.id,
        userId: currentUser.uid,
        name: contactData.name,
        phoneNumber: normalizedPhone,
        email: contactData.email || '',
        isOnEnkamba: enkambaInfo.isOnEnkamba,
        referralCode: enkambaInfo.referralCode,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };
    } catch (error: any) {
      const errorMsg = error.message || 'Erreur lors de l\'ajout du contact';
      setState(prev => ({ ...prev, error: errorMsg }));
      console.error('Erreur ajout contact:', error);
      return null;
    }
  }, [currentUser, normalizePhoneNumber, checkIfOnEnkamba]);

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
      
      if (updates.phoneNumber) {
        const normalizedPhone = normalizePhoneNumber(updates.phoneNumber);
        const enkambaInfo = checkIfOnEnkamba(normalizedPhone);
        updateData.phoneNumber = normalizedPhone;
        updateData.isOnEnkamba = enkambaInfo.isOnEnkamba;
        updateData.referralCode = enkambaInfo.referralCode || null;
      }

      await updateDoc(doc(db, 'contacts', contactId), updateData);
      return true;
    } catch (error: any) {
      const errorMsg = error.message || 'Erreur lors de la modification du contact';
      setState(prev => ({ ...prev, error: errorMsg }));
      console.error('Erreur modification contact:', error);
      return false;
    }
  }, [currentUser, normalizePhoneNumber, checkIfOnEnkamba]);

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

  // Obtenir les contacts sur eNkamba
  const getEnkambaContacts = useCallback(() => {
    return state.contacts.filter(c => c.isOnEnkamba);
  }, [state.contacts]);

  // Obtenir les contacts non sur eNkamba
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

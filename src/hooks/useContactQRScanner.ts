'use client';

import { useState, useCallback } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

interface ScannedContactData {
  type: 'CONTACT' | 'PAYMENT' | 'ENKAMBA_ACCOUNT' | 'ENKAMBA_CARD' | 'UNKNOWN';
  uid?: string;
  name?: string;
  email?: string;
  phone?: string;
  accountNumber?: string;
  cardNumber?: string;
}

interface MatchedUser {
  found: boolean;
  userId?: string;
  displayName?: string;
  email?: string;
  phone?: string;
  profileImage?: string;
  referralCode?: string;
}

export function useContactQRScanner() {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedData, setScannedData] = useState<ScannedContactData | null>(null);
  const [matchedUser, setMatchedUser] = useState<MatchedUser | null>(null);
  const { toast } = useToast();

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

  // Générer des variantes de numéro
  const getPhoneVariants = useCallback((phone: string): string[] => {
    const normalized = normalizePhoneNumber(phone);
    if (!normalized) return [];

    const digits = normalized.replace(/\D/g, '');
    const variants = new Set<string>([normalized, digits, `+${digits}`]);

    if (digits.startsWith('243')) {
      const local = digits.slice(3);
      if (local) {
        variants.add(local);
        variants.add(`0${local}`);
        variants.add(`+243${local}`);
        variants.add(`243${local}`);
      }
    }

    if (digits.startsWith('0') && digits.length > 1) {
      const withoutZero = digits.slice(1);
      variants.add(`+243${withoutZero}`);
      variants.add(`243${withoutZero}`);
    }

    if (digits.length === 9) {
      variants.add(`+243${digits}`);
      variants.add(`243${digits}`);
      variants.add(`0${digits}`);
    }

    return Array.from(variants).filter(Boolean);
  }, [normalizePhoneNumber]);

  // Parser le QR code scanné
  const parseQRCode = useCallback((qrData: string): ScannedContactData => {
    const parts = qrData.split('|');
    const type = parts[0];

    switch (type) {
      case 'CONTACT':
        // Format: CONTACT|uid|name|email|phone
        return {
          type: 'CONTACT',
          uid: parts[1] || undefined,
          name: parts[2] || undefined,
          email: parts[3] || undefined,
          phone: parts[4] || undefined,
        };

      case 'PAYMENT':
        // Format: PAYMENT|accountNumber|name|email|uid
        return {
          type: 'PAYMENT',
          accountNumber: parts[1] || undefined,
          name: parts[2] || undefined,
          email: parts[3] || undefined,
          uid: parts[4] || undefined,
        };

      default:
        // Essayer de détecter si c'est un ancien format sans préfixe
        // Format ancien: accountNumber|name|email|uid (commence par ENK)
        if (parts[0]?.startsWith('ENK') && parts.length >= 4) {
          return {
            type: 'PAYMENT',
            accountNumber: parts[0],
            name: parts[1] || undefined,
            email: parts[2] || undefined,
            uid: parts[3] || undefined,
          };
        }
        
        // Essayer de détecter si c'est un numéro de compte Kenz seul
        if (qrData.startsWith('ENK') && qrData.length >= 12 && !qrData.includes('|')) {
          return {
            type: 'ENKAMBA_ACCOUNT',
            accountNumber: qrData,
          };
        }
        
        // Vérifier si c'est un numéro de carte (format: 1234 5678 9012 3456)
        if (/^\d{4}\s\d{4}\s\d{4}\s\d{4}$/.test(qrData)) {
          return {
            type: 'ENKAMBA_CARD',
            cardNumber: qrData,
          };
        }

        return {
          type: 'UNKNOWN',
        };
    }
  }, []);

  // Chercher l'utilisateur dans Firebase
  const findUserInFirebase = useCallback(async (contactData: ScannedContactData): Promise<MatchedUser> => {
    const usersRef = collection(db, 'users');

    try {
      console.log('🔍 Recherche avec données:', contactData);
      
      // 1. Si on a un UID direct, chercher par UID (priorité absolue)
      if (contactData.uid) {
        console.log('🎯 Tentative recherche par UID:', contactData.uid);
        const qByUid = query(usersRef, where('__name__', '==', contactData.uid));
        const uidSnapshot = await getDocs(qByUid);
        
        if (!uidSnapshot.empty) {
          const userDoc = uidSnapshot.docs[0];
          const userData = userDoc.data();
          console.log('✅ Utilisateur trouvé par UID');
          return {
            found: true,
            userId: userDoc.id,
            displayName: userData.fullName || userData.displayName || userData.name || userData.email,
            email: userData.email,
            phone: userData.phone || userData.phoneNumber,
            profileImage: userData.profileImage || userData.photoURL,
            referralCode: userData.referralCode,
          };
        }
        console.log('❌ Aucun utilisateur trouvé par UID');
      }

      // 2. Chercher par email
      if (contactData.email) {
        console.log('📧 Tentative recherche par email:', contactData.email);
        const normalizedEmail = contactData.email.trim().toLowerCase();
        const qByEmail = query(usersRef, where('email', '==', normalizedEmail));
        const emailSnapshot = await getDocs(qByEmail);
        
        if (!emailSnapshot.empty) {
          const userDoc = emailSnapshot.docs[0];
          const userData = userDoc.data();
          console.log('✅ Utilisateur trouvé par email');
          return {
            found: true,
            userId: userDoc.id,
            displayName: userData.fullName || userData.displayName || userData.name || userData.email,
            email: userData.email,
            phone: userData.phone || userData.phoneNumber,
            profileImage: userData.profileImage || userData.photoURL,
            referralCode: userData.referralCode,
          };
        }
        console.log('❌ Aucun utilisateur trouvé par email');
      }

      // 3. Chercher par numéro de téléphone
      if (contactData.phone) {
        console.log('📱 Tentative recherche par téléphone:', contactData.phone);
        const phoneVariants = getPhoneVariants(contactData.phone);
        const phoneFields = ['phoneNumber', 'phone', 'kyc.linkedAccount.phoneNumber'];

        for (const variant of phoneVariants) {
          for (const field of phoneFields) {
            const qByPhone = query(usersRef, where(field, '==', variant));
            const phoneSnapshot = await getDocs(qByPhone);
            
            if (!phoneSnapshot.empty) {
              const userDoc = phoneSnapshot.docs[0];
              const userData = userDoc.data();
              console.log('✅ Utilisateur trouvé par téléphone:', variant, field);
              return {
                found: true,
                userId: userDoc.id,
                displayName: userData.fullName || userData.displayName || userData.name || userData.email,
                email: userData.email,
                phone: userData.phone || userData.phoneNumber,
                profileImage: userData.profileImage || userData.photoURL,
                referralCode: userData.referralCode,
              };
            }
          }
        }
        console.log('❌ Aucun utilisateur trouvé par téléphone');
      }

      // 4. Chercher par numéro de compte Kenz
      if (contactData.accountNumber) {
        console.log('💳 Tentative recherche par accountNumber:', contactData.accountNumber);
        
        // Essayer avec le champ accountNumber
        const qByAccount = query(usersRef, where('accountNumber', '==', contactData.accountNumber));
        const accountSnapshot = await getDocs(qByAccount);
        
        if (!accountSnapshot.empty) {
          const userDoc = accountSnapshot.docs[0];
          const userData = userDoc.data();
          console.log('✅ Utilisateur trouvé par accountNumber');
          return {
            found: true,
            userId: userDoc.id,
            displayName: userData.fullName || userData.displayName || userData.name || userData.email,
            email: userData.email,
            phone: userData.phone || userData.phoneNumber,
            profileImage: userData.profileImage || userData.photoURL,
            referralCode: userData.referralCode,
          };
        }
        
        // Si pas trouvé, générer l'accountNumber à partir de tous les UIDs et comparer
        console.log('🔄 Recherche par génération d\'accountNumber...');
        const allUsersSnapshot = await getDocs(usersRef);
        
        for (const userDoc of allUsersSnapshot.docs) {
          const userData = userDoc.data();
          const hash = userDoc.id.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
          const generatedAccountNum = `ENK${String(hash).padStart(12, '0')}`;
          
          if (generatedAccountNum === contactData.accountNumber) {
            console.log('✅ Utilisateur trouvé par accountNumber généré');
            return {
              found: true,
              userId: userDoc.id,
              displayName: userData.fullName || userData.displayName || userData.name || userData.email,
              email: userData.email,
              phone: userData.phone || userData.phoneNumber,
              profileImage: userData.profileImage || userData.photoURL,
              referralCode: userData.referralCode,
            };
          }
        }
        
        console.log('❌ Aucun utilisateur trouvé par accountNumber');
      }

      // 5. Chercher par numéro de carte Kenz
      if (contactData.cardNumber) {
        console.log('💳 Tentative recherche par cardNumber:', contactData.cardNumber);
        const qByCard = query(usersRef, where('cardNumber', '==', contactData.cardNumber));
        const cardSnapshot = await getDocs(qByCard);
        
        if (!cardSnapshot.empty) {
          const userDoc = cardSnapshot.docs[0];
          const userData = userDoc.data();
          console.log('✅ Utilisateur trouvé par cardNumber');
          return {
            found: true,
            userId: userDoc.id,
            displayName: userData.fullName || userData.displayName || userData.name || userData.email,
            email: userData.email,
            phone: userData.phone || userData.phoneNumber,
            profileImage: userData.profileImage || userData.photoURL,
            referralCode: userData.referralCode,
          };
        }
        console.log('❌ Aucun utilisateur trouvé par cardNumber');
      }
    } catch (error) {
      console.error('❌ Erreur recherche utilisateur:', error);
    }

    console.log('❌ Aucun utilisateur trouvé après toutes les tentatives');
    return { found: false };
  }, [getPhoneVariants]);

  // Traiter le QR code scanné
  const processScannedQR = useCallback(async (qrData: string) => {
    console.log('🔄 Début traitement QR code:', qrData);
    setIsScanning(true);

    try {
      // Parser le QR code
      console.log('📝 Parsing du QR code...');
      const contactData = parseQRCode(qrData);
      console.log('✅ QR code parsé:', contactData);
      setScannedData(contactData);

      if (contactData.type === 'UNKNOWN') {
        console.warn('⚠️ Type de QR code non reconnu');
        toast({
          variant: 'destructive',
          title: 'QR Code non reconnu',
          description: 'Ce QR code n\'est pas un contact Kenz valide',
        });
        setIsScanning(false);
        return null;
      }

      // Chercher l'utilisateur dans Firebase
      console.log('🔍 Recherche utilisateur dans Firebase...');
      const user = await findUserInFirebase(contactData);
      console.log('📊 Résultat recherche:', user);
      setMatchedUser(user);

      if (user.found) {
        console.log('✅ Contact trouvé:', user.displayName);
        toast({
          title: 'Contact trouvé',
          description: `${user.displayName} est sur Kenz`,
          className: 'bg-primary text-white border-none',
        });
      } else {
        console.log('❌ Contact non trouvé');
        toast({
          variant: 'destructive',
          title: 'Contact non trouvé',
          description: 'Ce contact n\'est pas encore sur Kenz',
        });
      }

      setIsScanning(false);
      return user;
    } catch (error: any) {
      console.error('❌ Erreur traitement QR:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.message || 'Erreur lors du traitement du QR code',
      });
      setIsScanning(false);
      return null;
    }
  }, [parseQRCode, findUserInFirebase, toast]);

  // Réinitialiser
  const reset = useCallback(() => {
    setScannedData(null);
    setMatchedUser(null);
    setIsScanning(false);
  }, []);

  return {
    isScanning,
    scannedData,
    matchedUser,
    processScannedQR,
    reset,
  };
}

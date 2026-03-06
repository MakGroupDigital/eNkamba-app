'use client';

import { useState, useCallback } from 'react';
import { collection, getDocs, query, where, writeBatch, doc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

interface ImportedContact {
  name: string;
  phoneNumber?: string;
  email?: string;
}

interface MatchResult {
  imported: number;
  matched: number;
  notMatched: number;
  errors: number;
}

export function useContactsImport() {
  const [isImporting, setIsImporting] = useState(false);
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

  // Générer des variantes de numéro de téléphone pour le matching
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

  // Chercher un utilisateur dans Firebase par email ou téléphone
  const findUserInFirebase = useCallback(async (phoneNumber?: string, email?: string): Promise<{
    found: boolean;
    userId?: string;
    displayName?: string;
    referralCode?: string;
  }> => {
    const usersRef = collection(db, 'users');

    try {
      // 1. Chercher par email (prioritaire car plus fiable)
      if (email) {
        const normalizedEmail = email.trim().toLowerCase();
        if (normalizedEmail) {
          const qByEmail = query(usersRef, where('email', '==', normalizedEmail));
          const emailSnapshot = await getDocs(qByEmail);
          
          if (!emailSnapshot.empty) {
            const userDoc = emailSnapshot.docs[0];
            const userData = userDoc.data();
            return {
              found: true,
              userId: userDoc.id,
              displayName: userData.fullName || userData.displayName || userData.name || userData.email,
              referralCode: userData.referralCode,
            };
          }
        }
      }

      // 2. Chercher par téléphone avec toutes les variantes
      if (phoneNumber) {
        const phoneVariants = getPhoneVariants(phoneNumber);
        const phoneFields = ['phoneNumber', 'phone', 'kyc.linkedAccount.phoneNumber'];

        for (const variant of phoneVariants) {
          for (const field of phoneFields) {
            const qByPhone = query(usersRef, where(field, '==', variant));
            const phoneSnapshot = await getDocs(qByPhone);
            
            if (!phoneSnapshot.empty) {
              const userDoc = phoneSnapshot.docs[0];
              const userData = userDoc.data();
              return {
                found: true,
                userId: userDoc.id,
                displayName: userData.fullName || userData.displayName || userData.name || userData.email,
                referralCode: userData.referralCode,
              };
            }
          }
        }
      }
    } catch (error) {
      console.error('Erreur recherche utilisateur:', error);
    }

    return { found: false };
  }, [getPhoneVariants]);

  // Importer automatiquement tous les contacts d'un fichier VCF
  const importVCFContacts = useCallback(async (file: File): Promise<MatchResult> => {
    if (!auth.currentUser) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Vous devez être connecté',
      });
      return { imported: 0, matched: 0, notMatched: 0, errors: 0 };
    }

    setIsImporting(true);

    try {
      // Lire le fichier VCF
      const text = await file.text();
      const contacts = parseVCF(text);

      if (contacts.length === 0) {
        toast({
          variant: 'destructive',
          title: 'Erreur',
          description: 'Aucun contact trouvé dans le fichier',
        });
        return { imported: 0, matched: 0, notMatched: 0, errors: 0 };
      }

      // Traiter tous les contacts en batch
      const batch = writeBatch(db);
      const contactsRef = collection(db, 'contacts');
      
      let imported = 0;
      let matched = 0;
      let notMatched = 0;
      let errors = 0;

      // Traiter par lots de 50 (limite Firestore batch)
      const batchSize = 50;
      for (let i = 0; i < contacts.length; i += batchSize) {
        const batchContacts = contacts.slice(i, i + batchSize);
        
        for (const contact of batchContacts) {
          try {
            // Chercher si l'utilisateur existe sur Firebase
            const userMatch = await findUserInFirebase(contact.phoneNumber, contact.email);
            
            const normalizedPhone = contact.phoneNumber ? normalizePhoneNumber(contact.phoneNumber) : '';
            
            // Créer le document de contact
            const contactDoc = doc(contactsRef);
            batch.set(contactDoc, {
              userId: auth.currentUser!.uid,
              name: contact.name,
              phoneNumber: normalizedPhone || '',
              email: contact.email || '',
              isOnEnkamba: userMatch.found,
              referralCode: userMatch.referralCode || null,
              enkambaUserId: userMatch.userId || null,
              enkambaDisplayName: userMatch.displayName || null,
              createdAt: new Date(),
              updatedAt: new Date(),
            });

            imported++;
            if (userMatch.found) {
              matched++;
            } else {
              notMatched++;
            }
          } catch (error) {
            console.error('Erreur traitement contact:', contact.name, error);
            errors++;
          }
        }

        // Commit le batch
        await batch.commit();
      }

      toast({
        title: 'Import réussi',
        description: `${imported} contacts importés, ${matched} sur eNkamba`,
        className: 'bg-green-600 text-white border-none',
      });

      return { imported, matched, notMatched, errors };
    } catch (error: any) {
      console.error('Erreur import VCF:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.message || 'Erreur lors de l\'import',
      });
      return { imported: 0, matched: 0, notMatched: 0, errors: 1 };
    } finally {
      setIsImporting(false);
    }
  }, [toast, normalizePhoneNumber, findUserInFirebase]);

  // Parser un fichier VCF
  const parseVCF = (vcfText: string): ImportedContact[] => {
    const contacts: ImportedContact[] = [];
    const lines = vcfText.split(/\r?\n/);
    
    let currentContact: Partial<ImportedContact> = {};
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      if (trimmed === 'BEGIN:VCARD') {
        currentContact = {};
      } else if (trimmed === 'END:VCARD') {
        if (currentContact.name && (currentContact.phoneNumber || currentContact.email)) {
          contacts.push(currentContact as ImportedContact);
        }
        currentContact = {};
      } else if (trimmed.startsWith('FN:')) {
        currentContact.name = trimmed.substring(3).trim();
      } else if (trimmed.startsWith('N:')) {
        if (!currentContact.name) {
          const parts = trimmed.substring(2).split(';');
          currentContact.name = `${parts[1] || ''} ${parts[0] || ''}`.trim();
        }
      } else if (trimmed.startsWith('TEL')) {
        const phoneMatch = trimmed.match(/:([\d\s\+\-\(\)]+)$/);
        if (phoneMatch && !currentContact.phoneNumber) {
          currentContact.phoneNumber = phoneMatch[1].trim();
        }
      } else if (trimmed.startsWith('EMAIL')) {
        const emailMatch = trimmed.match(/:(.+)$/);
        if (emailMatch && !currentContact.email) {
          currentContact.email = emailMatch[1].trim().toLowerCase();
        }
      }
    }
    
    return contacts;
  };

  return {
    isImporting,
    importVCFContacts,
  };
}

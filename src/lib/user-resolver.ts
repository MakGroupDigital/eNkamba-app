/**
 * Utilitaire de résolution d'identité utilisateur multi-critères
 * Recherche un utilisateur par email, numéro eNkamba, numéro de carte ou téléphone
 */

import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';

export interface ResolvedUser {
  uid: string;
  data: any;
  foundBy: 'email' | 'accountNumber' | 'cardNumber' | 'phoneNumber' | 'uid';
}

/**
 * Recherche un utilisateur par n'importe quel identifiant
 * Essaie dans l'ordre: email, accountNumber, cardNumber, phoneNumber
 * 
 * @param identifier - L'identifiant à rechercher (peut être email, numéro eNkamba, carte ou téléphone)
 * @returns ResolvedUser si trouvé, null sinon
 */
export async function resolveUserByIdentifier(identifier: string): Promise<ResolvedUser | null> {
  if (!identifier || !identifier.trim()) {
    return null;
  }

  const cleanIdentifier = identifier.trim();
  const usersRef = collection(db, 'users');

  // Si c'est un UID Firebase direct (commence par un caractère alphanumérique de 28 caractères)
  if (cleanIdentifier.length === 28 && /^[a-zA-Z0-9]+$/.test(cleanIdentifier)) {
    try {
      const userDoc = await getDoc(doc(db, 'users', cleanIdentifier));
      if (userDoc.exists()) {
        return {
          uid: userDoc.id,
          data: userDoc.data(),
          foundBy: 'uid',
        };
      }
    } catch (error) {
      console.log('Pas un UID valide, continue la recherche...');
    }
  }

  // 1. Recherche par email (si contient @)
  if (cleanIdentifier.includes('@')) {
    try {
      const q = query(usersRef, where('email', '==', cleanIdentifier.toLowerCase()));
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const userDoc = snapshot.docs[0];
        return {
          uid: userDoc.id,
          data: userDoc.data(),
          foundBy: 'email',
        };
      }
    } catch (error) {
      console.error('Erreur recherche par email:', error);
    }
  }

  // 2. Recherche par numéro eNkamba (si commence par ENK)
  if (cleanIdentifier.toUpperCase().startsWith('ENK')) {
    try {
      console.log('[user-resolver] Recherche par accountNumber:', cleanIdentifier.toUpperCase());
      const q = query(usersRef, where('accountNumber', '==', cleanIdentifier.toUpperCase()));
      const snapshot = await getDocs(q);
      
      console.log('[user-resolver] Résultats accountNumber:', snapshot.size);
      
      if (!snapshot.empty) {
        const userDoc = snapshot.docs[0];
        console.log('[user-resolver] Utilisateur trouvé via accountNumber:', userDoc.id);
        return {
          uid: userDoc.id,
          data: userDoc.data(),
          foundBy: 'accountNumber',
        };
      }
      
      // Si pas trouvé, essayer de trouver par UID généré
      // Le numéro ENK est généré à partir du hash de l'UID
      // On va chercher tous les utilisateurs et vérifier leur numéro généré
      console.log('[user-resolver] Pas trouvé par accountNumber, recherche par hash...');
      const allUsersSnapshot = await getDocs(collection(db, 'users'));
      
      for (const userDoc of allUsersSnapshot.docs) {
        const userData = userDoc.data();
        
        // Générer le numéro eNkamba pour cet utilisateur
        const hash = userDoc.id.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
        const generatedEnkNumber = `ENK${String(hash).padStart(12, '0')}`;
        
        if (generatedEnkNumber === cleanIdentifier.toUpperCase()) {
          console.log('[user-resolver] Utilisateur trouvé via hash généré:', userDoc.id);
          
          // Mettre à jour le document avec le accountNumber
          try {
            await updateDoc(doc(db, 'users', userDoc.id), {
              accountNumber: generatedEnkNumber
            });
            console.log('[user-resolver] accountNumber mis à jour dans Firestore');
          } catch (updateError) {
            console.error('[user-resolver] Erreur mise à jour accountNumber:', updateError);
          }
          
          return {
            uid: userDoc.id,
            data: userData,
            foundBy: 'accountNumber',
          };
        }
      }
      
      console.log('[user-resolver] Aucun utilisateur trouvé avec ce numéro eNkamba');
    } catch (error) {
      console.error('[user-resolver] Erreur recherche par accountNumber:', error);
    }
  }

  // 3. Recherche par numéro de carte (si contient des chiffres et espaces)
  const cardNumberClean = cleanIdentifier.replace(/\s/g, '');
  if (/^\d+$/.test(cardNumberClean) && cardNumberClean.length >= 12) {
    try {
      // Essayer avec et sans espaces
      const q1 = query(usersRef, where('cardNumber', '==', cleanIdentifier));
      const snapshot1 = await getDocs(q1);
      
      if (!snapshot1.empty) {
        const userDoc = snapshot1.docs[0];
        return {
          uid: userDoc.id,
          data: userDoc.data(),
          foundBy: 'cardNumber',
        };
      }

      // Essayer sans espaces
      const q2 = query(usersRef, where('cardNumber', '==', cardNumberClean));
      const snapshot2 = await getDocs(q2);
      
      if (!snapshot2.empty) {
        const userDoc = snapshot2.docs[0];
        return {
          uid: userDoc.id,
          data: userDoc.data(),
          foundBy: 'cardNumber',
        };
      }

      // Essayer avec espaces formatés (XXXX XXXX XXXX XXXX)
      const formattedCard = cardNumberClean.match(/.{1,4}/g)?.join(' ');
      if (formattedCard) {
        const q3 = query(usersRef, where('cardNumber', '==', formattedCard));
        const snapshot3 = await getDocs(q3);
        
        if (!snapshot3.empty) {
          const userDoc = snapshot3.docs[0];
          return {
            uid: userDoc.id,
            data: userDoc.data(),
            foundBy: 'cardNumber',
          };
        }
      }
    } catch (error) {
      console.error('Erreur recherche par cardNumber:', error);
    }
  }

  // 4. Recherche par numéro de téléphone (si commence par + ou contient des chiffres)
  if (cleanIdentifier.startsWith('+') || /^\d+$/.test(cleanIdentifier.replace(/[\s-]/g, ''))) {
    try {
      const q = query(usersRef, where('phoneNumber', '==', cleanIdentifier));
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const userDoc = snapshot.docs[0];
        return {
          uid: userDoc.id,
          data: userDoc.data(),
          foundBy: 'phoneNumber',
        };
      }
    } catch (error) {
      console.error('Erreur recherche par phoneNumber:', error);
    }
  }

  // Aucun utilisateur trouvé
  return null;
}

/**
 * Recherche multiple d'utilisateurs par identifiants
 * Utile pour les paiements multiples
 * 
 * @param identifiers - Liste d'identifiants à rechercher
 * @returns Map des identifiants vers les utilisateurs résolus
 */
export async function resolveMultipleUsers(
  identifiers: string[]
): Promise<Map<string, ResolvedUser | null>> {
  const results = new Map<string, ResolvedUser | null>();

  // Rechercher en parallèle pour optimiser les performances
  const promises = identifiers.map(async (identifier) => {
    const resolved = await resolveUserByIdentifier(identifier);
    return { identifier, resolved };
  });

  const resolvedUsers = await Promise.all(promises);

  resolvedUsers.forEach(({ identifier, resolved }) => {
    results.set(identifier, resolved);
  });

  return results;
}

/**
 * Vérifie si un identifiant est valide (format correct)
 * 
 * @param identifier - L'identifiant à valider
 * @returns true si le format est valide
 */
export function isValidIdentifier(identifier: string): boolean {
  if (!identifier || !identifier.trim()) {
    return false;
  }

  const clean = identifier.trim();

  // Email
  if (clean.includes('@') && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
    return true;
  }

  // Numéro eNkamba
  if (clean.toUpperCase().startsWith('ENK') && clean.length >= 15) {
    return true;
  }

  // Numéro de carte (12-19 chiffres avec ou sans espaces)
  const cardClean = clean.replace(/\s/g, '');
  if (/^\d{12,19}$/.test(cardClean)) {
    return true;
  }

  // Numéro de téléphone (commence par + ou contient au moins 9 chiffres)
  if (clean.startsWith('+') || /\d{9,}/.test(clean.replace(/[\s-]/g, ''))) {
    return true;
  }

  return false;
}

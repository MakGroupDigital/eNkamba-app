/**
 * Script utilitaire pour générer et mettre à jour les accountNumber manquants
 * À exécuter une fois pour mettre à jour tous les utilisateurs existants
 */

import { db } from '@/lib/firebase';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';

export async function generateMissingAccountNumbers(): Promise<{
  total: number;
  updated: number;
  errors: number;
  results: Array<{ uid: string; accountNumber: string; status: 'updated' | 'error' | 'skipped' }>;
}> {
  console.log('🔄 Début de la génération des accountNumber manquants...');
  
  const results: Array<{ uid: string; accountNumber: string; status: 'updated' | 'error' | 'skipped' }> = [];
  let updated = 0;
  let errors = 0;
  
  try {
    // Récupérer tous les utilisateurs
    const usersSnapshot = await getDocs(collection(db, 'users'));
    console.log(`📊 ${usersSnapshot.size} utilisateurs trouvés`);
    
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const uid = userDoc.id;
      
      // Vérifier si accountNumber existe déjà
      if (userData.accountNumber) {
        console.log(`✓ ${uid}: accountNumber existe déjà (${userData.accountNumber})`);
        results.push({
          uid,
          accountNumber: userData.accountNumber,
          status: 'skipped',
        });
        continue;
      }
      
      // Générer le accountNumber
      const hash = uid.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
      const accountNumber = `ENK${String(hash).padStart(12, '0')}`;
      
      try {
        // Mettre à jour Firestore
        await updateDoc(doc(db, 'users', uid), {
          accountNumber: accountNumber,
        });
        
        console.log(`✅ ${uid}: accountNumber créé (${accountNumber})`);
        results.push({
          uid,
          accountNumber,
          status: 'updated',
        });
        updated++;
      } catch (error) {
        console.error(`❌ ${uid}: Erreur mise à jour`, error);
        results.push({
          uid,
          accountNumber,
          status: 'error',
        });
        errors++;
      }
    }
    
    console.log('\n📈 Résumé:');
    console.log(`   Total: ${usersSnapshot.size}`);
    console.log(`   Mis à jour: ${updated}`);
    console.log(`   Erreurs: ${errors}`);
    console.log(`   Ignorés: ${usersSnapshot.size - updated - errors}`);
    
    return {
      total: usersSnapshot.size,
      updated,
      errors,
      results,
    };
  } catch (error) {
    console.error('❌ Erreur globale:', error);
    throw error;
  }
}

/**
 * Générer le accountNumber pour un utilisateur spécifique
 */
export async function generateAccountNumberForUser(uid: string): Promise<string> {
  const hash = uid.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
  const accountNumber = `ENK${String(hash).padStart(12, '0')}`;
  
  try {
    await updateDoc(doc(db, 'users', uid), {
      accountNumber: accountNumber,
    });
    console.log(`✅ accountNumber créé pour ${uid}: ${accountNumber}`);
    return accountNumber;
  } catch (error) {
    console.error(`❌ Erreur création accountNumber pour ${uid}:`, error);
    throw error;
  }
}

/**
 * Vérifier si un accountNumber existe pour un utilisateur
 */
export async function checkAccountNumber(uid: string): Promise<string | null> {
  try {
    const userDoc = await getDocs(collection(db, 'users'));
    const user = userDoc.docs.find(doc => doc.id === uid);
    
    if (!user) {
      console.log(`❌ Utilisateur ${uid} non trouvé`);
      return null;
    }
    
    const userData = user.data();
    if (userData.accountNumber) {
      console.log(`✓ accountNumber existe: ${userData.accountNumber}`);
      return userData.accountNumber;
    }
    
    console.log(`⚠️ accountNumber manquant pour ${uid}`);
    return null;
  } catch (error) {
    console.error(`❌ Erreur vérification accountNumber:`, error);
    return null;
  }
}

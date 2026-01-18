# 📋 GUIDE DE DÉVELOPPEMENT - eNkamba.io

**Document de Référence Obligatoire**  
**Version:** 1.0  
**Date:** 14 janvier 2026  
**Statut:** Actif et Contraignant

---

## ⚠️ RÈGLES FONDAMENTALES (NON-NÉGOCIABLES)

### 1. 🔒 FIREBASE STORE & FIRESTORE - INTÉGRITÉ ABSOLUE

#### Règle Primaire
- **INTERDIT** de modifier les règles Firebase ou structures Firestore de manière globale
- Les modifications sont **UNIQUEMENT** autorisées au niveau spécifique de la fonctionnalité qui en a besoin
- Chaque modification doit être **documentée** avec la raison et la fonctionnalité concernée
- **JAMAIS** de modifications "au cas où" ou "pour l'avenir"

#### Processus de Modification
```
1. Identifier la fonctionnalité qui nécessite la modification
2. Étudier l'impact sur les autres modules
3. Modifier UNIQUEMENT ce qui est nécessaire
4. Documenter la modification dans un commentaire
5. Tester en isolation avant de merger
6. Valider qu'aucune autre fonctionnalité n'est affectée
```

#### Exemple ❌ INTERDIT
```typescript
// ❌ MAUVAIS - Modification globale
db.collection('users').doc(userId).update({
  // Modification de la structure globale
  newField: value
})
```

#### Exemple ✅ CORRECT
```typescript
// ✅ BON - Modification ciblée avec documentation
// Modification pour la fonctionnalité: Rapport Financier IA
// Raison: Ajouter le timestamp de la dernière analyse
db.collection('users').doc(userId).update({
  lastReportAnalysis: timestamp
})
```

---

### 2. 🚫 INTERDICTION DE SUPPOSITIONS

#### Règle Primaire
- **JAMAIS** supposer le comportement d'une fonctionnalité
- **JAMAIS** supposer qu'une donnée existe ou a un format spécifique
- **JAMAIS** supposer qu'une API répond comme prévu
- Chaque solution doit être **vérifiée**, **testée**, **documentée**

#### Processus de Vérification
```
1. Lire le code existant
2. Vérifier les tests existants
3. Tester manuellement le comportement
4. Documenter les résultats
5. Implémenter la solution basée sur les faits
```

#### Exemple ❌ INTERDIT
```typescript
// ❌ MAUVAIS - Supposition
const userBalance = userData.balance; // Et si balance n'existe pas?
const amount = userBalance - 100; // Crash potentiel
```

#### Exemple ✅ CORRECT
```typescript
// ✅ BON - Vérification
const userBalance = userData?.balance ?? 0;
if (typeof userBalance !== 'number') {
  throw new Error('Balance invalide ou manquante');
}
const amount = userBalance - 100;
```

---

### 3. ⏱️ PAS DE "EN ATTENDANT" - FAIRE DÉFINITIVEMENT

#### Règle Primaire
- **INTERDIT** de créer du code temporaire ou "en attendant"
- Le code temporaire devient permanent et crée de la dette technique
- Chaque ligne de code doit être **définitive** et **maintenable**
- Si tu ne peux pas le faire bien maintenant, **ne le fais pas**

#### Processus
```
1. Avant de coder: Vérifier que tu as tous les éléments
2. Planifier la solution complète
3. Implémenter de manière définitive
4. Tester complètement
5. Documenter
6. Merger uniquement si c'est 100% prêt
```

#### Exemple ❌ INTERDIT
```typescript
// ❌ MAUVAIS - Code temporaire
// TODO: À refactoriser plus tard
const result = await fetchData(); // Pas de gestion d'erreur
const processed = result.map(x => x.value); // Pas de vérification
// On verra plus tard si ça marche
```

#### Exemple ✅ CORRECT
```typescript
// ✅ BON - Code définitif
async function fetchAndProcessData() {
  try {
    const result = await fetchData();
    
    if (!Array.isArray(result)) {
      throw new Error('Format de données invalide');
    }
    
    const processed = result
      .filter(item => item && typeof item.value === 'number')
      .map(item => item.value);
    
    return processed;
  } catch (error) {
    logger.error('Erreur lors du traitement des données', error);
    throw error;
  }
}
```

---

### 4. 🔍 ÉTUDIER EFFICACEMENT AVANT DE CODER

#### Règle Primaire
- **CHAQUE problème** doit être étudié efficacement avant de proposer une solution
- Les solutions doivent être **réelles**, **testées**, **durables**
- Pas de solutions "magiques" ou "qui semblent marcher"
- Documenter l'analyse du problème avant la solution

#### Processus d'Étude
```
1. Définir le problème précisément
2. Identifier les causes racines
3. Lister les solutions possibles
4. Évaluer les pros/cons de chaque solution
5. Choisir la meilleure solution
6. Implémenter et tester
7. Documenter la décision
```

#### Template d'Analyse
```markdown
## Problème
[Description précise du problème]

## Causes Racines
- Cause 1
- Cause 2

## Solutions Possibles
1. Solution A - Pros: ... Cons: ...
2. Solution B - Pros: ... Cons: ...

## Solution Choisie
[Justification]

## Implémentation
[Code]

## Tests
[Résultats des tests]
```

---

### 5. 🚫 INTERDIT DE PRÉTENDRE

#### Règle Primaire
- **JAMAIS** prétendre que quelque chose fonctionne si ce n'est pas testé
- **JAMAIS** prétendre comprendre un code sans l'avoir lu
- **JAMAIS** prétendre qu'une solution est "simple" sans l'avoir implémentée
- **TOUJOURS** être honnête sur l'état du code et les limitations

#### Processus
```
1. Tester réellement le code
2. Documenter les résultats
3. Signaler les problèmes trouvés
4. Proposer des solutions réelles
5. Être transparent sur les limitations
```

---

### 6. ✅ VÉRIFIER LES DOUBLONS AVANT DE CRÉER

#### Règle Primaire
- **AVANT** de créer une nouvelle fonctionnalité, page ou composant:
  - Vérifier qu'elle n'existe pas déjà
  - Vérifier qu'une fonctionnalité similaire n'existe pas
  - Vérifier qu'on ne peut pas réutiliser du code existant
- **OBJECTIF:** Éviter les doublons et les erreurs

#### Processus de Vérification
```
1. Chercher dans src/app/ pour les pages
2. Chercher dans src/components/ pour les composants
3. Chercher dans src/lib/ pour les utilitaires
4. Chercher dans src/ai/flows/ pour les flows IA
5. Chercher dans la documentation du projet
6. Si rien trouvé: Créer la nouvelle fonctionnalité
7. Si trouvé: Modifier l'existant ou réutiliser
```

#### Checklist Avant Création
```
☐ Fonctionnalité similaire existe?
☐ Composant réutilisable existe?
☐ Utilitaire existe?
☐ Documentation mentionne quelque chose de similaire?
☐ Pas de doublon trouvé? → Créer
☐ Doublon trouvé? → Modifier l'existant
```

---

### 7. 🔐 NE PAS TOUCHER AUX FONCTIONNALITÉS QUI MARCHENT

#### Règle Primaire
- **INTERDIT** de modifier une fonctionnalité qui fonctionne déjà
- **SAUF** si c'est explicitement demandé
- **SAUF** si c'est un bug critique
- **OBJECTIF:** Éviter les régressions et les bugs

#### Processus
```
1. Identifier la fonctionnalité à développer
2. Vérifier qu'elle n'existe pas
3. Développer UNIQUEMENT cette fonctionnalité
4. Tester en isolation
5. Vérifier que les autres fonctionnalités marchent toujours
6. Merger uniquement si tout fonctionne
```

#### Exemple ❌ INTERDIT
```typescript
// ❌ MAUVAIS - Modification d'une fonction existante qui marche
// Fonction originale: Charger le profil utilisateur
export async function loadUserProfile(userId: string) {
  const user = await db.collection('users').doc(userId).get();
  return user.data();
}

// ❌ MODIFICATION NON DEMANDÉE
export async function loadUserProfile(userId: string) {
  const user = await db.collection('users').doc(userId).get();
  // Ajout non demandé
  const stats = await db.collection('stats').doc(userId).get();
  return { ...user.data(), stats: stats.data() };
}
```

#### Exemple ✅ CORRECT
```typescript
// ✅ BON - Créer une nouvelle fonction
// Fonction originale: Charger le profil utilisateur
export async function loadUserProfile(userId: string) {
  const user = await db.collection('users').doc(userId).get();
  return user.data();
}

// ✅ NOUVELLE FONCTION pour la nouvelle fonctionnalité
export async function loadUserProfileWithStats(userId: string) {
  const user = await db.collection('users').doc(userId).get();
  const stats = await db.collection('stats').doc(userId).get();
  return { ...user.data(), stats: stats.data() };
}
```

---

### 8. 🔄 COHÉRENCE DES PATTERNS ET ALGORITHMES

#### Règle Primaire
- **TOUS** les patterns et algorithmes doivent être **cohérents** dans l'app
- Si tu utilises `GET` pour charger des données, utilise `GET` partout
- Si tu utilises une structure de données, utilise la même structure partout
- **OBJECTIF:** Prévisibilité, maintenabilité, moins de bugs

#### Exemples de Cohérence

##### ❌ INCOHÉRENT
```typescript
// Module 1: Charger les photos de profil
async function loadProfilePhoto(userId: string) {
  return await db.collection('photos').doc(userId).get(); // GET
}

// Module 2: Charger les photos de galerie
async function loadGalleryPhotos(userId: string) {
  return await db.collection('photos').doc(userId).set({}); // SET ❌ INCOHÉRENT
}
```

##### ✅ COHÉRENT
```typescript
// Module 1: Charger les photos de profil
async function loadProfilePhoto(userId: string) {
  return await db.collection('photos').doc(userId).get(); // GET
}

// Module 2: Charger les photos de galerie
async function loadGalleryPhotos(userId: string) {
  return await db.collection('photos').doc(userId).get(); // GET ✅ COHÉRENT
}

// Module 3: Sauvegarder les photos
async function saveProfilePhoto(userId: string, photoData: any) {
  return await db.collection('photos').doc(userId).set(photoData); // SET
}
```

#### Patterns à Respecter
```typescript
// Pattern 1: Charger des données
async function loadData(id: string) {
  return await db.collection('collection').doc(id).get();
}

// Pattern 2: Sauvegarder des données
async function saveData(id: string, data: any) {
  return await db.collection('collection').doc(id).set(data);
}

// Pattern 3: Mettre à jour des données
async function updateData(id: string, data: any) {
  return await db.collection('collection').doc(id).update(data);
}

// Pattern 4: Supprimer des données
async function deleteData(id: string) {
  return await db.collection('collection').doc(id).delete();
}

// Pattern 5: Lister des données
async function listData(query?: any) {
  let q = db.collection('collection');
  if (query) q = q.where(...query);
  return await q.get();
}
```

---

## 📋 RÈGLES SUPPLÉMENTAIRES IMPORTANTES

### 9. 📝 DOCUMENTATION OBLIGATOIRE

#### Règle
- **CHAQUE** fonction complexe doit avoir un commentaire expliquant le "pourquoi"
- **CHAQUE** modification Firebase doit être documentée
- **CHAQUE** décision technique doit être justifiée
- **CHAQUE** bug fixé doit être documenté

#### Format de Documentation
```typescript
/**
 * Charge le profil utilisateur avec ses statistiques
 * 
 * @param userId - L'ID unique de l'utilisateur
 * @returns Objet contenant les données du profil et les stats
 * 
 * @throws Error si l'utilisateur n'existe pas
 * 
 * @example
 * const profile = await loadUserProfile('user123');
 * console.log(profile.name); // "John Doe"
 */
export async function loadUserProfile(userId: string) {
  // Implémentation
}
```

---

### 10. 🧪 TESTS OBLIGATOIRES

#### Règle
- **AUCUN** code en production sans tests
- **CHAQUE** fonction critique doit avoir des tests unitaires
- **CHAQUE** intégration Firebase doit avoir des tests
- **CHAQUE** feature doit avoir des tests d'intégration

#### Types de Tests
```
1. Tests Unitaires - Tester les fonctions isolées
2. Tests d'Intégration - Tester les interactions entre modules
3. Tests E2E - Tester les flux utilisateur complets
4. Tests de Performance - Vérifier les temps de réponse
```

---

### 11. ⚠️ GESTION DES ERREURS

#### Règle
- **JAMAIS** d'erreurs silencieuses
- **TOUJOURS** capturer et logger les erreurs
- **TOUJOURS** fournir un message d'erreur clair à l'utilisateur
- **TOUJOURS** avoir un plan de fallback

#### Pattern de Gestion d'Erreur
```typescript
async function criticalOperation(data: any) {
  try {
    // Validation
    if (!data || typeof data !== 'object') {
      throw new Error('Données invalides');
    }
    
    // Opération
    const result = await performOperation(data);
    
    // Vérification du résultat
    if (!result) {
      throw new Error('Opération échouée');
    }
    
    return result;
  } catch (error) {
    // Logging
    logger.error('Erreur lors de l\'opération critique', {
      error,
      data,
      timestamp: new Date()
    });
    
    // Notification utilisateur
    toast.error('Une erreur est survenue. Veuillez réessayer.');
    
    // Fallback
    return null;
  }
}
```

---

### 12. 🚀 PERFORMANCE

#### Règle
- **PAS** de requêtes inutiles à Firebase
- **OPTIMISER** les queries avec des index
- **CACHER** les données quand possible
- **PAGINER** les listes longues

#### Bonnes Pratiques
```typescript
// ❌ MAUVAIS - Requête inefficace
async function getAllUsers() {
  return await db.collection('users').get(); // Charge TOUS les utilisateurs
}

// ✅ BON - Requête optimisée
async function getUsersPaginated(pageSize: number = 20, lastDoc?: any) {
  let query = db.collection('users').limit(pageSize);
  if (lastDoc) {
    query = query.startAfter(lastDoc);
  }
  return await query.get();
}

// ✅ BON - Avec cache
const userCache = new Map();
async function getUserCached(userId: string) {
  if (userCache.has(userId)) {
    return userCache.get(userId);
  }
  const user = await db.collection('users').doc(userId).get();
  userCache.set(userId, user.data());
  return user.data();
}
```

---

### 13. 🔐 SÉCURITÉ

#### Règle
- **JAMAIS** exposer les clés API
- **TOUJOURS** valider côté serveur
- **TOUJOURS** utiliser les règles Firebase
- **TOUJOURS** chiffrer les données sensibles

#### Bonnes Pratiques
```typescript
// ❌ MAUVAIS - Clé API exposée
const apiKey = 'AIzaSyD...'; // Visible dans le code

// ✅ BON - Clé API en variable d'environnement
const apiKey = process.env.FIREBASE_API_KEY;

// ❌ MAUVAIS - Pas de validation
async function updateUserBalance(userId: string, amount: number) {
  await db.collection('users').doc(userId).update({ balance: amount });
}

// ✅ BON - Validation côté serveur
async function updateUserBalance(userId: string, amount: number) {
  // Valider que l'utilisateur est authentifié
  if (!currentUser) throw new Error('Non authentifié');
  
  // Valider que c'est son propre compte
  if (currentUser.uid !== userId) throw new Error('Non autorisé');
  
  // Valider le montant
  if (typeof amount !== 'number' || amount < 0) {
    throw new Error('Montant invalide');
  }
  
  // Mettre à jour
  await db.collection('users').doc(userId).update({ balance: amount });
}
```

---

### 14. 📊 LOGGING & MONITORING

#### Règle
- **CHAQUE** action critique doit être loggée
- **CHAQUE** erreur doit être loggée
- **CHAQUE** transaction doit être tracée
- **OBJECTIF:** Déboguer facilement et monitorer la santé de l'app

#### Niveaux de Log
```typescript
logger.debug('Message de débogage'); // Développement
logger.info('Information générale'); // Événements normaux
logger.warn('Avertissement'); // Situations anormales
logger.error('Erreur', error); // Erreurs
logger.critical('Critique', error); // Erreurs critiques
```

#### Exemple
```typescript
async function processPayment(userId: string, amount: number) {
  logger.info('Début du traitement du paiement', { userId, amount });
  
  try {
    const user = await loadUser(userId);
    logger.debug('Utilisateur chargé', { userId });
    
    if (user.balance < amount) {
      logger.warn('Solde insuffisant', { userId, balance: user.balance, amount });
      throw new Error('Solde insuffisant');
    }
    
    const result = await processTransaction(userId, amount);
    logger.info('Paiement traité avec succès', { userId, amount, transactionId: result.id });
    
    return result;
  } catch (error) {
    logger.error('Erreur lors du traitement du paiement', { userId, amount, error });
    throw error;
  }
}
```

---

### 15. 🔄 VERSIONING DES DONNÉES

#### Règle
- **DOCUMENTER** les versions des structures de données
- **ÉVITER** les incompatibilités entre versions
- **MIGRER** les données quand la structure change
- **OBJECTIF:** Éviter les bugs liés aux changements de structure

#### Format de Versioning
```typescript
/**
 * Structure de l'utilisateur
 * 
 * Version 1.0 (14/01/2026)
 * - id: string
 * - name: string
 * - email: string
 * - balance: number
 * 
 * Version 1.1 (15/01/2026)
 * - Ajout: lastLogin: timestamp
 * - Ajout: preferences: object
 */

interface User {
  id: string;
  name: string;
  email: string;
  balance: number;
  lastLogin?: timestamp; // Nouveau en v1.1
  preferences?: object; // Nouveau en v1.1
}
```

---

### 16. 🔄 ROLLBACK PLAN

#### Règle
- **AVANT** chaque déploiement, avoir un plan pour revenir en arrière
- **DOCUMENTER** les étapes de rollback
- **TESTER** le rollback avant de déployer
- **OBJECTIF:** Minimiser les dégâts en cas de problème

#### Template de Rollback
```markdown
## Déploiement: [Nom de la feature]
Date: [Date]

### Changements
- [Changement 1]
- [Changement 2]

### Plan de Rollback
1. Revert le commit: `git revert [commit-hash]`
2. Redéployer: `npm run build && npm run deploy`
3. Vérifier: Tester les fonctionnalités critiques
4. Notifier: Informer l'équipe

### Temps estimé: 15 minutes
```

---

### 17. 👀 CODE REVIEW OBLIGATOIRE

#### Règle
- **CHAQUE** changement doit être revu avant merge
- **MINIMUM** 1 reviewer
- **VÉRIFIER** les règles de ce guide
- **OBJECTIF:** Maintenir la qualité du code

#### Checklist de Review
```
☐ Code suit les règles de ce guide?
☐ Pas de modifications globales Firebase?
☐ Pas de suppositions?
☐ Code est définitif (pas de "en attendant")?
☐ Pas de doublons?
☐ Fonctionnalités existantes ne sont pas affectées?
☐ Patterns sont cohérents?
☐ Documentation est présente?
☐ Tests sont présents?
☐ Gestion d'erreurs est correcte?
☐ Performance est acceptable?
☐ Sécurité est respectée?
```

---

### 18. 📛 NAMING CONVENTIONS

#### Règle
- **NOMS CLAIRS** et cohérents pour variables, fonctions, collections
- **ÉVITER** les abréviations confuses
- **UTILISER** camelCase pour les variables et fonctions
- **UTILISER** PascalCase pour les classes et types
- **UTILISER** UPPER_SNAKE_CASE pour les constantes

#### Exemples
```typescript
// ❌ MAUVAIS
const u = userData;
const fn = (x) => x * 2;
const db_users = [];

// ✅ BON
const user = userData;
const doubleValue = (value) => value * 2;
const dbUsers = [];

// Collections Firebase
const USERS_COLLECTION = 'users';
const TRANSACTIONS_COLLECTION = 'transactions';
const REPORTS_COLLECTION = 'reports';

// Types
interface User {
  id: string;
  name: string;
}

// Constantes
const MAX_RETRY_ATTEMPTS = 3;
const DEFAULT_PAGE_SIZE = 20;
```

---

### 19. 🔗 DÉPENDANCES & IMPORTS

#### Règle
- **ORGANISER** les imports de manière logique
- **ÉVITER** les imports circulaires
- **DOCUMENTER** les dépendances externes
- **MINIMISER** les dépendances

#### Format d'Import
```typescript
// 1. Imports React/Next
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// 2. Imports de bibliothèques externes
import { z } from 'zod';
import { format } from 'date-fns';

// 3. Imports locaux - Utilitaires
import { logger } from '@/lib/logger';
import { db } from '@/lib/firebase';

// 4. Imports locaux - Composants
import { Button } from '@/components/ui/button';
import { UserCard } from '@/components/user-card';

// 5. Imports locaux - Types
import type { User } from '@/types/user';
```

---

### 20. 🎯 PROCESSUS DE DÉVELOPPEMENT

#### Étapes Obligatoires
```
1. PLANIFICATION
   ☐ Définir le problème
   ☐ Étudier les solutions
   ☐ Vérifier les doublons
   ☐ Documenter la décision

2. DÉVELOPPEMENT
   ☐ Créer une branche
   ☐ Implémenter la solution
   ☐ Respecter les patterns
   ☐ Ajouter la documentation
   ☐ Ajouter les tests

3. TESTING
   ☐ Tests unitaires
   ☐ Tests d'intégration
   ☐ Tests manuels
   ☐ Vérifier les régressions

4. REVIEW
   ☐ Code review
   ☐ Vérifier les règles
   ☐ Approuver les changements

5. DÉPLOIEMENT
   ☐ Merger la branche
   ☐ Déployer en staging
   ☐ Tester en staging
   ☐ Déployer en production
   ☐ Monitorer

6. DOCUMENTATION
   ☐ Documenter les changements
   ☐ Mettre à jour le CONTEXT.md
   ☐ Notifier l'équipe
```

---

## 🚨 VIOLATIONS GRAVES

### Actions Interdites (Risque de Revert)
- ❌ Modifier les règles Firebase globalement
- ❌ Toucher à une fonctionnalité qui marche sans demande
- ❌ Créer du code temporaire
- ❌ Faire des suppositions sans vérification
- ❌ Créer des doublons
- ❌ Déployer sans tests
- ❌ Ignorer les patterns existants
- ❌ Exposer les clés API
- ❌ Faire des modifications sans documentation
- ❌ Merger sans code review

### Conséquences
- **1ère violation:** Avertissement + Revert du code
- **2e violation:** Suspension du droit de commit
- **3e violation:** Révision complète du processus

---

## ✅ CHECKLIST AVANT CHAQUE COMMIT

```
☐ Code suit les règles de ce guide?
☐ Pas de suppositions?
☐ Pas de code temporaire?
☐ Pas de modifications globales Firebase?
☐ Pas de doublons?
☐ Fonctionnalités existantes marchent toujours?
☐ Patterns sont cohérents?
☐ Documentation est présente?
☐ Tests sont présents et passent?
☐ Gestion d'erreurs est correcte?
☐ Performance est acceptable?
☐ Sécurité est respectée?
☐ Naming conventions sont respectées?
☐ Code review est faite?
☐ Rollback plan est documenté?
```

---

## 📞 QUESTIONS FRÉQUENTES

### Q: Je dois modifier une fonctionnalité existante, c'est autorisé?
**R:** Seulement si c'est explicitement demandé ou si c'est un bug critique. Sinon, crée une nouvelle fonction.

### Q: Je peux faire du code temporaire "en attendant"?
**R:** Non. Le code temporaire devient permanent. Fais-le bien dès le départ.

### Q: Je peux supposer que cette donnée existe?
**R:** Non. Vérifie toujours. Utilise des types TypeScript et des validations Zod.

### Q: Je peux modifier les règles Firebase pour ma feature?
**R:** Oui, mais UNIQUEMENT pour ta feature spécifique. Documente la modification.

### Q: Je peux créer une nouvelle fonction similaire à une existante?
**R:** Non. Réutilise la fonction existante ou refactorise-la.

### Q: Je peux déployer sans tests?
**R:** Non. Aucun code en production sans tests.

---

## 📚 RESSOURCES

- **CONTEXT.md** - Vue d'ensemble du projet
- **Code existant** - Patterns et conventions
- **Firebase Docs** - Documentation officielle
- **TypeScript Docs** - Guide TypeScript
- **Next.js Docs** - Guide Next.js

---

**Dernière mise à jour:** 14 janvier 2026  
**Responsable:** Équipe de développement eNkamba.io  
**Statut:** Actif et Obligatoire

---

## 🎯 RÉSUMÉ EN UNE PHRASE

**Développe de manière définitive, vérifiée, cohérente et documentée. Ne touche pas à ce qui marche. Étudie avant de coder. Teste tout. Documente tout.**


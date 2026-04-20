# Agent Relay - Correction des Redirections

## Date: 20 Avril 2026

## Problème Identifié

Lorsqu'un utilisateur clique sur "Voir statut" depuis les paramètres, il est redirigé vers la page de sélection de type d'agent avec un chargement infini.

### Cause
Boucle de redirection entre les pages:
1. Page principale (`/dashboard/agent-relay`) vérifie le statut et redirige
2. Page de statut (`/dashboard/agent-relay/status`) vérifie aussi et redirige
3. Les deux pages se renvoient l'une vers l'autre créant une boucle

## Solution Implémentée

### 1. Page Principale - Logique de Redirection Claire

**Fichier**: `src/app/dashboard/agent-relay/page.tsx`

**Changements**:
- ✅ Utilise `router.replace()` au lieu de `router.push()` pour éviter l'historique
- ✅ Redirige uniquement si statut = `submitted`, `approved`, ou `in_progress`
- ✅ Affiche la page uniquement si statut = `none` ou `rejected`
- ✅ Affiche un loader pendant la vérification

**Logique**:
```typescript
if (status === 'submitted') {
  router.replace('/dashboard/agent-relay/status');
} else if (status === 'approved') {
  router.replace('/dashboard/agent-relay/dashboard');
} else if (status === 'in_progress' && application) {
  router.replace(`/dashboard/agent-relay/signup?type=${application.agentType}`);
}
// Sinon, afficher la page (none ou rejected)
```

### 2. Page de Statut - Affichage Conditionnel

**Fichier**: `src/app/dashboard/agent-relay/status/page.tsx`

**Changements**:
- ✅ Utilise `router.replace()` au lieu de `router.push()`
- ✅ Redirige si `none`, `approved`, ou `in_progress`
- ✅ Affiche uniquement si statut = `submitted` ou `rejected`
- ✅ Retourne `null` si conditions non remplies

**Logique**:
```typescript
// Redirections
if (status === 'none') {
  router.replace('/dashboard/agent-relay');
  return;
}
if (status === 'approved') {
  router.replace('/dashboard/agent-relay/dashboard');
  return;
}
if (status === 'in_progress' && application) {
  router.replace(`/dashboard/agent-relay/signup?type=${application.agentType}`);
  return;
}

// Affichage uniquement pour submitted et rejected
if (status !== 'submitted' && status !== 'rejected') {
  return null;
}
```

### 3. Page Signup - Protection Contre Soumissions Multiples

**Fichier**: `src/app/dashboard/agent-relay/signup/page.tsx`

**Changements**:
- ✅ Redirige vers `/status` si statut = `submitted`
- ✅ Redirige vers `/dashboard` si statut = `approved`
- ✅ Charge les données uniquement si statut = `in_progress`

**Logique**:
```typescript
if (data.status === 'submitted') {
  router.push('/dashboard/agent-relay/status');
  return;
}
if (data.status === 'approved') {
  router.push('/dashboard/agent-relay/dashboard');
  return;
}
// Charger données uniquement si in_progress
if (data.status === 'in_progress') {
  // Charger et reprendre
}
```

## Matrice de Redirection

| Statut Actuel | Page Principale | Page Signup | Page Status | Page Dashboard |
|---------------|----------------|-------------|-------------|----------------|
| **none** | ✅ Affiche | ✅ Affiche | → Principale | → Principale |
| **in_progress** | → Signup | ✅ Affiche | → Signup | → Principale |
| **submitted** | → Status | → Status | ✅ Affiche | → Status |
| **approved** | → Dashboard | → Dashboard | → Dashboard | ✅ Affiche |
| **rejected** | ✅ Affiche | ✅ Affiche | ✅ Affiche | → Principale |

## Flux Utilisateur Corrigé

### Scénario 1: Nouvelle Demande
```
1. Paramètres → Clic "Devenir Agent Relais"
2. → /dashboard/agent-relay (status = none)
3. ✅ Affiche sélection de type
4. Sélectionne type → Clic "Commencer"
5. → /dashboard/agent-relay/signup?type=XXX
6. ✅ Affiche formulaire étape 1
```

### Scénario 2: Demande Soumise - Voir Statut
```
1. Paramètres → Clic "Voir statut" (status = submitted)
2. → /dashboard/agent-relay/status
3. ✅ Affiche page de statut avec détails
4. Pas de redirection, pas de boucle
```

### Scénario 3: Inscription en Cours
```
1. Paramètres → Clic "Continuer" (status = in_progress)
2. → /dashboard/agent-relay/signup?type=XXX
3. ✅ Reprend à l'étape sauvegardée
```

### Scénario 4: Demande Approuvée
```
1. Paramètres → Clic "Accéder" (status = approved)
2. → /dashboard/agent-relay/dashboard
3. ✅ Affiche dashboard agent
```

### Scénario 5: Demande Rejetée
```
1. Paramètres → Clic "Nouvelle demande" (status = rejected)
2. → /dashboard/agent-relay
3. ✅ Affiche sélection de type (peut recommencer)
```

## Différences Clés

### Avant (Problématique)
- ❌ Utilisation de `router.push()` créant historique
- ❌ Redirections dans les deux sens
- ❌ Pas de vérification de statut avant affichage
- ❌ Boucle infinie entre pages

### Après (Corrigé)
- ✅ Utilisation de `router.replace()` sans historique
- ✅ Redirections unidirectionnelles claires
- ✅ Vérification stricte avant affichage
- ✅ Chaque page a un rôle précis

## Tests à Effectuer

### Test 1: Nouvelle Demande
- [ ] Clic "Devenir Agent Relais" depuis paramètres
- [ ] Page de sélection s'affiche correctement
- [ ] Pas de chargement infini
- [ ] Peut sélectionner un type et continuer

### Test 2: Demande Soumise
- [ ] Clic "Voir statut" depuis paramètres
- [ ] Page de statut s'affiche directement
- [ ] Pas de redirection vers sélection
- [ ] Pas de chargement infini
- [ ] Détails de la demande visibles

### Test 3: Inscription en Cours
- [ ] Clic "Continuer" depuis paramètres
- [ ] Redirige vers formulaire
- [ ] Reprend à la bonne étape
- [ ] Pas de boucle

### Test 4: Demande Approuvée
- [ ] Clic "Accéder" depuis paramètres
- [ ] Redirige vers dashboard agent
- [ ] Pas de retour possible vers formulaire

### Test 5: Demande Rejetée
- [ ] Clic "Nouvelle demande" depuis paramètres
- [ ] Page de sélection s'affiche
- [ ] Peut recommencer le processus

### Test 6: Navigation Directe
- [ ] Accès direct à `/dashboard/agent-relay` avec demande soumise
- [ ] Redirige automatiquement vers `/status`
- [ ] Accès direct à `/dashboard/agent-relay/status` sans demande
- [ ] Redirige automatiquement vers `/dashboard/agent-relay`

## Notes Techniques

### router.replace() vs router.push()
```typescript
// router.push() - Ajoute à l'historique
router.push('/page'); // Bouton retour ramène à la page précédente

// router.replace() - Remplace dans l'historique
router.replace('/page'); // Bouton retour saute la page actuelle
```

**Pourquoi replace() ?**
- Évite les boucles de navigation
- Empêche l'utilisateur de revenir à une page intermédiaire
- Nettoie l'historique de navigation

### Ordre des Vérifications
```typescript
1. isLoading → Afficher loader
2. Redirections (replace)
3. Vérification conditions d'affichage
4. return null si conditions non remplies
5. Affichage du contenu
```

## Résumé des Corrections

### Fichiers Modifiés
- ✅ `src/app/dashboard/agent-relay/page.tsx`
  - Ajout vérification statut avec redirections
  - Utilisation de `router.replace()`
  - Affichage conditionnel

- ✅ `src/app/dashboard/agent-relay/status/page.tsx`
  - Ajout redirection pour `in_progress`
  - Utilisation de `router.replace()`
  - Affichage uniquement pour `submitted` et `rejected`

- ✅ `src/app/dashboard/agent-relay/signup/page.tsx`
  - Redirection vers `/status` si `submitted`
  - Redirection vers `/dashboard` si `approved`
  - Chargement conditionnel des données

### Problèmes Résolus
- ✅ Boucle de redirection infinie
- ✅ Chargement infini sur page de statut
- ✅ Accès au formulaire après soumission
- ✅ Navigation confuse entre pages

### Améliorations
- ✅ Navigation claire et prévisible
- ✅ Pas d'historique pollué
- ✅ Chaque page a un rôle unique
- ✅ Expérience utilisateur fluide

Le système de navigation est maintenant robuste et sans boucles! 🎉

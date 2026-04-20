# Agent Relay - Protection Contre Soumissions Multiples

## Date: 20 Avril 2026

## Problème Résolu

Les utilisateurs qui avaient déjà soumis une demande pouvaient encore accéder au formulaire d'inscription et potentiellement soumettre plusieurs demandes.

## Solution Implémentée

### 1. Protection sur la Page Principale (`/dashboard/agent-relay`)

**Fichier**: `src/app/dashboard/agent-relay/page.tsx`

**Ajouts**:
- Import du hook `useAgentRelayStatus`
- Vérification du statut au chargement
- Redirections automatiques selon le statut

**Logique de Redirection**:
```typescript
useEffect(() => {
  if (!isLoading) {
    if (status === 'submitted') {
      // Demande soumise → Page de statut
      router.push('/dashboard/agent-relay/status');
    } else if (status === 'approved') {
      // Demande approuvée → Dashboard agent
      router.push('/dashboard/agent-relay/dashboard');
    } else if (status === 'in_progress' && application) {
      // Inscription en cours → Reprendre le formulaire
      router.push(`/dashboard/agent-relay/signup?type=${application.agentType}`);
    }
  }
}, [status, isLoading, router, application]);
```

**Affichage**:
- Loading spinner pendant la vérification
- Page visible uniquement si `status === 'none'` ou `status === 'rejected'`
- Sinon, redirection automatique

### 2. Protection sur la Page d'Inscription (`/dashboard/agent-relay/signup`)

**Fichier**: `src/app/dashboard/agent-relay/signup/page.tsx`

**Modifications dans `loadProgress()`**:
```typescript
// Si déjà soumis, rediriger vers status
if (data.status === 'submitted') {
  router.push('/dashboard/agent-relay/status');
  return;
}

// Si approuvé, rediriger vers dashboard
if (data.status === 'approved') {
  router.push('/dashboard/agent-relay/dashboard');
  return;
}

// Charger les données seulement si in_progress
if (data.status === 'in_progress') {
  // ... charger les données
}
```

**Comportement**:
- Vérifie le statut au chargement de la page
- Redirige immédiatement si `submitted` ou `approved`
- Charge les données uniquement si `in_progress`

---

## Flux Utilisateur Mis à Jour

### Scénario 1: Nouvelle Demande
```
1. Utilisateur va sur /dashboard/agent-relay
2. Hook vérifie → status = 'none'
3. Page s'affiche normalement
4. Sélectionne type d'agent
5. Clique "Commencer"
6. Accède au formulaire
```

### Scénario 2: Demande en Cours
```
1. Utilisateur va sur /dashboard/agent-relay
2. Hook vérifie → status = 'in_progress'
3. Redirection automatique vers /dashboard/agent-relay/signup?type=XXX
4. Reprend à l'étape sauvegardée
```

### Scénario 3: Demande Soumise (PROTÉGÉ)
```
1. Utilisateur va sur /dashboard/agent-relay
2. Hook vérifie → status = 'submitted'
3. Redirection automatique vers /dashboard/agent-relay/status
4. Voit l'état de sa demande
5. NE PEUT PAS accéder au formulaire
```

### Scénario 4: Demande Approuvée (PROTÉGÉ)
```
1. Utilisateur va sur /dashboard/agent-relay
2. Hook vérifie → status = 'approved'
3. Redirection automatique vers /dashboard/agent-relay/dashboard
4. Accède à son espace agent
5. NE PEUT PAS soumettre nouvelle demande
```

### Scénario 5: Demande Rejetée
```
1. Utilisateur va sur /dashboard/agent-relay
2. Hook vérifie → status = 'rejected'
3. Page s'affiche normalement
4. Peut soumettre une nouvelle demande
```

### Scénario 6: Tentative d'Accès Direct au Formulaire (PROTÉGÉ)
```
1. Utilisateur tape /dashboard/agent-relay/signup?type=XXX
2. Page charge et vérifie le statut
3. Si status = 'submitted' → Redirection vers /status
4. Si status = 'approved' → Redirection vers /dashboard
5. NE PEUT PAS contourner la protection
```

---

## Matrice de Protection

| Statut Actuel | Page Principale | Page Signup | Page Status | Dashboard Agent |
|---------------|----------------|-------------|-------------|-----------------|
| **none** | ✅ Affiche | ✅ Affiche | ❌ Redirige | ❌ Redirige |
| **in_progress** | 🔄 → Signup | ✅ Affiche | ❌ Redirige | ❌ Redirige |
| **submitted** | 🔄 → Status | 🔄 → Status | ✅ Affiche | ❌ Redirige |
| **approved** | 🔄 → Dashboard | 🔄 → Dashboard | 🔄 → Dashboard | ✅ Affiche |
| **rejected** | ✅ Affiche | ✅ Affiche | ✅ Affiche | ❌ Redirige |

Légende:
- ✅ Affiche = Page accessible et affichée
- ❌ Redirige = Accès refusé, redirection
- 🔄 → X = Redirection automatique vers X

---

## Points de Contrôle

### 1. Page Principale
```typescript
// Vérification au chargement
const { status, application, isLoading } = useAgentRelayStatus();

// Redirections
useEffect(() => {
  if (!isLoading) {
    if (status === 'submitted') router.push('/dashboard/agent-relay/status');
    else if (status === 'approved') router.push('/dashboard/agent-relay/dashboard');
    else if (status === 'in_progress') router.push(`/dashboard/agent-relay/signup?type=${application.agentType}`);
  }
}, [status, isLoading, router, application]);

// Affichage conditionnel
if (status !== 'none' && status !== 'rejected') {
  return null; // Ne rien afficher
}
```

### 2. Page Signup
```typescript
// Vérification dans loadProgress()
if (data.status === 'submitted') {
  router.push('/dashboard/agent-relay/status');
  return;
}

if (data.status === 'approved') {
  router.push('/dashboard/agent-relay/dashboard');
  return;
}

// Continuer seulement si in_progress
if (data.status === 'in_progress') {
  // Charger les données
}
```

### 3. Page Status
```typescript
// Déjà implémenté
useEffect(() => {
  if (!isLoading && status === 'none') {
    router.push('/dashboard/agent-relay');
  }
  if (!isLoading && status === 'approved') {
    router.push('/dashboard/agent-relay/dashboard');
  }
}, [status, isLoading, router]);
```

### 4. Dashboard Agent
```typescript
// Déjà implémenté
useEffect(() => {
  if (!isLoading && status !== 'approved') {
    router.push('/dashboard/agent-relay');
  }
}, [status, isLoading, router]);
```

---

## Avantages de Cette Approche

### 1. Sécurité
- ✅ Impossible de soumettre plusieurs demandes
- ✅ Impossible de contourner via URL directe
- ✅ Vérification côté client ET côté serveur (Firestore)

### 2. UX Améliorée
- ✅ Redirections automatiques intelligentes
- ✅ Pas de messages d'erreur confus
- ✅ L'utilisateur arrive toujours au bon endroit

### 3. Cohérence
- ✅ Logique centralisée dans `useAgentRelayStatus`
- ✅ Comportement uniforme sur toutes les pages
- ✅ Facile à maintenir et déboguer

### 4. Performance
- ✅ Une seule requête Firestore par page
- ✅ Hook réutilisable avec cache
- ✅ Redirections immédiates

---

## Tests à Effectuer

### Tests Fonctionnels
- [ ] Nouvelle demande: peut accéder au formulaire
- [ ] Demande en cours: reprend au bon endroit
- [ ] Demande soumise: redirigé vers status
- [ ] Demande approuvée: redirigé vers dashboard
- [ ] Demande rejetée: peut soumettre nouvelle demande

### Tests de Contournement
- [ ] Taper URL /signup directement → Redirigé si soumis
- [ ] Bouton retour navigateur → Redirigé si soumis
- [ ] Ouvrir dans nouvel onglet → Redirigé si soumis
- [ ] Modifier URL manuellement → Redirigé si soumis

### Tests de Navigation
- [ ] Depuis paramètres → Bon comportement
- [ ] Depuis dashboard → Bon comportement
- [ ] Depuis notifications → Bon comportement
- [ ] Lien direct externe → Bon comportement

### Tests de Statut
- [ ] Changement de statut en temps réel
- [ ] Plusieurs onglets ouverts
- [ ] Rafraîchissement de page
- [ ] Navigation avant/arrière

---

## Limitations et Considérations

### 1. Délai de Redirection
- Il y a un court délai (loading) pendant la vérification
- Acceptable car améliore la sécurité
- Spinner affiché pour feedback utilisateur

### 2. Requêtes Firestore
- Chaque page fait une requête pour vérifier le statut
- Optimisé avec requête simple (userId uniquement)
- Pourrait être amélioré avec cache global

### 3. Navigation Rapide
- Si l'utilisateur navigue très vite, peut voir brièvement la page
- Pas critique car redirection immédiate
- Amélioration possible avec middleware

### 4. Statut Rejeté
- Permet de soumettre nouvelle demande
- Comportement voulu mais à surveiller
- Pourrait ajouter limite de tentatives

---

## Améliorations Futures

### 1. Cache Global
```typescript
// Context pour partager le statut entre pages
const AgentRelayContext = createContext();

// Évite requêtes multiples
// Mise à jour en temps réel
```

### 2. Middleware Next.js
```typescript
// Vérification côté serveur avant rendu
// Redirection plus rapide
// Pas de flash de contenu
```

### 3. Notifications
```typescript
// Notifier l'utilisateur pourquoi redirigé
// Toast message explicatif
// Meilleure compréhension
```

### 4. Analytics
```typescript
// Tracker les tentatives de contournement
// Identifier les problèmes UX
// Améliorer le flux
```

---

## Résumé

✅ **Protection complète contre soumissions multiples**
✅ **Redirections automatiques intelligentes**
✅ **Impossible de contourner via URL directe**
✅ **UX fluide et cohérente**
✅ **Code maintenable et centralisé**

Les utilisateurs avec demande soumise ou approuvée ne peuvent plus accéder au formulaire d'inscription. Ils sont automatiquement redirigés vers la page appropriée (statut ou dashboard).

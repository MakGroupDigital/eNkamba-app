# Agent Relay Status Management - April 20, 2026

## Nouvelles Fonctionnalités Implémentées

### 1. Hook de Statut Agent Relais
**Fichier**: `src/hooks/useAgentRelayStatus.ts`

Hook personnalisé qui vérifie le statut de la demande agent relais de l'utilisateur.

**Statuts possibles**:
- `none` - Aucune demande
- `in_progress` - Inscription en cours (pas encore soumise)
- `submitted` - Demande soumise, en attente d'examen
- `approved` - Demande approuvée, compte agent actif
- `rejected` - Demande rejetée

**Retourne**:
- `status` - Le statut actuel
- `application` - Les détails de la demande
- `isLoading` - État de chargement

### 2. Section Agent Relais Dynamique (Paramètres)
**Fichier**: `src/components/agent-relay/AgentRelaySection.tsx`

La section dans les paramètres s'adapte maintenant au statut de la demande:

#### Aucune demande (`none`)
- Affiche "Devenir Agent Relais"
- Bouton pour commencer l'inscription

#### Demande en cours (`in_progress`)
- Badge orange "Étape X/5"
- Affiche la progression
- Bouton "Continuer" pour reprendre l'inscription

#### Demande soumise (`submitted`)
- Badge orange "En examen"
- Message "Demande en cours de traitement"
- Bouton "Voir statut" pour voir les détails

#### Demande approuvée (`approved`)
- Badge vert "Actif"
- Message "Compte Agent Relais Actif"
- Bouton "Accéder" vers le dashboard agent

#### Demande rejetée (`rejected`)
- Badge rouge "Rejetée"
- Affiche la raison du rejet
- Bouton "Nouvelle demande" pour recommencer

### 3. Page Principale Agent Relais Améliorée
**Fichier**: `src/app/dashboard/agent-relay/page.tsx`

**Changements**:
- ✅ Sélection obligatoire du type d'agent avant de continuer
- ✅ Interface avec cartes sélectionnables
- ✅ Bouton "Commencer" désactivé tant qu'aucun type n'est sélectionné
- ✅ Indication visuelle du type sélectionné (checkmark vert)
- ✅ Descriptions pour chaque type d'agent

**Types d'agents**:
1. **Agent Relais** - Effectuez des transactions pour vos clients
2. **Cabiniste** - Gérez un point de vente fixe
3. **Point de Service** - Offrez des services eNkamba dans votre commerce

### 4. Page de Statut de Demande
**Fichier**: `src/app/dashboard/agent-relay/status/page.tsx`

Page dédiée pour voir l'état de sa demande avec:
- Carte de statut colorée selon l'état
- Détails de la demande (type, nom, téléphone, date)
- Actions contextuelles selon le statut
- Lien vers le support

**Redirections automatiques**:
- Si `none` → Redirige vers `/dashboard/agent-relay`
- Si `approved` → Redirige vers `/dashboard/agent-relay/dashboard`

### 5. Dashboard Agent (Placeholder)
**Fichier**: `src/app/dashboard/agent-relay/dashboard/page.tsx`

Dashboard pour les agents approuvés avec:
- Carte de bienvenue personnalisée
- Statistiques (solde, clients, transactions)
- Actions rapides
- Notice "En développement"

**Accès**: Uniquement pour les utilisateurs avec statut `approved`

## Structure Firestore

### Collection: `agentRelayApplications`

```typescript
{
  id: string,
  userId: string,
  agentType: 'agent-relais' | 'cabinet' | 'point-service',
  status: 'in_progress' | 'submitted' | 'approved' | 'rejected',
  currentStep: number, // 1-5
  
  // Données personnelles
  phoneNumber: string,
  pinHash: string,
  profileType: 'individual' | 'enterprise',
  fullName: string,
  dateOfBirth: string,
  idType: string,
  idNumber: string,
  
  // Biométrie
  selfieUrl: string,
  videoUrl: string,
  
  // Dates
  createdAt: Timestamp,
  updatedAt: Timestamp,
  submittedAt?: Timestamp,
  reviewedAt?: Timestamp,
  
  // Rejet
  rejectionReason?: string
}
```

## Flux Utilisateur

### Nouveau Utilisateur
1. Va dans Paramètres → Voit "Devenir Agent Relais"
2. Clique → Arrive sur `/dashboard/agent-relay`
3. Sélectionne un type d'agent (obligatoire)
4. Clique "Commencer l'inscription"
5. Redirigé vers `/dashboard/agent-relay/signup?type=XXX`
6. Complète les 5 étapes
7. Soumet la demande

### Utilisateur avec Demande en Cours
1. Va dans Paramètres → Voit "Demande en cours - Étape X/5"
2. Clique "Continuer" → Reprend à l'étape sauvegardée
3. Complète les étapes restantes

### Utilisateur avec Demande Soumise
1. Va dans Paramètres → Voit "Demande en cours de traitement"
2. Clique "Voir statut" → Arrive sur `/dashboard/agent-relay/status`
3. Voit les détails et le statut "En examen"

### Utilisateur Approuvé
1. Va dans Paramètres → Voit "Compte Agent Relais Actif"
2. Clique "Accéder" → Arrive sur `/dashboard/agent-relay/dashboard`
3. Accède à son espace agent professionnel

### Utilisateur Rejeté
1. Va dans Paramètres → Voit "Demande non approuvée"
2. Voit la raison du rejet
3. Clique "Nouvelle demande" → Peut recommencer le processus

## Gestion Administrative (À implémenter)

Pour approuver/rejeter une demande, un admin devra:

```typescript
// Approuver
await updateDoc(doc(db, 'agentRelayApplications', applicationId), {
  status: 'approved',
  reviewedAt: serverTimestamp()
});

// Rejeter
await updateDoc(doc(db, 'agentRelayApplications', applicationId), {
  status: 'rejected',
  rejectionReason: 'Raison du rejet...',
  reviewedAt: serverTimestamp()
});
```

## Routes Créées

- `/dashboard/agent-relay` - Page principale avec sélection de type
- `/dashboard/agent-relay/signup` - Formulaire d'inscription (5 étapes)
- `/dashboard/agent-relay/status` - Statut de la demande
- `/dashboard/agent-relay/success` - Page de confirmation après soumission
- `/dashboard/agent-relay/dashboard` - Dashboard agent (approuvés uniquement)

## Améliorations Futures

1. **Panel Admin**
   - Interface pour examiner les demandes
   - Approuver/rejeter avec raisons
   - Voir les documents et biométrie

2. **Notifications**
   - Email/SMS quand demande soumise
   - Notification quand approuvée/rejetée
   - Rappels pour compléter l'inscription

3. **Dashboard Agent Complet**
   - Transactions en temps réel
   - Gestion de la trésorerie
   - Rapports et statistiques
   - Gestion des clients

4. **Vérification Biométrique**
   - Intégration avec service de vérification d'identité
   - Détection de fraude
   - Validation automatique des documents

## Tests à Effectuer

- [ ] Nouveau utilisateur peut sélectionner un type et commencer
- [ ] Bouton "Commencer" désactivé sans sélection
- [ ] Section paramètres affiche le bon statut
- [ ] Reprise d'inscription fonctionne
- [ ] Page statut affiche les bonnes informations
- [ ] Redirections automatiques fonctionnent
- [ ] Dashboard agent accessible uniquement si approuvé
- [ ] Changement de statut met à jour l'interface

## Notes Techniques

- Le hook `useAgentRelayStatus` utilise une requête simplifiée (userId uniquement) pour éviter les problèmes d'index
- Les redirections sont gérées avec `useEffect` dans chaque page
- Les badges de statut utilisent des couleurs cohérentes (vert=actif, orange=en cours, rouge=rejeté)
- Tous les textes sont en français
- Design cohérent avec la charte Enkamba (vert #32BB78, orange #FF6B35)

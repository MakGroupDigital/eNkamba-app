# Flux KYC Corrigé

## Vue d'ensemble
Le flux KYC a été corrigé pour gérer correctement le statut de vérification et les redirections.

## Logique Corrigée

### 1. Vérification du Statut KYC
- **Hook `useKycStatus`**: 
  - Charge le statut KYC depuis Firebase (priorité)
  - Fallback sur localStorage si Firebase n'est pas disponible
  - Retourne `isKycCompleted` et `isLoading`

### 2. Page KYC (`/kyc`)
- **Si KYC est déjà complété**:
  - Le hook `useKycStatus` retourne `isKycCompleted = true`
  - Un `useEffect` détecte cela et redirige vers `/dashboard`
  - L'utilisateur ne voit jamais la page KYC
  
- **Si KYC n'est pas complété**:
  - L'utilisateur voit le formulaire KYC
  - Il remplit les informations d'identité
  - Il complète les étapes (selfie, referral, link account)
  - À la fin, `completeKyc()` est appelée
  - Les données sont envoyées à Firebase Cloud Function
  - Le statut local est mis à jour
  - L'utilisateur est redirigé vers `/dashboard`

### 3. Module KYC Gate (`ModuleKycGate`)
- **Modules libres** (pas de KYC requis):
  - `/dashboard/miyiki-chat` (Chat)
  - `/dashboard/ai` (AI)
  - `/dashboard/settings` (Paramètres)
  - → Affiche le contenu directement

- **Modules restreints** (KYC requis):
  - Tous les autres modules
  - Si `isKycCompleted = true` → Affiche le contenu
  - Si `isKycCompleted = false` → Affiche le message "Accès restreint"
  - Si `isLoading = true` → Affiche le contenu (évite les flashs)

## Flux Utilisateur

### Scénario 1: Nouvel utilisateur (pas de KYC)
```
1. Utilisateur se connecte
2. Accède à /dashboard
3. Essaie d'accéder à un module restreint (ex: /dashboard/wallet)
4. ModuleKycGate affiche "Accès restreint"
5. Clique sur "Vérifier mon identité"
6. Redirigé vers /kyc
7. Remplit le formulaire KYC
8. Soumet les données
9. Cloud Function valide et stocke dans Firebase
10. Statut local mis à jour (isKycCompleted = true)
11. Redirigé vers /dashboard
12. Peut maintenant accéder à tous les modules
```

### Scénario 2: Utilisateur avec KYC complété
```
1. Utilisateur se connecte
2. Accède à /kyc
3. Hook useKycStatus charge le statut depuis Firebase
4. Détecte que isKycCompleted = true
5. useEffect redirige vers /dashboard
6. Utilisateur ne voit jamais la page KYC
7. Peut accéder à tous les modules
```

### Scénario 3: Utilisateur accède à module libre
```
1. Utilisateur se connecte (KYC non complété)
2. Accède à /dashboard/ai (Chat)
3. ModuleKycGate vérifie: module libre → affiche le contenu
4. Utilisateur peut utiliser le Chat sans KYC
5. Peut accéder à /dashboard/settings aussi
```

## Changements Clés

### 1. `useKycStatus.ts`
- Attend que `authLoading` soit faux avant de charger le KYC
- Priorité à Firebase (pas localStorage d'abord)
- Retourne `isLoading` pour éviter les flashs

### 2. `src/app/kyc/page.tsx`
- Ajoute un `useEffect` qui redirige si KYC est complété
- Affiche un loader pendant le chargement du KYC
- Valide tous les champs d'identité avant soumission

### 3. `ModuleKycGate`
- Logique claire: module libre → affiche, KYC complété → affiche, sinon → restreint
- Affiche le contenu pendant le loading pour éviter les flashs

## Synchronisation Firebase

### Cloud Function `getKycStatus()`
```
Input: { userId }
Output: { isCompleted: boolean, completedAt: timestamp }
```

### Cloud Function `completeKyc()`
```
Input: {
  userId,
  identityType,
  identityNumber,
  fullName,
  dateOfBirth,
  country,
  linkedAccount (optionnel)
}
Output: { success: true, message: "..." }
```

## Fallback localStorage

Si Firebase n'est pas disponible:
- Le hook utilise localStorage comme fallback
- Les données sont synchronisées quand Firebase redevient disponible
- Permet une expérience offline basique

## Prochaines Étapes

1. Tester le flux complet end-to-end
2. Vérifier que les redirections fonctionnent correctement
3. Tester les scénarios offline
4. Ajouter des logs pour déboguer les problèmes de synchronisation

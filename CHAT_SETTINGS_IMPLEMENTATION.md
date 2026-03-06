# Implémentation des Paramètres de Chat

## Résumé
Développement complet des fonctionnalités de paramètres dans l'onglet "Paramètres" de Miyiki-Chat.

## Fonctionnalités Implémentées

### 1. Hook de Gestion des Paramètres (`useChatSettings`)
**Fichier**: `src/hooks/useChatSettings.ts`

Gère les paramètres de confidentialité de l'utilisateur:
- `onlineStatus`: Afficher/masquer le statut en ligne
- `readReceipts`: Activer/désactiver les confirmations de lecture
- `lastSeen`: Afficher/masquer la dernière connexion
- `locationSharing`: Activer/désactiver le partage de localisation en temps réel

**Stockage**: Firestore `users/{uid}/settings/chat`

### 2. Dialog de Partage de Localisation
**Fichier**: `src/components/chat/LocationSharingDialog.tsx`

Fonctionnalités:
- Demande de permission de géolocalisation
- Récupération de la position GPS (latitude, longitude)
- Reverse geocoding pour obtenir l'adresse (via OpenStreetMap)
- Gestion des erreurs (permission refusée, timeout, etc.)
- Interface utilisateur intuitive

### 3. Composants UI Ajoutés

#### Alert Component
**Fichier**: `src/components/ui/alert.tsx`
- Affichage des messages d'erreur et d'information
- Variantes: default, destructive

#### Switch Component
**Fichier**: `src/components/ui/switch.tsx`
- Toggle pour activer/désactiver les paramètres
- Basé sur Radix UI

### 4. Page Paramètres Mise à Jour
**Fichier**: `src/app/dashboard/miyiki-chat/page.tsx`

#### Section "Paramètres du chat"
1. **Modifier le profil** → Redirige vers `/dashboard/settings/edit-profile`
2. **Gérer les groupes** → Ouvre le dialog de création de groupe
3. **Partager ma localisation** → Ouvre le dialog de partage GPS

#### Section "Confidentialité"
Chaque paramètre affiche:
- Icône colorée selon l'état (activé/désactivé)
- Nom du paramètre
- Description de l'état actuel
- Bouton toggle pour activer/désactiver

**Paramètres disponibles**:
1. **Statut en ligne** (Eye/EyeOff icon)
   - Activé: Visible par tous
   - Désactivé: Masqué

2. **Confirmation de lecture** (CheckCheck icon)
   - Activé: Les autres voient quand vous lisez
   - Désactivé: Masqué

3. **Dernière connexion** (Circle icon)
   - Activé: Visible par tous
   - Désactivé: Masqué

4. **Partage de localisation** (MapPin icon)
   - Activé: Activé en temps réel
   - Désactivé: Désactivé

## Architecture

```
src/
├── hooks/
│   └── useChatSettings.ts          # Hook de gestion des paramètres
├── components/
│   ├── chat/
│   │   └── LocationSharingDialog.tsx  # Dialog de partage GPS
│   └── ui/
│       ├── alert.tsx                # Composant Alert
│       └── switch.tsx               # Composant Switch
└── app/
    └── dashboard/
        └── miyiki-chat/
            └── page.tsx             # Page principale avec paramètres
```

## Flux de Données

1. **Chargement initial**:
   - `useChatSettings` charge les paramètres depuis Firestore
   - Si aucun paramètre n'existe, crée les valeurs par défaut

2. **Modification d'un paramètre**:
   - L'utilisateur clique sur un bouton toggle
   - `updateSetting()` met à jour Firestore
   - L'état local est mis à jour immédiatement
   - L'UI se met à jour automatiquement

3. **Partage de localisation**:
   - L'utilisateur clique sur "Partager ma localisation"
   - Dialog s'ouvre avec demande de permission GPS
   - Position récupérée et affichée
   - Reverse geocoding pour l'adresse
   - Confirmation et partage

## Sécurité et Confidentialité

- Les paramètres sont stockés par utilisateur dans Firestore
- La géolocalisation nécessite une permission explicite
- Les données GPS ne sont partagées qu'après confirmation
- Tous les paramètres sont désactivables individuellement

## Améliorations Futures

1. **Partage de localisation en temps réel**:
   - Implémenter le suivi GPS continu
   - Envoyer la position dans les conversations
   - Afficher sur une carte interactive

2. **Statut personnalisé**:
   - Permettre des statuts personnalisés (Occupé, Disponible, etc.)
   - Messages de statut personnalisés

3. **Paramètres avancés**:
   - Blocage d'utilisateurs
   - Gestion des notifications
   - Thème sombre/clair

## Tests Recommandés

1. Tester chaque toggle de paramètre
2. Vérifier la persistance après rechargement
3. Tester le partage de localisation avec/sans permission
4. Vérifier les erreurs de géolocalisation
5. Tester sur mobile et desktop

## Notes Techniques

- Utilise Firestore pour la persistance
- Geolocation API pour le GPS
- OpenStreetMap Nominatim pour le reverse geocoding
- Radix UI pour les composants Switch
- Tailwind CSS pour le styling

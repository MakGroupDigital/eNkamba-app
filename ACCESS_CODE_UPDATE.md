# Mise à Jour du Code d'Accès - eNkamba

## Date: 20 Avril 2026

## Changements Effectués

### 1. Nouveau Code d'Accès
- **Ancien code**: `eNkamba2026`
- **Nouveau code**: `eNkamba2000`

### 2. Vérification Obligatoire à Chaque Ouverture

**Avant**:
- Le code était sauvegardé dans `localStorage`
- Une fois entré, l'utilisateur n'avait plus besoin de le rentrer
- Persistait même après fermeture du navigateur

**Après**:
- Le code est maintenant sauvegardé dans `sessionStorage`
- L'utilisateur doit entrer le code à chaque nouvelle session
- Le code expire automatiquement à la fermeture du navigateur/onglet

### 3. Fichiers Modifiés

#### `src/hooks/useAccessCode.ts`
```typescript
// Changements:
- const ACCESS_CODE_STORAGE_KEY = 'enkamba_access_verified';
+ const ACCESS_CODE_SESSION_KEY = 'enkamba_access_verified';

- const CORRECT_CODE = process.env.NEXT_PUBLIC_ACCESS_CODE || 'eNkamba2026';
+ const CORRECT_CODE = process.env.NEXT_PUBLIC_ACCESS_CODE || 'eNkamba2000';

// Utilisation de sessionStorage au lieu de localStorage
- localStorage.getItem(ACCESS_CODE_STORAGE_KEY)
+ sessionStorage.getItem(ACCESS_CODE_SESSION_KEY)

- localStorage.setItem(ACCESS_CODE_STORAGE_KEY, 'true')
+ sessionStorage.setItem(ACCESS_CODE_SESSION_KEY, 'true')

- localStorage.removeItem(ACCESS_CODE_STORAGE_KEY)
+ sessionStorage.removeItem(ACCESS_CODE_SESSION_KEY)
```

#### Fichiers d'environnement
- `.env` - Mis à jour avec `eNkamba2000`
- `.env.example` - Mis à jour avec `eNkamba2000`
- `.env.production` - Mis à jour avec `eNkamba2000`

## Comportement

### Scénario 1: Première Visite
1. L'utilisateur ouvre l'application
2. Un écran de vérification s'affiche
3. L'utilisateur entre le code `eNkamba2000`
4. Accès accordé pour cette session

### Scénario 2: Navigation dans l'App
1. L'utilisateur navigue entre les pages
2. Le code reste valide (sessionStorage actif)
3. Pas besoin de re-entrer le code

### Scénario 3: Fermeture et Réouverture
1. L'utilisateur ferme le navigateur/onglet
2. sessionStorage est effacé automatiquement
3. À la réouverture, le code est demandé à nouveau

### Scénario 4: Nouvel Onglet
1. L'utilisateur ouvre un nouvel onglet
2. sessionStorage n'est pas partagé entre onglets
3. Le code est demandé dans le nouvel onglet

## Différences localStorage vs sessionStorage

| Caractéristique | localStorage | sessionStorage |
|----------------|--------------|----------------|
| **Durée de vie** | Permanent | Session uniquement |
| **Fermeture navigateur** | Persiste | Effacé |
| **Nouvel onglet** | Partagé | Isolé |
| **Sécurité** | Moins sécurisé | Plus sécurisé |

## Avantages de sessionStorage

### Sécurité Améliorée
- Le code n'est pas stocké de façon permanente
- Réduit le risque d'accès non autorisé
- Force une nouvelle authentification régulière

### Contrôle d'Accès
- Chaque session nécessite le code
- Empêche l'accès prolongé sans supervision
- Idéal pour environnement de développement/test

### Isolation
- Chaque onglet est indépendant
- Pas de partage de session entre onglets
- Meilleur contrôle de l'accès

## Migration pour les Utilisateurs Existants

### Nettoyage Automatique
Le hook vérifie maintenant `sessionStorage` au lieu de `localStorage`, donc:
- Les anciennes entrées dans `localStorage` sont ignorées
- Pas besoin de migration manuelle
- Tous les utilisateurs devront entrer le nouveau code

### Première Connexion Après Mise à Jour
1. L'utilisateur ouvre l'app
2. Même s'il avait le code en localStorage, il devra le rentrer
3. Nouveau code: `eNkamba2000`

## Tests à Effectuer

### Test 1: Nouveau Code
- [ ] Ouvrir l'application
- [ ] Entrer `eNkamba2000`
- [ ] Vérifier que l'accès est accordé
- [ ] Entrer `eNkamba2026` (ancien code)
- [ ] Vérifier que l'accès est refusé

### Test 2: Persistance Session
- [ ] Entrer le code correct
- [ ] Naviguer entre plusieurs pages
- [ ] Vérifier que le code n'est pas redemandé
- [ ] Rafraîchir la page (F5)
- [ ] Vérifier que le code n'est pas redemandé

### Test 3: Fermeture Navigateur
- [ ] Entrer le code correct
- [ ] Fermer complètement le navigateur
- [ ] Rouvrir le navigateur
- [ ] Ouvrir l'application
- [ ] Vérifier que le code est redemandé

### Test 4: Nouvel Onglet
- [ ] Entrer le code dans l'onglet 1
- [ ] Ouvrir un nouvel onglet
- [ ] Accéder à l'application
- [ ] Vérifier que le code est redemandé

### Test 5: Fermeture Onglet
- [ ] Entrer le code
- [ ] Fermer l'onglet (pas le navigateur)
- [ ] Rouvrir l'application dans un nouvel onglet
- [ ] Vérifier que le code est redemandé

## Notes Importantes

### Pour le Développement
- Le code doit être entré à chaque nouvelle session de développement
- Cela peut sembler contraignant mais améliore la sécurité
- Le code est défini dans les variables d'environnement

### Pour la Production
- Le même comportement s'applique en production
- Assurez-vous que `.env.production` contient le bon code
- Communiquez le nouveau code à tous les utilisateurs autorisés

### Variables d'Environnement
```bash
# Development
NEXT_PUBLIC_ACCESS_CODE=eNkamba2000

# Production
NEXT_PUBLIC_ACCESS_CODE=eNkamba2000
```

## Déploiement

### Étapes de Déploiement
1. ✅ Mettre à jour le code dans `useAccessCode.ts`
2. ✅ Mettre à jour les fichiers `.env*`
3. ⏳ Commit et push sur GitHub
4. ⏳ Déployer sur l'environnement de production
5. ⏳ Vérifier que le nouveau code fonctionne
6. ⏳ Communiquer le nouveau code aux utilisateurs

### Commandes Git
```bash
git add src/hooks/useAccessCode.ts .env.example .env.production
git commit -m "security: update access code to eNkamba2000 and enforce per-session verification"
git push origin main
```

## Communication aux Utilisateurs

### Message à Envoyer
```
📢 Mise à jour importante - Code d'accès eNkamba

Le code d'accès de l'application a été mis à jour pour des raisons de sécurité.

Nouveau code: eNkamba2000

Important:
- Vous devrez entrer ce code à chaque ouverture de l'application
- Le code expire à la fermeture du navigateur
- Gardez ce code confidentiel

Merci de votre compréhension.
```

## Résumé

✅ **Code mis à jour**: `eNkamba2026` → `eNkamba2000`
✅ **Vérification obligatoire**: À chaque nouvelle session
✅ **Stockage**: localStorage → sessionStorage
✅ **Sécurité**: Améliorée
✅ **Expiration**: À la fermeture du navigateur

Le système est maintenant plus sécurisé et force une authentification régulière! 🔒

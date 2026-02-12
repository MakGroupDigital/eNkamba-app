# Déploiement Manuel des Cloud Functions

## 🔧 Approche Alternative - Déploiement via Firebase Console

Comme le déploiement CLI timeout, voici comment déployer manuellement :

### Option 1 : Déploiement via Firebase Console (Recommandé)

1. **Aller à Firebase Console**
   - https://console.firebase.google.com
   - Sélectionner votre projet

2. **Aller à Functions**
   - Cliquer sur "Functions" dans le menu de gauche
   - Cliquer sur "Créer une fonction"

3. **Créer les 4 fonctions**

#### Fonction 1 : submitBusinessRequest
```
Nom : submitBusinessRequest
Déclencheur : HTTPS
Authentification : Nécessite authentification
Région : us-central1
```

Copier le code de `functions/src/businessAccountManagement.ts` (fonction `submitBusinessRequest`)

#### Fonction 2 : approveBusinessRequest
```
Nom : approveBusinessRequest
Déclencheur : HTTPS
Authentification : Nécessite authentification
Région : us-central1
```

Copier le code de `functions/src/businessAccountManagement.ts` (fonction `approveBusinessRequest`)

#### Fonction 3 : rejectBusinessRequest
```
Nom : rejectBusinessRequest
Déclencheur : HTTPS
Authentification : Nécessite authentification
Région : us-central1
```

Copier le code de `functions/src/businessAccountManagement.ts` (fonction `rejectBusinessRequest`)

#### Fonction 4 : getPendingBusinessRequests
```
Nom : getPendingBusinessRequests
Déclencheur : HTTPS
Authentification : Nécessite authentification
Région : us-central1
```

Copier le code de `functions/src/businessAccountManagement.ts` (fonction `getPendingBusinessRequests`)

### Option 2 : Déploiement via CLI avec timeout augmenté

```bash
firebase deploy --only functions --debug --timeout 600
```

### Option 3 : Déploiement par fonction individuelle

```bash
firebase deploy --only functions:submitBusinessRequest
firebase deploy --only functions:approveBusinessRequest
firebase deploy --only functions:rejectBusinessRequest
firebase deploy --only functions:getPendingBusinessRequests
```

## 📝 Code à Copier

Tous les codes des Cloud Functions sont dans :
`functions/src/businessAccountManagement.ts`

## ✅ Vérification du Déploiement

Après le déploiement, vérifier dans Firebase Console :
1. Aller à Functions
2. Voir les 4 fonctions listées
3. Vérifier qu'elles sont "Actives"

## 🧪 Test des Fonctions

Une fois déployées, les fonctions seront appelées automatiquement par :
- `src/hooks/useBusinessAccount.ts` (côté utilisateur)
- `src/app/admin/business-requests/page.tsx` (côté admin)

## 📞 Support

Si le déploiement échoue :
1. Vérifier que vous êtes connecté à Firebase : `firebase login`
2. Vérifier le projet : `firebase projects:list`
3. Vérifier les logs : `firebase functions:log`

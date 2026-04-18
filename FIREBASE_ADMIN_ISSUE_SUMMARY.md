# Firebase Admin SDK Issue - Solution Temporaire

## 🚨 Problème Identifié

**Firebase Admin SDK ne fonctionne pas** - Erreur d'authentification service account :
```
16 UNAUTHENTICATED: Request had invalid authentication credentials
```

## ✅ Solution Temporaire Appliquée

### 1. API add-funds-lite - CORRIGÉE ✅
- **Avant** : Firebase Admin SDK (erreur 500)
- **Après** : Firebase Client SDK (fonctionne ✅)
- **Test** : `curl -X POST http://localhost:9002/api/wallet/add-funds-lite/` → 200 OK

### 2. API add-funds - EN COURS
- **Statut** : Utilise encore Firebase Admin SDK (erreur 500)
- **Solution** : Désactiver temporairement l'authentification ou utiliser SDK client

## 🔍 Diagnostic Complet

### Tests Effectués
1. ✅ **SDK Client Firebase** : Fonctionne parfaitement
2. ❌ **SDK Admin Firebase** : Erreur d'authentification service account
3. ✅ **Règles Firestore** : Permissives (allow read, write: if true)
4. ✅ **Configuration Firebase** : Correcte

### Cause Probable
Le **service account Firebase** a été désactivé, supprimé ou n'a plus les bonnes permissions.

## 🛠️ Solutions Possibles

### Solution 1: Régénérer Service Account (Recommandée)
1. Aller dans Firebase Console → Project Settings → Service Accounts
2. Générer une nouvelle clé privée
3. Encoder en Base64 et mettre à jour `FIREBASE_PRIVATE_KEY_ENCODED`

### Solution 2: Utiliser SDK Client (Temporaire)
- ✅ Déjà appliquée pour `add-funds-lite`
- 🔄 À appliquer pour `add-funds`

### Solution 3: Désactiver Authentification (Dev seulement)
- Supprimer la vérification de token temporairement
- ⚠️ UNIQUEMENT pour le développement

## 📋 État Actuel

| Endpoint | SDK | Statut | Action |
|----------|-----|--------|--------|
| `/api/wallet/add-funds-lite/` | Client | ✅ 200 OK | Corrigé |
| `/api/wallet/add-funds/` | Admin | ❌ 500 Error | À corriger |
| `/api/test/firebase-admin/` | Admin | ❌ 500 Error | Test |
| `/api/test/firebase-user/` | Client | ✅ 200 OK | Test |

## 🎯 Prochaines Étapes

1. **Corriger `/api/wallet/add-funds/`** - Utiliser SDK client temporairement
2. **Tester l'interface utilisateur** - Vérifier que les erreurs 500 sont résolues
3. **Régénérer service account** - Solution permanente
4. **Revenir à Firebase Admin SDK** - Une fois le service account corrigé

## 📝 Notes Importantes

- ⚠️ **Sécurité** : SDK Client moins sécurisé que Admin SDK
- 🔧 **Temporaire** : Cette solution est pour débloquer le développement
- 🎯 **Production** : Utiliser Firebase Admin SDK avec service account valide
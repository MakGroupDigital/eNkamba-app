# Force Browser Refresh - Fix CORS Cache

**Date**: 2026-02-02  
**Problème**: Le navigateur utilise encore l'ancienne version du code avec les appels Cloud Functions

## 🔴 Symptôme

Les erreurs CORS persistent même après avoir modifié le code pour utiliser Firestore directement :
```
Access to fetch at 'https://us-central1-studio-1153706651-6032b.cloudfunctions.net/getWalletBalance'
from origin 'http://localhost:9002' has been blocked by CORS policy
```

## ✅ Solution : Hard Refresh du Navigateur

### Option 1 : Raccourcis Clavier

**Sur macOS** :
- **Chrome/Edge** : `Cmd + Shift + R` ou `Cmd + Option + R`
- **Firefox** : `Cmd + Shift + R`
- **Safari** : `Cmd + Option + E` (vider le cache) puis `Cmd + R`

**Sur Windows/Linux** :
- **Chrome/Edge/Firefox** : `Ctrl + Shift + R` ou `Ctrl + F5`

### Option 2 : Via DevTools

1. Ouvrir DevTools (`F12` ou `Cmd + Option + I`)
2. Clic droit sur le bouton de rafraîchissement
3. Sélectionner "Vider le cache et actualiser"

### Option 3 : Vider Complètement le Cache

**Chrome/Edge** :
1. `Cmd + Shift + Delete` (macOS) ou `Ctrl + Shift + Delete` (Windows)
2. Sélectionner "Images et fichiers en cache"
3. Cliquer sur "Effacer les données"
4. Recharger la page

**Firefox** :
1. `Cmd + Shift + Delete` (macOS) ou `Ctrl + Shift + Delete` (Windows)
2. Sélectionner "Cache"
3. Cliquer sur "Effacer maintenant"
4. Recharger la page

## 🔍 Vérification

Après le hard refresh, vous devriez voir dans la console :
- ✅ Aucune erreur CORS
- ✅ Pas d'appel à `getWalletBalance` Cloud Function
- ✅ Lecture directe depuis Firestore
- ✅ Solde chargé correctement

## 📝 Pourquoi ce problème ?

1. **Hot Module Replacement (HMR)** : Next.js utilise HMR qui ne recharge pas toujours tous les modules
2. **Service Workers** : Peuvent mettre en cache les anciennes versions
3. **Browser Cache** : Le navigateur garde en cache les anciens bundles JavaScript
4. **Fast Refresh** : Peut ne pas détecter certains changements dans les hooks

## 🚀 Alternative : Redémarrer le Serveur

Si le hard refresh ne fonctionne pas :

```bash
# Arrêter le serveur (Ctrl + C dans le terminal)
# Puis redémarrer
npm run dev
```

## 🎯 Commandes Utiles

### Nettoyer le cache Next.js
```bash
rm -rf .next
npm run dev
```

### Nettoyer node_modules (si nécessaire)
```bash
rm -rf node_modules .next
npm install
npm run dev
```

## ✅ Checklist de Dépannage

1. ☐ Hard refresh du navigateur (`Cmd + Shift + R`)
2. ☐ Vérifier la console (pas d'erreurs CORS)
3. ☐ Vérifier l'onglet Network (pas d'appels aux Cloud Functions)
4. ☐ Si ça ne marche pas : vider complètement le cache
5. ☐ Si ça ne marche toujours pas : redémarrer le serveur
6. ☐ En dernier recours : `rm -rf .next && npm run dev`

---

**Note** : Ce problème est spécifique au développement local. En production, le cache est géré automatiquement par le CDN.

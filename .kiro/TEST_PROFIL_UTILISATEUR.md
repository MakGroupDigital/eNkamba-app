# Guide de Test - Profil Utilisateur

## 🎯 Objectif

Vérifier que les profils utilisateurs se chargent correctement après connexion, même avec les erreurs CORS des Cloud Functions.

## 📋 Prérequis

- ✅ Serveur en cours d'exécution sur port 9002
- ✅ Navigateur avec console ouverte (F12)
- ✅ Compte Google pour tester

## 🧪 Scénario de Test 1: Connexion Google

### Étapes

1. **Ouvrir l'application**
   ```
   http://localhost:9002/login
   ```

2. **Cliquer sur "Continuer avec Google"**
   - Une popup Google devrait s'ouvrir
   - Sélectionner votre compte Google
   - Autoriser l'accès

3. **Vérifier la connexion**
   - Message "Connexion réussie" devrait apparaître
   - Redirection vers `/dashboard`

4. **Vérifier le profil dans le dashboard**
   - Votre nom devrait s'afficher
   - Votre photo de profil devrait s'afficher
   - Votre email devrait être visible

5. **Aller dans Paramètres**
   ```
   http://localhost:9002/dashboard/settings
   ```
   - Vérifier que vos informations s'affichent
   - Nom, email, photo

6. **Aller dans Modifier le Profil**
   ```
   http://localhost:9002/dashboard/settings/edit-profile
   ```
   - Vérifier que le formulaire est pré-rempli
   - Nom complet, email

### Résultats Attendus

✅ **Connexion réussie**  
✅ **Profil affiché dans le dashboard**  
✅ **Informations visibles dans les paramètres**  
✅ **Formulaire pré-rempli dans edit-profile**

### Console du Navigateur

Vous devriez voir:

```
Profil utilisateur créé avec succès via Firestore
```

OU (si Cloud Functions fonctionnent):

```
Profil utilisateur créé avec succès via Cloud Function
```

**Pas d'erreurs CORS bloquantes** ✅

## 🧪 Scénario de Test 2: Vérifier le Fallback

### Étapes

1. **Ouvrir la console du navigateur (F12)**

2. **Aller dans l'onglet Network**

3. **Se connecter avec Google**

4. **Observer les requêtes réseau**
   - Chercher les requêtes vers `cloudfunctions.net`
   - Vérifier si elles échouent (CORS)

5. **Vérifier les logs console**
   - Chercher "Erreur Cloud Function, utilisation du fallback Firestore"
   - Chercher "Profil utilisateur créé avec succès via Firestore"

### Résultats Attendus

Si CORS bloqué:
```
⚠️ Erreur Cloud Function, utilisation du fallback Firestore: internal
✅ Profil utilisateur créé avec succès via Firestore
```

Si Cloud Functions fonctionnent:
```
✅ Profil utilisateur créé avec succès via Cloud Function
```

**Dans les deux cas, le profil doit s'afficher correctement** ✅

## 🧪 Scénario de Test 3: Statut KYC

### Étapes

1. **Se connecter avec Google**

2. **Aller dans Paramètres**
   ```
   http://localhost:9002/dashboard/settings
   ```

3. **Vérifier le bouton KYC**
   - Devrait afficher "Vérification KYC (Optionnel)"
   - Variante "ghost" (pas de fond vert)

4. **Cliquer sur le bouton KYC**
   - Redirection vers `/kyc`
   - Formulaire KYC devrait s'afficher

### Résultats Attendus

✅ **Bouton KYC visible**  
✅ **Texte "Optionnel"**  
✅ **Formulaire KYC accessible**  
✅ **Pas de blocage d'accès**

## 🧪 Scénario de Test 4: Accès aux Modules

### Étapes

1. **Se connecter avec Google**

2. **Tester l'accès aux modules suivants:**
   - `/dashboard/wallet` - Portefeuille
   - `/dashboard/send` - Envoyer de l'argent
   - `/dashboard/receive` - Recevoir de l'argent
   - `/dashboard/savings` - Épargne
   - `/dashboard/history` - Historique

3. **Vérifier qu'aucun module ne demande KYC**

### Résultats Attendus

✅ **Tous les modules accessibles**  
✅ **Pas de popup KYC**  
✅ **Pas de redirection forcée vers /kyc**

## 🐛 Problèmes Possibles

### Problème 1: Profil ne s'affiche pas

**Symptômes:**
- Nom générique affiché
- Photo par défaut
- Email manquant

**Solution:**
1. Ouvrir la console (F12)
2. Chercher les erreurs
3. Vérifier que Firestore est accessible
4. Vérifier les règles Firestore

### Problème 2: Erreur "Permission Denied"

**Symptômes:**
```
FirebaseError: Missing or insufficient permissions
```

**Solution:**
1. Vérifier les règles Firestore dans `firestore.rules`
2. S'assurer que les règles sont permissives pour le développement
3. Redéployer les règles si nécessaire:
   ```bash
   firebase deploy --only firestore:rules
   ```

### Problème 3: Popup Google Bloquée

**Symptômes:**
```
FirebaseError: auth/popup-blocked
```

**Solution:**
1. Autoriser les popups pour localhost:9002
2. Réessayer la connexion

## 📊 Checklist de Test

- [ ] Connexion Google réussie
- [ ] Profil affiché dans le dashboard
- [ ] Nom et photo visibles
- [ ] Email visible dans les paramètres
- [ ] Formulaire edit-profile pré-rempli
- [ ] Statut KYC accessible (optionnel)
- [ ] Tous les modules accessibles
- [ ] Pas d'erreurs CORS bloquantes
- [ ] Fallback Firestore fonctionne
- [ ] Console sans erreurs critiques

## 🎉 Succès

Si tous les tests passent:

✅ **Le système de fallback Firestore fonctionne correctement**  
✅ **Les profils utilisateurs se chargent même avec CORS bloqué**  
✅ **L'application est résiliente et prête pour le développement**

## 📝 Commandes Utiles

```bash
# Lancer le serveur
npm run dev

# Vérifier les logs du serveur
# (dans un autre terminal)
tail -f .next/trace

# Ouvrir la console Firebase
firebase console

# Vérifier les règles Firestore
firebase firestore:rules:get
```

## 🔗 URLs de Test

- Login: http://localhost:9002/login
- Dashboard: http://localhost:9002/dashboard
- Settings: http://localhost:9002/dashboard/settings
- Edit Profile: http://localhost:9002/dashboard/settings/edit-profile
- KYC: http://localhost:9002/kyc

---

**Date**: 2 février 2026  
**Version**: 1.0  
**Statut**: Prêt pour les tests

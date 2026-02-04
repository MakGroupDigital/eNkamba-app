# Diagnostic - Erreur Réseau Firebase

## 🔴 Erreur Rencontrée

```
FirebaseError: Firebase: Error (auth/network-request-failed)
```

## 🔍 Cause

Cette erreur indique que votre navigateur ne peut pas se connecter aux serveurs Firebase. Cela peut être dû à:

1. **Problème de connexion internet**
2. **Pare-feu ou antivirus bloquant Firebase**
3. **DNS ne résolvant pas les domaines Firebase**
4. **Proxy ou VPN interférant**
5. **Extensions de navigateur bloquant les requêtes**

## ✅ Solutions à Essayer

### Solution 1: Vérifier la Connexion Internet

1. **Tester votre connexion**
   ```bash
   # Dans un terminal
   ping google.com
   ping firebase.google.com
   ```

2. **Ouvrir ces URLs dans votre navigateur**
   - https://www.google.com (devrait fonctionner)
   - https://firebase.google.com (devrait fonctionner)
   - https://identitytoolkit.googleapis.com (devrait afficher une erreur 404, mais pas d'erreur réseau)

3. **Si ces sites ne s'ouvrent pas**
   - Vérifiez votre connexion WiFi/Ethernet
   - Redémarrez votre routeur
   - Essayez avec un autre réseau (partage de connexion mobile)

### Solution 2: Désactiver Temporairement le Pare-feu/Antivirus

1. **Désactiver temporairement votre antivirus**
   - Kaspersky, Avast, Norton, etc.
   - Réessayer la connexion

2. **Désactiver le pare-feu Windows/Mac**
   - Windows: Paramètres → Mise à jour et sécurité → Sécurité Windows → Pare-feu
   - Mac: Préférences Système → Sécurité → Pare-feu

3. **Si ça fonctionne**
   - Ajouter une exception pour localhost:9002
   - Ajouter une exception pour *.googleapis.com

### Solution 3: Vider le Cache DNS

**Windows:**
```bash
ipconfig /flushdns
```

**Mac:**
```bash
sudo dscacheutil -flushcache
sudo killall -HUP mDNSResponder
```

**Linux:**
```bash
sudo systemd-resolve --flush-caches
```

### Solution 4: Désactiver VPN/Proxy

1. **Si vous utilisez un VPN**
   - Désactivez-le temporairement
   - Réessayez la connexion

2. **Si vous utilisez un proxy**
   - Désactivez-le dans les paramètres réseau
   - Réessayez

### Solution 5: Désactiver les Extensions de Navigateur

1. **Ouvrir le mode navigation privée**
   - Chrome: Ctrl+Shift+N (Windows) ou Cmd+Shift+N (Mac)
   - Firefox: Ctrl+Shift+P (Windows) ou Cmd+Shift+P (Mac)

2. **Essayer de se connecter en mode privé**
   - Si ça fonctionne → une extension bloque Firebase

3. **Extensions courantes qui bloquent:**
   - Bloqueurs de publicités (AdBlock, uBlock Origin)
   - Extensions de confidentialité (Privacy Badger)
   - Extensions de sécurité

### Solution 6: Changer de DNS

1. **Utiliser les DNS de Google**
   - DNS primaire: 8.8.8.8
   - DNS secondaire: 8.8.4.4

2. **Utiliser les DNS de Cloudflare**
   - DNS primaire: 1.1.1.1
   - DNS secondaire: 1.0.0.1

**Comment changer (Mac):**
```bash
# Ouvrir Préférences Système → Réseau
# Sélectionner votre connexion → Avancé → DNS
# Ajouter 8.8.8.8 et 8.8.4.4
```

### Solution 7: Utiliser l'Authentification Email (Alternative)

Si Google Auth ne fonctionne pas, utilisez l'authentification par email:

1. **Sur la page de login**
   - Cliquer sur "Email" au lieu de "Continuer avec Google"
   - Entrer votre email
   - Recevoir un code OTP
   - Se connecter avec le code

2. **Avantages**
   - Ne dépend pas de Google Auth
   - Fonctionne même avec des problèmes réseau Google
   - Plus simple pour le développement local

## 🧪 Test de Diagnostic

### Test 1: Vérifier l'Accès aux APIs Firebase

Ouvrez la console du navigateur (F12) et exécutez:

```javascript
fetch('https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=AIzaSyDRhWbrpB1Ss4njot7GYO-CZdkvJtZXGyI', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({})
})
.then(r => console.log('✅ Firebase accessible:', r.status))
.catch(e => console.error('❌ Firebase inaccessible:', e))
```

**Résultat attendu:**
- ✅ Status 400 (Bad Request) = Firebase accessible, juste requête invalide
- ❌ Network Error = Firebase bloqué

### Test 2: Vérifier les Domaines Firebase

```javascript
const domains = [
  'https://firebase.google.com',
  'https://identitytoolkit.googleapis.com',
  'https://securetoken.googleapis.com',
  'https://www.googleapis.com'
];

domains.forEach(domain => {
  fetch(domain)
    .then(() => console.log('✅', domain))
    .catch(() => console.error('❌', domain));
});
```

## 📊 Checklist de Diagnostic

- [ ] Connexion internet fonctionnelle
- [ ] google.com accessible
- [ ] firebase.google.com accessible
- [ ] Pare-feu désactivé ou exception ajoutée
- [ ] Antivirus désactivé ou exception ajoutée
- [ ] VPN/Proxy désactivé
- [ ] Extensions de navigateur désactivées
- [ ] Cache DNS vidé
- [ ] DNS changé (Google ou Cloudflare)
- [ ] Mode navigation privée testé
- [ ] Test de diagnostic exécuté

## 🔧 Solution Temporaire: Authentification Email

En attendant de résoudre le problème réseau, utilisez l'authentification par email:

```typescript
// Dans login/page.tsx, l'authentification email fonctionne déjà
// Cliquez sur "Email" au lieu de "Continuer avec Google"
```

## 📝 Informations Système

**Votre Configuration:**
- OS: macOS
- Navigateur: Chrome/Safari/Firefox
- Réseau: WiFi/Ethernet
- Localisation: ?

**Serveurs Firebase:**
- Region: us-central1
- Project: studio-1153706651-6032b
- Auth Domain: studio-1153706651-6032b.firebaseapp.com

## 🆘 Si Rien ne Fonctionne

### Option 1: Utiliser un Autre Réseau

1. **Partage de connexion mobile**
   - Activer le partage de connexion sur votre téléphone
   - Connecter votre ordinateur
   - Réessayer

2. **Réseau public**
   - Café, bibliothèque, etc.
   - Tester si le problème persiste

### Option 2: Utiliser un Autre Navigateur

1. **Essayer avec:**
   - Chrome
   - Firefox
   - Safari
   - Edge

2. **Si un navigateur fonctionne**
   - Le problème vient des extensions ou paramètres du navigateur initial

### Option 3: Contacter votre FAI

Si le problème persiste sur tous les réseaux et navigateurs:
- Votre FAI bloque peut-être les domaines Google/Firebase
- Demander à débloquer *.googleapis.com

## 📞 Support

Si vous avez besoin d'aide supplémentaire:

1. **Partager les résultats des tests de diagnostic**
2. **Indiquer votre configuration réseau**
3. **Préciser si d'autres services Google fonctionnent**

---

**Date**: 2 février 2026  
**Erreur**: auth/network-request-failed  
**Statut**: En diagnostic

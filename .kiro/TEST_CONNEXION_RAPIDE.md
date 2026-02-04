# Test Rapide - Connexion Firebase

## 🔍 Diagnostic en 2 Minutes

### Étape 1: Tester l'Accès à Firebase

Ouvrez votre navigateur et essayez d'accéder à ces URLs:

1. **https://www.google.com**
   - ✅ Devrait fonctionner
   - ❌ Si erreur → problème de connexion internet

2. **https://firebase.google.com**
   - ✅ Devrait afficher le site Firebase
   - ❌ Si erreur → Firebase bloqué

3. **https://identitytoolkit.googleapis.com**
   - ✅ Devrait afficher "404 Not Found" (c'est normal)
   - ❌ Si "ERR_NAME_NOT_RESOLVED" → DNS ne résout pas

### Étape 2: Test dans la Console

1. **Ouvrir la console du navigateur** (F12)

2. **Coller ce code:**
   ```javascript
   fetch('https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=AIzaSyDRhWbrpB1Ss4njot7GYO-CZdkvJtZXGyI', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({})
   })
   .then(r => console.log('✅ Firebase accessible, status:', r.status))
   .catch(e => console.error('❌ Firebase bloqué:', e.message))
   ```

3. **Résultat attendu:**
   - ✅ "Firebase accessible, status: 400" → Firebase fonctionne
   - ❌ "Firebase bloqué: Failed to fetch" → Firebase bloqué

## 🚀 Solutions Rapides

### Si Firebase est Bloqué

**Solution 1: Mode Navigation Privée**
```
Chrome: Ctrl+Shift+N (Windows) ou Cmd+Shift+N (Mac)
Firefox: Ctrl+Shift+P (Windows) ou Cmd+Shift+P (Mac)
```
→ Réessayer la connexion

**Solution 2: Désactiver Extensions**
- Désactiver AdBlock, uBlock Origin, Privacy Badger
- Réessayer

**Solution 3: Utiliser Email Auth**
- Sur http://localhost:9002/login
- Cliquer sur "Email" au lieu de "Google"
- Entrer votre email
- Recevoir le code OTP
- Se connecter

### Si Problème de DNS

**Mac:**
```bash
sudo dscacheutil -flushcache
sudo killall -HUP mDNSResponder
```

**Windows:**
```bash
ipconfig /flushdns
```

## 📱 Alternative: Authentification Email

L'authentification par email fonctionne déjà et ne dépend pas de Google Auth:

1. **Aller sur** http://localhost:9002/login
2. **Cliquer sur "Email"**
3. **Entrer votre email**
4. **Regarder la console (F12)** pour le code OTP
5. **Entrer le code**
6. **Se connecter** ✅

## 🎯 Résumé

| Problème | Solution Rapide |
|----------|----------------|
| Firebase bloqué | Mode navigation privée |
| Extensions bloquent | Désactiver extensions |
| DNS ne résout pas | Vider cache DNS |
| Tout échoue | Utiliser Email Auth |

---

**Temps estimé**: 2-5 minutes  
**Difficulté**: Facile

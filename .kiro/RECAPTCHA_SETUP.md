# Configuration reCAPTCHA pour l'Authentification par Téléphone

## Erreur: `auth/invalid-app-credential`

Cette erreur signifie que Firebase ne peut pas valider le reCAPTCHA. Voici comment configurer correctement:

## Étapes de Configuration

### 1. Créer une clé reCAPTCHA v2 dans Google Cloud Console

1. Aller à [Google Cloud Console](https://console.cloud.google.com)
2. Sélectionner le projet `studio-1153706651-6032b`
3. Aller à **reCAPTCHA Admin Console** (ou chercher "reCAPTCHA")
4. Cliquer sur **"Create"** ou **"+"**
5. Remplir les informations:
   - **Label**: "eNkamba Phone Auth"
   - **reCAPTCHA type**: Sélectionner **reCAPTCHA v2**
   - **reCAPTCHA v2 type**: Sélectionner **"Invisible reCAPTCHA badge"**
   - **Domains**: Ajouter:
     - `localhost:9002`
     - `localhost:3000`
     - `127.0.0.1:9002`
     - Votre domaine de production (ex: `enkamba.io`)
6. Cliquer **"Create"**
7. Copier la **Site Key** (clé publique)

### 2. Configurer reCAPTCHA dans Firebase Console

1. Aller à [Firebase Console](https://console.firebase.google.com)
2. Sélectionner le projet `studio-1153706651-6032b`
3. Aller à **Authentication** → **Sign-in method**
4. Cliquer sur **Phone**
5. Dans la section **reCAPTCHA**, cliquer sur le lien **"reCAPTCHA configuration"**
6. Sélectionner **reCAPTCHA v2** (pas Enterprise)
7. Entrer la **Site Key** que tu as copiée
8. Cliquer **Save**

### 3. Vérifier la Configuration

Après avoir configuré, attendre 5-10 minutes pour que les changements se propagent.

## Clés reCAPTCHA Actuelles

**Site Key (Publique)**: `6LfuglEsAAAAAKEs-hihNaGaobl6TFiWgG7axgw7`

Cette clé est déjà configurée dans le code:
- `src/app/layout.tsx` - Script reCAPTCHA
- `src/app/login/page.tsx` - RecaptchaVerifier

## Dépannage

### Si l'erreur persiste:

1. **Vérifier les domaines autorisés**:
   - Aller à Google Cloud Console → reCAPTCHA Admin
   - Vérifier que `localhost:9002` est dans la liste des domaines
   - Ajouter le domaine si manquant

2. **Vérifier la clé reCAPTCHA**:
   - S'assurer que la clé dans Firebase Console correspond à celle dans le code
   - Régénérer la clé si nécessaire

3. **Vérifier les permissions Firebase**:
   - Aller à Firebase Console → Project Settings
   - Vérifier que l'API `identitytoolkit.googleapis.com` est activée

4. **Attendre la propagation**:
   - Les changements peuvent prendre 5-10 minutes
   - Essayer après 10 minutes

5. **Vider le cache**:
   - Vider le cache du navigateur
   - Redémarrer le serveur de développement

## Alternative: Désactiver reCAPTCHA pour le Développement

Si tu veux tester sans reCAPTCHA:

1. Modifier `src/app/login/page.tsx`:
```typescript
// Commenter la création du RecaptchaVerifier
// recaptchaVerifierRef.current = new RecaptchaVerifier(...)

// Utiliser null à la place
const confirmation = await signInWithPhoneNumber(
  auth,
  e164Phone,
  null // Pas de reCAPTCHA
);
```

**ATTENTION**: Cela ne fonctionne que en développement. En production, reCAPTCHA est obligatoire.

## Ressources

- [Firebase Phone Authentication](https://firebase.google.com/docs/auth/web/phone-auth)
- [reCAPTCHA v2 Setup](https://developers.google.com/recaptcha/docs/v2/start)
- [Google Cloud Console](https://console.cloud.google.com)

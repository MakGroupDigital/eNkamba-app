# ⚡ Quick Start - Authentification

## Tester Immédiatement

### Email (Fonctionne maintenant!)

```
1. npm run dev
2. Aller à http://localhost:9002/login
3. Cliquer sur "Email"
4. Entrer une adresse email
5. Cliquer "Recevoir un code par email"
6. Ouvrir console (F12) → chercher "📧 Code d'authentification"
7. Copier le code
8. Entrer le code dans le formulaire
9. Cliquer "Confirmer et continuer"
10. Redirection vers /dashboard/miyiki-chat ✅
```

### Téléphone (Nécessite config Firebase)

```
1. Aller à Firebase Console
2. Authentication → Phone → reCAPTCHA configuration
3. Sélectionner reCAPTCHA v2
4. Entrer Site Key: 6LfuglEsAAAAAKEs-hihNaGaobl6TFiWgG7axgw7
5. Cliquer Save
6. Attendre 5-10 minutes
7. Tester sur http://localhost:9002/login
```

---

## Fichiers Clés

| Fichier | Rôle |
|---------|------|
| `src/app/login/page.tsx` | Interface login (2 méthodes) |
| `src/lib/email-auth.ts` | Helpers email OTP |
| `src/app/layout.tsx` | reCAPTCHA v2 script |
| `.kiro/EMAIL_AUTH_SETUP.md` | Config email production |
| `.kiro/RECAPTCHA_FIX.md` | Config reCAPTCHA |

---

## Flux Utilisateur

```
Login Page
├── Sélectionner Méthode
│   ├── 📱 Téléphone
│   │   ├── Sélectionner Pays
│   │   ├── Entrer Numéro
│   │   ├── Recevoir SMS
│   │   └── Entrer Code
│   └── 📧 Email
│       ├── Entrer Email
│       ├── Recevoir Code
│       └── Entrer Code
└── Redirection Dashboard
```

---

## Données Stockées

### localStorage

```javascript
// Après connexion réussie
enkamba_user = {
  name: "Utilisateur eNkamba",
  phone: "+243812345678" // ou email: "user@example.com"
}

// Pendant authentification email
enkamba_email_auth = {
  email: "user@example.com",
  code: "123456",
  timestamp: 1705862400000,
  attempts: 0
}
```

---

## Messages d'Erreur

| Erreur | Cause | Solution |
|--------|-------|----------|
| "Veuillez saisir votre email" | Email vide | Entrer un email |
| "Email invalide" | Format incorrect | Vérifier le format |
| "Code expiré" | Plus de 5 minutes | Renvoyer un code |
| "Trop de tentatives" | 5+ tentatives échouées | Renvoyer un code |
| "Code incorrect" | Code ne correspond pas | Vérifier le code |

---

## Développement vs Production

### Développement (Maintenant)

```
Email:
- Code affiché dans console
- Pas de service email requis
- Prêt à tester immédiatement

Téléphone:
- Nécessite config Firebase
- reCAPTCHA v2 requis
- SMS simulé en dev
```

### Production (À Faire)

```
Email:
- Cloud Function pour envoyer email
- Service email configuré (SendGrid, etc.)
- Variables d'environnement définies

Téléphone:
- reCAPTCHA v2 configuré
- SMS réels via Firebase
- Domaines autorisés
```

---

## Commandes Utiles

```bash
# Démarrer le dev
npm run dev

# Vérifier les erreurs
npm run lint

# Vérifier les types
npm run typecheck

# Voir les logs Firebase
firebase functions:log
```

---

## Checklist Avant Production

- [ ] Email authentication testée
- [ ] Téléphone authentication testée
- [ ] reCAPTCHA v2 configuré
- [ ] Cloud Function déployée
- [ ] Service email configuré
- [ ] Variables d'environnement définies
- [ ] HTTPS activé
- [ ] Rate limiting implémenté
- [ ] Logging configuré
- [ ] Alertes configurées

---

## Support Rapide

**Q: Le code email ne s'affiche pas?**  
A: Ouvrir console (F12) et chercher "📧"

**Q: L'email n'est pas reçu?**  
A: En dev, le code est dans la console. En prod, vérifier Cloud Function.

**Q: Le téléphone ne fonctionne pas?**  
A: Configurer reCAPTCHA v2 dans Firebase Console

**Q: Trop de tentatives?**  
A: Attendre 5 minutes ou renvoyer un code

---

**Dernière mise à jour**: January 21, 2026  
**Prêt pour**: Développement immédiat

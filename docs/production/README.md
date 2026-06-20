# Livraison Production eNkamba v1.3.0

## Résumé

Cette livraison regroupe la version exploitable de l'application eNkamba, son APK Android, les documents de support et les procédures nécessaires à une exploitation client.

## Périmètre livré

### Apps principales

- Paiement : portefeuille, carte, solde masqué, QR paiement, historique et accès sécurisé.
- Marché : accueil marketplace, recherche, commande, livraison Ugavi et détails produits renforcés.
- Logistique : livraison, agences nationales, agences internationales, agences relais, tracking, scan QR/code-barres et preuve de livraison.
- Chat : discussions personnelles et business, profils, blocage, fonds de discussion, QR contact et traduction.
- Réseau social : feed compact, publication média, profil public, suivi, restriction et blocage.
- Admin : infrastructure, logs, cyber, pages dédiées, surveillance et accès aux modules de contrôle.

### Mobile Android

- Application Capacitor native.
- Package Android : `io.enkamba.app`.
- Version : `1.3.0`.
- versionCode : `6`.
- APK : `enkamba-v1.3.0-production.apk`.

## Architecture d'exploitation

L'APK utilise une WebView native et charge l'application depuis le domaine de production :

```text
Application Android -> WebView Capacitor -> https://www.enkamba.io
```

Ce mode conserve les routes API, l'authentification, Firebase, les paiements, les médias et les fonctions temps réel côté serveur.

## Pré-requis production

- Domaine production actif en HTTPS.
- Firebase configuré pour l'environnement production.
- Règles Firestore et Storage vérifiées.
- Variables d'environnement production chargées côté serveur.
- Comptes administrateurs créés et testés.
- APK signée avec le keystore officiel.
- Procédure de sauvegarde activée.
- Support client prêt avec contacts et procédure d'incident.

## Validation minimale avant livraison client

1. Installer l'APK sur un appareil Android physique.
2. Ouvrir l'application et vérifier le splash screen.
3. Se connecter avec un compte utilisateur standard.
4. Se connecter avec un compte admin.
5. Tester les apps Paiement, Marché, Logistique, Chat et Social.
6. Créer un colis test et suivre son évolution.
7. Scanner un QR/code-barres colis.
8. Créer une commande Marché et lancer l'itinéraire Ugavi interne.
9. Vérifier les logs admin.
10. Confirmer qu'aucune erreur critique n'apparaît en navigation normale.

## Documents associés

- `GUIDE_ADMIN.md` : exploitation quotidienne par l'administrateur.
- `FORMATION_CLIENT.md` : support de formation client.
- `CHECKLIST_EXPLOITATION.md` : contrôle avant mise en production.
- `PROCEDURE_RELEASE_ANDROID.md` : génération et distribution APK.

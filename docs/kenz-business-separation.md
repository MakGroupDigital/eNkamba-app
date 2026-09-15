# Kenz Business: séparation B2C / B2B

## Résultat

Kenz reste l’application réservée aux clients. Kenz Business est un portail web indépendant pour les activités professionnelles, accessible à `business.enkamba.io` après déploiement.

Les deux applications utilisent le même projet Firebase `studio-1153706651-6032b` et les mêmes collections Firestore. Cette livraison ne déplace, ne duplique et ne modifie aucune donnée existante.

| Élément | Kenz client | Kenz Business |
| --- | --- | --- |
| Commandes, portefeuille, achats, colis, dons publics | Oui | Redirection vers Kenz |
| Demandes et dashboards business | Redirection vers Kenz Business | Oui |
| Boutique, catalogue et commandes vendeur | Non | Oui |
| Agence logistique, relais/POS, eChurch | Non | Oui |
| Firebase Auth, Firestore, Cloud Functions | Projet partagé | Projet partagé |

## Parcours

1. Dans Kenz, les paramètres affichent seulement **Obtenir un compte business** et ouvrent le portail.
2. Après connexion, Kenz Business charge tous les comptes réellement détenus par l’utilisateur.
3. Chaque carte ouvre l’identifiant exact du compte. Deux agences de paiement, deux boutiques ou deux comptes logistiques ne sont jamais mélangés.
4. Un nouvel utilisateur est dirigé vers le choix de structure : entreprise, indépendant, boutique, logistique, POS, agent, cabinet, église ou école.
5. Une entreprise passe par KYB avec les documents de société. Les autres structures passent par KYC. Les documents sont envoyés vers Cloudinary conformément à l’architecture existante.
6. La validation renvoie vers le compte concerné grâce à `businessId` ou `accountId`.

## Déploiement sans interruption

1. Pousser et déployer d’abord le dépôt `MakGroupDigital/enkambabusiness`.
2. Configurer `business.enkamba.io` chez l’hébergeur du nouveau portail.
3. Ajouter `business.enkamba.io` dans les domaines autorisés de Firebase Authentication, avec le domaine client déjà utilisé en production.
4. Ajouter au portail les variables suivantes :

```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=studio-1153706651-6032b.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=studio-1153706651-6032b
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=studio-1153706651-6032b.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=60114170881
NEXT_PUBLIC_FIREBASE_APP_ID=1:60114170881:web:7805087264e18745ef3c00
NEXT_PUBLIC_KENZ_CLIENT_URL=https://enkamba.io
KENZ_API_ORIGIN=https://enkamba.io
```

5. Mettre `NEXT_PUBLIC_BUSINESS_PORTAL_URL=https://business.enkamba.io` dans Kenz client et redéployer Kenz.
6. Déployer les fonctions Firebase pour que la notification de validation cible le compte exact :

```bash
cd functions
npx firebase deploy --only functions:onBusinessAccountApproved
```

## Retour arrière

Avant le dernier déploiement client, aucun lien client ne dépend du nouveau sous-domaine. Pour revenir temporairement à l’ancien comportement, retirer `NEXT_PUBLIC_BUSINESS_PORTAL_URL` ou restaurer seulement le déploiement frontend Kenz. Les comptes et les dossiers Firestore restent inchangés.

## Limite connue à traiter avant production

Les règles Firestore actuellement présentes dans le dépôt autorisent encore les lectures et écritures globales. Cette séparation respecte ces règles pour éviter de casser l’application existante, mais il faut remplacer cette règle de développement par des règles basées sur `request.auth.uid` avant ouverture publique de Kenz Business.

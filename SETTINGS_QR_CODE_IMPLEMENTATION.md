# Implémentation QR Code de Contact dans Paramètres

## Résumé
Ajout d'une fonctionnalité de QR code de contact dans la page des paramètres, permettant aux utilisateurs de partager facilement leurs informations de contact.

## Fonctionnalités Implémentées

### 1. Affichage de la Photo de Profil
**Fichier**: `src/app/dashboard/settings/page.tsx`

- Récupération de la photo depuis `profile.profileImage` ou `profile.photoURL`
- Affichage dans l'Avatar avec fallback sur les initiales
- Synchronisation avec les autres pages de l'application

### 2. Composant ContactQRCode
**Fichier**: `src/components/settings/ContactQRCode.tsx`

#### Fonctionnalités:
- **Génération de QR Code** avec les informations:
  - UID de l'utilisateur
  - Nom complet
  - Email
  - Téléphone (si défini)
  
- **Format du QR Code**: `CONTACT|uid|name|email|phone`
  - Exemple: `CONTACT|abc123|Jean Dupont|jean@example.com|+243851723022`

- **Actions disponibles**:
  - **Télécharger**: Sauvegarde le QR code en PNG
  - **Partager**: Utilise l'API Web Share (mobile) ou copie les infos

- **Design**:
  - QR code en couleur eNkamba (#32BB78)
  - Fond blanc avec bordure
  - Affichage des informations de contact sous le QR code

### 3. Bouton QR Code dans Paramètres
**Emplacement**: À côté de la photo de profil

- Icône QR code circulaire
- Ouvre le dialog du QR code au clic
- Tooltip "Mon QR Code"

### 4. Section Informations Détaillées
**Comportement**: Cachée par défaut, visible sur demande

- Bouton "Voir et modifier mes infos" pour toggle
- Animation fluide lors de l'affichage
- Affiche toutes les informations du profil

## Architecture

```
src/
├── components/
│   └── settings/
│       └── ContactQRCode.tsx       # Composant QR code de contact
└── app/
    └── dashboard/
        └── settings/
            └── page.tsx            # Page paramètres mise à jour
```

## Format des Données QR Code

### Structure
```
CONTACT|{uid}|{name}|{email}|{phone}
```

### Exemple
```
CONTACT|abc123def456|Jean Dupont|jean.dupont@example.com|+243851723022
```

### Champs
1. **Type**: `CONTACT` (identifie le type de QR code)
2. **UID**: Identifiant unique Firebase de l'utilisateur
3. **Name**: Nom complet de l'utilisateur
4. **Email**: Adresse email
5. **Phone**: Numéro de téléphone (vide si non défini)

## Utilisation

### Pour l'utilisateur:
1. Aller dans **Paramètres**
2. Cliquer sur l'icône **QR Code** à côté de la photo de profil
3. Le QR code s'affiche avec les informations de contact
4. Options:
   - **Télécharger**: Sauvegarde l'image du QR code
   - **Partager**: Partage via les apps natives ou copie les infos

### Pour scanner le QR code:
1. Utiliser le scanner de l'app eNkamba
2. Scanner le QR code d'un contact
3. Les informations sont extraites et peuvent être ajoutées aux contacts

## Intégration avec le Module Paiement

Le format du QR code est cohérent avec celui utilisé dans le module paiement:
- Même bibliothèque: `qrcode` v1.5.4
- Même couleur: #32BB78 (vert eNkamba)
- Même structure: `TYPE|data1|data2|...`

### Autres types de QR codes dans l'app:
- **PAYMENT**: Pour les paiements
- **GROUP**: Pour rejoindre un groupe
- **CONTACT**: Pour ajouter un contact (nouveau)

## Sécurité et Confidentialité

- Le QR code contient uniquement les informations publiques
- L'UID permet d'identifier l'utilisateur de manière unique
- Pas d'informations sensibles (mot de passe, solde, etc.)
- Le téléphone est optionnel et n'apparaît que s'il est défini

## Améliorations Futures

1. **Scanner de QR Code de Contact**
   - Ajouter une fonctionnalité pour scanner les QR codes de contact
   - Ajouter automatiquement aux contacts eNkamba

2. **Personnalisation du QR Code**
   - Permettre de choisir les informations à inclure
   - Options de couleur et style

3. **QR Code Dynamique**
   - Générer un lien court qui redirige vers le profil
   - Permet de mettre à jour les infos sans changer le QR code

4. **Statistiques**
   - Suivre combien de fois le QR code a été scanné
   - Voir qui a ajouté l'utilisateur via QR code

## Tests Recommandés

1. Générer le QR code avec différents profils
2. Tester le téléchargement sur mobile et desktop
3. Tester le partage via Web Share API
4. Vérifier que le QR code contient les bonnes données
5. Scanner le QR code avec un lecteur externe
6. Tester avec/sans numéro de téléphone

## Notes Techniques

- Utilise `qrcode` pour la génération
- Utilise `next/image` pour l'affichage optimisé
- Web Share API pour le partage natif
- Fallback sur clipboard pour les navigateurs non compatibles
- Dialog responsive (mobile-friendly)

# eNkamba APK v1.3.0 - Livraison Production

## Informations de release

- Version : 1.3.0
- Android versionCode : 6
- Date : 20 juin 2026
- Package : `io.enkamba.app`
- APK attendue : `enkamba-v1.3.0-production.apk`
- Taille : 9,8 MB
- SHA-256 : `cbb0681b6c99cb18ed0cddcd7a7ee615ba9384b266da9240e596f44fcde0371c`
- Mode mobile : WebView native Capacitor chargeant `https://www.enkamba.io`

## Objectif

Cette release prépare eNkamba pour une livraison exploitable : build mobile propre, documentation de production, guide administrateur, checklist de validation et support de formation client.

## Principales évolutions depuis v1.2.3

- Stabilisation du flux Logistique : suivi colis, scan QR/code-barres, agences nationales, internationales, relais, preuve de livraison et espace agent.
- Ajout d'une procédure de release Android en ligne de commande.
- Ajout d'une commande `npm run apk:release`.
- Documentation production structurée dans `docs/production`.
- Version applicative alignée en `1.3.0`.

## Vérifications recommandées

- `npm run typecheck`
- `npm run build`
- `npm run apk:release`
- Installation APK sur un appareil Android physique.
- Connexion utilisateur, connexion admin et navigation entre les apps principales.
- Test Logistique complet : création, scan, changement statut, tracking et preuve de livraison.
- Test Paiement : portefeuille, QR paiement, historique, visibilité du solde.
- Test Marché : recherche produit, commande, accès itinéraire Ugavi interne.
- Test Chat/Social : conversation, profil public, publication média, fond de discussion, traduction.

## Notes de sécurité

- Ne pas versionner les fichiers de signature Android.
- Garder le keystore et les mots de passe hors du dépôt Git.
- Vérifier les règles Firestore et les variables de production avant diffusion client.
- Utiliser un compte admin restreint pour la formation et les démonstrations.

## Artefacts

- APK : `enkamba-v1.3.0-production.apk`
- Signature APK : valide avec APK Signature Scheme v2
- Notes : `APK_V1.3.0_RELEASE_NOTES.md`
- Documentation : `docs/production/README.md`
- Guide admin : `docs/production/GUIDE_ADMIN.md`
- Formation client : `docs/production/FORMATION_CLIENT.md`
- Checklist exploitation : `docs/production/CHECKLIST_EXPLOITATION.md`
- Procédure APK : `docs/production/PROCEDURE_RELEASE_ANDROID.md`

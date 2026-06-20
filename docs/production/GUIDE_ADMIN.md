# Guide Administrateur eNkamba

## Objectif

Ce guide aide l'administrateur à superviser les apps eNkamba, traiter les demandes, contrôler les incidents et assurer une exploitation stable.

## Accès admin

1. Se connecter avec un compte autorisé.
2. Ouvrir l'app Admin.
3. Vérifier que le tableau de bord affiche les indicateurs essentiels.
4. Utiliser les boutons du dashboard pour accéder aux pages spécialisées.

## Pages principales

### Infrastructure

But : contrôler l'état général de l'écosystème.

Actions :

- Lire l'état des serveurs applicatifs.
- Consulter les services par app.
- Vérifier les pare-feu, agents connectés et points de surveillance.
- Ouvrir les cartes de surveillance pour analyser l'activité géographique.

### Logs

But : identifier les erreurs rencontrées dans les apps.

Actions :

- Filtrer par app, page, utilisateur, gravité et période.
- Copier le message exact d'erreur.
- Partager un incident avec l'équipe technique.
- Marquer un incident comme traité après correction.

### Cyber

But : surveiller les comportements sensibles.

Actions :

- Voir les sessions actives.
- Lire les adresses IP, localisations approximatives et appareils.
- Identifier les pages où les utilisateurs passent le plus de temps.
- Repérer les accès inhabituels.
- Escalader les alertes critiques.

### Business Accounts

But : contrôler les comptes professionnels et agences.

Actions :

- Valider les demandes business.
- Vérifier les documents KYB.
- Contrôler les agences nationales, internationales et relais.
- Approuver, suspendre ou mettre sous surveillance une agence.
- Lire les scores de fiabilité.

### Paiement

But : suivre les flux financiers.

Actions :

- Vérifier les transactions.
- Contrôler les statuts paiement.
- Gérer les litiges.
- Bloquer ou débloquer un règlement si nécessaire.
- Exporter un rapport financier.

### Logistique

But : contrôler les colis et les opérations terrain.

Actions :

- Rechercher un colis par numéro, QR ou code-barres.
- Lire l'historique de tracking.
- Voir l'agence responsable.
- Vérifier la preuve de livraison.
- Identifier les colis en retard.
- Contrôler les scans entrée, sortie et livraison.

## Routine quotidienne recommandée

### Matin

- Vérifier l'état Infrastructure.
- Lire les erreurs critiques.
- Contrôler les paiements bloqués.
- Vérifier les colis en retard.

### Milieu de journée

- Traiter les demandes business.
- Contrôler les signalements utilisateurs.
- Suivre les agences sous surveillance.

### Fin de journée

- Exporter ou noter les incidents importants.
- Vérifier les comptes à risque.
- Préparer le résumé d'exploitation.

## Gestion incident

1. Identifier l'app concernée.
2. Copier le message exact.
3. Relever utilisateur, heure, page, appareil et IP si disponible.
4. Classer la gravité : faible, moyenne, élevée, critique.
5. Corriger ou escalader à l'équipe technique.
6. Tester après correction.
7. Fermer l'incident avec une note.

## Bonnes pratiques

- Ne jamais partager un accès admin personnel.
- Ne jamais publier les fichiers de signature APK.
- Utiliser un compte de test pour les démonstrations.
- Limiter les exports aux personnes autorisées.
- Documenter chaque suspension ou déblocage.
- Vérifier les règles d'accès après chaque grande mise à jour.

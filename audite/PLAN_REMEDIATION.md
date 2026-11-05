# Plan de remédiation — Audit « Feedback de test eNkamba Août 2026 »

Source : `audite/Feedback de test eNkamba Août 2026.xlsx` (85 tickets ENK-001 → ENK-085, 6 captures).
Légende statut : ⏳ à faire · 🔧 en cours · ✅ fait (code) · 🟡 partiel · ⛔ hors code / décision requise

## A. Exécutable dans le code (ordre d'exécution)

### Phase 0 — Stop-the-line (S0)
| # | Ticket | Sujet | Statut |
|---|---|---|---|
| 1 | ENK-013 | Retirer le « chevron » flottant gauche (raccourci « Mes colis » qui ressemble à un outil debug) | ✅ |
| 2 | ENK-012 | Supprimer le bandeau de localisation permanent ; localisation seulement à l'usage | ✅ |
| 3 | ENK-014 | Bouton IA flottant : ne plus recouvrir les CTA (zones sûres, masquage contextuel) | ✅ |
| 4 | ENK-064 | Makutano : pas de localisation précise sous le nom par défaut (ville seulement, opt-in) | ✅ |
| 5 | ENK-051 | Devises : RMB → CNY, FCFA → XAF (codes ISO non ambigus) | 🟡 |
| 6 | ENK-007 | Soldes fictifs : neutraliser les chemins de code qui créditent sans transaction réelle (bypass/test) ; script d'audit des soldes en lecture seule | 🟡 |

### Phase 1 — Feedbacks testeurs (onglet « Feedback Enkamba »)
| # | Ticket | Sujet | Statut |
|---|---|---|---|
| 7 | ENK-001 | IA : rendu Markdown fiable (plus de `**`) + actions Copier / J'aime / Écouter / Partager | ✅ |
| 8 | ENK-003 | Makutano : « Voir plus / Voir moins » sur publications longues | ✅ |
| 9 | ENK-004 | Makutano : commentaires avec avatar, réponse, réaction, mention @ | ✅ |
| 10 | ENK-005 | Makutano : réactions multiples + liste des personnes ayant réagi | ✅ |
| 11 | ENK-006 | Makutano : statistiques du profil cliquables | ✅ |
| 12 | ENK-011 | Makutano : publications du profil = même composant que le fil | ✅ |
| 13 | ENK-010 | Photo de profil ouvrable en grand format | ✅ |
| 14 | ENK-009 | Chat : notes vocales (enregistrement, durée, prévisualisation) | ✅ |
| 15 | ENK-002 | Paiement Web : affichage Services financiers / Futur / Autres services | 🟡 |

### Phase 2 — UX transversale visible sur les captures
| # | Ticket | Sujet | Statut |
|---|---|---|---|
| 16 | ENK-016 / 031 | Libellés coupés (« Gr », « Fournisse… », « Top vente… », « Entrepren… ») | 🟡 |
| 17 | ENK-025 | Chat : ne plus afficher d'e-mail brut comme nom de contact | ✅ |
| 18 | ENK-015 | Navigation : supprimer le doublon « Paramètres » | ✅ |
| 19 | ENK-040 | Ugavi : labels persistants, CTA « Rechercher » non recouvert | ✅ |
| 20 | ENK-017 | Casse du prénom (« Bonsoir, martin ») et terminologie | 🟡 |

## B. Hors code / décision humaine requise (⛔)
Ces tickets exigent des contrats, des licences, des audits externes, des équipes ou des décisions de direction. Le code ne peut pas les « valider » seul :
- **Paiement réglementé** : ENK-048 grand livre double entrée audité, 049 idempotence, 050 rapprochement, 053 KYC/AML, 054 fraude, 055 authentification forte, 056 PCI, 057 reversals, 058 disponibilité pays, 059 produits réglementés, 060 FacePaie (DPIA), 061 back-office 4 yeux, 062 PRA.
- **Sécurité / conformité** : ENK-027 audit E2EE, 078 AppSec/SBOM/pentest, 083 gouvernance vie privée, 085 stores/licences, 008 crypto.
- **Trust & Safety** : ENK-028/066 modération et SLA, 067 mineurs, 037 contrefaçon.
- **Plateforme / exploitation** : ENK-077 contrats API, 079 CI/CD, 080 SRE, 081 matrice appareils et charge, 082 canary/feature flags, 084 KPI et mode démo.
- **Chantiers métier longs** : ENK-034/035/036/039 checkout, commandes, stock, orchestration ; 042–047 devis, tracking, preuve de garde, douane ; 070–075 gouvernance IA ; 018 i18n complète ; 019 WCAG complet ; 023 design system.

Décision recommandée par l'audit et reprise ici : **aucun lancement avec argent réel** avant que la partie B « Paiement » soit validée.

## Journal d'exécution (2026-11-05)
Vérifications : `tsc --noEmit` client et business = 0 erreur · tests business 14/14 · tests unitaires des nouveaux utilitaires OK · test de rendu Markdown (gras, listes, tableaux, code, HTML/script injecté, liens `javascript:`) OK. Aucune donnée de production modifiée, rien de commité.

| # | Ticket | Ce qui a été fait | Fichiers principaux |
|---|---|---|---|
| 1 | ENK-013 | Languette noire globale supprimée ; dans Ugavi, bouton « Mes colis » libellé | `dashboard/layout.tsx`, `ugavi/page.tsx` |
| 2 | ENK-012 | Bandeau de localisation permanent supprimé ; Ugavi demande la position au clic sur « Me localiser », avec message si refus | `layout.tsx`, `ugavi/page.tsx` |
| 3 | ENK-014 | Bouton IA 48 px sans halo, au-dessus de la zone sûre, masqué sur paiements/Ugavi/création/fiche produit et quand le clavier est ouvert | `masolo-floating-button.tsx`, `hooks/useIsKeyboardOpen.ts` |
| 4 | ENK-064 | Lieu facultatif (aucun / ville / quartier), jamais de coordonnées GPS dans un post ; EXIF retiré des photos ; anciens posts affichés à la ville | `makutano/create`, `lib/makutano-location.ts`, `lib/strip-image-metadata.ts` |
| 5 | ENK-051 | Codes ISO affichés (CNY, XAF) + libellé régional ; formulaires business en CNY. Clés Firestore `RMB`/`FCFA` conservées (lecture) | `lib/currency-codes.ts`, `conversion`, `mbongo-dashboard` |
| 6 | ENK-007 | **Failles fermées** : dépôts « simulés » qui créditaient sans paiement (`add-funds`, `add-funds-lite`) ; page PayPal `/ok` qui créditait depuis le navigateur ; jeton Firebase réellement vérifié pour dépôt et retrait ; 7 routes test/debug fermées en production ; script d'audit des soldes **en lecture seule** | `api/wallet/*`, `app/ok`, `lib/verify-request-user.ts`, `middleware.ts`, `scripts/audit-wallet-balances.mjs` |
| 7 | ENK-001 | Rendu Markdown sûr (sans HTML brut) + Copier / Utile / Pas utile / Écouter / Partager | `components/ai/SafeMarkdown.tsx`, `AiMessageActions.tsx` |
| 8–12 | ENK-003/004/005/006/011 | Corps de publication partagé fil + profil : Voir plus/moins, 6 réactions + liste des personnes, commentaires avec avatar/réponse/mention/J'aime/suppression/signalement, stats du profil cliquables, publications du profil au format du fil, partage réel | `components/makutano/*`, `lib/makutano-reactions.ts`, `makutano/page.tsx`, `makutano/profile/[userId]` |
| 13 | ENK-010 | Visionneuse photo plein écran (zoom, Échap) | `components/profile/PhotoViewer.tsx` |
| 14 | ENK-009 | Format réel (WebM/MP4) au lieu de « wav », durée réelle, micro libéré, interruption gérée, refus des enregistrements vides/trop courts, aperçu stable ; lecture : son coupé par Web Audio sans CORS corrigé | `miyiki-chat/[id]/conversation-client.tsx`, `lib/media-recording.ts` |
| 15 | ENK-002 | Grilles Paiement adaptatives (plus de débordement à 320 px) — **à vérifier visuellement connecté** | `mbongo-dashboard/page.tsx` |
| 16 | ENK-016/031 | Filtres chat et marché à la ligne, catégories « Voir tout », onglets Makutano avec césure, onglets chat empilés | `miyiki-chat/page.tsx`, `nkampa/page.tsx`, `makutano/page.tsx` |
| 17 | ENK-025 | E-mails/numéros masqués comme noms (u•••@gmail.com), plus jamais enregistrés comme nom | `lib/display-identity.ts`, `useConversations.ts`, `useFirestoreConversations.ts` |
| 18 | ENK-015 | Onglet « Paramètres » du chat renommé « Options » (plus de doublon avec la barre du bas) | `miyiki-chat/page.tsx` |
| 19 | ENK-040 | Libellés persistants Départ/Destination, bouton inverser, CTA « Rechercher » pleine largeur | `ugavi/page.tsx` |
| 20 | ENK-017 | Prénom correctement capitalisé, plus d'e-mail ni de « Charmant » en repli | `ai/chat/*`, `lib/display-identity.ts` |

### Restes et décisions à prendre
- **Grand livre / règles Firestore (ENK-048)** : transferts, épargne, tontine, achats modifient encore les soldes depuis le navigateur, avec des règles Firestore ouvertes. Chantier serveur à planifier ; c'est le vrai verrou avant l'argent réel.
- **PayPal** : créditer exige un webhook PayPal vérifié côté serveur (identifiants PayPal requis). En attendant, aucun crédit automatique.
- **Audit des soldes (lancé le 2026-11-05, lecture seule)** : 46 portefeuilles, 8 à examiner (`audite/wallet-audit.csv`). Deux soldes viennent presque entièrement de dépôts non vérifiés (≈ 800 000 000 et ≈ 501 000 050) ; un solde à 4 998 000 face à un historique de −4 998 000 ; écarts restants liés aux conversions de devises (non comptées). Toute correction de solde passe par une migration validée par la Finance.
- **Posts Makutano existants** : 5 publications portent encore latitude/longitude. Script prêt : `node scripts/purge-makutano-post-coordinates.mjs` (simulation) puis `--apply` (sauvegarde dans `audite/makutano-location-backup.json`, garde la ville). Non exécuté : écriture en production bloquée par le garde-fou, à lancer par le responsable.
- **Devise des pages agent relais (business)** : ✅ décision : devise selon le pays de l'utilisateur, CDF par défaut (RDC). Montants de référence (rédigés en FCFA) convertis à des taux indicatifs et arrondis — `lib/local-currency.ts`, `hooks/useLocalCurrency.ts`. Les montants eux-mêmes restent à valider par le métier.
- **Marque (ENK-017)** : ✅ décision : la marque affichée est « Kenz » (libellés visibles « eNKAMBA » remplacés ; noms techniques inchangés).
- **Mentions @** : ✅ chaque personne mentionnée reçoit une notification « Vous avez été mentionné » (`users/{uid}/notifications`).

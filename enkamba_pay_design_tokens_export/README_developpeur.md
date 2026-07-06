# eNKAMBA Pay — Spécification UI développeur

## Couleurs officielles

| Nom | HEX | Usage |
|---|---|---|
| Vert principal eNKAMBA | `#028355` | Header, identité officielle, composants principaux |
| Vert actif | `#0F9A61` | Boutons actifs, icônes principales |
| Vert carte | `#089961` | Cartes solde et cartes devises |
| Vert accent | `#18A96E` | Badges, notifications, accents |
| Fond vert doux | `#E8F6F1` | Menu actif, background léger |
| Fond général | `#FCFDFC` | Fond de page |
| Texte principal | `#1B2026` | Titres et textes forts |
| Texte secondaire | `#477063` | Labels, sous-titres, menus inactifs |
| Bordure claire | `#E9F0ED` | Cartes, séparateurs |
| Blanc | `#FFFFFF` | Cartes, texte sur vert, bordures |

## Dégradés

```css
--enkamba-gradient-card-header: linear-gradient(135deg, #028355 0%, #089961 55%, #18A96E 100%);
--enkamba-gradient-round-button: linear-gradient(145deg, #028355 0%, #0F9A61 70%, #18A96E 100%);
--enkamba-gradient-ai-button: linear-gradient(145deg, #028355 0%, #18A96E 100%);
```

## Tailles des icônes

| Zone | Conteneur | Icône | Rayon |
|---|---:|---:|---:|
| Actions hautes | 72 × 72 px | 34 × 34 px | 50% |
| Services financiers | Carte 100 × 115 px | 42 × 42 px | 14 px |
| Menu bas inactif | — | 24 × 24 px | — |
| Menu bas actif | — | 26 × 26 px | Fond `#E8F6F1` |
| Bouton IA flottant | 64 × 64 px | Lettre 32 px | 50% |
| Badge mini IA | 22 × 22 px | — | 50% |

## Typographie

```css
font-family: Inter, Poppins, Roboto, sans-serif;
title-size: 22px;
section-title-size: 14px;
card-label-size: 13px;
bottom-menu-size: 11px;
font-weight-title: 700;
font-weight-section: 600;
font-weight-normal: 500;
```

## Fichiers inclus

1. `enkamba_pay_design_tokens.json` — prêt pour intégration mobile/web.
2. `enkamba_pay_tokens.css` — variables CSS + classes suggérées.
3. `README_developpeur.md` — résumé clair pour l’équipe technique.

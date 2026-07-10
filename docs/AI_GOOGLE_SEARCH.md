# Recherche web pour eNkamba AI

## Objectif

Quand l'utilisateur active le mode `Recherche` dans eNkamba AI, l'API `/api/ai/enhanced-chat` interroge le web, injecte les résultats dans le contexte IA, puis répond avec une synthèse ou une liste de sources.

## Fonctionnement sans clé API

La recherche fonctionne sans configuration obligatoire via DuckDuckGo HTML. Cela permet d'avoir des résultats web réels en local et en production sans dépendre d'une clé externe.

## Google Custom Search optionnel

Google peut être activé en priorité si une clé API est disponible.

```bash
GOOGLE_CUSTOM_SEARCH_API_KEY=...
GOOGLE_CUSTOM_SEARCH_CX=...
```

Alias acceptés pour le moteur :

```bash
GOOGLE_CUSTOM_SEARCH_ENGINE_ID=...
GOOGLE_CSE_ID=...
```

## Configuration

1. Créer une clé API dans Google Cloud Console.
2. Activer l'API `Custom Search API`.
3. Créer un moteur dans Google Programmable Search Engine.
4. Récupérer le `Search engine ID` et le placer dans `GOOGLE_CUSTOM_SEARCH_CX`.

## Comportement

Google est utilisé en priorité uniquement s'il est configuré.

Si Google n'est pas configuré, indisponible ou hors quota, l'app utilise DuckDuckGo HTML sans clé API. Aucun faux résultat n'est généré.

Si aucun fournisseur ne retourne de résultat exploitable, eNkamba AI le signale clairement au lieu de prétendre avoir consulté Internet.

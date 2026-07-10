# Base de connaissances eNkamba AI

## Objectif

La collection Firestore `aiKnowledgeBase` contient les connaissances que eNkamba AI utilise avant de répondre.

L'API `/api/ai/enhanced-chat` cherche les fiches pertinentes, les injecte dans le prompt, puis complète avec les connaissances générales du modèle et la recherche web si l'utilisateur active le mode Recherche.

## Collection Firestore

Collection : `aiKnowledgeBase`

Champs principaux :

- `id`
- `module`
- `title`
- `summary`
- `content`
- `keywords`
- `tags`
- `visibility`
- `priority`
- `status`
- `createdAt`
- `updatedAt`

## Import

Commande :

```bash
npm run seed:ai-knowledge
```

Le script utilise Firebase Admin et lit les credentials depuis :

- `firebase-admin-sdk.encoded.txt`, si présent ;
- ou `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` ;
- ou les variantes encodées `FIREBASE_CLIENT_EMAIL_ENCODED`, `FIREBASE_PRIVATE_KEY_ENCODED`.

Si Firebase renvoie `UNAUTHENTICATED`, le service account local est invalide, expiré, révoqué ou ne correspond pas au projet Firestore actif.

## Fallback

Même si Firestore n'est pas disponible, eNkamba AI utilise le fichier local :

`src/data/ai-knowledge-seed.json`

Cela permet à l'assistant de répondre immédiatement avec les connaissances eNkamba principales pendant que l'import Firestore est corrigé.

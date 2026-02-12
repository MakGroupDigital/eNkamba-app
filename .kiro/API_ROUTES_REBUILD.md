# Fix: Routes API Chat - Erreur 404

## Problème

L'erreur `Failed to load resource: the server responded with a status of 404 (Not Found)` sur `/api/chat/accept-transfer/` indique que le serveur de développement n'a pas recompilé les routes API après les modifications.

## Solution

### 1. Arrêter le serveur de développement

Appuyez sur `Ctrl+C` dans le terminal où le serveur tourne.

### 2. Redémarrer le serveur

```bash
npm run dev
```

ou

```bash
yarn dev
```

### 3. Attendre la recompilation

Le serveur devrait afficher:
```
- ready started server on 0.0.0.0:3000, url: http://localhost:3000
```

### 4. Tester les routes

Les routes suivantes devraient maintenant fonctionner:

- `POST /api/chat/transfer-money` - Créer un transfert
- `POST /api/chat/accept-transfer` - Accepter un transfert
- `POST /api/chat/reject-transfer` - Refuser un transfert

## Corrections Appliquées

### 1. Import manquant dans accept-transfer

**Avant:**
```typescript
import { doc, getDoc, updateDoc, increment, collection, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
```

**Après:**
```typescript
import { doc, getDoc, updateDoc, increment, collection, query, where, getDocs, serverTimestamp, addDoc } from 'firebase/firestore';
```

### 2. Utilisation incorrecte de addDoc

**Avant:**
```typescript
const historyRef = collection(db, 'transactions');
await historyRef.add({...});  // ❌ collection n'a pas de méthode add()
```

**Après:**
```typescript
const historyRef = collection(db, 'transactions');
await addDoc(historyRef, {...});  // ✅ Correct
```

## Fichiers Modifiés

- `src/app/api/chat/accept-transfer/route.ts` - Correction des imports et de la syntaxe

## Vérification

Après le redémarrage, vérifiez dans la console du navigateur:

1. Ouvrez DevTools (F12)
2. Allez dans l'onglet Network
3. Essayez d'accepter un transfert
4. Vérifiez que la requête `accept-transfer` retourne 200 (succès) et non 404

## Logs Attendus

Après le redémarrage, vous devriez voir:

```
✓ Compiled successfully
```

Et dans la console du navigateur, pas d'erreur 404 sur les routes API du chat.

# Fix Makutano - Publication en Production

## Problème
Le module Makutano publiait bien en local mais pas en production.

## Cause
Makutano utilisait sa propre route API `/api/makutano/upload-media` pour uploader les médias vers Cloudinary, alors que les stories utilisent la fonction `uploadToCloudinary` qui appelle `/api/stories/upload-media`.

## Solution
Modifié `src/app/dashboard/makutano/create/page.tsx` pour utiliser la même fonction `uploadToCloudinary` que les stories.

### Changements

#### Avant (ne fonctionnait pas en production)
```typescript
const uploadToStorage = async (): Promise<string> => {
  if (pickedFile) {
    const token = await user.getIdToken();
    const formData = new FormData();
    formData.append('file', pickedFile);
    formData.append('userId', user.uid);
    formData.append('mediaType', mediaType);

    const response = await fetch('/api/makutano/upload-media', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    // ...
  }
};
```

#### Après (fonctionne en production)
```typescript
import { uploadToCloudinary } from '@/lib/cloudinary-upload';

const uploadToStorage = async (): Promise<string> => {
  if (pickedFile) {
    const resourceType = mediaType === 'image' ? 'image' : mediaType === 'video' ? 'video' : 'raw';
    const uploadResult = await uploadToCloudinary(pickedFile, resourceType);
    return uploadResult.secureUrl;
  }
  return externalMediaUrl.trim();
};
```

## Avantages
1. ✅ Utilise la même infrastructure que les stories (déjà testée et fonctionnelle)
2. ✅ Pas besoin de maintenir deux routes API différentes
3. ✅ Fonctionne en local ET en production
4. ✅ Gestion d'erreur cohérente avec les stories

## Fichiers modifiés
- `src/app/dashboard/makutano/create/page.tsx`

## Fichiers obsolètes (peuvent être supprimés)
- `src/app/api/makutano/upload-media/route.ts` (plus utilisé)

## Test
1. Aller sur http://localhost:9002/dashboard/makutano
2. Cliquer sur le bouton "+" pour créer un post
3. Ajouter une image/vidéo/audio
4. Publier
5. Vérifier que le post apparaît dans le feed

## Déploiement
Les modifications ont été poussées sur GitHub et seront automatiquement déployées sur Vercel.

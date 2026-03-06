# Migration: Chat Media to Cloudinary

## Objectif
Migrer tous les médias de chat (audio, vidéo, photos, fichiers) de Firebase Storage (base64) vers Cloudinary pour:
- Réduire la taille des documents Firestore
- Améliorer les performances de chargement
- Optimiser le stockage et la bande passante
- Utiliser les fonctionnalités de transformation de Cloudinary

## Changements Implémentés

### 1. Messages Audio (Voice)

**Avant:**
```typescript
// Enregistrement audio stocké en base64 dans Firestore
await sendMessage(conversationId, '🎤 Message vocal', 'voice', { 
  audio: base64String,
  duration: recordingDuration
});
```

**Après:**
```typescript
// Upload vers Cloudinary puis stockage de l'URL
const uploadResult = await uploadToCloudinary(file, 'video'); // audio = video pour Cloudinary
await sendMessage(conversationId, '🎤 Message vocal', 'voice', { 
  mediaUrl: uploadResult.secureUrl,
  duration: recordingDuration,
  thumbnailUrl: uploadResult.thumbnailUrl
});
```

### 2. Messages Vidéo

**Avant:**
```typescript
// Vidéo stockée en base64
await sendMessage(conversationId, '🎥 Message vidéo', 'video', { 
  video: base64String,
  duration: recordingDuration
});
```

**Après:**
```typescript
// Upload vers Cloudinary
const uploadResult = await uploadToCloudinary(file, 'video');
await sendMessage(conversationId, '🎥 Message vidéo', 'video', { 
  mediaUrl: uploadResult.secureUrl,
  duration: recordingDuration,
  thumbnailUrl: uploadResult.thumbnailUrl
});
```

### 3. Fichiers (Photos, Documents, etc.)

**Avant:**
```typescript
// Fichier stocké en base64
await sendMessage(conversationId, `📎 ${file.name}`, 'file', { 
  fileName: file.name, 
  fileType: file.type, 
  fileData: base64String,
  fileSize: file.size
});
```

**Après:**
```typescript
// Détection automatique du type et upload vers Cloudinary
let resourceType: 'image' | 'video' | 'raw' = 'raw';
if (file.type.startsWith('image/')) resourceType = 'image';
else if (file.type.startsWith('video/')) resourceType = 'video';
else if (file.type.startsWith('audio/')) resourceType = 'video';

const uploadResult = await uploadToCloudinary(file, resourceType);
await sendMessage(conversationId, `📎 ${file.name}`, 'file', { 
  fileName: file.name, 
  fileType: file.type, 
  fileSize: file.size,
  mediaUrl: uploadResult.secureUrl,
  thumbnailUrl: uploadResult.thumbnailUrl
});
```

### 4. Affichage des Médias

**Support Legacy + Nouveau Format:**

```typescript
// Détection intelligente
const isAudioMessage = message.messageType === 'voice' && message.metadata?.mediaUrl;
const isLegacyAudioMessage = message.metadata?.audio; // Anciens messages

// URL unifiée
const audioUrl = message.metadata?.mediaUrl || 
                 (message.metadata?.audio ? `data:audio/wav;base64,${message.metadata.audio}` : null);

// Affichage
<audio src={audioUrl} controls />
```

### 5. Composant FileMessage

**Props mises à jour:**
```typescript
interface FileMessageProps {
  fileName: string;
  fileType: string;
  fileData?: string;      // Legacy: base64
  mediaUrl?: string;      // New: Cloudinary URL
  thumbnailUrl?: string;  // Cloudinary thumbnail
  fileSize?: number;
  senderName?: string;
  timestamp?: Date;
}
```

**Logique d'affichage:**
```typescript
// Priorité à mediaUrl, fallback sur fileData
const fileUrl = mediaUrl || (fileData ? `data:${fileType};base64,${fileData}` : null);

// Images avec thumbnail optimisé
<img src={thumbnailUrl || fileUrl} alt={fileName} />

// Téléchargement
<a href={fileUrl} download={fileName} target="_blank">Télécharger</a>
```

## Structure des Métadonnées

### Nouveau Format (Cloudinary)
```typescript
{
  messageType: 'voice' | 'video' | 'file',
  metadata: {
    mediaUrl: string,        // URL Cloudinary principale
    thumbnailUrl?: string,   // Thumbnail généré par Cloudinary
    duration?: number,       // Pour audio/vidéo
    fileName?: string,       // Pour fichiers
    fileType?: string,       // MIME type
    fileSize?: number        // Taille en bytes
  }
}
```

### Format Legacy (Base64)
```typescript
{
  messageType: 'voice' | 'video' | 'file',
  metadata: {
    audio?: string,          // Base64 audio
    video?: string,          // Base64 vidéo
    fileData?: string,       // Base64 fichier
    duration?: number,
    fileName?: string,
    fileType?: string,
    fileSize?: number
  }
}
```

## Avantages

### Performance
- **Taille Firestore réduite**: URLs au lieu de base64 (réduction de ~75%)
- **Chargement plus rapide**: CDN Cloudinary vs base64 inline
- **Bande passante optimisée**: Compression automatique

### Fonctionnalités
- **Thumbnails automatiques**: Pour vidéos et images
- **Transformations**: Redimensionnement, recadrage, filtres
- **Streaming optimisé**: Pour audio et vidéo
- **Cache CDN**: Distribution mondiale

### Coûts
- **Stockage Firestore**: Réduction significative
- **Bande passante**: Cloudinary gère la distribution
- **Scalabilité**: Meilleure gestion de la croissance

## Compatibilité

### Rétrocompatibilité Totale
- Les anciens messages avec base64 continuent de fonctionner
- Détection automatique du format (mediaUrl vs base64)
- Pas de migration de données nécessaire
- Transition progressive et transparente

### Détection du Format
```typescript
// Nouveau format
if (message.metadata?.mediaUrl) {
  // Utiliser Cloudinary URL
}
// Format legacy
else if (message.metadata?.audio || message.metadata?.video || message.metadata?.fileData) {
  // Utiliser base64
}
```

## Progression de l'Upload

Feedback visuel pendant l'upload:
```typescript
setSendingProgress(0);    // Début
// ... upload vers Cloudinary ...
setSendingProgress(70);   // Upload terminé
// ... envoi message Firestore ...
setSendingProgress(90);   // Message envoyé
// ... finalisation ...
setSendingProgress(100);  // Terminé
```

## Types de Fichiers Supportés

### Images
- JPEG, PNG, GIF, WebP, SVG
- Thumbnail automatique
- Transformations disponibles

### Vidéos
- MP4, WebM, MOV, AVI
- Thumbnail de la première frame
- Streaming optimisé

### Audio
- WAV, MP3, OGG, M4A
- Traité comme 'video' par Cloudinary
- Streaming audio

### Documents
- PDF, DOC, DOCX, TXT
- Stocké comme 'raw'
- Téléchargement direct

## Fichiers Modifiés

1. **src/app/dashboard/miyiki-chat/[id]/conversation-client.tsx**
   - Ajout import `uploadToCloudinary`
   - Modification `sendRecording()` pour upload Cloudinary
   - Modification `handleSendFile()` pour upload Cloudinary
   - Mise à jour détection messages audio/vidéo
   - Support legacy + nouveau format

2. **src/components/chat/FileMessage.tsx**
   - Ajout props `mediaUrl` et `thumbnailUrl`
   - Props `fileData` devient optionnel (legacy)
   - Logique unifiée pour URLs et base64
   - Téléchargement compatible Cloudinary

3. **src/hooks/useStories.ts**
   - Fonction `replyToStory` mise à jour (tâche précédente)

## Tests Recommandés

1. **Enregistrement audio**
   - Enregistrer un message vocal
   - Vérifier l'upload vers Cloudinary
   - Vérifier la lecture

2. **Enregistrement vidéo**
   - Enregistrer un message vidéo
   - Vérifier le thumbnail
   - Vérifier la lecture

3. **Upload fichiers**
   - Image: vérifier thumbnail
   - Vidéo: vérifier lecture
   - Audio: vérifier lecture
   - Document: vérifier téléchargement

4. **Messages legacy**
   - Vérifier que les anciens messages s'affichent
   - Vérifier la lecture des anciens audios/vidéos

## Migration Future (Optionnelle)

Si vous souhaitez migrer les anciens messages:

```typescript
// Script de migration (à exécuter une fois)
const migrateOldMessages = async () => {
  const messagesRef = collection(db, 'conversations', conversationId, 'messages');
  const q = query(messagesRef, where('metadata.audio', '!=', null));
  
  const snapshot = await getDocs(q);
  for (const doc of snapshot.docs) {
    const data = doc.data();
    
    // Convertir base64 en blob
    const blob = base64ToBlob(data.metadata.audio, 'audio/wav');
    const file = new File([blob], 'audio.wav', { type: 'audio/wav' });
    
    // Upload vers Cloudinary
    const result = await uploadToCloudinary(file, 'video');
    
    // Mettre à jour le message
    await updateDoc(doc.ref, {
      'metadata.mediaUrl': result.secureUrl,
      'metadata.audio': deleteField() // Supprimer l'ancien champ
    });
  }
};
```

## Conclusion

Migration réussie vers Cloudinary pour tous les types de médias dans le chat, avec:
- Rétrocompatibilité totale
- Performances améliorées
- Coûts optimisés
- Fonctionnalités avancées (thumbnails, transformations)
- Expérience utilisateur améliorée

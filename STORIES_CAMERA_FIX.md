# Fix Stories - Flux Caméra et Menu d'Options

## Problèmes Résolus

### 1. Menu d'options manquant pour Photo
**Avant**: Quand on cliquait sur "Photo", la caméra démarrait automatiquement sans choix.
**Après**: Menu d'options avec "Prendre une photo" ou "Importer une photo".

### 2. Flux caméra ne s'affichait pas
**Problème**: Quand on cliquait sur "Filmer maintenant", la page de la caméra s'affichait (lampe allumée) mais l'écran restait noir.
**Cause**: Le `streamRef.current` était défini mais ne déclenchait pas de re-render, et le stream n'était pas connecté au `<video>` au bon moment.

## Solutions Implémentées

### 1. Ajout du state `isCameraActive`
```typescript
const [isCameraActive, setIsCameraActive] = useState(false);
```

Ce state force un re-render quand la caméra est prête, permettant d'afficher la bonne interface.

### 2. Ajout d'un useEffect pour connecter le stream
```typescript
useEffect(() => {
  if (isCameraActive && streamRef.current && videoRef.current) {
    videoRef.current.srcObject = streamRef.current;
    videoRef.current.play().catch(err => console.error('Erreur lecture vidéo:', err));
  }
}, [isCameraActive]);
```

Cet effet s'exécute quand `isCameraActive` change, garantissant que le stream est connecté au bon moment.

### 3. Mise à jour des fonctions
- `startCamera()`: Met à jour `isCameraActive` après avoir obtenu le stream
- `stopCamera()`: Réinitialise `isCameraActive` à false
- `switchCamera()`: Réinitialise avant de redémarrer

### 4. Mise à jour des conditions de rendu
```typescript
// Avant
mode === 'photo' && !previewUrl
mode === 'video' && !previewUrl && streamRef.current

// Après
mode === 'photo' && !previewUrl && isCameraActive
mode === 'video' && !previewUrl && isCameraActive
```

### 5. Menu d'options pour Photo
Ajout d'un menu similaire à Vidéo et Audio:
- "Prendre une photo" → Démarre la caméra
- "Importer une photo" → Ouvre le sélecteur de fichiers
- "Annuler" → Retour au menu principal

## Flux Utilisateur Amélioré

### Photo
1. Clic sur "Photo"
2. Menu: "Prendre une photo" ou "Importer une photo"
3. Si "Prendre une photo" → Interface caméra avec flux vidéo
4. Capture → Prévisualisation → Publication

### Vidéo
1. Clic sur "Vidéo"
2. Menu: "Filmer maintenant" ou "Importer une vidéo"
3. Si "Filmer maintenant" → Interface caméra avec flux vidéo
4. Enregistrement → Prévisualisation → Publication

### Audio
1. Clic sur "Audio"
2. Menu: "Enregistrer maintenant" ou "Importer un audio"
3. Si "Enregistrer maintenant" → Interface d'enregistrement audio
4. Enregistrement → Prévisualisation → Publication

## Fichiers Modifiés
- `src/app/dashboard/miyiki-chat/stories/create/page.tsx`

## Test
1. Aller sur http://localhost:9002/dashboard/miyiki-chat?tab=stories
2. Cliquer sur "+" pour créer une story
3. Choisir "Photo", "Vidéo" ou "Audio"
4. Vérifier que le menu d'options s'affiche
5. Cliquer sur "Prendre une photo" / "Filmer maintenant" / "Enregistrer maintenant"
6. Vérifier que le flux de la caméra/micro s'affiche correctement

## Résultat
✅ Menu d'options cohérent pour tous les types de stories
✅ Flux caméra s'affiche correctement
✅ Enregistrement vidéo/audio fonctionne
✅ Import de fichiers fonctionne
✅ UX améliorée et cohérente

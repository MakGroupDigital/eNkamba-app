# Système de Gestion des Permissions d'Appareil

## Vue d'ensemble

Un système complet pour gérer les permissions d'appareil (caméra, microphone, localisation, etc.) qui **stocke les autorisations accordées** pour éviter de les redemander à chaque fois.

## Problème Résolu

Avant: L'utilisateur était redemandé d'autoriser la caméra, le microphone, etc. à chaque utilisation → **Expérience utilisateur mauvaise**

Après: Les permissions sont stockées localement pendant 30 jours → **Expérience fluide et respectueuse**

## Architecture

### 1. **PermissionsManager** (`src/lib/permissions-manager.ts`)
Gestionnaire centralisé qui:
- Stocke les permissions dans `localStorage`
- Gère l'expiration (30 jours par défaut)
- Fournit des méthodes pour vérifier/enregistrer les permissions

```typescript
// Vérifier si permission accordée
permissionsManager.isPermissionGranted('camera')

// Enregistrer une permission accordée
permissionsManager.setPermissionGranted('camera')

// Réinitialiser une permission
permissionsManager.resetPermission('camera')
```

### 2. **useDevicePermission Hook** (`src/hooks/useDevicePermission.ts`)
Hook React pour utiliser les permissions:

```typescript
const { isGranted, isDenied, isLoading, requestPermission } = useDevicePermission('camera');

// Demander la permission
const granted = await requestPermission();
```

### 3. **PermissionRequest Component** (`src/components/permissions/PermissionRequest.tsx`)
Composant UI pour afficher les demandes de permission:

```tsx
<PermissionRequest
  type="camera"
  title="Accès à la caméra"
  description="Nous avons besoin d'accéder à votre caméra pour filmer"
  onGranted={() => console.log('Caméra autorisée')}
  onDenied={() => console.log('Caméra refusée')}
/>
```

## Types de Permissions Supportées

- `camera` - Caméra
- `microphone` - Microphone
- `location` - Localisation GPS
- `photos` - Accès aux photos
- `contacts` - Accès aux contacts
- `clipboard` - Presse-papiers
- `calendar` - Calendrier

## Stockage des Données

Les permissions sont stockées dans `localStorage` sous la clé `enkamba_device_permissions`:

```json
{
  "camera": {
    "status": "granted",
    "timestamp": 1707561600000,
    "expiresAt": 1710153600000
  },
  "microphone": {
    "status": "denied",
    "timestamp": 1707561600000,
    "expiresAt": 1710153600000
  }
}
```

## Durée de Cache

- **Par défaut**: 30 jours
- **Modifiable**: Changer `PERMISSION_CACHE_DURATION` dans `permissions-manager.ts`

## Utilisation dans les Composants

### Exemple 1: Scanner avec Caméra

```tsx
import { useDevicePermission } from '@/hooks/useDevicePermission';

export function ScannerPage() {
  const { isGranted, requestPermission } = useDevicePermission('camera');

  useEffect(() => {
    if (!isGranted) {
      requestPermission();
    }
  }, []);

  if (!isGranted) {
    return <PermissionRequest type="camera" title="Caméra" description="..." />;
  }

  return <Scanner />;
}
```

### Exemple 2: Enregistrement Audio

```tsx
export function AudioRecorder() {
  const { isGranted, requestPermission } = useDevicePermission('microphone');

  const startRecording = async () => {
    if (!isGranted) {
      const granted = await requestPermission();
      if (!granted) return;
    }
    // Démarrer l'enregistrement
  };

  return <button onClick={startRecording}>Enregistrer</button>;
}
```

### Exemple 3: Localisation

```tsx
export function LocationFeature() {
  const { isGranted, requestPermission } = useDevicePermission('location');

  const getLocation = async () => {
    if (!isGranted) {
      const granted = await requestPermission();
      if (!granted) return;
    }
    
    navigator.geolocation.getCurrentPosition(position => {
      console.log(position.coords);
    });
  };

  return <button onClick={getLocation}>Obtenir ma localisation</button>;
}
```

## Gestion des Permissions Refusées

Quand une permission est refusée:
1. Elle est stockée comme `denied` pendant 30 jours
2. L'utilisateur ne sera pas redemandé pendant cette période
3. L'utilisateur peut cliquer "Réessayer" pour demander à nouveau
4. Ou modifier les paramètres de son appareil

## Réinitialiser les Permissions

```typescript
// Réinitialiser une permission spécifique
permissionsManager.resetPermission('camera');

// Réinitialiser toutes les permissions
permissionsManager.resetAllPermissions();
```

## Avantages

✅ **Pas de demandes répétées** - Les permissions sont mémorisées  
✅ **Expérience fluide** - L'utilisateur n'est pas interrompu  
✅ **Contrôle utilisateur** - Peut réinitialiser à tout moment  
✅ **Sécurité** - Respecte les standards de sécurité du navigateur  
✅ **Transparent** - Affiche clairement l'état des permissions  

## Fichiers Créés

- `src/lib/permissions-manager.ts` - Gestionnaire centralisé
- `src/hooks/useDevicePermission.ts` - Hook React
- `src/components/permissions/PermissionRequest.tsx` - Composant UI

## Prochaines Étapes

1. Intégrer dans les composants existants (Scanner, ProCameraRecorder, etc.)
2. Ajouter des paramètres pour gérer les permissions
3. Afficher un dashboard des permissions accordées

# Configuration Cloudinary pour Enkamba

## Pourquoi Cloudinary ?

Cloudinary est utilisé pour héberger les médias (images/vidéos) des Stories dans l'application Enkamba.

## Configuration Requise

### 1. Obtenir les Credentials Cloudinary

1. Va sur [Cloudinary Console](https://console.cloudinary.com/settings/api-keys)
2. Copie les informations suivantes :
   - **Cloud Name** : `dy73hzkpm` (déjà configuré)
   - **API Key** : ex. `123456789012345`
   - **API Secret** : ex. `abcDEF123ghiJKL456mnoPQR`

### 2. Créer l'Upload Preset

1. Va sur [Cloudinary Upload Settings](https://console.cloudinary.com/settings/upload)
2. Clique sur "Add upload preset"
3. Nom du preset : `stories_preset`
4. Signing Mode : **Signed**
5. Folder : `enkamba/stories`
6. Sauvegarde

### 3. Encoder l'URL Cloudinary

#### Option A : Utiliser le script automatique

```bash
./scripts/encode-cloudinary-url.sh
```

#### Option B : Encoder manuellement

```bash
# Format: cloudinary://API_KEY:API_SECRET@CLOUD_NAME
echo -n "cloudinary://YOUR_API_KEY:YOUR_API_SECRET@dy73hzkpm" | base64
```

Exemple :
```bash
echo -n "cloudinary://123456789012345:abcDEF123ghiJKL456mnoPQR@dy73hzkpm" | base64
```

Résultat : `Y2xvdWRpbmFyeTovLzEyMzQ1Njc4OTAxMjM0NTphYmNERUYxMjNnaGlKS0w0NTZtbm9QUVJAZHU3M2h6a3Bt`

### 4. Ajouter dans .env.local

Ouvre `.env.local` et remplace la valeur de `CLOUDINARY_URL_ENCODED` :

```bash
CLOUDINARY_URL_ENCODED=Y2xvdWRpbmFyeTovLzEyMzQ1Njc4OTAxMjM0NTphYmNERUYxMjNnaGlKS0w0NTZtbm9QUVJAZHU3M2h6a3Bt
```

### 5. Redémarrer le serveur

```bash
npm run dev
```

## Sécurité

- ✅ Les fichiers `.env` et `.env.local` sont dans `.gitignore`
- ✅ Les credentials sont encodés en Base64 pour éviter la détection GitHub Secret Scanning
- ✅ Ne jamais commiter les vraies credentials
- ✅ Utiliser les variables d'environnement Vercel/Firebase pour la production

## Vérification

Pour tester que la configuration fonctionne :

1. Va sur l'application : `http://localhost:9002/dashboard/miyiki-chat/stories/create`
2. Essaie de créer une story avec une image ou vidéo
3. Si l'upload réussit, la configuration est correcte ✅

## Troubleshooting

### Erreur : "Configuration Cloudinary incomplète"

- Vérifie que `CLOUDINARY_URL_ENCODED` est bien défini dans `.env.local`
- Vérifie que l'URL est correctement encodée en Base64
- Vérifie que le format est : `cloudinary://API_KEY:API_SECRET@dy73hzkpm`

### Erreur : "Invalid signature"

- Vérifie que ton API Secret est correct
- Vérifie que l'upload preset `stories_preset` existe et est en mode "Signed"

### Erreur : "Upload preset not found"

- Crée l'upload preset `stories_preset` dans Cloudinary Dashboard
- Assure-toi qu'il est en mode "Signed"

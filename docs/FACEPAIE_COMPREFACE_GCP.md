# FacePaie - Déploiement CompreFace sur Google Cloud VM

FacePaie utilise CompreFace comme moteur de reconnaissance faciale. Vercel garde l’application eNKAMBA, tandis que CompreFace tourne sur une VM Google Cloud avec Docker.

## Prérequis

- VM Google Cloud Ubuntu/Debian.
- Accès SSH à la VM.
- Port TCP `8000` autorisé dans les règles firewall Google Cloud.
- Au moins 4 Go de RAM recommandés pour un test correct.

## Installation automatique

Depuis la machine locale du projet :

```bash
bash scripts/deploy-compreface-gcp-vm.sh
```

Le script demande :

- IP publique ou hostname de la VM.
- Utilisateur SSH.
- URL publique CompreFace, par exemple `http://IP_DE_LA_VM:8000`.

## Création des clés FacePaie

Après installation, ouvrir :

```text
http://IP_DE_LA_VM:8000/login
```

Puis :

1. Créer le compte administrateur CompreFace.
2. Créer une application `FacePaie`.
3. Créer un service `Face Recognition`.
4. Copier la clé API du service Recognition.
5. Créer un service `Face Detection`.
6. Copier la clé API du service Detection.

## Variables eNKAMBA

Ajouter dans `.env.local` et dans les variables Vercel :

```env
COMPREFACE_BASE_URL=http://IP_DE_LA_VM:8000
COMPREFACE_RECOGNITION_API_KEY=cle_recognition
COMPREFACE_DETECTION_API_KEY=cle_detection
COMPREFACE_FACE_THRESHOLD=0.82
```

## Commandes utiles sur la VM

```bash
cd ~/enkamba-compreface
docker compose ps
docker compose logs -f
docker compose restart
```

## Production

Pour une exploitation réelle, utiliser un domaine HTTPS devant CompreFace. Les images de visage sont sensibles, donc l’accès public doit être limité et surveillé.

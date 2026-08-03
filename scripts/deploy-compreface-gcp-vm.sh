#!/usr/bin/env bash
# Déploie CompreFace sur une VM Linux Google Cloud pour FacePaie.
set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}=== Déploiement CompreFace FacePaie sur VM Google Cloud ===${NC}\n"

read -r -p "IP publique ou hostname de la VM: " VM_HOST
read -r -p "Utilisateur SSH (ex: ubuntu, debian, root): " SSH_USER
read -r -p "URL publique CompreFace (ex: http://IP:8000 ou https://facepaie.domaine.com): " COMPREFACE_PUBLIC_URL

if [ -z "$VM_HOST" ] || [ -z "$SSH_USER" ]; then
  echo -e "${RED}IP/hostname et utilisateur SSH obligatoires.${NC}"
  exit 1
fi

if [ -z "$COMPREFACE_PUBLIC_URL" ]; then
  COMPREFACE_PUBLIC_URL="http://$VM_HOST:8000"
fi

TEMP_SCRIPT=$(mktemp)
cat > "$TEMP_SCRIPT" << 'EOFSCRIPT'
#!/usr/bin/env bash
set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

APP_DIR="$HOME/enkamba-compreface"

compose() {
  if docker compose version >/dev/null 2>&1; then
    docker compose "$@"
  else
    docker-compose "$@"
  fi
}

echo -e "${YELLOW}Mise à jour système et dépendances...${NC}"
if command -v apt-get >/dev/null 2>&1; then
  sudo apt-get update
  sudo apt-get install -y curl unzip ca-certificates
else
  echo -e "${RED}Cette installation automatique cible Ubuntu/Debian.${NC}"
  exit 1
fi

echo -e "${YELLOW}Installation Docker si nécessaire...${NC}"
if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com -o /tmp/get-docker.sh
  sudo sh /tmp/get-docker.sh
  rm -f /tmp/get-docker.sh
fi

if ! docker compose version >/dev/null 2>&1 && ! command -v docker-compose >/dev/null 2>&1; then
  sudo apt-get install -y docker-compose-plugin docker-compose
fi

if ! docker info >/dev/null 2>&1; then
  echo -e "${YELLOW}Activation du service Docker...${NC}"
  sudo systemctl enable --now docker
fi

echo -e "${YELLOW}Préparation du dossier CompreFace...${NC}"
mkdir -p "$APP_DIR"
cd "$APP_DIR"

echo -e "${YELLOW}Téléchargement de la dernière release CompreFace...${NC}"
LATEST_URL="$(curl -fsSL https://api.github.com/repos/exadel-inc/CompreFace/releases/latest | grep -Eo 'https://[^"]+CompreFace_[^"]+\.zip' | head -n 1 || true)"
if [ -z "$LATEST_URL" ]; then
  echo -e "${RED}Impossible de trouver l’archive officielle CompreFace.${NC}"
  exit 1
fi

rm -f compreface.zip
curl -fL "$LATEST_URL" -o compreface.zip
unzip -o compreface.zip >/dev/null
rm -f compreface.zip

echo -e "${YELLOW}Ouverture du port 8000 sur le firewall interne si présent...${NC}"
if command -v ufw >/dev/null 2>&1; then
  sudo ufw allow 8000/tcp || true
fi

echo -e "${YELLOW}Démarrage CompreFace...${NC}"
compose up -d

echo -e "${YELLOW}Attente du démarrage des conteneurs...${NC}"
sleep 15

if compose ps | grep -qi "compreface"; then
  echo -e "${GREEN}CompreFace est lancé.${NC}"
else
  echo -e "${RED}CompreFace ne semble pas lancé. Logs:${NC}"
  compose logs --tail=80
  exit 1
fi

echo -e "\n${GREEN}Installation terminée.${NC}"
echo -e "${YELLOW}Commandes utiles sur la VM:${NC}"
echo "cd $APP_DIR && docker compose ps"
echo "cd $APP_DIR && docker compose logs -f"
echo "cd $APP_DIR && docker compose restart"
EOFSCRIPT

echo -e "${YELLOW}Test SSH vers $SSH_USER@$VM_HOST...${NC}"
ssh -o ConnectTimeout=10 "$SSH_USER@$VM_HOST" "echo Connexion SSH OK"

echo -e "${YELLOW}Copie et exécution du script distant...${NC}"
scp "$TEMP_SCRIPT" "$SSH_USER@$VM_HOST:/tmp/install-enkamba-compreface.sh"
ssh "$SSH_USER@$VM_HOST" "bash /tmp/install-enkamba-compreface.sh && rm /tmp/install-enkamba-compreface.sh"
rm -f "$TEMP_SCRIPT"

echo -e "\n${GREEN}CompreFace est prêt côté serveur.${NC}"
echo -e "${YELLOW}Ouvre ensuite:${NC} ${GREEN}$COMPREFACE_PUBLIC_URL/login${NC}"
echo
echo "Dans CompreFace:"
echo "1. Crée le compte administrateur."
echo "2. Crée une application FacePaie."
echo "3. Crée un service Face Recognition et copie sa clé API."
echo "4. Crée un service Face Detection et copie sa clé API."
echo
echo -e "${YELLOW}Variables à mettre dans Vercel et dans .env.local:${NC}"
cat << EOF
COMPREFACE_BASE_URL=$COMPREFACE_PUBLIC_URL
COMPREFACE_RECOGNITION_API_KEY=cle_recognition_a_copier_depuis_compreface
COMPREFACE_DETECTION_API_KEY=cle_detection_a_copier_depuis_compreface
COMPREFACE_FACE_THRESHOLD=0.82
EOF

echo -e "\n${YELLOW}Important Google Cloud:${NC}"
echo "Vérifie que la règle firewall GCP autorise TCP 8000 vers cette VM."

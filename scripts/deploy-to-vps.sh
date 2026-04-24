#!/usr/bin/env bash
# Script pour déployer le serveur TURN depuis ta machine locale vers le VPS
set -euo pipefail

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║      🚀 DÉPLOIEMENT TURN SERVER VERS VPS - eNkamba 🚀     ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}\n"

# Demander les informations
read -p "IP ou hostname du VPS: " VPS_HOST
read -p "Utilisateur SSH (ex: root): " SSH_USER
read -p "Domaine TURN (ex: turn.enkamba.com): " TURN_DOMAIN
read -p "Utilisateur TURN (ex: enkamba_user): " TURN_USER
read -sp "Mot de passe TURN (laisse vide pour auto-générer): " TURN_PASS
echo -e "\n"

# Générer un mot de passe si vide
if [ -z "$TURN_PASS" ]; then
    TURN_PASS=$(openssl rand -base64 32)
    echo -e "${YELLOW}🔑 Mot de passe généré: ${GREEN}$TURN_PASS${NC}"
    echo -e "${YELLOW}⚠️  SAUVEGARDE CE MOT DE PASSE !${NC}\n"
fi

# Vérifier la connexion SSH
echo -e "${YELLOW}🔌 Test de connexion SSH...${NC}"
if ssh -o ConnectTimeout=5 -o BatchMode=yes "$SSH_USER@$VPS_HOST" exit 2>/dev/null; then
    echo -e "${GREEN}✅ Connexion SSH OK${NC}"
else
    echo -e "${YELLOW}⚠️  Connexion SSH nécessite un mot de passe ou une clé${NC}"
    echo -e "${BLUE}Assure-toi de pouvoir te connecter avec: ssh $SSH_USER@$VPS_HOST${NC}\n"
fi

# Créer un script temporaire pour le VPS
TEMP_SCRIPT=$(mktemp)
cat > "$TEMP_SCRIPT" << 'EOFSCRIPT'
#!/usr/bin/env bash
set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

TURN_DOMAIN="$1"
TURN_USER="$2"
TURN_PASS="$3"
VPS_IP="$4"

echo -e "${YELLOW}📦 Installation de Docker...${NC}"
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    rm get-docker.sh
fi

if ! command -v docker-compose &> /dev/null; then
    sudo apt update
    sudo apt install -y docker-compose
fi

echo -e "${YELLOW}📁 Création de la structure...${NC}"
mkdir -p ~/enkamba-turn/{data,certs}
cd ~/enkamba-turn

echo -e "${YELLOW}📝 Création des fichiers de configuration...${NC}"
cat > docker-compose.yml << 'EOF'
services:
  coturn:
    image: coturn/coturn:4.6.3
    container_name: enkamba-coturn
    restart: unless-stopped
    network_mode: host
    env_file:
      - .env
    volumes:
      - ./turnserver.conf:/etc/coturn/turnserver.conf:ro
      - ./data:/var/lib/coturn
      - ./certs:/etc/coturn/certs:ro
    command:
      - -c
      - /etc/coturn/turnserver.conf
EOF

cat > turnserver.conf << 'EOF'
listening-port=3478
tls-listening-port=5349
fingerprint
lt-cred-mech
no-multicast-peers
stale-nonce
listening-ip=0.0.0.0
external-ip=${TURN_EXTERNAL_IP}
realm=${TURN_REALM}
server-name=${TURN_DOMAIN}
user=${TURN_USERNAME}:${TURN_PASSWORD}
min-port=${TURN_MIN_PORT}
max-port=${TURN_MAX_PORT}
no-cli
verbose
cert=${TURN_CERT_PATH}
pkey=${TURN_KEY_PATH}
EOF

cat > .env << EOF
TURN_DOMAIN=$TURN_DOMAIN
TURN_REALM=$TURN_DOMAIN
TURN_USERNAME=$TURN_USER
TURN_PASSWORD=$TURN_PASS
TURN_EXTERNAL_IP=$VPS_IP
TURN_MIN_PORT=49152
TURN_MAX_PORT=65535
TURN_CERT_PATH=/etc/coturn/certs/fullchain.pem
TURN_KEY_PATH=/etc/coturn/certs/privkey.pem
TURN_ENABLE_TLS=false
EOF

echo -e "${YELLOW}🔥 Configuration du firewall...${NC}"
if command -v ufw &> /dev/null; then
    sudo ufw allow 3478/tcp
    sudo ufw allow 3478/udp
    sudo ufw allow 5349/tcp
    sudo ufw allow 49152:65535/udp
    sudo ufw allow 49152:65535/tcp
elif command -v iptables &> /dev/null; then
    sudo iptables -A INPUT -p tcp --dport 3478 -j ACCEPT
    sudo iptables -A INPUT -p udp --dport 3478 -j ACCEPT
    sudo iptables -A INPUT -p tcp --dport 5349 -j ACCEPT
    sudo iptables -A INPUT -p udp --dport 49152:65535 -j ACCEPT
    sudo iptables -A INPUT -p tcp --dport 49152:65535 -j ACCEPT
fi

echo -e "${YELLOW}🚀 Lancement du serveur...${NC}"
docker-compose up -d

sleep 5

if docker ps | grep -q enkamba-coturn; then
    echo -e "${GREEN}✅ Serveur TURN démarré avec succès !${NC}"
else
    echo -e "❌ Erreur lors du démarrage"
    docker-compose logs coturn
    exit 1
fi

echo -e "${GREEN}✨ Déploiement terminé !${NC}"
EOFSCRIPT

# Copier et exécuter le script sur le VPS
echo -e "\n${YELLOW}📤 Envoi du script sur le VPS...${NC}"
scp "$TEMP_SCRIPT" "$SSH_USER@$VPS_HOST:/tmp/install-turn.sh"

echo -e "${YELLOW}🚀 Exécution du déploiement sur le VPS...${NC}"
ssh "$SSH_USER@$VPS_HOST" "bash /tmp/install-turn.sh '$TURN_DOMAIN' '$TURN_USER' '$TURN_PASS' '$VPS_HOST' && rm /tmp/install-turn.sh"

# Nettoyer
rm "$TEMP_SCRIPT"

# Générer les variables d'environnement
echo -e "\n${YELLOW}🔧 Génération des variables d'environnement...${NC}"
if [ -f "scripts/generate-turn-env.sh" ]; then
    bash scripts/generate-turn-env.sh "$TURN_DOMAIN" "$TURN_USER" "$TURN_PASS" > .env.turn.generated
    echo -e "${GREEN}✅ Variables générées dans .env.turn.generated${NC}"
    echo -e "${BLUE}Copie le contenu de ce fichier dans ton .env.local${NC}\n"
    
    # Afficher les variables
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    cat .env.turn.generated
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
    
    # Demander si on doit ajouter automatiquement à .env.local
    read -p "Ajouter automatiquement à .env.local ? (y/n): " ADD_TO_ENV
    if [ "$ADD_TO_ENV" = "y" ] || [ "$ADD_TO_ENV" = "Y" ]; then
        echo -e "\n# TURN Server Configuration - Generated $(date)" >> .env.local
        cat .env.turn.generated >> .env.local
        echo -e "${GREEN}✅ Variables ajoutées à .env.local${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Script generate-turn-env.sh non trouvé${NC}"
    echo -e "${BLUE}Exécute manuellement: npm run turn:env -- $TURN_DOMAIN $TURN_USER $TURN_PASS${NC}"
fi

# Test de connexion
echo -e "\n${YELLOW}🧪 Test de connexion au serveur TURN...${NC}"
if command -v nc &> /dev/null; then
    if nc -zv -w 5 "$VPS_HOST" 3478 2>&1 | grep -q "succeeded"; then
        echo -e "${GREEN}✅ Port 3478 accessible${NC}"
    else
        echo -e "${YELLOW}⚠️  Port 3478 non accessible (peut prendre quelques minutes)${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  nc non installé, impossible de tester${NC}"
fi

# Résumé final
echo -e "\n${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║          🎉 DÉPLOIEMENT TERMINÉ AVEC SUCCÈS ! 🎉           ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}\n"

echo -e "${YELLOW}📝 Informations de connexion:${NC}"
echo -e "   VPS: ${GREEN}$VPS_HOST${NC}"
echo -e "   Domaine TURN: ${GREEN}$TURN_DOMAIN${NC}"
echo -e "   Utilisateur: ${GREEN}$TURN_USER${NC}"
echo -e "   Mot de passe: ${GREEN}$TURN_PASS${NC}"

echo -e "\n${YELLOW}🔧 Prochaines étapes:${NC}"
echo -e "   1. Configure ton DNS pour pointer $TURN_DOMAIN vers $VPS_HOST"
echo -e "   2. Vérifie que les variables sont dans .env.local"
echo -e "   3. Redémarre ton serveur de dev: ${GREEN}npm run dev${NC}"
echo -e "   4. Teste avec: ${GREEN}bash scripts/test-turn-server.sh${NC}"

echo -e "\n${YELLOW}📊 Commandes utiles:${NC}"
echo -e "   Voir les logs: ${GREEN}ssh $SSH_USER@$VPS_HOST 'cd ~/enkamba-turn && docker-compose logs -f coturn'${NC}"
echo -e "   Redémarrer: ${GREEN}ssh $SSH_USER@$VPS_HOST 'cd ~/enkamba-turn && docker-compose restart'${NC}"
echo -e "   Statut: ${GREEN}ssh $SSH_USER@$VPS_HOST 'docker ps | grep coturn'${NC}"

echo -e "\n${GREEN}✨ Tout est prêt ! Bon développement ! ✨${NC}\n"

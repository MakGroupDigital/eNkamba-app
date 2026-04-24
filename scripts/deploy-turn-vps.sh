#!/usr/bin/env bash
# Script de déploiement automatique du serveur TURN sur VPS
set -euo pipefail

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Déploiement du serveur TURN eNkamba ===${NC}\n"

# Vérifier si on est sur le VPS (pas en local)
if [ ! -f /etc/os-release ]; then
    echo -e "${RED}❌ Ce script doit être exécuté sur le VPS Linux${NC}"
    exit 1
fi

# Demander les informations
read -p "Nom de domaine TURN (ex: turn.enkamba.com): " TURN_DOMAIN
read -p "IP publique du VPS: " TURN_IP
read -p "Nom d'utilisateur TURN (ex: enkamba_user): " TURN_USER
read -sp "Mot de passe TURN (sera caché): " TURN_PASS
echo ""

# Générer un mot de passe fort si vide
if [ -z "$TURN_PASS" ]; then
    TURN_PASS=$(openssl rand -base64 32)
    echo -e "${YELLOW}⚠️  Mot de passe généré automatiquement: $TURN_PASS${NC}"
    echo -e "${YELLOW}⚠️  SAUVEGARDE CE MOT DE PASSE !${NC}\n"
fi

# Vérifier Docker
echo -e "\n${YELLOW}📦 Vérification de Docker...${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}Docker n'est pas installé. Installation en cours...${NC}"
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    rm get-docker.sh
    echo -e "${GREEN}✅ Docker installé${NC}"
else
    echo -e "${GREEN}✅ Docker déjà installé${NC}"
fi

# Vérifier Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo -e "${YELLOW}Docker Compose n'est pas installé. Installation en cours...${NC}"
    sudo apt update
    sudo apt install -y docker-compose
    echo -e "${GREEN}✅ Docker Compose installé${NC}"
else
    echo -e "${GREEN}✅ Docker Compose déjà installé${NC}"
fi

# Créer le dossier de travail
WORK_DIR="$HOME/enkamba-turn"
echo -e "\n${YELLOW}📁 Création du dossier $WORK_DIR...${NC}"
mkdir -p "$WORK_DIR"/{data,certs}
cd "$WORK_DIR"

# Créer docker-compose.yml
echo -e "${YELLOW}📝 Création de docker-compose.yml...${NC}"
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

# Créer turnserver.conf
echo -e "${YELLOW}📝 Création de turnserver.conf...${NC}"
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

# TLS optionnel
cert=${TURN_CERT_PATH}
pkey=${TURN_KEY_PATH}
EOF

# Créer .env
echo -e "${YELLOW}📝 Création du fichier .env...${NC}"
cat > .env << EOF
TURN_DOMAIN=$TURN_DOMAIN
TURN_REALM=$TURN_DOMAIN
TURN_USERNAME=$TURN_USER
TURN_PASSWORD=$TURN_PASS
TURN_EXTERNAL_IP=$TURN_IP
TURN_MIN_PORT=49152
TURN_MAX_PORT=65535
TURN_CERT_PATH=/etc/coturn/certs/fullchain.pem
TURN_KEY_PATH=/etc/coturn/certs/privkey.pem
TURN_ENABLE_TLS=false
EOF

# Configuration du firewall
echo -e "\n${YELLOW}🔥 Configuration du firewall...${NC}"
if command -v ufw &> /dev/null; then
    echo -e "${YELLOW}Utilisation de UFW...${NC}"
    sudo ufw allow 3478/tcp
    sudo ufw allow 3478/udp
    sudo ufw allow 5349/tcp
    sudo ufw allow 49152:65535/udp
    sudo ufw allow 49152:65535/tcp
    echo -e "${GREEN}✅ Règles UFW ajoutées${NC}"
elif command -v iptables &> /dev/null; then
    echo -e "${YELLOW}Utilisation d'iptables...${NC}"
    sudo iptables -A INPUT -p tcp --dport 3478 -j ACCEPT
    sudo iptables -A INPUT -p udp --dport 3478 -j ACCEPT
    sudo iptables -A INPUT -p tcp --dport 5349 -j ACCEPT
    sudo iptables -A INPUT -p udp --dport 49152:65535 -j ACCEPT
    sudo iptables -A INPUT -p tcp --dport 49152:65535 -j ACCEPT
    
    # Sauvegarder les règles
    if [ -d /etc/iptables ]; then
        sudo iptables-save | sudo tee /etc/iptables/rules.v4 > /dev/null
    fi
    echo -e "${GREEN}✅ Règles iptables ajoutées${NC}"
else
    echo -e "${YELLOW}⚠️  Aucun firewall détecté. Configure manuellement les ports:${NC}"
    echo -e "   - 3478/tcp+udp"
    echo -e "   - 5349/tcp"
    echo -e "   - 49152-65535/tcp+udp"
fi

# Lancer le serveur
echo -e "\n${YELLOW}🚀 Lancement du serveur TURN...${NC}"
docker-compose up -d

# Attendre que le serveur démarre
echo -e "${YELLOW}⏳ Attente du démarrage (5 secondes)...${NC}"
sleep 5

# Vérifier le statut
if docker ps | grep -q enkamba-coturn; then
    echo -e "${GREEN}✅ Serveur TURN démarré avec succès !${NC}"
else
    echo -e "${RED}❌ Erreur lors du démarrage. Vérifier les logs:${NC}"
    docker-compose logs coturn
    exit 1
fi

# Afficher les logs
echo -e "\n${YELLOW}📋 Derniers logs:${NC}"
docker-compose logs --tail 20 coturn

# Résumé
echo -e "\n${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║          🎉 SERVEUR TURN DÉPLOYÉ AVEC SUCCÈS ! 🎉          ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}\n"

echo -e "${YELLOW}📝 Informations de connexion:${NC}"
echo -e "   Domaine: ${GREEN}$TURN_DOMAIN${NC}"
echo -e "   IP: ${GREEN}$TURN_IP${NC}"
echo -e "   Utilisateur: ${GREEN}$TURN_USER${NC}"
echo -e "   Mot de passe: ${GREEN}$TURN_PASS${NC}"
echo -e "   Port TURN: ${GREEN}3478${NC}"
echo -e "   Port TURNS: ${GREEN}5349${NC}"

echo -e "\n${YELLOW}🔧 Prochaines étapes:${NC}"
echo -e "   1. Configure ton DNS pour pointer $TURN_DOMAIN vers $TURN_IP"
echo -e "   2. Sur ta machine locale, exécute:"
echo -e "      ${GREEN}npm run turn:env -- $TURN_DOMAIN $TURN_USER $TURN_PASS${NC}"
echo -e "   3. Copie la sortie dans ton .env.local"

echo -e "\n${YELLOW}📊 Commandes utiles:${NC}"
echo -e "   Voir les logs: ${GREEN}cd $WORK_DIR && docker-compose logs -f coturn${NC}"
echo -e "   Redémarrer: ${GREEN}cd $WORK_DIR && docker-compose restart${NC}"
echo -e "   Arrêter: ${GREEN}cd $WORK_DIR && docker-compose down${NC}"
echo -e "   Statut: ${GREEN}docker ps | grep coturn${NC}"

echo -e "\n${YELLOW}🔒 Pour activer TLS/SSL (recommandé en production):${NC}"
echo -e "   ${GREEN}sudo certbot certonly --standalone -d $TURN_DOMAIN${NC}"
echo -e "   ${GREEN}sudo cp /etc/letsencrypt/live/$TURN_DOMAIN/fullchain.pem $WORK_DIR/certs/${NC}"
echo -e "   ${GREEN}sudo cp /etc/letsencrypt/live/$TURN_DOMAIN/privkey.pem $WORK_DIR/certs/${NC}"
echo -e "   ${GREEN}sudo chown -R \$(id -u):\$(id -g) $WORK_DIR/certs/${NC}"
echo -e "   Puis modifie .env: ${GREEN}TURN_ENABLE_TLS=true${NC}"
echo -e "   Et redémarre: ${GREEN}cd $WORK_DIR && docker-compose restart${NC}"

echo -e "\n${GREEN}✨ Tout est prêt ! Bon développement ! ✨${NC}\n"

#!/usr/bin/env bash
# Script de test du serveur TURN
set -euo pipefail

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║           🧪 TEST DU SERVEUR TURN eNkamba 🧪               ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}\n"

# Demander les informations
read -p "Domaine TURN (ex: turn.enkamba.com): " TURN_HOST
read -p "Utilisateur TURN: " TURN_USER
read -sp "Mot de passe TURN: " TURN_PASS
echo -e "\n"

# Test 1: Résolution DNS
echo -e "${YELLOW}[1/5] 🌐 Test de résolution DNS...${NC}"
if host "$TURN_HOST" > /dev/null 2>&1; then
    IP=$(host "$TURN_HOST" | grep "has address" | awk '{print $4}' | head -1)
    echo -e "${GREEN}✅ DNS résolu: $TURN_HOST → $IP${NC}"
else
    echo -e "${RED}❌ Impossible de résoudre $TURN_HOST${NC}"
    echo -e "${YELLOW}⚠️  Vérifie ta configuration DNS${NC}"
    exit 1
fi

# Test 2: Ping du serveur
echo -e "\n${YELLOW}[2/5] 🏓 Test de connectivité (ping)...${NC}"
if ping -c 3 "$TURN_HOST" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Serveur accessible${NC}"
else
    echo -e "${YELLOW}⚠️  Ping échoué (peut être normal si ICMP est bloqué)${NC}"
fi

# Test 3: Port TURN (3478)
echo -e "\n${YELLOW}[3/5] 🔌 Test du port TURN (3478)...${NC}"
if timeout 5 bash -c "echo > /dev/tcp/$TURN_HOST/3478" 2>/dev/null; then
    echo -e "${GREEN}✅ Port 3478/TCP ouvert${NC}"
else
    echo -e "${RED}❌ Port 3478/TCP fermé ou inaccessible${NC}"
    echo -e "${YELLOW}⚠️  Vérifie le firewall du VPS${NC}"
fi

# Test 4: Port TURNS (5349)
echo -e "\n${YELLOW}[4/5] 🔐 Test du port TURNS (5349)...${NC}"
if timeout 5 bash -c "echo > /dev/tcp/$TURN_HOST/5349" 2>/dev/null; then
    echo -e "${GREEN}✅ Port 5349/TCP ouvert${NC}"
else
    echo -e "${YELLOW}⚠️  Port 5349/TCP fermé (normal si TLS non activé)${NC}"
fi

# Test 5: Test TURN avec turnutils (si disponible)
echo -e "\n${YELLOW}[5/5] 🎯 Test de connexion TURN...${NC}"
if command -v turnutils_uclient &> /dev/null; then
    echo -e "${BLUE}Exécution de turnutils_uclient...${NC}"
    if turnutils_uclient -v -u "$TURN_USER" -w "$TURN_PASS" "$TURN_HOST" 2>&1 | grep -q "tot_send_msgs"; then
        echo -e "${GREEN}✅ Connexion TURN réussie !${NC}"
        echo -e "${GREEN}✅ Authentification valide${NC}"
        echo -e "${GREEN}✅ Relais fonctionnel${NC}"
    else
        echo -e "${RED}❌ Échec de la connexion TURN${NC}"
        echo -e "${YELLOW}⚠️  Vérifie les credentials (user/password)${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  turnutils_uclient non installé${NC}"
    echo -e "${BLUE}Pour installer: sudo apt install -y coturn-utils${NC}"
    echo -e "${BLUE}Test manuel avec curl...${NC}"
    
    # Test basique avec curl
    if curl -s --max-time 5 "http://$TURN_HOST:3478" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Serveur répond sur le port 3478${NC}"
    else
        echo -e "${YELLOW}⚠️  Pas de réponse HTTP (normal pour TURN)${NC}"
    fi
fi

# Test 6: Vérification des variables d'environnement locales
echo -e "\n${YELLOW}[BONUS] 📋 Vérification des variables d'environnement...${NC}"
if [ -f .env.local ]; then
    if grep -q "NEXT_PUBLIC_WEBRTC_TURN_HOST" .env.local; then
        echo -e "${GREEN}✅ Variables TURN trouvées dans .env.local${NC}"
        
        # Afficher les valeurs (sans les mots de passe)
        echo -e "${BLUE}Configuration actuelle:${NC}"
        grep "NEXT_PUBLIC_WEBRTC_TURN_HOST=" .env.local | sed 's/^/  /'
        grep "NEXT_PUBLIC_WEBRTC_TURN_PORT=" .env.local | sed 's/^/  /'
        grep "NEXT_PUBLIC_WEBRTC_TURN_USERNAME=" .env.local | sed 's/^/  /'
    else
        echo -e "${YELLOW}⚠️  Variables TURN non trouvées dans .env.local${NC}"
        echo -e "${BLUE}Exécute: npm run turn:env -- $TURN_HOST $TURN_USER <password>${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Fichier .env.local non trouvé${NC}"
    echo -e "${BLUE}Crée-le et ajoute les variables TURN${NC}"
fi

# Résumé
echo -e "\n${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                     📊 RÉSUMÉ DES TESTS                    ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}\n"

echo -e "${YELLOW}Serveur testé:${NC} $TURN_HOST"
echo -e "${YELLOW}IP résolue:${NC} ${IP:-N/A}"
echo -e "${YELLOW}Utilisateur:${NC} $TURN_USER"

echo -e "\n${YELLOW}🔧 Prochaines étapes si des tests ont échoué:${NC}"
echo -e "   1. Vérifie que le serveur TURN est démarré sur le VPS"
echo -e "      ${BLUE}ssh root@$IP 'docker ps | grep coturn'${NC}"
echo -e "   2. Vérifie les logs du serveur"
echo -e "      ${BLUE}ssh root@$IP 'cd ~/enkamba-turn && docker-compose logs coturn'${NC}"
echo -e "   3. Vérifie le firewall"
echo -e "      ${BLUE}ssh root@$IP 'sudo ufw status'${NC}"
echo -e "   4. Teste depuis le VPS lui-même"
echo -e "      ${BLUE}ssh root@$IP 'turnutils_uclient -v -u $TURN_USER -w <pass> localhost'${NC}"

echo -e "\n${GREEN}✨ Test terminé ! ✨${NC}\n"

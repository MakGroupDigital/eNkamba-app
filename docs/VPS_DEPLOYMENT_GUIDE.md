# Guide de Déploiement TURN Server sur VPS

Ce guide te permet de déployer le serveur TURN (coturn) sur ton VPS pour activer les appels audio/vidéo WebRTC.

## Prérequis

- Un VPS avec Ubuntu/Debian
- Docker et Docker Compose installés
- Un nom de domaine pointant vers ton VPS (ex: `turn.enkamba.com`)
- Accès root ou sudo sur le VPS

## Étape 1: Connexion au VPS

```bash
ssh root@TON_IP_VPS
# ou
ssh ton_user@TON_IP_VPS
```

## Étape 2: Installation de Docker (si pas déjà installé)

```bash
# Mise à jour du système
sudo apt update && sudo apt upgrade -y

# Installation de Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Installation de Docker Compose
sudo apt install docker-compose -y

# Vérification
docker --version
docker-compose --version
```

## Étape 3: Création du dossier coturn

```bash
# Créer le dossier pour coturn
mkdir -p ~/enkamba-turn
cd ~/enkamba-turn

# Créer les sous-dossiers nécessaires
mkdir -p data certs
```

## Étape 4: Créer les fichiers de configuration

### 4.1 Créer docker-compose.yml

```bash
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
```

### 4.2 Créer turnserver.conf

```bash
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

# TLS optionnel pour turns:
cert=${TURN_CERT_PATH}
pkey=${TURN_KEY_PATH}
EOF
```

### 4.3 Créer le fichier .env

**⚠️ IMPORTANT: Remplace les valeurs suivantes par tes vraies valeurs:**

```bash
cat > .env << 'EOF'
TURN_DOMAIN=turn.enkamba.com
TURN_REALM=turn.enkamba.com
TURN_USERNAME=enkamba_user
TURN_PASSWORD=MOT_DE_PASSE_TRES_SECURISE_ICI
TURN_EXTERNAL_IP=TON_IP_PUBLIC_VPS
TURN_MIN_PORT=49152
TURN_MAX_PORT=65535
TURN_CERT_PATH=/etc/coturn/certs/fullchain.pem
TURN_KEY_PATH=/etc/coturn/certs/privkey.pem
TURN_ENABLE_TLS=false
EOF
```

**Édite le fichier pour mettre tes vraies valeurs:**
```bash
nano .env
```

Remplace:
- `turn.enkamba.com` → ton sous-domaine TURN
- `MOT_DE_PASSE_TRES_SECURISE_ICI` → un mot de passe fort (génère-le avec `openssl rand -base64 32`)
- `TON_IP_PUBLIC_VPS` → l'IP publique de ton VPS

## Étape 5: Configuration du Firewall

```bash
# Ouvrir les ports nécessaires
sudo ufw allow 3478/tcp
sudo ufw allow 3478/udp
sudo ufw allow 5349/tcp
sudo ufw allow 49152:65535/udp
sudo ufw allow 49152:65535/tcp

# Si tu utilises iptables au lieu de ufw:
sudo iptables -A INPUT -p tcp --dport 3478 -j ACCEPT
sudo iptables -A INPUT -p udp --dport 3478 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 5349 -j ACCEPT
sudo iptables -A INPUT -p udp --dport 49152:65535 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 49152:65535 -j ACCEPT
sudo iptables-save > /etc/iptables/rules.v4
```

## Étape 6: Configuration DNS

Configure ton DNS pour pointer vers ton VPS:

```
Type: A
Nom: turn.enkamba.com (ou ton sous-domaine)
Valeur: TON_IP_PUBLIC_VPS
TTL: 3600
```

Vérifie que le DNS fonctionne:
```bash
dig turn.enkamba.com
# ou
nslookup turn.enkamba.com
```

## Étape 7: Lancer le serveur TURN

```bash
cd ~/enkamba-turn

# Lancer coturn
docker-compose up -d

# Vérifier les logs
docker-compose logs -f coturn

# Vérifier que le conteneur tourne
docker ps | grep coturn
```

## Étape 8: Tester le serveur TURN

```bash
# Installer l'outil de test
sudo apt install -y coturn-utils

# Tester la connexion TURN
turnutils_uclient -v -u enkamba_user -w TON_MOT_DE_PASSE turn.enkamba.com
```

Tu devrais voir des messages de succès avec "tot_send_msgs" et "tot_recv_msgs".

## Étape 9: Générer les variables d'environnement pour l'app

Sur ta **machine locale** (pas le VPS), exécute:

```bash
npm run turn:env -- turn.enkamba.com enkamba_user TON_MOT_DE_PASSE
```

Copie la sortie et ajoute-la dans ton fichier `.env.local` (développement) ou dans tes variables d'environnement de production.

## Étape 10: (Optionnel) Activer TLS/SSL avec Let's Encrypt

Pour activer `turns://` (TURN over TLS):

```bash
# Installer certbot
sudo apt install -y certbot

# Obtenir un certificat SSL
sudo certbot certonly --standalone -d turn.enkamba.com

# Copier les certificats dans le dossier coturn
sudo cp /etc/letsencrypt/live/turn.enkamba.com/fullchain.pem ~/enkamba-turn/certs/
sudo cp /etc/letsencrypt/live/turn.enkamba.com/privkey.pem ~/enkamba-turn/certs/
sudo chown -R 1000:1000 ~/enkamba-turn/certs/

# Modifier .env pour activer TLS
nano .env
# Change TURN_ENABLE_TLS=true

# Redémarrer coturn
cd ~/enkamba-turn
docker-compose restart
```

## Commandes Utiles

```bash
# Voir les logs en temps réel
docker-compose logs -f coturn

# Redémarrer le serveur
docker-compose restart

# Arrêter le serveur
docker-compose down

# Voir les statistiques
docker stats enkamba-coturn

# Vérifier les ports ouverts
sudo netstat -tulpn | grep -E '3478|5349|49152'
```

## Dépannage

### Le serveur ne démarre pas
```bash
# Vérifier les logs
docker-compose logs coturn

# Vérifier que les ports ne sont pas déjà utilisés
sudo netstat -tulpn | grep 3478
```

### Les clients ne peuvent pas se connecter
```bash
# Vérifier le firewall
sudo ufw status
sudo iptables -L -n

# Vérifier que le DNS pointe bien vers le VPS
dig turn.enkamba.com

# Tester depuis l'extérieur
telnet turn.enkamba.com 3478
```

### Erreur "Permission denied" sur les certificats
```bash
sudo chown -R 1000:1000 ~/enkamba-turn/certs/
sudo chmod 644 ~/enkamba-turn/certs/*
```

## Sécurité

1. **Change le mot de passe TURN régulièrement**
2. **Limite l'accès par IP si possible** (dans turnserver.conf)
3. **Active TLS/SSL en production**
4. **Surveille les logs** pour détecter les abus
5. **Configure un rate limiting** si nécessaire

## Monitoring

Pour surveiller l'utilisation:

```bash
# Créer un script de monitoring
cat > ~/monitor-turn.sh << 'EOF'
#!/bin/bash
echo "=== TURN Server Status ==="
docker ps | grep coturn
echo ""
echo "=== Resource Usage ==="
docker stats enkamba-coturn --no-stream
echo ""
echo "=== Recent Logs ==="
docker logs enkamba-coturn --tail 20
EOF

chmod +x ~/monitor-turn.sh

# Exécuter
./monitor-turn.sh
```

## Résumé des Ports

| Port | Protocole | Usage |
|------|-----------|-------|
| 3478 | TCP/UDP | TURN standard |
| 5349 | TCP | TURNS (TLS) |
| 49152-65535 | UDP/TCP | Plage de ports pour les relais média |

---

**Une fois tout configuré, ton serveur TURN sera opérationnel et tes appels WebRTC fonctionneront même derrière des NAT restrictifs !** 🎉

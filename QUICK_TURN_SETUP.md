# 🚀 Setup Rapide du Serveur TURN

## Option 1: Script Automatique (Recommandé)

### Sur ton VPS:

```bash
# 1. Copie le script sur ton VPS
scp scripts/deploy-turn-vps.sh root@TON_IP_VPS:~/

# 2. Connecte-toi au VPS
ssh root@TON_IP_VPS

# 3. Exécute le script
bash ~/deploy-turn-vps.sh
```

Le script va:
- ✅ Installer Docker et Docker Compose si nécessaire
- ✅ Créer tous les fichiers de configuration
- ✅ Configurer le firewall
- ✅ Lancer le serveur TURN
- ✅ Te donner toutes les infos nécessaires

### Sur ta machine locale:

```bash
# Génère les variables d'environnement
npm run turn:env -- turn.enkamba.com ton_user ton_password

# Copie la sortie dans .env.local
```

---

## Option 2: Manuel (Guide Complet)

Consulte le guide détaillé: [docs/VPS_DEPLOYMENT_GUIDE.md](docs/VPS_DEPLOYMENT_GUIDE.md)

---

## Vérification Rapide

### Sur le VPS:

```bash
# Vérifier que le serveur tourne
docker ps | grep coturn

# Voir les logs
cd ~/enkamba-turn
docker-compose logs -f coturn
```

### Test de connexion:

```bash
# Installer l'outil de test
sudo apt install -y coturn-utils

# Tester
turnutils_uclient -v -u ton_user -w ton_password turn.enkamba.com
```

---

## Configuration DNS

Avant de tester, configure ton DNS:

```
Type: A
Nom: turn.enkamba.com
Valeur: TON_IP_VPS
TTL: 3600
```

Vérifie:
```bash
dig turn.enkamba.com
```

---

## Ports à Ouvrir

| Port | Protocole | Usage |
|------|-----------|-------|
| 3478 | TCP/UDP | TURN standard |
| 5349 | TCP | TURNS (TLS) |
| 49152-65535 | UDP/TCP | Relais média |

---

## Dépannage Express

### Le serveur ne démarre pas:
```bash
docker-compose logs coturn
```

### Les clients ne se connectent pas:
```bash
# Vérifier le firewall
sudo ufw status

# Vérifier les ports
sudo netstat -tulpn | grep -E '3478|5349'

# Tester depuis l'extérieur
telnet turn.enkamba.com 3478
```

### Redémarrer le serveur:
```bash
cd ~/enkamba-turn
docker-compose restart
```

---

## Variables d'Environnement pour l'App

Après avoir lancé `npm run turn:env`, ajoute ces variables dans:

- **Développement**: `.env.local`
- **Production**: Variables d'environnement de ton hébergeur (Vercel, Netlify, etc.)

```env
NEXT_PUBLIC_WEBRTC_STUN_URLS=stun:stun.l.google.com:19302,...
NEXT_PUBLIC_WEBRTC_TURN_HOST=turn.enkamba.com
NEXT_PUBLIC_WEBRTC_TURN_PORT=3478
NEXT_PUBLIC_WEBRTC_TURNS_PORT=5349
NEXT_PUBLIC_WEBRTC_TURN_USERNAME=ton_user
NEXT_PUBLIC_WEBRTC_TURN_PASSWORD=ton_password
# + versions encodées
```

---

## Activer TLS/SSL (Production)

```bash
# Sur le VPS
sudo apt install -y certbot
sudo certbot certonly --standalone -d turn.enkamba.com

# Copier les certificats
sudo cp /etc/letsencrypt/live/turn.enkamba.com/fullchain.pem ~/enkamba-turn/certs/
sudo cp /etc/letsencrypt/live/turn.enkamba.com/privkey.pem ~/enkamba-turn/certs/
sudo chown -R $(id -u):$(id -g) ~/enkamba-turn/certs/

# Modifier .env
cd ~/enkamba-turn
nano .env
# Change: TURN_ENABLE_TLS=true

# Redémarrer
docker-compose restart
```

---

## Monitoring

```bash
# Statut en temps réel
docker stats enkamba-coturn

# Logs en direct
docker-compose logs -f coturn

# Vérifier l'utilisation des ressources
htop
```

---

## 🎉 C'est Tout !

Une fois configuré:
1. ✅ Serveur TURN opérationnel
2. ✅ Variables d'environnement dans l'app
3. ✅ Appels WebRTC fonctionnels même derrière NAT

**Besoin d'aide ?** Consulte [docs/VPS_DEPLOYMENT_GUIDE.md](docs/VPS_DEPLOYMENT_GUIDE.md)

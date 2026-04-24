# 📡 Résumé Complet - Serveur TURN eNkamba

## 🎯 Objectif

Permettre les appels audio/vidéo WebRTC même quand les utilisateurs sont derrière des NAT restrictifs ou des firewalls.

---

## 📁 Fichiers Créés

### Scripts
- ✅ `scripts/deploy-to-vps.sh` - Déploiement automatique depuis ta machine locale
- ✅ `scripts/deploy-turn-vps.sh` - Script d'installation à exécuter sur le VPS
- ✅ `scripts/test-turn-server.sh` - Test de connexion au serveur TURN
- ✅ `scripts/generate-turn-env.sh` - Génération des variables d'environnement

### Documentation
- ✅ `QUICK_TURN_SETUP.md` - Guide de démarrage rapide
- ✅ `docs/VPS_DEPLOYMENT_GUIDE.md` - Guide complet étape par étape
- ✅ `TURN_DEPLOYMENT_CHECKLIST.md` - Checklist pour ne rien oublier
- ✅ `TURN_SERVER_SUMMARY.md` - Ce fichier (résumé)

### Infrastructure
- ✅ `infra/coturn/docker-compose.yml` - Stack Docker coturn
- ✅ `infra/coturn/.env.example` - Template de configuration
- ✅ `infra/coturn/turnserver.conf` - Configuration coturn

### Code Application
- ✅ `src/lib/webrtc.ts` - Client WebRTC qui lit les variables TURN
- ✅ Variables d'environnement dans `.env.local` (à configurer)

---

## 🚀 Méthodes de Déploiement

### Méthode 1: Automatique (Recommandée) ⭐

```bash
# Depuis ta machine locale
bash scripts/deploy-to-vps.sh
```

**Avantages:**
- ✅ Tout automatique
- ✅ Génère les variables automatiquement
- ✅ Peut ajouter à .env.local automatiquement
- ✅ Teste la connexion

**Prérequis:**
- Accès SSH au VPS
- Clé SSH configurée (ou mot de passe)

---

### Méthode 2: Script sur VPS

```bash
# 1. Copier le script sur le VPS
scp scripts/deploy-turn-vps.sh root@TON_VPS:~/

# 2. Se connecter au VPS
ssh root@TON_VPS

# 3. Exécuter le script
bash ~/deploy-turn-vps.sh

# 4. Sur ta machine locale
npm run turn:env -- turn.enkamba.com ton_user ton_password
```

**Avantages:**
- ✅ Plus de contrôle
- ✅ Voir les logs en direct
- ✅ Facile à débugger

---

### Méthode 3: Manuel

Suis le guide complet: [docs/VPS_DEPLOYMENT_GUIDE.md](docs/VPS_DEPLOYMENT_GUIDE.md)

**Avantages:**
- ✅ Comprendre chaque étape
- ✅ Personnalisation maximale
- ✅ Apprentissage

---

## 🔧 Configuration Requise

### Sur le VPS

| Élément | Valeur |
|---------|--------|
| OS | Ubuntu 20.04+ / Debian 10+ |
| RAM | 512 MB minimum (1 GB recommandé) |
| CPU | 1 core minimum |
| Stockage | 5 GB minimum |
| Ports | 3478, 5349, 49152-65535 |

### DNS

```
Type: A
Nom: turn.enkamba.com (ou ton sous-domaine)
Valeur: IP_DE_TON_VPS
TTL: 3600
```

### Variables d'Environnement (App)

```env
NEXT_PUBLIC_WEBRTC_STUN_URLS=stun:stun.l.google.com:19302,...
NEXT_PUBLIC_WEBRTC_TURN_HOST=turn.enkamba.com
NEXT_PUBLIC_WEBRTC_TURN_PORT=3478
NEXT_PUBLIC_WEBRTC_TURNS_PORT=5349
NEXT_PUBLIC_WEBRTC_TURN_USERNAME=ton_user
NEXT_PUBLIC_WEBRTC_TURN_PASSWORD=ton_password
# + versions encodées (générées automatiquement)
```

---

## 🧪 Tests

### Test 1: Connexion Basique

```bash
bash scripts/test-turn-server.sh
```

### Test 2: Depuis le VPS

```bash
ssh root@TON_VPS
sudo apt install -y coturn-utils
turnutils_uclient -v -u ton_user -w ton_password localhost
```

### Test 3: Dans l'Application

1. Lance l'app: `npm run dev`
2. Ouvre deux navigateurs/onglets
3. Initie un appel audio/vidéo
4. Vérifie que ça fonctionne

### Test 4: Depuis Différents Réseaux

- Test WiFi → WiFi
- Test WiFi → 4G
- Test 4G → 4G
- Test avec VPN activé

---

## 📊 Monitoring

### Commandes Utiles

```bash
# Voir les logs en temps réel
ssh root@TON_VPS 'cd ~/enkamba-turn && docker-compose logs -f coturn'

# Statut du conteneur
ssh root@TON_VPS 'docker ps | grep coturn'

# Statistiques de ressources
ssh root@TON_VPS 'docker stats enkamba-coturn --no-stream'

# Redémarrer le serveur
ssh root@TON_VPS 'cd ~/enkamba-turn && docker-compose restart'

# Arrêter le serveur
ssh root@TON_VPS 'cd ~/enkamba-turn && docker-compose down'

# Démarrer le serveur
ssh root@TON_VPS 'cd ~/enkamba-turn && docker-compose up -d'
```

### Logs à Surveiller

```bash
# Erreurs de connexion
grep "ERROR" ~/enkamba-turn/data/turn*.log

# Connexions réussies
grep "session" ~/enkamba-turn/data/turn*.log

# Statistiques
docker logs enkamba-coturn 2>&1 | grep "Total"
```

---

## 🔒 Sécurité

### Recommandations

1. **Mot de passe fort**: Utilise `openssl rand -base64 32`
2. **TLS/SSL**: Active TURNS en production
3. **Firewall**: Limite l'accès si possible
4. **Monitoring**: Surveille les abus
5. **Rotation**: Change le mot de passe régulièrement

### Activer TLS/SSL

```bash
# Sur le VPS
sudo apt install -y certbot
sudo certbot certonly --standalone -d turn.enkamba.com

# Copier les certificats
sudo cp /etc/letsencrypt/live/turn.enkamba.com/fullchain.pem ~/enkamba-turn/certs/
sudo cp /etc/letsencrypt/live/turn.enkamba.com/privkey.pem ~/enkamba-turn/certs/
sudo chown -R $(id -u):$(id -g) ~/enkamba-turn/certs/

# Modifier .env
nano ~/enkamba-turn/.env
# Change: TURN_ENABLE_TLS=true

# Redémarrer
cd ~/enkamba-turn && docker-compose restart
```

### Renouvellement Auto des Certificats

```bash
# Ajouter un cron job
sudo crontab -e

# Ajouter cette ligne:
0 3 * * * certbot renew --quiet && cp /etc/letsencrypt/live/turn.enkamba.com/*.pem ~/enkamba-turn/certs/ && cd ~/enkamba-turn && docker-compose restart
```

---

## 🐛 Dépannage

### Problème: Le serveur ne démarre pas

```bash
# Vérifier les logs
ssh root@TON_VPS 'cd ~/enkamba-turn && docker-compose logs coturn'

# Vérifier la config
ssh root@TON_VPS 'cat ~/enkamba-turn/.env'

# Vérifier Docker
ssh root@TON_VPS 'docker ps -a'
```

### Problème: Les clients ne se connectent pas

```bash
# Vérifier le DNS
dig turn.enkamba.com

# Vérifier les ports
ssh root@TON_VPS 'sudo netstat -tulpn | grep -E "3478|5349"'

# Vérifier le firewall
ssh root@TON_VPS 'sudo ufw status'

# Tester depuis l'extérieur
telnet turn.enkamba.com 3478
```

### Problème: Les appels ne fonctionnent pas

1. Vérifier les variables d'environnement dans l'app
2. Vérifier la console du navigateur (F12)
3. Vérifier que le serveur TURN est accessible
4. Tester avec `scripts/test-turn-server.sh`

### Problème: Certificats SSL

```bash
# Vérifier les permissions
ssh root@TON_VPS 'ls -la ~/enkamba-turn/certs/'

# Corriger les permissions
ssh root@TON_VPS 'sudo chown -R $(id -u):$(id -g) ~/enkamba-turn/certs/'
ssh root@TON_VPS 'sudo chmod 644 ~/enkamba-turn/certs/*'
```

---

## 📈 Performance

### Optimisations

1. **Augmenter la plage de ports**: Plus de ports = plus de connexions simultanées
2. **Augmenter les ressources VPS**: Plus de RAM/CPU pour plus d'utilisateurs
3. **Load balancing**: Plusieurs serveurs TURN pour haute disponibilité
4. **CDN**: Utiliser un CDN pour les fichiers statiques

### Limites Typiques

| VPS | Appels Simultanés | Bande Passante |
|-----|-------------------|----------------|
| 512 MB RAM | ~10-20 | 100 Mbps |
| 1 GB RAM | ~50-100 | 500 Mbps |
| 2 GB RAM | ~200-300 | 1 Gbps |

---

## 🎓 Ressources

### Documentation Officielle
- [Coturn GitHub](https://github.com/coturn/coturn)
- [WebRTC Docs](https://webrtc.org/)
- [TURN RFC](https://tools.ietf.org/html/rfc5766)

### Outils de Test
- [Trickle ICE](https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/)
- [WebRTC Troubleshooter](https://test.webrtc.org/)

---

## ✅ Checklist Rapide

- [ ] VPS configuré avec Ubuntu/Debian
- [ ] DNS pointant vers le VPS
- [ ] Script de déploiement exécuté
- [ ] Serveur TURN démarré
- [ ] Ports ouverts dans le firewall
- [ ] Variables d'environnement dans .env.local
- [ ] Tests de connexion réussis
- [ ] Appels fonctionnels dans l'app
- [ ] TLS/SSL activé (production)
- [ ] Monitoring configuré

---

## 🆘 Support

Si tu rencontres des problèmes:

1. Consulte [docs/VPS_DEPLOYMENT_GUIDE.md](docs/VPS_DEPLOYMENT_GUIDE.md)
2. Vérifie [TURN_DEPLOYMENT_CHECKLIST.md](TURN_DEPLOYMENT_CHECKLIST.md)
3. Exécute `bash scripts/test-turn-server.sh`
4. Vérifie les logs: `ssh root@VPS 'cd ~/enkamba-turn && docker-compose logs coturn'`

---

## 🎉 Résumé

**Ce qui est fait:**
- ✅ Infrastructure coturn prête
- ✅ Scripts de déploiement automatiques
- ✅ Documentation complète
- ✅ Scripts de test
- ✅ Client WebRTC configuré dans l'app

**Ce qui reste à faire:**
1. Déployer sur ton VPS (5-10 minutes)
2. Configurer le DNS (5-30 minutes de propagation)
3. Ajouter les variables dans .env.local (1 minute)
4. Tester les appels (2 minutes)

**Temps total estimé: ~15-45 minutes** (selon la propagation DNS)

---

**🚀 Prêt à déployer ? Lance `bash scripts/deploy-to-vps.sh` !**

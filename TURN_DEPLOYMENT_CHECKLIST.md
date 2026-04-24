# ✅ Checklist de Déploiement TURN Server

Utilise cette checklist pour t'assurer que tout est bien configuré.

---

## 📋 Avant de Commencer

- [ ] J'ai un VPS avec Ubuntu/Debian
- [ ] J'ai accès root/sudo au VPS
- [ ] J'ai un nom de domaine (ex: enkamba.com)
- [ ] Je peux créer un sous-domaine (ex: turn.enkamba.com)
- [ ] J'ai noté l'IP publique de mon VPS: `___________________`

---

## 🌐 Configuration DNS

- [ ] J'ai créé un enregistrement A pour mon sous-domaine TURN
  - Type: `A`
  - Nom: `turn` (ou `turn.enkamba.com`)
  - Valeur: `IP_DE_MON_VPS`
  - TTL: `3600`
- [ ] J'ai attendu la propagation DNS (5-30 minutes)
- [ ] J'ai vérifié avec: `dig turn.enkamba.com` ou `nslookup turn.enkamba.com`

---

## 🖥️ Sur le VPS

### Installation

- [ ] Je me suis connecté au VPS: `ssh root@MON_IP_VPS`
- [ ] J'ai copié le script de déploiement sur le VPS
  ```bash
  scp scripts/deploy-turn-vps.sh root@MON_IP_VPS:~/
  ```
- [ ] J'ai exécuté le script: `bash ~/deploy-turn-vps.sh`
- [ ] Le script a terminé sans erreur
- [ ] J'ai noté les credentials affichés:
  - Domaine: `___________________`
  - Utilisateur: `___________________`
  - Mot de passe: `___________________`

### Vérification

- [ ] Le conteneur Docker tourne: `docker ps | grep coturn`
- [ ] Les logs ne montrent pas d'erreur: `cd ~/enkamba-turn && docker-compose logs coturn`
- [ ] Les ports sont ouverts:
  ```bash
  sudo netstat -tulpn | grep -E '3478|5349'
  ```

### Firewall

- [ ] Les ports sont ouverts dans le firewall:
  - [ ] 3478/TCP
  - [ ] 3478/UDP
  - [ ] 5349/TCP
  - [ ] 49152-65535/UDP
  - [ ] 49152-65535/TCP
- [ ] Vérification: `sudo ufw status` ou `sudo iptables -L -n`

---

## 💻 Sur Ma Machine Locale

### Génération des Variables

- [ ] J'ai exécuté:
  ```bash
  npm run turn:env -- turn.enkamba.com mon_user mon_password
  ```
- [ ] J'ai copié la sortie complète

### Configuration de l'App

- [ ] J'ai créé/modifié `.env.local`
- [ ] J'ai collé les variables générées dans `.env.local`
- [ ] Les variables incluent:
  - [ ] `NEXT_PUBLIC_WEBRTC_TURN_HOST`
  - [ ] `NEXT_PUBLIC_WEBRTC_TURN_PORT`
  - [ ] `NEXT_PUBLIC_WEBRTC_TURN_USERNAME`
  - [ ] `NEXT_PUBLIC_WEBRTC_TURN_PASSWORD`
  - [ ] Les versions `_ENCODED`
- [ ] J'ai redémarré le serveur de dev: `npm run dev`

---

## 🧪 Tests

### Test Basique

- [ ] J'ai exécuté le script de test:
  ```bash
  bash scripts/test-turn-server.sh
  ```
- [ ] Tous les tests sont passés ✅

### Test depuis le VPS

- [ ] Je me suis connecté au VPS
- [ ] J'ai installé les outils de test:
  ```bash
  sudo apt install -y coturn-utils
  ```
- [ ] J'ai testé la connexion:
  ```bash
  turnutils_uclient -v -u mon_user -w mon_password localhost
  ```
- [ ] Le test affiche "tot_send_msgs" et "tot_recv_msgs" > 0

### Test depuis l'App

- [ ] J'ai lancé l'app en local: `npm run dev`
- [ ] J'ai ouvert deux navigateurs/onglets
- [ ] J'ai initié un appel audio/vidéo
- [ ] L'appel fonctionne ✅
- [ ] La vidéo/audio est transmise correctement

---

## 🔒 Sécurité (Optionnel mais Recommandé)

### Activation TLS/SSL

- [ ] J'ai installé certbot sur le VPS:
  ```bash
  sudo apt install -y certbot
  ```
- [ ] J'ai obtenu un certificat SSL:
  ```bash
  sudo certbot certonly --standalone -d turn.enkamba.com
  ```
- [ ] J'ai copié les certificats:
  ```bash
  sudo cp /etc/letsencrypt/live/turn.enkamba.com/fullchain.pem ~/enkamba-turn/certs/
  sudo cp /etc/letsencrypt/live/turn.enkamba.com/privkey.pem ~/enkamba-turn/certs/
  sudo chown -R $(id -u):$(id -g) ~/enkamba-turn/certs/
  ```
- [ ] J'ai modifié `.env` sur le VPS: `TURN_ENABLE_TLS=true`
- [ ] J'ai redémarré coturn: `cd ~/enkamba-turn && docker-compose restart`
- [ ] Le port 5349 fonctionne avec TLS

### Renouvellement Auto des Certificats

- [ ] J'ai configuré le renouvellement automatique:
  ```bash
  sudo crontab -e
  # Ajouter:
  0 3 * * * certbot renew --quiet && cp /etc/letsencrypt/live/turn.enkamba.com/*.pem ~/enkamba-turn/certs/ && cd ~/enkamba-turn && docker-compose restart
  ```

---

## 🚀 Déploiement en Production

### Variables d'Environnement

- [ ] J'ai ajouté les variables TURN dans mon hébergeur (Vercel/Netlify/etc.)
- [ ] J'ai vérifié que les variables sont bien chargées en prod
- [ ] J'ai testé un appel en production

### Monitoring

- [ ] J'ai configuré un monitoring basique:
  ```bash
  # Sur le VPS, créer un cron pour surveiller
  */5 * * * * docker ps | grep -q coturn || (cd ~/enkamba-turn && docker-compose up -d)
  ```
- [ ] J'ai configuré des alertes (optionnel)

---

## 📊 Maintenance

### Commandes à Connaître

- [ ] Je sais voir les logs: `cd ~/enkamba-turn && docker-compose logs -f coturn`
- [ ] Je sais redémarrer: `cd ~/enkamba-turn && docker-compose restart`
- [ ] Je sais arrêter: `cd ~/enkamba-turn && docker-compose down`
- [ ] Je sais voir les stats: `docker stats enkamba-coturn`

### Sauvegarde

- [ ] J'ai sauvegardé le fichier `.env` du VPS
- [ ] J'ai sauvegardé les credentials TURN
- [ ] J'ai documenté la configuration pour mon équipe

---

## 🎉 Finalisation

- [ ] Le serveur TURN est opérationnel 24/7
- [ ] Les appels WebRTC fonctionnent en local
- [ ] Les appels WebRTC fonctionnent en production
- [ ] J'ai testé avec différents réseaux (WiFi, 4G, etc.)
- [ ] J'ai testé avec différents navigateurs
- [ ] La documentation est à jour
- [ ] Mon équipe sait comment accéder aux logs

---

## 📝 Notes Personnelles

```
Date de déploiement: ___________________
IP du VPS: ___________________
Domaine TURN: ___________________
Hébergeur VPS: ___________________
Problèmes rencontrés: 




Solutions appliquées:




```

---

## 🆘 En Cas de Problème

### Le serveur ne démarre pas
1. Vérifier les logs: `docker-compose logs coturn`
2. Vérifier la config: `cat ~/enkamba-turn/.env`
3. Vérifier Docker: `docker ps -a`

### Les clients ne se connectent pas
1. Vérifier le DNS: `dig turn.enkamba.com`
2. Vérifier les ports: `sudo netstat -tulpn | grep 3478`
3. Vérifier le firewall: `sudo ufw status`
4. Tester depuis le VPS: `turnutils_uclient -v -u user -w pass localhost`

### Les appels ne fonctionnent pas
1. Vérifier les variables d'environnement dans l'app
2. Vérifier la console du navigateur (F12)
3. Tester avec `scripts/test-turn-server.sh`
4. Vérifier que le serveur TURN est accessible depuis Internet

---

**✅ Checklist complétée le:** `___________________`

**🎊 Félicitations ! Ton serveur TURN est opérationnel !**

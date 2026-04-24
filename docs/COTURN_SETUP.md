# Coturn Setup

Configuration minimale pour activer les appels WebRTC a distance avec un serveur `TURN` auto-heberge.

## Pourquoi

Sans `TURN`, les appels peuvent marcher en local mais echouer entre reseaux differents. `STUN` seul ne suffit pas face aux NAT stricts.

## Variables eNkamba

Le client supporte maintenant deux modes :

1. `NEXT_PUBLIC_WEBRTC_ICE_SERVERS`
2. variables `TURN` dediees

Exemple conseille :

```env
NEXT_PUBLIC_WEBRTC_ICE_SERVERS=
NEXT_PUBLIC_WEBRTC_STUN_URLS=stun:stun.l.google.com:19302,stun:stun1.l.google.com:19302
NEXT_PUBLIC_WEBRTC_TURN_HOST=turn.votre-domaine.com
NEXT_PUBLIC_WEBRTC_TURN_PORT=3478
NEXT_PUBLIC_WEBRTC_TURNS_PORT=5349
NEXT_PUBLIC_WEBRTC_TURN_USERNAME=enkamba
NEXT_PUBLIC_WEBRTC_TURN_PASSWORD=mot-de-passe-solide
```

## Ports a ouvrir

- `3478/tcp`
- `3478/udp`
- `5349/tcp`
- plage RTP `49152-65535/udp`

## Exemple coturn

Fichier `turnserver.conf` minimal :

```conf
listening-port=3478
tls-listening-port=5349
fingerprint
use-auth-secret=no
lt-cred-mech
realm=turn.votre-domaine.com
user=enkamba:mot-de-passe-solide
server-name=turn.votre-domaine.com
external-ip=VOTRE_IP_PUBLIQUE
listening-ip=0.0.0.0
min-port=49152
max-port=65535
no-cli
```

## Docker rapide

```bash
docker run -d --name coturn \
  -p 3478:3478/tcp -p 3478:3478/udp \
  -p 5349:5349/tcp \
  -p 49152-65535:49152-65535/udp \
  -v $(pwd)/turnserver.conf:/etc/coturn/turnserver.conf \
  coturn/coturn
```

## DNS et TLS

- pointez `turn.votre-domaine.com` vers votre serveur
- ajoutez un certificat TLS valide si vous utilisez `turns:`
- gardez `3478` pour `turn:` et `5349` pour `turns:`

## Important

- `TURN` n'est pas optionnel pour la fiabilite en production
- meme auto-heberge, le cout principal sera celui du serveur et de la bande passante
- les variables `NEXT_PUBLIC_*` sont visibles par le client; les variantes `_ENCODED` servent surtout a eviter les faux positifs de secret scanning

# eNkamba WebRTC TURN

Configuration de production des appels audio et video Masolo.

## Serveur

- VM: `enkambavps`
- Zone: `us-central1-c`
- IP publique: `104.154.90.30`
- Service: `coturn`
- Statut attendu: `active`

## Ports Google Cloud

- `3478/tcp`
- `3478/udp`
- `49152-65535/udp`

Les regles firewall creees sont:

- `enkamba-turn-3478`
- `enkamba-turn-relay-udp`

## Variables Vercel

Ajouter ces variables dans Vercel pour que les appels utilisent le serveur TURN:

```env
NEXT_PUBLIC_WEBRTC_ICE_SERVERS=
NEXT_PUBLIC_WEBRTC_STUN_URLS=stun:stun.l.google.com:19302,stun:stun1.l.google.com:19302,stun:stun2.l.google.com:19302
NEXT_PUBLIC_WEBRTC_TURN_HOST=104.154.90.30
NEXT_PUBLIC_WEBRTC_TURN_PORT=3478
NEXT_PUBLIC_WEBRTC_TURNS_PORT=
NEXT_PUBLIC_WEBRTC_TURN_USERNAME=enkamba_turn
NEXT_PUBLIC_WEBRTC_TURN_PASSWORD=mettre_le_mot_de_passe_turn_configure_sur_la_vm
```

Le mot de passe reel ne doit pas etre commite dans le depot. Il doit rester dans les variables d'environnement locales et Vercel.

## Verification rapide

Sur la VM:

```bash
sudo systemctl status coturn --no-pager
sudo ss -lntup | grep ':3478'
```

Depuis une machine externe:

```bash
nc -vz 104.154.90.30 3478
```

Le test TURN avec `turnutils_uclient` doit montrer une perte de paquets a `0%`.

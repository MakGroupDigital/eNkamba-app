# eNkamba Realtime Gateway

Passerelle WebSocket pour les notifications avancees, la presence, le typing et les signaux immediats d'appel.

## URL de production

```env
NEXT_PUBLIC_REALTIME_WS_URL=wss://enkamba-realtime.104.154.90.30.sslip.io/ws
```

## Endpoints

- `GET /health`: etat du service
- `WSS /ws`: connexion WebSocket

## Evenements supportes

- `auth`
- `presence:ping`
- `conversation:join`
- `conversation:leave`
- `typing:start`
- `typing:stop`
- `notification:realtime`
- `call:ringing`

Firestore reste la source persistante. Ce service sert uniquement a accelerer les signaux temps reel.

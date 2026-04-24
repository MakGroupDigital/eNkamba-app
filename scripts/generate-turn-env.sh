#!/usr/bin/env bash
set -euo pipefail

if [ "${1:-}" = "" ] || [ "${2:-}" = "" ] || [ "${3:-}" = "" ]; then
  echo "Usage: $0 <turn-host> <turn-username> <turn-password> [turn-port] [turns-port]" >&2
  exit 1
fi

TURN_HOST="$1"
TURN_USERNAME="$2"
TURN_PASSWORD="$3"
TURN_PORT="${4:-3478}"
TURNS_PORT="${5:-5349}"
STUN_URLS="stun:stun.l.google.com:19302,stun:stun1.l.google.com:19302,stun:stun2.l.google.com:19302"

encode() {
  printf '%s' "$1" | base64
}

cat <<EOF
# .env.local / variables de prod
NEXT_PUBLIC_WEBRTC_ICE_SERVERS=
NEXT_PUBLIC_WEBRTC_STUN_URLS=$STUN_URLS
NEXT_PUBLIC_WEBRTC_TURN_HOST=$TURN_HOST
NEXT_PUBLIC_WEBRTC_TURN_PORT=$TURN_PORT
NEXT_PUBLIC_WEBRTC_TURNS_PORT=$TURNS_PORT
NEXT_PUBLIC_WEBRTC_TURN_USERNAME=$TURN_USERNAME
NEXT_PUBLIC_WEBRTC_TURN_PASSWORD=$TURN_PASSWORD

# Versions encodees
NEXT_PUBLIC_WEBRTC_STUN_URLS_ENCODED=$(encode "$STUN_URLS")
NEXT_PUBLIC_WEBRTC_TURN_HOST_ENCODED=$(encode "$TURN_HOST")
NEXT_PUBLIC_WEBRTC_TURN_PORT_ENCODED=$(encode "$TURN_PORT")
NEXT_PUBLIC_WEBRTC_TURNS_PORT_ENCODED=$(encode "$TURNS_PORT")
NEXT_PUBLIC_WEBRTC_TURN_USERNAME_ENCODED=$(encode "$TURN_USERNAME")
NEXT_PUBLIC_WEBRTC_TURN_PASSWORD_ENCODED=$(encode "$TURN_PASSWORD")
EOF


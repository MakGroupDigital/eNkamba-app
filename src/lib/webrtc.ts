'use client';

import { decodeSecret } from '@/lib/decode-secrets';

const DEFAULT_ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
];

function readEnvValue(value: string | undefined, encodedValue: string | undefined): string {
  return value?.trim() || decodeSecret(encodedValue).trim();
}

function parseCsv(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildIceServersFromEnv(): RTCIceServer[] {
  const stunUrlsValue = readEnvValue(
    process.env.NEXT_PUBLIC_WEBRTC_STUN_URLS,
    process.env.NEXT_PUBLIC_WEBRTC_STUN_URLS_ENCODED
  );
  const turnHost = readEnvValue(
    process.env.NEXT_PUBLIC_WEBRTC_TURN_HOST,
    process.env.NEXT_PUBLIC_WEBRTC_TURN_HOST_ENCODED
  );
  const turnUsername = readEnvValue(
    process.env.NEXT_PUBLIC_WEBRTC_TURN_USERNAME,
    process.env.NEXT_PUBLIC_WEBRTC_TURN_USERNAME_ENCODED
  );
  const turnPassword = readEnvValue(
    process.env.NEXT_PUBLIC_WEBRTC_TURN_PASSWORD,
    process.env.NEXT_PUBLIC_WEBRTC_TURN_PASSWORD_ENCODED
  );
  const turnPort = readEnvValue(
    process.env.NEXT_PUBLIC_WEBRTC_TURN_PORT,
    process.env.NEXT_PUBLIC_WEBRTC_TURN_PORT_ENCODED
  ) || '3478';
  const turnsPort = readEnvValue(
    process.env.NEXT_PUBLIC_WEBRTC_TURNS_PORT,
    process.env.NEXT_PUBLIC_WEBRTC_TURNS_PORT_ENCODED
  );

  const stunUrls = stunUrlsValue ? parseCsv(stunUrlsValue) : DEFAULT_ICE_SERVERS.flatMap((server) => (Array.isArray(server.urls) ? server.urls : [server.urls]));
  const iceServers: RTCIceServer[] = [{ urls: stunUrls }];

  if (turnHost && turnUsername && turnPassword) {
    const turnUrls = [`turn:${turnHost}:${turnPort}?transport=udp`, `turn:${turnHost}:${turnPort}?transport=tcp`];

    if (turnsPort) {
      turnUrls.push(`turns:${turnHost}:${turnsPort}?transport=tcp`);
    }

    iceServers.push({
      urls: turnUrls,
      username: turnUsername,
      credential: turnPassword,
    });
  }

  return iceServers;
}

function parseIceServers(rawValue: string | undefined): RTCIceServer[] {
  if (!rawValue) {
    return buildIceServersFromEnv();
  }

  try {
    const parsed = JSON.parse(rawValue);
    if (!Array.isArray(parsed)) {
      return buildIceServersFromEnv();
    }

    const normalized = parsed.filter((item): item is RTCIceServer => {
      if (!item || typeof item !== 'object') return false;
      const urls = (item as RTCIceServer).urls;
      return typeof urls === 'string' || Array.isArray(urls);
    });

    return normalized.length > 0 ? normalized : buildIceServersFromEnv();
  } catch (error) {
    console.warn('Configuration ICE invalide, fallback STUN par défaut:', error);
    return buildIceServersFromEnv();
  }
}

export function getRtcConfiguration(): RTCConfiguration {
  const iceServers = parseIceServers(process.env.NEXT_PUBLIC_WEBRTC_ICE_SERVERS);

  return {
    iceServers,
    iceCandidatePoolSize: 10,
    iceTransportPolicy: 'all',
    bundlePolicy: 'max-bundle',
    rtcpMuxPolicy: 'require',
  };
}

export function hasTurnServerConfigured(): boolean {
  const iceServers = parseIceServers(process.env.NEXT_PUBLIC_WEBRTC_ICE_SERVERS);
  return iceServers.some((server) => {
    const urls = Array.isArray(server.urls) ? server.urls : [server.urls];
    return urls.some((url) => typeof url === 'string' && url.startsWith('turn:'));
  });
}

export async function attachRemoteStream(
  mediaElement: HTMLMediaElement | null,
  remoteStream: MediaStream,
  onReady?: () => void
) {
  if (!mediaElement) return;

  if (mediaElement.srcObject !== remoteStream) {
    mediaElement.srcObject = remoteStream;
  }

  try {
    await mediaElement.play();
  } catch {
    mediaElement.onloadedmetadata = () => {
      void mediaElement.play().catch(() => undefined);
    };
  }

  onReady?.();
}

export function closePeerResources(peerConnection: RTCPeerConnection | null, streams: Array<MediaStream | null>) {
  streams.forEach((stream) => {
    stream?.getTracks().forEach((track) => track.stop());
  });

  if (!peerConnection) return;

  try {
    peerConnection.getSenders().forEach((sender) => {
      sender.track?.stop();
    });
  } catch {}

  try {
    peerConnection.close();
  } catch {}
}

'use client';

const DEFAULT_ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
];

function parseIceServers(rawValue: string | undefined): RTCIceServer[] {
  if (!rawValue) {
    return DEFAULT_ICE_SERVERS;
  }

  try {
    const parsed = JSON.parse(rawValue);
    if (!Array.isArray(parsed)) {
      return DEFAULT_ICE_SERVERS;
    }

    const normalized = parsed.filter((item): item is RTCIceServer => {
      if (!item || typeof item !== 'object') return false;
      const urls = (item as RTCIceServer).urls;
      return typeof urls === 'string' || Array.isArray(urls);
    });

    return normalized.length > 0 ? normalized : DEFAULT_ICE_SERVERS;
  } catch (error) {
    console.warn('Configuration ICE invalide, fallback STUN par défaut:', error);
    return DEFAULT_ICE_SERVERS;
  }
}

export function getRtcConfiguration(): RTCConfiguration {
  const iceServers = parseIceServers(process.env.NEXT_PUBLIC_WEBRTC_ICE_SERVERS);

  return {
    iceServers,
    iceCandidatePoolSize: 10,
    bundlePolicy: 'max-bundle',
    rtcpMuxPolicy: 'require',
  };
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


/**
 * ENK-009: voice/video notes recorded in the format the device really produces,
 * with a duration measured from real time (Chrome's WebM files carry no duration header).
 */
const AUDIO_TYPES = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/ogg;codecs=opus', 'audio/webm'];
const VIDEO_TYPES = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/mp4', 'video/webm'];

export const MIN_NOTE_SECONDS = 1;
export const MIN_NOTE_BYTES = 1024;

export const VOICE_CONSTRAINTS: MediaTrackConstraints = {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
  channelCount: 1,
};

export function pickRecorderMimeType(kind: 'audio' | 'video'): string | undefined {
  if (typeof MediaRecorder === 'undefined' || typeof MediaRecorder.isTypeSupported !== 'function') return undefined;
  return (kind === 'audio' ? AUDIO_TYPES : VIDEO_TYPES).find((type) => MediaRecorder.isTypeSupported(type));
}

export function fileExtensionFor(mimeType: string) {
  const base = mimeType.split(';')[0];
  if (base.endsWith('/mp4')) return base.startsWith('audio') ? 'm4a' : 'mp4';
  if (base.endsWith('/ogg')) return 'ogg';
  return 'webm';
}

/** Returns a user-facing reason when a finished recording must not be sent, otherwise null. */
export function validateRecording(blob: Blob | null, durationSeconds: number): string | null {
  if (!blob || blob.size < MIN_NOTE_BYTES) return "L'enregistrement est vide. Vérifiez le micro puis réessayez.";
  if (durationSeconds < MIN_NOTE_SECONDS) return 'Enregistrement trop court. Maintenez au moins une seconde.';
  return null;
}

export function microphoneErrorMessage(error: unknown) {
  const name = (error as { name?: string })?.name;
  if (name === 'NotAllowedError' || name === 'SecurityError') return "Accès au micro refusé. Autorisez le micro dans les réglages de l'appareil.";
  if (name === 'NotFoundError' || name === 'OverconstrainedError') return 'Aucun micro disponible sur cet appareil.';
  if (name === 'NotReadableError') return 'Le micro est déjà utilisé par une autre application (appel en cours ?).';
  return "Impossible de démarrer l'enregistrement.";
}

export function formatClock(totalSeconds: number) {
  const seconds = Math.max(0, Math.round(totalSeconds || 0));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

function getKycCompreFaceConfig() {
  const baseUrl = (
    process.env.KYC_COMPREFACE_BASE_URL ||
    process.env.COMPREFACE_BASE_URL ||
    ''
  ).replace(/\/$/, '');
  const detectionApiKey =
    process.env.KYC_COMPREFACE_DETECTION_API_KEY ||
    process.env.COMPREFACE_DETECTION_API_KEY ||
    '';

  return { baseUrl, detectionApiKey };
}

function imageFromDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:(image\/(?:jpeg|jpg|png|webp));base64,(.+)$/);
  if (!match) throw new Error('Image KYC invalide.');

  const mimeType = match[1] === 'image/jpg' ? 'image/jpeg' : match[1];
  const buffer = Buffer.from(match[2], 'base64');
  if (buffer.length > 5 * 1024 * 1024) {
    throw new Error('Image KYC trop lourde.');
  }

  return new File([buffer], `kyc-selfie-${Date.now()}.jpg`, { type: mimeType });
}

async function callCompreFace(endpoint: string, apiKey: string, file: File) {
  const url = new URL(endpoint);
  url.searchParams.set('limit', '1');
  url.searchParams.set('det_prob_threshold', '0.82');
  url.searchParams.set('face_plugins', 'pose,mask,landmarks');

  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'x-api-key': apiKey },
    body: formData,
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.message || payload?.error || 'Le contrôle visage KYC a échoué.');
  }

  return payload;
}

function toNumber(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function assessKycFace(payload: any) {
  const faces = Array.isArray(payload?.result) ? payload.result : [];
  if (faces.length !== 1) {
    return {
      accepted: false,
      confidence: 0,
      reason: faces.length > 1 ? 'Plusieurs visages détectés.' : 'Aucun visage détecté.',
      instruction: faces.length > 1
        ? 'Gardez uniquement votre visage dans le cadre.'
        : 'Placez votre visage bien visible dans le cadre.',
    };
  }

  const face = faces[0];
  const probability = toNumber(face?.box?.probability) ?? 0;
  const maskValue = String(face?.mask?.value || '').toLowerCase();
  const pose = face?.pose || {};
  const yaw = toNumber(pose?.yaw ?? pose?.y) ?? 0;
  const pitch = toNumber(pose?.pitch ?? pose?.x) ?? 0;

  if (probability < 0.88) {
    return {
      accepted: false,
      confidence: Math.round(probability * 100),
      reason: 'Visage insuffisamment net.',
      instruction: 'Rapprochez-vous, restez stable et assurez une bonne lumière.',
    };
  }

  if (maskValue && maskValue !== 'without_mask') {
    return {
      accepted: false,
      confidence: Math.round(probability * 100),
      reason: 'Visage partiellement masqué.',
      instruction: 'Retirez masque, lunettes opaques ou élément qui cache le visage.',
    };
  }

  if (Math.abs(yaw) > 22 || Math.abs(pitch) > 22) {
    return {
      accepted: false,
      confidence: Math.round(probability * 100),
      reason: 'Position du visage incorrecte.',
      instruction: 'Regardez droit devant la caméra.',
    };
  }

  return {
    accepted: true,
    confidence: Math.round(probability * 100),
    reason: 'Visage KYC exploitable.',
    instruction: 'Visage validé pour soumission KYC.',
    details: {
      probability,
      pose: face?.pose || null,
      mask: face?.mask || null,
      box: face?.box || null,
    },
  };
}

export async function POST(request: NextRequest) {
  try {
    const { baseUrl, detectionApiKey } = getKycCompreFaceConfig();
    if (!baseUrl || !detectionApiKey) {
      return NextResponse.json(
        {
          success: false,
          missingConfig: true,
          error: 'Le contrôle KYC par reconnaissance faciale n’est pas configuré.',
        },
        { status: 503 }
      );
    }

    const body = await request.json();
    const frame = String(body?.frame || '');
    if (!frame) {
      return NextResponse.json(
        { success: false, error: 'Selfie KYC manquant.' },
        { status: 400 }
      );
    }

    const file = imageFromDataUrl(frame);
    const result = await callCompreFace(`${baseUrl}/api/v1/detection/detect`, detectionApiKey, file);
    const assessment = assessKycFace(result);

    return NextResponse.json({
      success: true,
      provider: 'enkamba-kyc-face-control',
      ...assessment,
    });
  } catch (error: any) {
    console.error('Erreur KYC CompreFace:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Erreur contrôle visage KYC.',
      },
      { status: 500 }
    );
  }
}

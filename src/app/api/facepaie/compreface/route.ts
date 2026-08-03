import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

type FacePaieAction = 'assess' | 'enroll' | 'recognize';

function getCompreFaceConfig() {
  const baseUrl = (
    process.env.COMPREFACE_BASE_URL ||
    process.env.FACEPAIE_COMPREFACE_URL ||
    ''
  ).replace(/\/$/, '');
  const recognitionApiKey =
    process.env.COMPREFACE_RECOGNITION_API_KEY ||
    process.env.FACEPAIE_COMPREFACE_RECOGNITION_API_KEY ||
    '';
  const detectionApiKey =
    process.env.COMPREFACE_DETECTION_API_KEY ||
    process.env.FACEPAIE_COMPREFACE_DETECTION_API_KEY ||
    recognitionApiKey;
  const verificationApiKey =
    process.env.COMPREFACE_VERIFY_API_KEY ||
    process.env.FACEPAIE_COMPREFACE_VERIFY_API_KEY ||
    recognitionApiKey;
  const threshold = Number(process.env.COMPREFACE_FACE_THRESHOLD || '0.82');

  return { baseUrl, recognitionApiKey, detectionApiKey, verificationApiKey, threshold };
}

function normalizeSubject(userId: string) {
  return `enkamba_facepaie_${userId.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
}

function imageFromDataUrl(dataUrl: string, filename: string) {
  const match = dataUrl.match(/^data:(image\/(?:jpeg|jpg|png|webp));base64,(.+)$/);
  if (!match) throw new Error('Image FacePaie invalide.');

  const mimeType = match[1] === 'image/jpg' ? 'image/jpeg' : match[1];
  const buffer = Buffer.from(match[2], 'base64');
  if (buffer.length > 5 * 1024 * 1024) {
    throw new Error('Image FacePaie trop lourde.');
  }

  return new File([buffer], filename, { type: mimeType });
}

async function callCompreFace(
  endpoint: string,
  apiKey: string,
  file: File,
  extraParams: Record<string, string> = {}
) {
  const url = new URL(endpoint);
  Object.entries(extraParams).forEach(([key, value]) => {
    if (value) url.searchParams.set(key, value);
  });

  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
    },
    body: formData,
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.message || payload?.error || 'FacePaie a refusé la demande.');
  }

  return payload;
}

function readNumber(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function assessFace(payload: any, step: string) {
  const face = payload?.result?.[0];
  if (!face) {
    return {
      accepted: false,
      confidence: 0,
      instruction: 'Placez votre visage bien visible dans le cadre.',
    };
  }

  const probability = readNumber(face?.box?.probability) ?? 0;
  const maskValue = String(face?.mask?.value || '').toLowerCase();
  if (probability < 0.88) {
    return {
      accepted: false,
      confidence: Math.round(probability * 100),
      instruction: 'Rapprochez-vous et gardez un seul visage net dans le cadre.',
    };
  }

  if (maskValue && maskValue !== 'without_mask') {
    return {
      accepted: false,
      confidence: Math.round(probability * 100),
      instruction: 'Retirez le masque ou tout élément qui cache le visage.',
    };
  }

  const pose = face?.pose || {};
  const yaw = readNumber(pose?.yaw ?? pose?.y);
  const pitch = readNumber(pose?.pitch ?? pose?.x);
  const hasPose = yaw !== null || pitch !== null;
  const absoluteYaw = Math.abs(yaw ?? 0);
  const absolutePitch = Math.abs(pitch ?? 0);

  if (step === 'center' && hasPose && (absoluteYaw > 18 || absolutePitch > 18)) {
    return {
      accepted: false,
      confidence: Math.round(probability * 100),
      instruction: 'Regardez droit devant la caméra.',
    };
  }

  if (step !== 'center' && !hasPose) {
    return {
      accepted: false,
      confidence: Math.round(probability * 100),
      instruction: 'Contrôle de position indisponible. Réessayez dans quelques instants.',
    };
  }

  if (step === 'left' && yaw !== null && yaw > -10) {
    return {
      accepted: false,
      confidence: Math.round(probability * 100),
      instruction: 'Tournez doucement votre visage à gauche.',
    };
  }

  if (step === 'right' && yaw !== null && yaw < 10) {
    return {
      accepted: false,
      confidence: Math.round(probability * 100),
      instruction: 'Tournez doucement votre visage à droite.',
    };
  }

  if (step === 'up' && pitch !== null && pitch > -8) {
    return {
      accepted: false,
      confidence: Math.round(probability * 100),
      instruction: 'Relevez légèrement votre tête.',
    };
  }

  return {
    accepted: true,
    confidence: Math.round(probability * 100),
    instruction:
      'Visage validé. Restez stable.',
    details: {
      probability,
      mask: face?.mask || null,
      pose: face?.pose || null,
      box: face?.box || null,
    },
  };
}

export async function POST(request: NextRequest) {
  try {
    const { baseUrl, recognitionApiKey, detectionApiKey, threshold } = getCompreFaceConfig();
    if (!baseUrl || !recognitionApiKey) {
      return NextResponse.json(
        {
          success: false,
          error: 'Le contrôle FacePaie n’est pas configuré.',
          missingConfig: true,
        },
        { status: 503 }
      );
    }

    const body = await request.json();
    const action = body?.action as FacePaieAction;
    const userId = String(body?.userId || '').trim();
    const frames = Array.isArray(body?.frames) ? body.frames.slice(0, 5) : [];
    const frame = String(body?.frame || '');
    const step = String(body?.step || 'center');

    if (action === 'assess') {
      if (!frame) {
        return NextResponse.json(
          { success: false, error: 'Image FacePaie manquante.' },
          { status: 400 }
        );
      }

      const file = imageFromDataUrl(frame, `facepaie-assess-${Date.now()}.jpg`);
      const endpoint = detectionApiKey
        ? `${baseUrl}/api/v1/detection/detect`
        : `${baseUrl}/api/v1/recognition/recognize`;
      const apiKey = detectionApiKey || recognitionApiKey;
      const result = await callCompreFace(endpoint, apiKey, file, {
        limit: '1',
        prediction_count: '1',
        det_prob_threshold: '0.82',
        face_plugins: 'pose,mask,landmarks',
      });
      const assessment = assessFace(result, step);

      return NextResponse.json({
        success: true,
        provider: 'facepaie',
        ...assessment,
      });
    }

    if (!userId || !['enroll', 'recognize'].includes(action) || frames.length < 3) {
      return NextResponse.json(
        { success: false, error: 'Données FacePaie insuffisantes.' },
        { status: 400 }
      );
    }

    const subject = normalizeSubject(userId);

    if (action === 'enroll') {
      const uploaded = [];

      for (const [index, frame] of frames.entries()) {
        const file = imageFromDataUrl(String(frame), `facepaie-${userId}-${index}.jpg`);
        const result = await callCompreFace(
          `${baseUrl}/api/v1/recognition/faces`,
          recognitionApiKey,
          file,
          {
            subject,
            det_prob_threshold: '0.88',
          }
        );
        uploaded.push(result);
      }

      return NextResponse.json({
        success: true,
        provider: 'compreface',
        subject,
        images: uploaded,
      });
    }

    const scores = [];
    for (const [index, frame] of frames.entries()) {
      const file = imageFromDataUrl(String(frame), `facepaie-check-${userId}-${index}.jpg`);
      const result = await callCompreFace(
        `${baseUrl}/api/v1/recognition/recognize`,
        recognitionApiKey,
        file,
        {
          limit: '1',
          prediction_count: '1',
          det_prob_threshold: '0.88',
        }
      );

      const match = result?.result?.[0]?.subjects?.[0];
      scores.push({
        frame: index,
        subject: match?.subject || '',
        similarity: Number(match?.similarity || 0),
      });
    }

    const validMatches = scores.filter(
      (score) => score.subject === subject && score.similarity >= threshold
    );

    return NextResponse.json({
      success: validMatches.length >= 2,
      provider: 'compreface',
      subject,
      threshold,
      scores,
    });
  } catch (error: any) {
    console.error('Erreur FacePaie CompreFace:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Erreur FacePaie.',
      },
      { status: 500 }
    );
  }
}

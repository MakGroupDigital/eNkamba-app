import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { decodeSecret } from '@/lib/decode-secrets';

function decodeJwtPayload(token: string): Record<string, any> | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const payload = Buffer.from(parts[1], 'base64url').toString('utf8');
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

function validateTokenFallback(idToken: string, userId: string): boolean {
  const payload = decodeJwtPayload(idToken);
  if (!payload) return false;

  const uid = payload.user_id || payload.sub;
  const exp = Number(payload.exp || 0);
  const now = Math.floor(Date.now() / 1000);

  return Boolean(uid && uid === userId && exp > now);
}

function stripOptionalBrackets(value?: string): string {
  if (!value) return '';
  return value.trim().replace(/^<|>$/g, '');
}

function getCloudinaryConfig() {
  let cloudName =
    process.env.CLOUDINARY_CLOUD_NAME?.trim() ||
    decodeSecret(process.env.CLOUDINARY_CLOUD_NAME_ENCODED) ||
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
    decodeSecret(process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME_ENCODED);

  let apiKey =
    stripOptionalBrackets(process.env.CLOUDINARY_API_KEY) ||
    stripOptionalBrackets(decodeSecret(process.env.CLOUDINARY_API_KEY_ENCODED));

  let apiSecret =
    stripOptionalBrackets(process.env.CLOUDINARY_API_SECRET) ||
    stripOptionalBrackets(decodeSecret(process.env.CLOUDINARY_API_SECRET_ENCODED));

  if (!cloudName || !apiKey || !apiSecret) {
    const rawCloudinaryUrl =
      process.env.CLOUDINARY_URL?.trim() ||
      decodeSecret(process.env.CLOUDINARY_URL_ENCODED)?.trim();

    if (rawCloudinaryUrl) {
      const normalizedUrl = rawCloudinaryUrl.replace(/[<>]/g, '');
      const match = normalizedUrl.match(/^cloudinary:\/\/([^:]+):([^@]+)@(.+)$/i);
      if (match) {
        apiKey = stripOptionalBrackets(match[1]);
        apiSecret = stripOptionalBrackets(match[2]);
        cloudName = stripOptionalBrackets(match[3]);
      }
    }
  }

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Configuration Cloudinary profil incomplète');
  }

  return { cloudName, apiKey, apiSecret };
}

function buildCloudinarySignature(params: Record<string, string>, apiSecret: string): string {
  const serializedParams = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('&');

  return createHash('sha1').update(`${serializedParams}${apiSecret}`).digest('hex');
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const idToken = authHeader.slice(7);
    const body = await request.json().catch(() => ({}));
    const userId = String(body.userId || '');
    const imageDataUrl = String(body.imageDataUrl || '');

    if (!userId || !validateTokenFallback(idToken, userId)) {
      return NextResponse.json({ error: 'Token invalide' }, { status: 401 });
    }

    if (!imageDataUrl.startsWith('data:image/')) {
      return NextResponse.json({ error: 'Image profil invalide' }, { status: 400 });
    }

    const { cloudName, apiKey, apiSecret } = getCloudinaryConfig();
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const folder = `enkamba/profiles/${userId}`;
    const publicId = `profile-${Date.now()}`;
    const context = `uploader=${userId}|resourceType=profile_photo`;
    const signature = buildCloudinarySignature(
      {
        context,
        folder,
        public_id: publicId,
        timestamp,
      },
      apiSecret
    );

    const cloudinaryFormData = new FormData();
    cloudinaryFormData.append('file', imageDataUrl);
    cloudinaryFormData.append('api_key', apiKey);
    cloudinaryFormData.append('timestamp', timestamp);
    cloudinaryFormData.append('signature', signature);
    cloudinaryFormData.append('folder', folder);
    cloudinaryFormData.append('public_id', publicId);
    cloudinaryFormData.append('context', context);

    const uploadResponse = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: cloudinaryFormData,
    });
    const result = await uploadResponse.json().catch(() => ({}));

    if (!uploadResponse.ok || !result?.secure_url) {
      return NextResponse.json(
        {
          error: 'Erreur upload Cloudinary',
          details: result,
        },
        { status: uploadResponse.status || 500 }
      );
    }

    return NextResponse.json({
      secureUrl: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
    });
  } catch (error: any) {
    console.error('Erreur API profile/upload-photo:', error);
    return NextResponse.json(
      {
        error: error?.message || 'Erreur serveur',
      },
      { status: 500 }
    );
  }
}

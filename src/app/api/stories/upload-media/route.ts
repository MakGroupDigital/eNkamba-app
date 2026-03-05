import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { decodeSecret } from '@/lib/decode-secrets';
import { getCloudinaryCredentials } from '@/config/cloudinary.config';

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
  const uploadPreset =
    process.env.CLOUDINARY_UPLOAD_PRESET?.trim() ||
    decodeSecret(process.env.CLOUDINARY_UPLOAD_PRESET_ENCODED) ||
    process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ||
    decodeSecret(process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET_ENCODED);

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

  // Fallback: config hardcodée (safe pour GitHub car encodée en Base64)
  if (!cloudName || !apiKey || !apiSecret) {
    try {
      const config = getCloudinaryCredentials();
      cloudName = config.cloudName;
      apiKey = config.apiKey;
      apiSecret = config.apiSecret;
    } catch (error) {
      console.error('Erreur chargement config Cloudinary:', error);
    }
  }

  if (!cloudName) {
    throw new Error('Configuration Cloudinary incomplète: cloud name manquant');
  }

  const hasSignedCreds = Boolean(apiKey && apiSecret);
  const hasUnsignedPreset = Boolean(uploadPreset);

  if (!hasSignedCreds && !hasUnsignedPreset) {
    throw new Error('Configuration Cloudinary incomplète: ajoute CLOUDINARY_URL ou CLOUDINARY_UPLOAD_PRESET');
  }

  return {
    cloudName,
    apiKey,
    apiSecret,
    uploadPreset: uploadPreset || '',
    mode: hasSignedCreds ? 'signed' as const : 'unsigned' as const,
  };
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
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const userId = String(formData.get('userId') || '');
    const requestedType = String(formData.get('resourceType') || 'image');

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 });
    }
    if (!userId || !validateTokenFallback(idToken, userId)) {
      return NextResponse.json({ error: 'Token invalide' }, { status: 401 });
    }

    const { cloudName, apiKey, apiSecret, uploadPreset, mode } = getCloudinaryConfig();
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const folder = `enkamba/stories/${userId}`;
    const publicId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const context = `uploader=${userId}|resourceType=${requestedType}`;
    const resourceType = requestedType === 'video' ? 'video' : requestedType === 'raw' ? 'raw' : 'image';

    const cloudinaryFormData = new FormData();
    cloudinaryFormData.append('file', file);
    cloudinaryFormData.append('folder', folder);
    
    if (mode === 'signed') {
      const signature = buildCloudinarySignature(
        {
          context,
          folder,
          public_id: publicId,
          timestamp,
        },
        apiSecret
      );
      cloudinaryFormData.append('api_key', apiKey);
      cloudinaryFormData.append('timestamp', timestamp);
      cloudinaryFormData.append('signature', signature);
      cloudinaryFormData.append('public_id', publicId);
      cloudinaryFormData.append('context', context);
    } else {
      cloudinaryFormData.append('upload_preset', uploadPreset);
    }

    const uploadResponse = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`, {
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
        { status: 500 }
      );
    }

    return NextResponse.json({
      secureUrl: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      resourceType: result.resource_type,
      duration: result.duration,
      width: result.width,
      height: result.height,
      cloudName,
      mode,
    });
  } catch (error: any) {
    console.error('Erreur API stories/upload-media:', error);
    return NextResponse.json(
      {
        error: error?.message || 'Erreur serveur',
      },
      { status: 500 }
    );
  }
}

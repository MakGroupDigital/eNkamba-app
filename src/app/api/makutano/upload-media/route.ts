import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { createHash } from 'crypto';

let adminInitialized = false;
let auth: ReturnType<typeof getAuth> | null = null;

function normalizePrivateKey(raw?: string): string {
  if (!raw) return '';
  let key = raw.trim();
  if (
    (key.startsWith('"') && key.endsWith('"')) ||
    (key.startsWith("'") && key.endsWith("'"))
  ) {
    key = key.slice(1, -1);
  }
  key = key.replace(/\\n/g, '\n').replace(/\r/g, '');
  return key;
}

function initializeFirebaseAdmin() {
  if (adminInitialized) return;

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY);

  if (!projectId || !clientEmail || !privateKey) {
    console.warn('Firebase Admin SDK non configuré pour Makutano upload: fallback JWT payload activé');
    adminInitialized = true;
    return;
  }

  if (!getApps().length) {
    try {
      initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
    } catch (error: any) {
      const msg = error?.message || '';
      if (msg.includes('Invalid PEM formatted message')) {
        console.warn(
          'FIREBASE_PRIVATE_KEY invalide pour Makutano upload, fallback JWT payload activé'
        );
        adminInitialized = true;
        return;
      }
      console.warn('Firebase Admin indisponible pour Makutano upload, fallback JWT payload activé:', error);
      adminInitialized = true;
      return;
    }
  }

  auth = getAuth();
  adminInitialized = true;
}

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

function validateTokenWithoutAdmin(idToken: string, userId: string): boolean {
  const payload = decodeJwtPayload(idToken);
  if (!payload) return false;

  const uid = payload.user_id || payload.sub;
  const exp = Number(payload.exp || 0);
  const now = Math.floor(Date.now() / 1000);

  if (!uid || uid !== userId) return false;
  if (!exp || exp <= now) return false;

  return true;
}

function getCloudinaryConfig() {
  const stripOptionalBrackets = (value?: string) => {
    if (!value) return '';
    return value.trim().replace(/^<|>$/g, '');
  };

  let cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  let apiKey = stripOptionalBrackets(process.env.CLOUDINARY_API_KEY);
  let apiSecret = stripOptionalBrackets(process.env.CLOUDINARY_API_SECRET);

  // Fallback: CLOUDINARY_URL format cloudinary://<api_key>:<api_secret>@<cloud_name>
  if (!cloudName || !apiKey || !apiSecret) {
    const rawCloudinaryUrl = process.env.CLOUDINARY_URL?.trim();
    if (rawCloudinaryUrl) {
      // Accept URLs where credentials are wrapped in chevrons.
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
    throw new Error(
      'Configuration Cloudinary incomplète (CLOUDINARY_URL ou CLOUDINARY_CLOUD_NAME/CLOUDINARY_API_KEY/CLOUDINARY_API_SECRET requis)'
    );
  }

  return { cloudName, apiKey, apiSecret };
}

function buildCloudinarySignature(params: Record<string, string>, apiSecret: string): string {
  const serializedParams = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('&');

  return createHash('sha1')
    .update(`${serializedParams}${apiSecret}`)
    .digest('hex');
}

export async function POST(request: NextRequest) {
  try {
    initializeFirebaseAdmin();

    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const idToken = authHeader.substring(7);
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const userId = String(formData.get('userId') || '');
    const mediaType = String(formData.get('mediaType') || 'file');

    if (!file) {
      return NextResponse.json({ error: 'Fichier manquant' }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    if (auth) {
      try {
        const decodedToken = await auth.verifyIdToken(idToken);
        if (decodedToken.uid !== userId) {
          return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
        }
      } catch {
        return NextResponse.json({ error: 'Token invalide' }, { status: 401 });
      }
    } else if (!validateTokenWithoutAdmin(idToken, userId)) {
      return NextResponse.json({ error: 'Token invalide (fallback)' }, { status: 401 });
    }

    const { cloudName, apiKey, apiSecret } = getCloudinaryConfig();
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const folder = `makutano/${userId}`;
    const publicId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const context = `mediaType=${mediaType}|uploader=${userId}`;
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
    cloudinaryFormData.append('file', file);
    cloudinaryFormData.append('api_key', apiKey);
    cloudinaryFormData.append('timestamp', timestamp);
    cloudinaryFormData.append('signature', signature);
    cloudinaryFormData.append('folder', folder);
    cloudinaryFormData.append('public_id', publicId);
    cloudinaryFormData.append('context', context);

    const uploadResponse = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
      method: 'POST',
      body: cloudinaryFormData,
    });
    const uploadPayload = await uploadResponse.json();

    if (!uploadResponse.ok || !uploadPayload?.secure_url) {
      return NextResponse.json(
        {
          error: 'Upload Cloudinary échoué',
          details: uploadPayload,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      mediaUrl: uploadPayload.secure_url,
      publicId: uploadPayload.public_id || null,
      resourceType: uploadPayload.resource_type || null,
      format: uploadPayload.format || null,
      bytes: uploadPayload.bytes || null,
      contentType: file.type || null,
    });
  } catch (error: any) {
    console.error('Erreur API upload-media:', error);
    return NextResponse.json(
      { error: error?.message || 'Erreur serveur upload' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';
import { randomUUID } from 'crypto';

let adminInitialized = false;
let auth: ReturnType<typeof getAuth> | null = null;
let storage: ReturnType<typeof getStorage> | null = null;

function normalizeBucketName(raw: string): string {
  return raw.replace(/^gs:\/\//, '').trim();
}

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
    throw new Error('Firebase Admin SDK non configuré (projectId/clientEmail/privateKey manquants)');
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
        throw new Error(
          'FIREBASE_PRIVATE_KEY invalide: vérifie le format PEM et les retours à la ligne (\\n).'
        );
      }
      throw error;
    }
  }

  auth = getAuth();
  storage = getStorage();
  adminInitialized = true;
}

export async function POST(request: NextRequest) {
  try {
    initializeFirebaseAdmin();

    if (!auth || !storage) {
      return NextResponse.json({ error: 'Service upload indisponible' }, { status: 503 });
    }

    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const idToken = authHeader.substring(7);
    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(idToken);
    } catch {
      return NextResponse.json({ error: 'Token invalide' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const userId = String(formData.get('userId') || '');
    const mediaType = String(formData.get('mediaType') || 'file');

    if (!file) {
      return NextResponse.json({ error: 'Fichier manquant' }, { status: 400 });
    }

    if (!userId || decodedToken.uid !== userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '';
    const envBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '';
    const buckets = Array.from(
      new Set(
        [envBucket, `${projectId}.firebasestorage.app`, `${projectId}.appspot.com`]
          .filter(Boolean)
          .map(normalizeBucketName)
      )
    );

    const ext = file.name.includes('.') ? file.name.split('.').pop() : 'bin';
    const objectPath = `makutano/${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const errors: string[] = [];

    for (const bucketName of buckets) {
      try {
        const bucket = storage.bucket(bucketName);
        const token = randomUUID();
        const object = bucket.file(objectPath);

        await object.save(buffer, {
          resumable: false,
          contentType: file.type || undefined,
          metadata: {
            metadata: {
              firebaseStorageDownloadTokens: token,
              mediaType,
              uploader: userId,
            },
          },
        });

        const mediaUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(
          objectPath
        )}?alt=media&token=${token}`;

        return NextResponse.json({
          success: true,
          mediaUrl,
          bucket: bucket.name,
          path: objectPath,
          contentType: file.type || null,
        });
      } catch (error: any) {
        errors.push(`${bucketName}: ${error?.message || 'unknown error'}`);
      }
    }

    return NextResponse.json(
      {
        error: 'Upload Firebase Storage échoué sur tous les buckets candidats',
        details: errors,
      },
      { status: 500 }
    );
  } catch (error: any) {
    console.error('Erreur API upload-media:', error);
    return NextResponse.json(
      { error: error?.message || 'Erreur serveur upload' },
      { status: 500 }
    );
  }
}

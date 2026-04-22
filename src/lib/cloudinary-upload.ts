/**
 * Upload de médias vers Cloudinary pour les stories
 */
import { auth } from '@/lib/firebase';
import { decodeSecret } from '@/lib/decode-secrets';

export interface CloudinaryUploadResult {
  url: string;
  secureUrl: string;
  publicId: string;
  format: string;
  resourceType: 'image' | 'video' | 'raw';
  duration?: number;
  width?: number;
  height?: number;
  thumbnailUrl?: string;
}

export async function uploadToCloudinary(
  file: File,
  resourceType: 'image' | 'video' | 'raw' = 'image'
): Promise<CloudinaryUploadResult> {
  const currentUser = auth.currentUser;
  if (!currentUser?.uid) {
    throw new Error('Utilisateur non authentifié');
  }

  const cloudName =
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
    decodeSecret(process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME_ENCODED);
  const uploadPreset =
    process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ||
    decodeSecret(process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET_ENCODED);

  const tryDirectUnsignedUpload = async (): Promise<CloudinaryUploadResult> => {
    if (!cloudName || !uploadPreset) {
      throw new Error('Configuration Cloudinary manquante (cloudName/uploadPreset)');
    }

    const folder = `enkamba/nkampa/${currentUser.uid}`;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);
    formData.append('folder', folder);

    const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;
    const response = await fetch(endpoint, { method: 'POST', body: formData });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload?.secure_url) {
      const details = payload?.error?.message || payload?.error || 'Erreur upload Cloudinary (direct)';
      throw new Error(details);
    }

    return {
      url: payload.secure_url,
      secureUrl: payload.secure_url,
      publicId: payload.public_id,
      format: payload.format,
      resourceType: payload.resource_type,
      duration: payload.duration ?? undefined,
      width: payload.width ?? undefined,
      height: payload.height ?? undefined,
      thumbnailUrl:
        payload.resource_type === 'video'
          ? `https://res.cloudinary.com/${cloudName}/video/upload/so_0,w_400,h_400,c_fill/${payload.public_id}.jpg`
          : undefined,
    };
  };

  try {
    const idToken = await currentUser.getIdToken();
    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', currentUser.uid);
    formData.append('resourceType', resourceType);

    const response = await fetch('/api/stories/upload-media', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
      body: formData,
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const details =
        payload?.details?.error?.message ||
        payload?.details?.error ||
        payload?.error ||
        'Erreur upload Cloudinary';
      throw new Error(String(details));
    }

    return {
      url: payload.secureUrl,
      secureUrl: payload.secureUrl,
      publicId: payload.publicId,
      format: payload.format,
      resourceType: payload.resourceType,
      duration: payload.duration ?? undefined,
      width: payload.width ?? undefined,
      height: payload.height ?? undefined,
      thumbnailUrl:
        payload.resourceType === 'video'
          ? `https://res.cloudinary.com/${payload.cloudName}/video/upload/so_0,w_400,h_400,c_fill/${payload.publicId}.jpg`
          : undefined,
    };
  } catch (e: any) {
    // Fallback: upload direct (unsigned preset) when API route fails (fetch failed / large payload / proxy reset).
    try {
      const direct = await tryDirectUnsignedUpload();
      return direct;
    } catch (fallbackError: any) {
      const msg = (e?.message || e?.toString?.() || 'fetch failed') as string;
      const fb = (fallbackError?.message || fallbackError?.toString?.() || '') as string;
      throw new Error(`Erreur upload Cloudinary: ${msg}${fb ? ` | Fallback: ${fb}` : ''}`);
    }
  }
}

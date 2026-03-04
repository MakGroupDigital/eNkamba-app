/**
 * Upload de médias vers Cloudinary pour les stories
 */
import { auth } from '@/lib/firebase';
import { decodeSecret } from './decode-secrets';

// Décoder les variables Cloudinary
const CLOUDINARY_CLOUD_NAME = 
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 
  decodeSecret(process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME_ENCODED) || 
  'your-cloud-name';

const CLOUDINARY_UPLOAD_PRESET = 
  process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 
  decodeSecret(process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET_ENCODED) || 
  'stories_preset';

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
    throw new Error(`Erreur upload Cloudinary: ${details}`);
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
    thumbnailUrl: payload.resourceType === 'video'
      ? `https://res.cloudinary.com/${payload.cloudName}/video/upload/so_0,w_400,h_400,c_fill/${payload.publicId}.jpg`
      : undefined,
  };
}

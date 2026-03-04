/**
 * Upload de médias vers Cloudinary pour les stories
 */

const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'your-cloud-name';
const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'stories_preset';

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
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  formData.append('folder', 'enkamba/stories');

  const endpoint = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`;

  const response = await fetch(endpoint, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Erreur upload Cloudinary');
  }

  const data = await response.json();

  return {
    url: data.url,
    secureUrl: data.secure_url,
    publicId: data.public_id,
    format: data.format,
    resourceType: data.resource_type,
    duration: data.duration,
    width: data.width,
    height: data.height,
    thumbnailUrl: data.resource_type === 'video' 
      ? `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/video/upload/so_0,w_400,h_400,c_fill/${data.public_id}.jpg`
      : undefined,
  };
}

import { NextRequest, NextResponse } from 'next/server';
import { decodeSecret } from '@/lib/decode-secrets';

// Décoder les variables Cloudinary
const CLOUDINARY_CLOUD_NAME = 
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 
  decodeSecret(process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME_ENCODED) || 
  '';

const CLOUDINARY_UPLOAD_PRESET = 
  process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 
  decodeSecret(process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET_ENCODED) || 
  '';

export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    // Vérifier que les variables Cloudinary sont configurées
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
      console.error('Cloudinary config missing:', {
        cloudName: !!CLOUDINARY_CLOUD_NAME,
        preset: !!CLOUDINARY_UPLOAD_PRESET
      });
      return NextResponse.json(
        { error: 'Configuration Cloudinary manquante' },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const mediaType = (formData.get('mediaType') as string) || 'image';

    if (!file) {
      return NextResponse.json(
        { error: 'Aucun fichier fourni' },
        { status: 400 }
      );
    }

    // Déterminer le resource_type pour Cloudinary
    let resourceType = 'image';
    if (mediaType === 'video') resourceType = 'video';
    else if (mediaType === 'audio') resourceType = 'video'; // Cloudinary traite l'audio comme video

    // Préparer le FormData pour Cloudinary
    const cloudinaryFormData = new FormData();
    cloudinaryFormData.append('file', file);
    cloudinaryFormData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    cloudinaryFormData.append('folder', 'enkamba-makutano');

    // Upload vers Cloudinary
    const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`;
    
    const uploadResponse = await fetch(cloudinaryUrl, {
      method: 'POST',
      body: cloudinaryFormData,
    });

    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.json().catch(() => ({}));
      console.error('Cloudinary upload error:', errorData);
      return NextResponse.json(
        { 
          error: 'Erreur upload Cloudinary',
          details: errorData
        },
        { status: uploadResponse.status }
      );
    }

    const result = await uploadResponse.json();

    return NextResponse.json({
      mediaUrl: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      resourceType: result.resource_type,
      duration: result.duration,
      width: result.width,
      height: result.height,
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { 
        error: 'Erreur serveur',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

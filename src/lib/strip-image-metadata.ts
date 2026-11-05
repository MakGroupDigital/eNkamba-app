/**
 * Re-encode a photo through a canvas so EXIF/XMP metadata (GPS position, device, timestamps)
 * never leaves the device for public content (ENK-064 / T-022).
 * Orientation is applied before drawing, so the result looks the same as the original.
 */
const PASSTHROUGH_TYPES = new Set(['image/gif', 'image/svg+xml']);

export async function stripImageMetadata(file: File, quality = 0.92): Promise<File> {
  if (!file.type.startsWith('image/') || PASSTHROUGH_TYPES.has(file.type)) return file;
  if (typeof createImageBitmap !== 'function' || typeof document === 'undefined') return file;

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    // Format the browser cannot decode (e.g. HEIC on some devices): Cloudinary strips metadata on delivery.
    return file;
  }

  try {
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const context = canvas.getContext('2d');
    if (!context) return file;
    context.drawImage(bitmap, 0, 0);

    const outputType = file.type === 'image/png' || file.type === 'image/webp' ? file.type : 'image/jpeg';
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, outputType, quality));
    if (!blob) return file;

    const extension = outputType.split('/')[1].replace('jpeg', 'jpg');
    const baseName = file.name.replace(/\.[^.]+$/, '') || 'photo';
    return new File([blob], `${baseName}.${extension}`, { type: outputType, lastModified: Date.now() });
  } finally {
    bitmap.close();
  }
}

// Client-side image downscale + JPEG re-encode. A 12MP iPhone selfie is ~3 MB
// of base64 — pushing that through every admin-snapshot poll would melt the
// browser. We resize to a max edge of 384px and re-encode at quality 0.75,
// which lands at ~25–50 KB per face while keeping it readable on stage.

const MAX_EDGE = 384;
const QUALITY = 0.75;

export async function compressImage(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas 2d unavailable');
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();

  return canvas.toDataURL('image/jpeg', QUALITY);
}

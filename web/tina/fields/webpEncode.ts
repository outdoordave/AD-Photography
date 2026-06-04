// Geteilte WebP/JPEG-Encode-Logik fuer die Tina-Foto-Felder (BulkPhotoField +
// SinglePhotoField). 1:1 wie admin/config.yml: WebP @Q85, Breite <= 2400px.
// jSquash-WASM wird vom CDN (unpkg) geladen -> WebP in JEDEM Browser inkl. Safari
// (genau wie Sveltia). Fallback: natives canvas-WebP -> sonst JPEG (nie PNG).

export const MAX_WIDTH = 2400;
export const WEBP_QUALITY = 85; // jSquash: 0..100
export const CANVAS_WEBP_Q = 0.85;
export const JPEG_Q = 0.82;
const JSQUASH_VER = '1.5.0';

export type EncoderMode = 'checking' | 'jsquash' | 'native' | 'jpeg';

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

export function fmt(bytes: number): string {
  return bytes >= 1024 * 1024 ? (bytes / 1024 / 1024).toFixed(1) + ' MB' : Math.round(bytes / 1024) + ' KB';
}

export function toBlobAsync(canvas: HTMLCanvasElement, type: string, q: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), type, q));
}

// jSquash-WebP-Encoder. WASM NICHT aus dem Tina-Bundle (dort 404), sondern per
// locateFile direkt vom CDN — funktioniert in JEDEM Browser inkl. Safari.
let webpMod: any = null;
let webpInitPromise: Promise<any> | null = null;
export async function jsquashWebp(imageData: ImageData): Promise<Blob> {
  if (!webpMod) webpMod = await import('@jsquash/webp/encode');
  if (!webpInitPromise) {
    webpInitPromise = webpMod.init(undefined, {
      locateFile: (path: string) => `https://unpkg.com/@jsquash/webp@${JSQUASH_VER}/codec/enc/${path}`,
    });
  }
  await webpInitPromise;
  const buf: ArrayBuffer = await webpMod.default(imageData, { quality: WEBP_QUALITY });
  return new Blob([buf], { type: 'image/webp' });
}

// Selbsttest: kann jSquash hier WebP erzeugen? (Beweist, dass die WASM laedt.)
export async function detectEncoder(): Promise<EncoderMode> {
  try {
    const id = new ImageData(2, 2);
    id.data.fill(200);
    const blob = await jsquashWebp(id);
    if (blob && blob.size > 0) return 'jsquash';
  } catch {
    /* faellt durch */
  }
  try {
    const c = document.createElement('canvas');
    c.width = 2;
    c.height = 2;
    const b = await toBlobAsync(c, 'image/webp', CANVAS_WEBP_Q);
    if (b && b.type === 'image/webp') return 'native';
  } catch {
    /* faellt durch */
  }
  return 'jpeg';
}

// Ein File -> optimiertes File (WebP wo moeglich, sonst JPEG). Breite <= 2400.
export async function toOptimized(file: File, mode: EncoderMode): Promise<{ file: File; format: 'webp' | 'jpeg' }> {
  const dataUrl = await readAsDataURL(file);
  const img = await loadImage(dataUrl);
  let w = img.naturalWidth || img.width;
  let h = img.naturalHeight || img.height;
  if (w > MAX_WIDTH) {
    const s = MAX_WIDTH / w;
    w = MAX_WIDTH;
    h = Math.round(h * s);
  }
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas-Context fehlt');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);
  const base = file.name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_-]+/g, '-');

  // 1) jSquash-WebP (alle Browser inkl. Safari)
  if (mode === 'jsquash') {
    try {
      const imageData = ctx.getImageData(0, 0, w, h);
      const blob = await jsquashWebp(imageData);
      return { file: new File([blob], `${base}.webp`, { type: 'image/webp' }), format: 'webp' };
    } catch {
      /* faellt auf canvas/jpeg zurueck */
    }
  }
  // 2) Natives canvas-WebP
  if (mode !== 'jpeg') {
    const blob = await toBlobAsync(canvas, 'image/webp', CANVAS_WEBP_Q);
    if (blob && blob.type === 'image/webp') {
      return { file: new File([blob], `${base}.webp`, { type: 'image/webp' }), format: 'webp' };
    }
  }
  // 3) JPEG-Fallback (klein, nicht PNG)
  const jblob = await toBlobAsync(canvas, 'image/jpeg', JPEG_Q);
  if (!jblob) throw new Error('Bild-Umwandlung fehlgeschlagen');
  return { file: new File([jblob], `${base}.jpg`, { type: 'image/jpeg' }), format: 'jpeg' };
}

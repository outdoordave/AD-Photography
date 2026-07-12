// Minimaler EXIF-Kamera-Leser (Build-Zeit, Node) — liest NUR Make (0x010F) + Model (0x0110) aus dem
// TIFF-Block, egal ob die Datei ein JPEG (APP1-Segment) oder WebP (EXIF-RIFF-Chunk) ist. Kein npm-Paket.
// Rückgabe: Klarname der Kamera (z. B. „Sony A7 IV") oder null, wenn keine EXIF/Kamera vorhanden.

// --- TIFF-Block aus JPEG (APP1 „Exif\0\0") herausschneiden -------------------------------------
function tiffFromJpeg(buf) {
  if (buf.length < 4 || buf[0] !== 0xff || buf[1] !== 0xd8) return null; // kein JPEG (SOI)
  let o = 2;
  while (o + 4 <= buf.length) {
    if (buf[o] !== 0xff) { o++; continue; }
    const marker = buf[o + 1];
    if (marker === 0xd9 || marker === 0xda) break; // EOI / SOS -> keine Metadaten mehr
    const len = (buf[o + 2] << 8) | buf[o + 3];
    if (len < 2) break;
    if (marker === 0xe1) { // APP1
      const start = o + 4;
      if (start + 6 <= buf.length && buf[start] === 0x45 && buf[start + 1] === 0x78 && buf[start + 2] === 0x69 && buf[start + 3] === 0x66) {
        return buf.subarray(start + 6, o + 2 + len); // hinter „Exif\0\0"
      }
    }
    o += 2 + len;
  }
  return null;
}

// --- TIFF-Block aus WebP (RIFF-Chunk „EXIF") herausschneiden ------------------------------------
function tiffFromWebp(buf) {
  if (buf.length < 12) return null;
  const asc = (i, n) => String.fromCharCode(...buf.subarray(i, i + n));
  if (asc(0, 4) !== 'RIFF' || asc(8, 4) !== 'WEBP') return null;
  let o = 12;
  while (o + 8 <= buf.length) {
    const cc = asc(o, 4);
    const size = buf[o + 4] | (buf[o + 5] << 8) | (buf[o + 6] << 16) | (buf[o + 7] << 24);
    const data = o + 8;
    if (cc === 'EXIF') {
      let t = buf.subarray(data, data + size);
      if (t.length >= 6 && t[0] === 0x45 && t[1] === 0x78 && t[2] === 0x69 && t[3] === 0x66) t = t.subarray(6); // „Exif\0\0"-Präfix
      return t;
    }
    o = data + size + (size & 1); // Chunks sind auf gerade Länge gepolstert
  }
  return null;
}

// --- Make/Model aus einem TIFF-Block lesen (nur IFD0, ASCII-Tags) -------------------------------
function readMakeModel(tiff) {
  if (!tiff || tiff.length < 8) return {};
  const le = tiff[0] === 0x49 && tiff[1] === 0x49; // „II" = little-endian, „MM" = big-endian
  if (!le && !(tiff[0] === 0x4d && tiff[1] === 0x4d)) return {};
  const u16 = (o) => (le ? tiff[o] | (tiff[o + 1] << 8) : (tiff[o] << 8) | tiff[o + 1]);
  const u32 = (o) => (le ? (tiff[o] | (tiff[o + 1] << 8) | (tiff[o + 2] << 16) | (tiff[o + 3] << 24)) >>> 0
    : ((tiff[o] << 24) | (tiff[o + 1] << 16) | (tiff[o + 2] << 8) | tiff[o + 3]) >>> 0);
  if (u16(2) !== 0x2a) return {};
  const ifd = u32(4);
  if (ifd + 2 > tiff.length) return {};
  const n = u16(ifd);
  const out = {};
  for (let i = 0; i < n; i++) {
    const e = ifd + 2 + i * 12;
    if (e + 12 > tiff.length) break;
    const tag = u16(e);
    if (tag !== 0x010f && tag !== 0x0110) continue;
    const count = u32(e + 4);
    const off = count <= 4 ? e + 8 : u32(e + 8);
    if (off + count > tiff.length) continue;
    let s = '';
    for (let j = 0; j < count; j++) { const c = tiff[off + j]; if (c === 0) break; s += String.fromCharCode(c); }
    s = s.trim();
    if (tag === 0x010f) out.make = s; else out.model = s;
  }
  return out;
}

// --- Klarnamen-Mapping (Davids Ausrüstung + generische Fälle) -----------------------------------
const SONY = {
  'ILCE-7M4': 'Sony A7 IV', 'ILCE-7M3': 'Sony A7 III', 'ILCE-7RM4': 'Sony A7R IV',
  'ILCE-7RM5': 'Sony A7R V', 'ILCE-6400': 'Sony A6400', 'ILCE-6700': 'Sony A6700',
};
const DJI = {
  FC3411: 'DJI Air 2S', FC3582: 'DJI Mini 3 Pro', FC8482: 'DJI Osmo Action', FC3170: 'DJI Mavic Air 2',
};
export function cameraName(make, model) {
  const mk = (make || '').trim();
  const md = (model || '').trim();
  if (!mk && !md) return null;
  const mkl = mk.toLowerCase();
  if (mkl.includes('apple') || md.startsWith('iPhone') || md.startsWith('iPad')) return md || 'Apple';
  if (mkl.includes('sony')) return SONY[md] || (md ? `Sony ${md}` : 'Sony');
  if (mkl.includes('dji')) return DJI[md] || (md ? `DJI ${md}` : 'DJI');
  if (mk && md) return md.startsWith(mk.split(' ')[0]) ? md : `${mk} ${md}`;
  return md || mk || null;
}

// Öffentlich: Kamera-Klarname aus einem Datei-Buffer (Uint8Array/Buffer). null = keine EXIF/Kamera.
export function readCamera(buf) {
  const tiff = tiffFromJpeg(buf) || tiffFromWebp(buf);
  if (!tiff) return null;
  const { make, model } = readMakeModel(tiff);
  return cameraName(make, model);
}

export { tiffFromJpeg, tiffFromWebp, readMakeModel };

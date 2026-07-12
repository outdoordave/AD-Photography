// EXIF beim Upload erhalten: aus der Originaldatei (JPEG/WebP) die Kamera (Make/Model) ziehen und nach der
// WebP-Konvertierung als „EXIF"-Chunk wieder einmuxen — sonst geht die Kamera-Info bei der Konvertierung
// verloren. Wir speichern NUR einen MINIMALEN EXIF-Block (Make+Model, ~50 Byte) statt der Original-EXIF
// (die mit Maker-Note + Thumbnail schnell 50 KB groß wird und das WebP aufblähen würde).
// Reine Uint8Array-Logik (kein DOM), damit sie auch in Node round-trip-getestet werden kann.

// Bequem-Helfer: aus der Quelldatei einen schlanken EXIF-Block (nur Kamera) bauen. null = keine Kamera.
export function slimExifForWebp(srcBytes: Uint8Array): Uint8Array | null {
  const full = extractExifTiff(srcBytes);
  if (!full) return null;
  const { make, model } = readMakeModel(full);
  if (!make && !model) return null;
  return buildMinimalExifTiff(make || '', model || '');
}

// --- EXIF-TIFF aus der Quelle extrahieren (JPEG-APP1 oder WebP-EXIF-Chunk) ----------------------
export function extractExifTiff(bytes: Uint8Array): Uint8Array | null {
  return tiffFromJpeg(bytes) || tiffFromWebp(bytes);
}

// Make (0x010F) + Model (0x0110) aus einem TIFF-Block lesen (nur IFD0, ASCII).
export function readMakeModel(tiff: Uint8Array): { make?: string; model?: string } {
  if (!tiff || tiff.length < 8) return {};
  const le = tiff[0] === 0x49 && tiff[1] === 0x49;
  if (!le && !(tiff[0] === 0x4d && tiff[1] === 0x4d)) return {};
  const u16 = (o: number) => (le ? tiff[o] | (tiff[o + 1] << 8) : (tiff[o] << 8) | tiff[o + 1]);
  const u32 = (o: number) => (le ? (tiff[o] | (tiff[o + 1] << 8) | (tiff[o + 2] << 16) | (tiff[o + 3] << 24)) >>> 0
    : ((tiff[o] << 24) | (tiff[o + 1] << 16) | (tiff[o + 2] << 8) | tiff[o + 3]) >>> 0);
  if (u16(2) !== 0x2a) return {};
  const ifd = u32(4);
  if (ifd + 2 > tiff.length) return {};
  const n = u16(ifd);
  const out: { make?: string; model?: string } = {};
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

// Minimalen little-endian TIFF-Block mit NUR Make+Model bauen. Kurze Strings (<=4 Byte inkl. NUL) MÜSSEN
// inline stehen (so liest sie auch readMakeModel) — sonst per Offset in den Datenbereich.
export function buildMinimalExifTiff(make: string, model: string): Uint8Array {
  const enc = (s: string) => { const a = Array.from(s).map((c) => c.charCodeAt(0) & 0xff); a.push(0); return a; };
  const tags: { tag: number; bytes: number[] }[] = [];
  if (make) tags.push({ tag: 0x010f, bytes: enc(make) });
  if (model) tags.push({ tag: 0x0110, bytes: enc(model) });
  const n = tags.length;
  const headerLen = 8;              // "II" + 0x2A + IFD0-Offset(8)
  const ifdLen = 2 + n * 12 + 4;    // count + Einträge + next-IFD(0)
  let dataOff = headerLen + ifdLen;  // Beginn des Datenbereichs
  const dataParts: number[][] = [];
  const b: number[] = [0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00, n & 255, (n >> 8) & 255];
  let curData = dataOff;
  for (const { tag, bytes } of tags) {
    b.push(tag & 255, (tag >> 8) & 255, 0x02, 0x00);                 // tag + type(ASCII)
    const cnt = bytes.length;
    b.push(cnt & 255, (cnt >> 8) & 255, (cnt >> 16) & 255, (cnt >> 24) & 255);
    if (cnt <= 4) { const v = [...bytes]; while (v.length < 4) v.push(0); b.push(v[0], v[1], v[2], v[3]); }
    else { b.push(curData & 255, (curData >> 8) & 255, (curData >> 16) & 255, (curData >> 24) & 255); dataParts.push(bytes); curData += cnt; }
  }
  b.push(0, 0, 0, 0); // keine weitere IFD
  for (const d of dataParts) b.push(...d);
  return new Uint8Array(b);
}

function tiffFromJpeg(buf: Uint8Array): Uint8Array | null {
  if (buf.length < 4 || buf[0] !== 0xff || buf[1] !== 0xd8) return null;
  let o = 2;
  while (o + 4 <= buf.length) {
    if (buf[o] !== 0xff) { o++; continue; }
    const marker = buf[o + 1];
    if (marker === 0xd9 || marker === 0xda) break;
    const len = (buf[o + 2] << 8) | buf[o + 3];
    if (len < 2) break;
    if (marker === 0xe1) {
      const s = o + 4;
      if (s + 6 <= buf.length && buf[s] === 0x45 && buf[s + 1] === 0x78 && buf[s + 2] === 0x69 && buf[s + 3] === 0x66) {
        return buf.subarray(s + 6, o + 2 + len);
      }
    }
    o += 2 + len;
  }
  return null;
}

function tiffFromWebp(buf: Uint8Array): Uint8Array | null {
  if (buf.length < 12) return null;
  const asc = (i: number, n: number) => String.fromCharCode(...Array.from(buf.subarray(i, i + n)));
  if (asc(0, 4) !== 'RIFF' || asc(8, 4) !== 'WEBP') return null;
  let o = 12;
  while (o + 8 <= buf.length) {
    const cc = asc(o, 4);
    const size = (buf[o + 4] | (buf[o + 5] << 8) | (buf[o + 6] << 16) | (buf[o + 7] << 24)) >>> 0;
    const data = o + 8;
    if (cc === 'EXIF') {
      let t = buf.subarray(data, data + size);
      if (t.length >= 6 && t[0] === 0x45 && t[1] === 0x78 && t[2] === 0x69 && t[3] === 0x66) t = t.subarray(6);
      return t;
    }
    o = data + size + (size & 1);
  }
  return null;
}

// --- WebP-Muxer: TIFF als EXIF-Chunk einsetzen (Container ggf. auf Extended/VP8X anheben) --------
function u32le(n: number): Uint8Array { return new Uint8Array([n & 255, (n >> 8) & 255, (n >> 16) & 255, (n >> 24) & 255]); }
function ccBytes(cc: string): number[] { return [cc.charCodeAt(0), cc.charCodeAt(1), cc.charCodeAt(2), cc.charCodeAt(3)]; }
function chunk(cc: string, data: Uint8Array): Uint8Array {
  const pad = data.length & 1;
  const b = new Uint8Array(8 + data.length + pad);
  b.set(ccBytes(cc), 0); b.set(u32le(data.length), 4); b.set(data, 8);
  return b;
}
function parseChunks(bytes: Uint8Array): { cc: string; data: Uint8Array }[] {
  const out: { cc: string; data: Uint8Array }[] = [];
  let o = 12;
  while (o + 8 <= bytes.length) {
    const cc = String.fromCharCode(bytes[o], bytes[o + 1], bytes[o + 2], bytes[o + 3]);
    const size = (bytes[o + 4] | (bytes[o + 5] << 8) | (bytes[o + 6] << 16) | (bytes[o + 7] << 24)) >>> 0;
    out.push({ cc, data: bytes.subarray(o + 8, o + 8 + size) });
    o = o + 8 + size + (size & 1);
  }
  return out;
}
function vp8xPayload(w: number, h: number, flags: number): Uint8Array {
  const b = new Uint8Array(10);
  b[0] = flags;
  const cw = w - 1, ch = h - 1;
  b[4] = cw & 255; b[5] = (cw >> 8) & 255; b[6] = (cw >> 16) & 255;
  b[7] = ch & 255; b[8] = (ch >> 8) & 255; b[9] = (ch >> 16) & 255;
  return b;
}

export function muxExifIntoWebp(webp: Uint8Array, tiff: Uint8Array | null, width: number, height: number): Uint8Array {
  if (!tiff || !tiff.length) return webp;
  const asc = (i: number, n: number) => String.fromCharCode(...Array.from(webp.subarray(i, i + n)));
  if (webp.length < 12 || asc(0, 4) !== 'RIFF' || asc(8, 4) !== 'WEBP') return webp;
  const chunks = parseChunks(webp);
  const vp8x = chunks.find((c) => c.cc === 'VP8X');
  const others = chunks.filter((c) => c.cc !== 'VP8X' && c.cc !== 'EXIF');
  let flags = (vp8x ? vp8x.data[0] : 0) | 0x08; // EXIF-Flag (Bit 3)
  let w = width, h = height;
  if (vp8x && vp8x.data.length >= 10) {
    w = 1 + ((vp8x.data[4]) | (vp8x.data[5] << 8) | (vp8x.data[6] << 16));
    h = 1 + ((vp8x.data[7]) | (vp8x.data[8] << 8) | (vp8x.data[9] << 16));
  }
  const parts = [chunk('VP8X', vp8xPayload(w, h, flags))];
  for (const c of others) parts.push(chunk(c.cc, c.data));
  parts.push(chunk('EXIF', tiff));
  let bodyLen = 0; for (const p of parts) bodyLen += p.length;
  const file = new Uint8Array(12 + bodyLen);
  file.set(ccBytes('RIFF'), 0); file.set(u32le(4 + bodyLen), 4); file.set(ccBytes('WEBP'), 8);
  let off = 12; for (const p of parts) { file.set(p, off); off += p.length; }
  return file;
}

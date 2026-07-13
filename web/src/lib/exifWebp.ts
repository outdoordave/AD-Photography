// EXIF beim Upload erhalten: aus der Originaldatei (JPEG/WebP) die Kamera (Make/Model) ziehen und nach der
// WebP-Konvertierung als „EXIF"-Chunk wieder einmuxen — sonst geht die Kamera-Info bei der Konvertierung
// verloren. Wir speichern NUR einen MINIMALEN EXIF-Block (Make+Model, ~50 Byte) statt der Original-EXIF
// (die mit Maker-Note + Thumbnail schnell 50 KB groß wird und das WebP aufblähen würde).
// Reine Uint8Array-Logik (kein DOM), damit sie auch in Node round-trip-getestet werden kann.

// Roh-Foto-EXIF (Kamera + Fotografen-Werte als Rohdaten). Rationals als [Zähler, Nenner].
export type PhotoTags = {
  make?: string; model?: string;
  exif?: { exposure?: [number, number]; fnum?: [number, number]; iso?: number; taken?: string; focal?: [number, number]; focal35?: number; lensMake?: string; lens?: string };
};

// Bequem-Helfer: aus der Quelldatei einen SCHLANKEN EXIF-Block (Kamera + Foto-Werte, ~150 B, ohne Thumbnail/
// Maker-Note) bauen — zum Wieder-Einmuxen ins WebP. null = keine EXIF/Kamera.
export function slimExifForWebp(srcBytes: Uint8Array): Uint8Array | null {
  const full = extractExifTiff(srcBytes);
  if (!full) return null;
  const info = readTiffPhoto(full);
  if (!info.make && !info.model && (!info.exif || !Object.keys(info.exif).length)) return null;
  return buildExifTiff(info);
}

// --- EXIF-TIFF aus der Quelle extrahieren (JPEG-APP1 oder WebP-EXIF-Chunk) ----------------------
export function extractExifTiff(bytes: Uint8Array): Uint8Array | null {
  return tiffFromJpeg(bytes) || tiffFromWebp(bytes);
}

// Foto-Tags aus einem TIFF-Block lesen: IFD0 (Make/Model + ExifIFD-Zeiger) und die ExifIFD (Belichtung,
// Blende, ISO, Aufnahmedatum, Brennweite, KB-Äquiv., Objektiv). Rationals als [Zähler, Nenner].
export function readTiffPhoto(t: Uint8Array): PhotoTags {
  if (!t || t.length < 8) return {};
  const le = t[0] === 0x49 && t[1] === 0x49;
  if (!le && !(t[0] === 0x4d && t[1] === 0x4d)) return {};
  const u16 = (o: number) => (le ? t[o] | (t[o + 1] << 8) : (t[o] << 8) | t[o + 1]);
  const u32 = (o: number) => (le ? (t[o] | (t[o + 1] << 8) | (t[o + 2] << 16) | (t[o + 3] << 24)) : ((t[o] << 24) | (t[o + 1] << 16) | (t[o + 2] << 8) | t[o + 3])) >>> 0;
  if (u16(2) !== 0x2a) return {};
  const readIFD = (off: number, want: Record<number, string>): Record<string, any> => {
    const res: Record<string, any> = {};
    if (off + 2 > t.length) return res;
    const n = u16(off);
    for (let i = 0; i < n; i++) {
      const e = off + 2 + i * 12;
      if (e + 12 > t.length) break;
      const tag = u16(e); const key = want[tag]; if (!key) continue;
      const type = u16(e + 2); const count = u32(e + 4);
      const elSize = type === 3 ? 2 : type === 4 ? 4 : type === 5 ? 8 : 1;
      const total = elSize * count;
      const vo = total <= 4 ? e + 8 : u32(e + 8);
      if (type === 2) { let s = ''; for (let j = 0; j < count; j++) { const c = t[vo + j]; if (c === 0) break; s += String.fromCharCode(c); } res[key] = s.trim(); }
      else if (vo + elSize > t.length) continue;
      else if (type === 3) res[key] = u16(vo);
      else if (type === 4) res[key] = u32(vo);
      else if (type === 5) res[key] = [u32(vo), u32(vo + 4)];
    }
    return res;
  };
  const ifd0 = readIFD(u32(4), { 0x010f: 'make', 0x0110: 'model', 0x8769: 'exifPtr' });
  const out: PhotoTags = { make: ifd0.make, model: ifd0.model, exif: {} };
  if (ifd0.exifPtr) out.exif = readIFD(ifd0.exifPtr, { 0x829a: 'exposure', 0x829d: 'fnum', 0x8827: 'iso', 0x9003: 'taken', 0x920a: 'focal', 0xa405: 'focal35', 0xa433: 'lensMake', 0xa434: 'lens' });
  return out;
}

// Schlanken little-endian TIFF-Block bauen: IFD0 (Make, Model, ExifIFD-Zeiger) + ExifIFD (Foto-Werte).
// Werte >4 Byte (Rationals, längere Strings) liegen im gemeinsamen Datenbereich; Offsets absolut ab TIFF-Start.
export function buildExifTiff(info: PhotoTags): Uint8Array {
  const le16 = (n: number) => [n & 255, (n >> 8) & 255];
  const le32 = (n: number) => [n & 255, (n >> 8) & 255, (n >> 16) & 255, (n >> 24) & 255];
  const ascii = (s: string) => { const a = Array.from(String(s)).map((c) => c.charCodeAt(0) & 255); a.push(0); return a; };
  const rat = (r: [number, number]) => [...le32(r[0] >>> 0), ...le32(r[1] >>> 0)];
  type Ent = { tag: number; type: number; count: number; val: number[] };
  const mk = (tag: number, type: number, val: number[], count?: number): Ent => ({ tag, type, count: count ?? (type === 2 ? val.length : 1), val });
  const E = info.exif || {};
  const ifd0: Ent[] = [];
  if (info.make) ifd0.push(mk(0x010f, 2, ascii(info.make)));
  if (info.model) ifd0.push(mk(0x0110, 2, ascii(info.model)));
  const ex: Ent[] = [];
  if (E.exposure) ex.push(mk(0x829a, 5, rat(E.exposure)));
  if (E.fnum) ex.push(mk(0x829d, 5, rat(E.fnum)));
  if (E.iso != null) ex.push(mk(0x8827, 3, le16(E.iso)));
  if (E.taken) ex.push(mk(0x9003, 2, ascii(E.taken)));
  if (E.focal) ex.push(mk(0x920a, 5, rat(E.focal)));
  if (E.focal35 != null) ex.push(mk(0xa405, 3, le16(E.focal35)));
  if (E.lensMake) ex.push(mk(0xa433, 2, ascii(E.lensMake)));
  if (E.lens) ex.push(mk(0xa434, 2, ascii(E.lens)));
  const haveExif = ex.length > 0;
  const ifd0Count = ifd0.length + (haveExif ? 1 : 0);
  const ifd0Size = 2 + ifd0Count * 12 + 4;
  const exifOff = 8 + ifd0Size;
  const exifSize = haveExif ? 2 + ex.length * 12 + 4 : 0;
  let dataOff = 8 + ifd0Size + exifSize; // Beginn Datenbereich (gerade, s. Größen)
  const data: number[] = [];
  const emit = (entries: Ent[], withExifPtr: boolean): number[] => {
    const list = entries.slice();
    if (withExifPtr) list.push(mk(0x8769, 4, le32(exifOff)));
    list.sort((a, b) => a.tag - b.tag); // TIFF verlangt aufsteigende Tag-Reihenfolge
    const out = [...le16(list.length)];
    for (const e of list) {
      out.push(...le16(e.tag), ...le16(e.type), ...le32(e.count));
      if (e.val.length <= 4) { const v = [...e.val]; while (v.length < 4) v.push(0); out.push(...v.slice(0, 4)); }
      else { out.push(...le32(dataOff)); data.push(...e.val); dataOff += e.val.length; if (dataOff & 1) { data.push(0); dataOff++; } }
    }
    out.push(...le32(0)); // keine weitere IFD
    return out;
  };
  const ifd0Bytes = emit(ifd0, haveExif);
  const exifBytes = haveExif ? emit(ex, false) : [];
  return new Uint8Array([0x49, 0x49, 0x2a, 0x00, ...le32(8), ...ifd0Bytes, ...exifBytes, ...data]);
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

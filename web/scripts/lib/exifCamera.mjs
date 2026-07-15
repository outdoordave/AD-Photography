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

// --- Fotografen-Werte (Blende/Belichtung/ISO/Brennweite/Objektiv/Aufnahmedatum) -----------------
// Generischer IFD-Leser (IFD0 + ExifIFD). Rationals als [Zähler, Nenner].
function readTiffPhoto(t) {
  if (!t || t.length < 8) return {};
  const le = t[0] === 0x49 && t[1] === 0x49;
  if (!le && !(t[0] === 0x4d && t[1] === 0x4d)) return {};
  const u16 = (o) => (le ? t[o] | (t[o + 1] << 8) : (t[o] << 8) | t[o + 1]);
  const u32 = (o) => (le ? (t[o] | (t[o + 1] << 8) | (t[o + 2] << 16) | (t[o + 3] << 24)) : ((t[o] << 24) | (t[o + 1] << 16) | (t[o + 2] << 8) | t[o + 3])) >>> 0;
  if (u16(2) !== 0x2a) return {};
  const readIFD = (off, want) => {
    const res = {};
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
  const out = { make: ifd0.make, model: ifd0.model, exif: {} };
  if (ifd0.exifPtr) out.exif = readIFD(ifd0.exifPtr, { 0x829a: 'exposure', 0x829d: 'fnum', 0x8827: 'iso', 0x9003: 'taken', 0x920a: 'focal', 0xa405: 'focal35', 0xa433: 'lensMake', 0xa434: 'lens' });
  return out;
}

const num = (r) => (Array.isArray(r) && r[1] ? r[0] / r[1] : null);
// Objektiv-Namen aufbereiten: Hersteller erkennen (aus LensMake ODER dem Modell-Code am Ende, z. B. Tamron
// „A057"/„A063"), den kryptischen Code entfernen und die Marke voranstellen. Fallback = reiner Name.
// „E 150-500mm F5-6.7 A057" -> „Tamron E 150-500mm F5-6.7". Universell NICHT möglich (EXIF trägt den Hersteller
// meist nicht) — daher gepflegte Marken-Tabelle; unbekannte Marken bleiben ohne Präfix.
function lensName(make, model) {
  let m = String(model || '').trim();
  if (!m) return undefined;
  // Handy-Objektive (Apple/Samsung/…): den verbosen Präfix „… back triple/dual camera" wegwerfen, damit egal
  // ist WELCHES Handy / wie viele Kameras — es bleibt die eigentliche Optik übrig (z. B. „6.765mm f/1.78").
  m = m.replace(/^.*\bback\s+(?:dual|triple|wide|tele|ultra\s*-?\s*wide)?\s*camera\s*/i, '').trim() || m;
  let brand = String(make || '').trim();
  const code = (m.match(/\b([A-Z]\d{3}[A-Z]?)\s*$/) || [])[1] || '';
  if (!brand) {
    if (/tamron/i.test(m) || /^[AF]\d{3}$/.test(code)) brand = 'Tamron';
    else if (/sigma/i.test(m) || /\|\s*(Art|Contemporary|Sports)\b/i.test(m)) brand = 'Sigma';
    else if (/samyang|rokinon/i.test(m)) brand = 'Samyang';
    else if (/viltrox/i.test(m)) brand = 'Viltrox';
    else if (/zeiss/i.test(m)) brand = 'Zeiss';
  }
  if (brand) brand = brand.charAt(0).toUpperCase() + brand.slice(1).toLowerCase(); // „SONY" -> „Sony"
  m = m.replace(/\s+[A-Z]\d{3,}[A-Z]?$/, '').replace(/\s{2,}/g, ' ').trim(); // Modell-Code weg
  // Marke voranstellen — außer bei Apple (iPhone-Name sagt die Marke schon) oder wenn schon enthalten.
  if (brand && brand.toLowerCase() !== 'apple' && !new RegExp('^' + brand, 'i').test(m)) m = brand + ' ' + m;
  return m;
}
function fmtExif(ex) {
  const out = {};
  const f = num(ex.fnum); if (f) out.aperture = 'f/' + (Math.round(f * 10) / 10).toString().replace(/\.0$/, '');
  const s = num(ex.exposure); if (s) out.shutter = s >= 1 ? (Math.round(s * 10) / 10) + ' s' : '1/' + Math.round(1 / s) + ' s';
  if (ex.iso != null) out.iso = 'ISO ' + ex.iso;
  // Brennweite: bei kleinem Sensor (Handy/Drohne) ist die reale Brennweite (z. B. 7 mm) irreführend — dann das
  // Kleinbild-Äquivalent zeigen (das gewohnte, vergleichbare Maß). Bei Systemkameras real == Äquiv -> reale.
  // Nur bei echtem Kleinsensor (Cropfaktor > 2.5×, also Handy/Drohne) das KB-Äquivalent zeigen; Systemkameras
  // (auch APS-C ~1.5×) behalten die reale Brennweite (z. B. Sony 28 mm statt 42 mm).
  const fl = num(ex.focal);
  if (fl) { const eq = ex.focal35; out.focal = (eq && eq >= Math.round(fl) * 2.5) ? `${eq} mm` : `${Math.round(fl)} mm`; }
  if (ex.lens) {
    let ln = lensName(ex.lensMake, ex.lens);
    // Handy-„Objektiv" ist nach dem Aufräumen nur noch „Nmm f/x" (fest verbaut, kein Objektivname) — das ist
    // wenig aussagekräftig und wiederholt die Blende. Stattdessen den Brennweiten-Typ (aus dem KB-Äquivalent).
    if (/^[\d.]+\s*mm\s+f\/[\d.]+$/i.test(ln || '')) {
      const eq = ex.focal35 || (num(ex.focal) ? Math.round(num(ex.focal)) : 0);
      ln = !eq ? ln : eq < 18 ? 'Ultraweitwinkel' : eq < 35 ? 'Weitwinkel' : eq < 70 ? 'Standard' : eq < 135 ? 'Teleobjektiv' : 'Supertele';
    }
    out.lens = ln;
  }
  if (ex.taken && /^\d{4}:\d{2}:\d{2}/.test(ex.taken)) { const [d] = ex.taken.split(' '); const [y, mo, da] = d.split(':'); out.taken = `${da}.${mo}.${y}`; }
  return out;
}

// Öffentlich: Kamera + formatierte Fotografen-Werte. { camera?, exif?: {aperture,shutter,iso,focal,lens,taken} }.
export function readPhotoInfo(buf) {
  const tiff = tiffFromJpeg(buf) || tiffFromWebp(buf);
  if (!tiff) return {};
  const info = readTiffPhoto(tiff);
  const res = {};
  const cam = cameraName(info.make, info.model); if (cam) res.camera = cam;
  const ex = fmtExif(info.exif || {}); if (Object.keys(ex).length) res.exif = ex;
  return res;
}

export { tiffFromJpeg, tiffFromWebp, readMakeModel };

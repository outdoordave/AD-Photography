// Tina Cloud schreibt gespeicherte /uploads-Pfade für die Anzeige auf seine
// Media-CDN-URL um (https://assets.tina.io/<projectId>/<datei>). Unsere Bilder
// liegen aber repo-basiert in /uploads. Für die Thumbnail-VORSCHAU der Foto-Felder
// die URL wieder auf /uploads/<datei> zurückbiegen — sonst 404 („?").
// NUR für die Anzeige; der gespeicherte Wert (input.value) bleibt unberührt.

// Doppelten /uploads/-Präfix einklappen: manche Tina-Media-Pfade kommen als
// „/uploads/uploads/<datei>" an (u. a. wenn die assets.tina.io-Umschreibung den
// mediaRoot schon enthält) -> der Pfad existiert nicht -> „?". Hier auf
// /uploads/<datei> reduzieren (einfache UND mehrfache Wiederholung).
export function dedupeUploads(p: string): string {
  return p ? p.replace(/\/uploads(?:\/uploads)+\//g, '/uploads/') : p;
}

export function toLocalMedia(p: string): string {
  if (!p) return '';
  const m = p.match(/^https?:\/\/assets\.tina\.io\/[^/]+\/(.+)$/i);
  const out = m ? '/uploads/' + m[1] : p;
  return dedupeUploads(out);
}

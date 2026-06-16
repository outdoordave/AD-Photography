// Tina Cloud schreibt gespeicherte /uploads-Pfade für die Anzeige auf seine
// Media-CDN-URL um (https://assets.tina.io/<projectId>/<datei>). Unsere Bilder
// liegen aber repo-basiert in /uploads. Für die Thumbnail-VORSCHAU der Foto-Felder
// die URL wieder auf /uploads/<datei> zurückbiegen — sonst 404 („?").
// NUR für die Anzeige; der gespeicherte Wert (input.value) bleibt unberührt.
export function toLocalMedia(p: string): string {
  if (!p) return '';
  const m = p.match(/^https?:\/\/assets\.tina\.io\/[^/]+\/(.+)$/i);
  if (m) return '/uploads/' + m[1];
  return p;
}

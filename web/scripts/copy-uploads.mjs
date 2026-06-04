// Kopiert die Bilder aus dem Repo-Wurzel-Ordner /uploads nach web/public/uploads,
// damit sie im Astro-Build (web/dist) landen und auf Cloudflare Pages ausgeliefert
// werden. Hintergrund: Die Astro-Seite wird aus web/ gebaut; /uploads liegt aber in
// der Repo-Wurzel. Lokal existiert public/uploads als Symlink (gitignored) -> dann
// NICHTS tun (der Symlink liefert die Bilder bereits aus). Auf Cloudflare gibt es den
// Symlink nicht -> dort wird real kopiert.
import { existsSync, lstatSync, cpSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const dest = resolve('public', 'uploads');
const src = resolve('..', 'uploads');

if (existsSync(dest) && lstatSync(dest).isSymbolicLink()) {
  console.log('[uploads] public/uploads ist ein Symlink (lokale Vorschau) -> kein Kopieren noetig.');
  process.exit(0);
}
if (!existsSync(src)) {
  console.warn('[uploads] Quelle nicht gefunden:', src, '-> uebersprungen (keine Bilder kopiert).');
  process.exit(0);
}
mkdirSync(dest, { recursive: true });
cpSync(src, dest, { recursive: true });
console.log('[uploads] Bilder kopiert:', src, '->', dest);

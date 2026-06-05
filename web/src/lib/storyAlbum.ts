import { client } from '../../tina/__generated__/client';

// Verknuepftes Album einer Story aufloesen -> { name, photos, href } fuer den
// Album-Lightbox-Block. Die Tina-`reference` kann je nach Codegen ein Pfad-String,
// ein {id}/{_sys}-Objekt oder ein bereits expandiertes Album-Objekt sein -> daraus
// robust den Album-Slug ermitteln und die Fotos sicher per alben-Query nachladen
// (kein Doppel-Upload: die Bilder kommen aus dem Album selbst).

export type AlbumInfo = { name: string; photos: string[]; href: string } | null;

function albumSlugFrom(la: any): string {
  if (!la) return '';
  if (typeof la === 'string') return (la.split('/').pop() || '').replace(/\.(json|md)$/i, '');
  if (la._sys && la._sys.filename) return String(la._sys.filename);
  if (la._sys && la._sys.relativePath) return (String(la._sys.relativePath).split('/').pop() || '').replace(/\.(json|md)$/i, '');
  if (la.id) return (String(la.id).split('/').pop() || '').replace(/\.(json|md)$/i, '');
  return '';
}

export async function resolveLinkedAlbum(linkedAlbum: any, lang: 'de' | 'en'): Promise<AlbumInfo> {
  const slug = albumSlugFrom(linkedAlbum);
  if (!slug) return null;
  try {
    const res = await client.queries.alben({ relativePath: `${slug}.json` });
    const a = res.data.alben as any;
    const photos = (Array.isArray(a.photos) ? a.photos : []).filter(Boolean);
    if (!photos.length) return null;
    const name = lang === 'en' ? a.name_en || a.name || 'Album' : a.name || 'Album';
    const href = (lang === 'en' ? '/en/portfolio/' : '/portfolio/') + slug;
    return { name, photos, href };
  } catch {
    return null;
  }
}

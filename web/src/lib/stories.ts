// ============================================================================
// Story-Render-Helfer — 1:1-Port aus der Live-`index.html` (Capability-Lock:
// identische Ausgabe). Reine Funktionen, kein Astro/React-Bezug.
// Quelle: mdToHtml (2434), buildStory (2513), wwYouTubeId/Embed (3488),
// normalizePath (1574), formatMonthYear (2492), dateSortKey (2506).
// ============================================================================

export interface StoryData {
  title_de?: string;
  category_de?: string;
  date?: string;
  cover?: string;
  excerpt_de?: string;
  body_de?: string;
  has_english?: boolean;
  title_en?: string;
  category_en?: string;
  excerpt_en?: string;
  body_en?: string;
  youtube_url?: string;
}

export interface LangView {
  cat: string;
  title: string;
  excerpt: string;
  bodyHtml: string;
  dateLabel: string;
}

export interface StoryView {
  photo: string;
  youtube: string;
  date: string;
  dateKey: number;
  de: LangView;
  en: LangView;
}

export interface StoryViewWithSlug extends StoryView {
  slug: string;
}

// --- Pfad normalisieren (CMS-Bilder liegen unter /uploads/) ---
export function normalizePath(p: string): string {
  if (!p) return '';
  // Tina Cloud schreibt bei image-Feldern den gespeicherten /uploads-Pfad auf seine
  // Media-CDN-URL um (https://assets.tina.io/<projectId>/<datei>). Unsere Bilder liegen
  // aber repo-basiert in /uploads -> diese URLs wieder auf /uploads/<datei> zurueckbiegen.
  const tina = p.match(/^https?:\/\/assets\.tina\.io\/[^/]+\/(.+)$/i);
  if (tina) return '/uploads/' + tina[1];
  if (/^(https?:|data:)/i.test(p)) return p;
  if (p.charAt(0) !== '/') return '/' + p;
  return p;
}

// --- YouTube ---
export function wwYouTubeId(url: string): string {
  if (!url) return '';
  const m = String(url).match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
  );
  return m ? m[1] : '';
}

export function wwYouTubeEmbed(url: string): string {
  const id = wwYouTubeId(url);
  if (!id) return '';
  return (
    '<div class="yt-embed"><iframe src="https://www.youtube-nocookie.com/embed/' +
    id +
    '" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>'
  );
}

// --- Mini-Markdown -> HTML (identisch zu mdToHtml in index.html) ---
export function mdToHtml(md: string): string {
  if (!md) return '';
  function inline(t: string): string {
    t = t.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, function (_m: string, alt: string, url: string) {
      const fixedUrl = /^(https?:|data:)/i.test(url) || url.charAt(0) === '/' ? url : '/' + url;
      return '<img src="' + fixedUrl + '" alt="' + alt + '" loading="lazy">';
    });
    t = t.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    t = t.replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>');
    t = t.replace(/~~([^~]+)~~/g, '<s>$1</s>');
    return t;
  }
  const blocks = md.split(/\n\s*\n/);
  let html = '';
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i].trim();
    if (!b) continue;
    const lines = b.split('\n');
    if (b.indexOf('> ') === 0 || b.indexOf('>') === 0) {
      html += '<div class="pullquote">' + inline(b.replace(/^>\s?/gm, '').trim()) + '</div>';
    } else if (b.indexOf('### ') === 0) {
      html += '<h3>' + inline(b.substring(4).trim()) + '</h3>';
    } else if (b.indexOf('## ') === 0) {
      html += '<h2>' + inline(b.substring(3).trim()) + '</h2>';
    } else if (b.indexOf('# ') === 0) {
      html += '<h2>' + inline(b.substring(2).trim()) + '</h2>';
    } else if (/^[-*]\s/.test(lines[0])) {
      html += '<ul>';
      for (let u = 0; u < lines.length; u++) {
        const li = lines[u].replace(/^[-*]\s+/, '').trim();
        if (li) html += '<li>' + inline(li) + '</li>';
      }
      html += '</ul>';
    } else if (/^\d+\.\s/.test(lines[0])) {
      html += '<ol>';
      for (let o = 0; o < lines.length; o++) {
        const ol = lines[o].replace(/^\d+\.\s+/, '').trim();
        if (ol) html += '<li>' + inline(ol) + '</li>';
      }
      html += '</ol>';
    } else if (/^<(p|div|ul|ol|h[1-6]|img|figure|blockquote|section)\b/i.test(b)) {
      html += b;
    } else {
      html += '<p>' + inline(b).replace(/\n/g, '<br>') + '</p>';
    }
  }
  return html;
}

// --- Datum ---
const monthsDE = ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];
const monthsEN = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export function formatMonthYear(dateStr: string, lang: 'de' | 'en'): string {
  if (!dateStr) return '';
  const m = String(dateStr).match(/^(\d{4})-(\d{2})/);
  if (!m) return dateStr;
  const year = m[1];
  const monthIdx = parseInt(m[2], 10) - 1;
  if (monthIdx < 0 || monthIdx > 11) return year;
  const names = lang === 'en' ? monthsEN : monthsDE;
  return names[monthIdx] + ' ' + year;
}

export function dateSortKey(dateStr: string): number {
  if (!dateStr) return 0;
  const m = String(dateStr).match(/^(\d{4})-(\d{2})(?:-(\d{2}))?/);
  if (!m) return 0;
  return parseInt(m[1], 10) * 10000 + parseInt(m[2], 10) * 100 + (m[3] ? parseInt(m[3], 10) : 1);
}

function pickHasEN(d: StoryData): boolean {
  return d.has_english === true;
}

// --- buildStory: Frontmatter -> Anzeige-Objekt (de/en), identisch zu index.html.
// (Ohne bodyFallback: Option A speichert den Text in body_de/body_en.) ---
export function buildStory(data: StoryData): StoryView {
  const coverPhoto = data.cover || '';
  const hasEN = pickHasEN(data);
  const textDe = data.body_de && data.body_de.trim() ? data.body_de : '';
  const enBody = data.body_en || '';
  const textEn = enBody && enBody.trim() ? enBody : '';
  return {
    photo: coverPhoto,
    youtube: data.youtube_url || '',
    date: data.date || '',
    dateKey: dateSortKey(data.date || ''),
    de: {
      cat: data.category_de || '',
      title: data.title_de || '',
      excerpt: data.excerpt_de || '',
      bodyHtml: mdToHtml(textDe),
      dateLabel: formatMonthYear(data.date || '', 'de'),
    },
    en: {
      cat: hasEN ? data.category_en || data.category_de || '' : data.category_de || '',
      title: hasEN ? data.title_en || data.title_de || '' : data.title_de || '',
      excerpt: hasEN ? data.excerpt_en || data.excerpt_de || '' : data.excerpt_de || '',
      bodyHtml: mdToHtml(hasEN ? textEn || textDe : textDe),
      dateLabel: formatMonthYear(data.date || '', 'en'),
    },
  };
}

// --- Liste laden + sortieren (neueste zuerst, wie build-indexes.js) ---
export function toSortedStories(raw: Array<{ slug: string; data: StoryData }>): StoryViewWithSlug[] {
  const built: StoryViewWithSlug[] = raw.map((r) => ({ ...buildStory(r.data), slug: r.slug }));
  built.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  return built;
}

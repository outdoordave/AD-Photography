import { defineConfig } from 'tinacms';
import BulkPhotoField from './fields/BulkPhotoField';
import SinglePhotoField from './fields/SinglePhotoField';
import { EnglishOnlyField, EnglishOnlyTextField, EnglishRichTextField, EnglishStoryField, EnglishStoryTextField, EnglishStoryRichTextField } from './fields/EnglishOnlyField';
import CropPhotoField from './fields/CropPhotoField';
import PhotoUploadField from './fields/PhotoUploadField';
import ImageFrameField from './fields/ImageFrameField';
import GearStyleField from './fields/GearStyleField';
import JournalStyleField from './fields/JournalStyleField';
import GearCategoryField from './fields/GearCategoryField';
import TripDesignsEditor from './fields/TripDesignsEditor';
import SectionBanner from './fields/SectionBanner';
import SprachBannerPreview from './fields/SprachBannerPreview';
import ReiseTitelPreview from './fields/ReiseTitelPreview';
import EnglishToggle from './fields/EnglishToggle';
import LocationSearchField from './fields/LocationSearchField';
import { backToSiteScreen } from './screens/BackToSiteScreen';
import { logoutScreen } from './screens/LogoutScreen';

// Harte 35-Zeichen-Grenze für Titel (Reise + Story). UI-only (ui.validate) -> KEIN Cloud-Re-Index,
// nur tina-lock.json neu + Deploy. Hinweis: bei den EN-Titelfeldern (eigene Komponente OHNE
// wrapFieldsWithMeta) wird der Fehlertext NICHT sichtbar gerendert; der DE-Titel (kanonisch) zeigt ihn,
// EN ist still mit-validiert. Pro Titel zusätzlich ein „max. 35 Zeichen"-Hinweis in der description.
const TITLE_MAX = 35;
const validateTitleMax = (value?: string) =>
  (typeof value === 'string' && value.length > TITLE_MAX ? `Maximal ${TITLE_MAX} Zeichen (aktuell ${value.length}).` : undefined);

// Tina-Cloud-Anbindung:
//   clientId + branch sind OEFFENTLICH (clientId steht ohnehin im Browser-Bundle).
//   Daher fest verdrahtet als Fallback -> der Build haengt fuer diese beiden NICHT
//   mehr an Umgebungsvariablen. Hintergrund: Auf Cloudflare laeuft `tinacms build`
//   als pkg-Binary, die die Custom-Env-Variablen beim Config-Laden nicht zuverlaessig
//   sieht; ausserdem filtert Tina beim Bundeln process.env auf TINA_PUBLIC_/NEXT_PUBLIC_.
//   Der TOKEN bleibt GEHEIM und kommt ausschliesslich aus der Umgebung (TINA_TOKEN) —
//   niemals im Repo. Ist TINA_TOKEN leer (z. B. am Mac ohne .env), laeuft Tina im
//   LOKALEN Modus (liest/schreibt direkt die Markdown-Dateien in src/content/stories).
const clientId = process.env.TINA_CLIENT_ID || 'defa5b44-687f-478c-a647-bad7355aedd3';
const token = process.env.TINA_TOKEN || '';
const branch = process.env.TINA_BRANCH || 'astro-umbau';

// Zentrale Reise-Design-Werte (Tuning) je Design. EINE Quelle mit lib/tripDesigns.ts (dort die
// Defaults + CSS-Erzeugung). Schritt 1: schlichte Zahlenfelder. Schritt 3 ersetzt die Anzeige durch
// den Regler-Editor (ui.component) — gleiche Datenfelder, daher KEIN weiterer Re-Index.
const designTuningField = (name: string, label: string) => ({
  type: 'object' as const, name, label,
  fields: [
    { type: 'number' as const, name: 'dimOp', label: 'Dimmung inaktiver Stationen (0–0.9)', description: '0 = unsichtbar, 1 = voll. Standard 0.30, luftig 0.15.' },
    { type: 'number' as const, name: 'gap', label: 'Luft zwischen Stationen (px)', description: 'Standard 14, luftig 50.' },
    { type: 'number' as const, name: 'titlePx', label: 'Titelgröße aktive Station (px)', description: 'Standard 30, luftig 26.' },
    { type: 'number' as const, name: 'scale', label: 'Inaktiv-Größe (0.70–1.00)', description: '1 = keine Verkleinerung. Standard 0.975, luftig 0.80.' },
    { type: 'number' as const, name: 'photoShadow', label: 'Foto-Schatten-Stärke (0–100)', description: '0 = keiner. luftig 40 (Foto schwebt).' },
  ],
});

export default defineConfig({
  branch,
  clientId,
  token,
  // TEIL 3A(b): globaler „Zur Website"-Menüpunkt in der CMS-Seitenleiste (Kategorie „Site").
  cmsCallback: (cms: any) => {
    try { cms.plugins.add(backToSiteScreen); } catch (e) { /* ignore */ }
    try { cms.plugins.add(logoutScreen); } catch (e) { /* ignore */ }
    // CSS-Korrektur: Tina setzt auf dem Formular-Feld-Container `white-space: nowrap`
    // (Tailwind-Klasse `whitespace-nowrap`). Folge: KEIN Feld-Label/keine Beschreibung
    // bricht um -> das Formular kann nicht schmaler werden als seine laengste Zeile und
    // wird bei schmalem Bearbeiten-Panel (z. B. neben der Live-Vorschau) rechts in den
    // nicht sichtbaren Bereich abgeschnitten. Hier nur diesen Container (Klassen-Kombi,
    // spezifischer als die Utility) auf `normal` -> alles umbrechbar, Formular passt sich an.
    // Nur der Container -> Nachfahren mit eigenem white-space (z. B. Code) bleiben unberuehrt.
    if (typeof document !== 'undefined' && !(document as any).__wwCssHook) {
      (document as any).__wwCssHook = true;
      try {
        const st = document.createElement('style');
        st.setAttribute('data-ww', 'cms-css');
        st.textContent =
          '.whitespace-nowrap.overflow-x-visible{white-space:normal;}' +
          // Die Datei-Listen der Mehrfach-Bereiche (Journal, Alben, Stories, Reisen) aus der
          // Seitenleiste ausblenden — mit den einzelnen .md/.json-Dateien arbeitet David nicht.
          // Gepflegt wird stattdessen über die LIVE-Übersichtsseiten (der jeweilige „…"-Bereich
          // routet dorthin) + die Karten-Knöpfe (Neu/Bearbeiten/Archiv/Löschen). Rein kosmetisch
          // (kein Re-Index): jeder Sidebar-Eintrag ist ein <li ohne data-slot> mit einem Link auf
          // /collections/<name>/~. Breadcrumb-<li> tragen data-slot -> per :not([data-slot])
          // ausgenommen, damit die Brotkrumen-Navigation unberührt bleibt.
          'li:not([data-slot]):has(> a[href$="/collections/journal/~"]),' +
          'li:not([data-slot]):has(> a[href$="/collections/alben/~"]),' +
          'li:not([data-slot]):has(> a[href$="/collections/story/~"]),' +
          'li:not([data-slot]):has(> a[href$="/collections/reisen/~"]){display:none!important;}';
        (document.head || document.documentElement).appendChild(st);
      } catch (e) { /* ignore */ }
    }
    // Auch Tinas EINGEBAUTEN Logout sauber zur Startseite führen (statt auf dem /admin-Login-
    // Screen festzuhängen). Zwei abgesicherte Wege:
    try {
      const goHome = () => { try { (window.top || window).location.assign('/'); } catch (e) { window.location.assign('/'); } };
      const clearTokens = () => {
        try { for (let i = localStorage.length - 1; i >= 0; i--) { const k = localStorage.key(i); if (k && /tina/i.test(k)) localStorage.removeItem(k); } } catch (e) { /* ignore */ }
        try { for (let i = sessionStorage.length - 1; i >= 0; i--) { const k = sessionStorage.key(i); if (k && /tina/i.test(k)) sessionStorage.removeItem(k); } } catch (e) { /* ignore */ }
      };

      // (a) Interne authProvider.logout-Methode patchen (falls in dieser Version vorhanden).
      const patch = (obj: any) => {
        if (obj && typeof obj.logout === 'function' && !obj.__wwPatched) {
          const orig = obj.logout.bind(obj);
          obj.logout = async function () { try { return await orig.apply(this, arguments); } finally { goHome(); } };
          obj.__wwPatched = true; return true;
        }
        return false;
      };
      const tryPatch = () => { let ok = false; try { ok = patch(cms?.api?.tina?.authProvider) || ok; } catch (e) {} try { ok = patch(cms?.api?.tina) || ok; } catch (e) {} return ok; };
      if (!tryPatch() && typeof setTimeout !== 'undefined') { setTimeout(tryPatch, 1500); setTimeout(tryPatch, 4000); }

      // (b) Robuster Fallback: Klick auf Tinas „Log out"-Schaltfläche im /admin-Dokument
      //     abfangen (Text-Erkennung) -> Tina seinen Logout machen lassen, dann hart heim.
      if (typeof document !== 'undefined' && !(document as any).__wwLogoutHook) {
        (document as any).__wwLogoutHook = true;
        document.addEventListener('click', (e: any) => {
          const start = e.target as HTMLElement;
          const el = start && start.closest ? start.closest('button, a, [role="button"]') : null;
          if (!el) return;
          const txt = (el.textContent || '').trim().toLowerCase();
          if (txt === 'log out' || txt === 'logout' || txt === 'sign out' || txt === 'abmelden') {
            clearTokens();
            setTimeout(goHome, 150); // kurz warten, damit Tinas eigener Logout noch durchläuft
          }
        }, true);
      }

      // CMS-Editor-Beschriftungen eindeutschen. Tina hat KEINE i18n-Option und die Labels stecken
      // im gebuendelten Editor -> wir schreiben die wenigen englischen TEXTE per MutationObserver
      // auf Deutsch um (gleiche DOM-Ebene wie der Logout-Patch oben). Nur exakte Treffer aus der Map
      // -> alles Unbekannte bleibt unveraendert (graceful). Heilt sich nach React-Re-Renders selbst,
      // weil der Observer neue/geaenderte Knoten erneut prueft. Die Ueberschrift-Labels bekommen
      // gleich einen Groessen-Hinweis (Word-artige „Vorschau" in Worten, da Tina keine Hover-Vorschau hat).
      if (typeof document !== 'undefined' && !(document as any).__wwI18nHook) {
        (document as any).__wwI18nHook = true;
        const MAP: Record<string, string> = {
          'Paragraph': 'Absatz',
          'Heading 1': 'Überschrift 1 (sehr groß)',
          'Heading 2': 'Überschrift 2 (groß)',
          'Heading 3': 'Überschrift 3 (mittel)',
          'Heading 4': 'Überschrift 4 (klein)',
          'Heading 5': 'Überschrift 5',
          'Heading 6': 'Überschrift 6',
          'Embed': 'Einfügen',
          // Tooltip-Texte der Symbol-Knöpfe (erscheinen beim Drüberschweben als Radix-Portal):
          'Bold': 'Fett',
          'Italic': 'Kursiv',
          'Strikethrough': 'Durchgestrichen',
          'Underline': 'Unterstrichen',
          'Quote': 'Zitat',
          'Blockquote': 'Zitat',
          'Bulleted List': 'Aufzählung',
          'Numbered List': 'Nummerierte Liste',
          'Ordered List': 'Nummerierte Liste',
          'Image': 'Bild',
          'Code': 'Code',
          'Table': 'Tabelle',
          'Heading': 'Überschrift',
          // Die Symbol-Knöpfe der Rich-Text-Leiste tragen ihre Tooltips als SVG-<title> in
          // KLEINSCHREIBUNG (Material-Symbol-Namen, z. B. „format bold"). Diese Texte liefen
          // bisher durch die obige Map NICHT (dort stand „Bold") -> hier die echten Strings.
          'format size': 'Textgröße',
          'format bold': 'Fett',
          'format italic': 'Kursiv',
          'format underlined': 'Unterstrichen',
          'format underline': 'Unterstrichen',
          'format strikethrough': 'Durchgestrichen',
          'strikethrough s': 'Durchgestrichen',
          'insert link': 'Link einfügen',
          'link off': 'Link entfernen',
          'format quote': 'Zitat',
          'format list bulleted': 'Aufzählung',
          'format list numbered': 'Nummerierte Liste',
          'format align left': 'Linksbündig',
          'image': 'Bild',
          'insert photo': 'Bild',
          'code blocks': 'Code-Block',
          // Formular-/Editor-Rahmen (Knöpfe + Auswahl-Platzhalter):
          'Save': 'Speichern',
          'Reset': 'Zurücksetzen',
          'Choose an option...': 'Bitte wählen …',
          'Log Out': 'Abmelden',
          'Media Manager': 'Medien',
          'Collections': 'Bereiche',
          'published': 'veröffentlicht',
        };
        const fixText = (node: any) => {
          const v = node.nodeValue; if (typeof v !== 'string') return;
          const t = v.trim(); const de = MAP[t];
          if (de && v !== de) node.nodeValue = v.replace(t, de);
        };
        // Die schwebenden Tooltips der Symbol-Knoepfe (Radix-Popover) tragen den ENGLISCHEN Begriff
        // PLUS Tastenkuerzel, z. B. „Bold (⌘+B)", „Quote (⌘+⇧+.)", „Headings". Exakt-Treffer scheitern
        // (Kuerzel variiert, am PC „Ctrl"). Loesung: den fuehrenden Begriff uebersetzen, den Kuerzel-Rest
        // behalten — und das NUR innerhalb von Tooltip-/Popover-Containern, damit der eigentliche
        // Editor-Text (der „Bold" enthalten koennte) unangetastet bleibt.
        const TIP: Record<string, string> = {
          'Headings': 'Überschriften', 'Heading': 'Überschrift',
          'Bulleted List': 'Aufzählung', 'Numbered List': 'Nummerierte Liste', 'Ordered List': 'Nummerierte Liste',
          'Bold': 'Fett', 'Italic': 'Kursiv', 'Underline': 'Unterstrichen', 'Strikethrough': 'Durchgestrichen',
          'Quote': 'Zitat', 'Link': 'Link einfügen', 'Image': 'Bild', 'Code': 'Code', 'Table': 'Tabelle', 'Embed': 'Einfügen',
        };
        const TIP_KEYS = Object.keys(TIP).sort((a, b) => b.length - a.length); // laengste zuerst (Headings vor Heading)
        const TIP_SEL = '[role="tooltip"], [data-radix-popper-content-wrapper]';
        const fixTip = (node: any) => {
          const v = node.nodeValue; if (typeof v !== 'string') return;
          const t = v.trim(); if (!t) return;
          for (const k of TIP_KEYS) {
            if (t === k || t.indexOf(k + ' (') === 0) { // „Bold" oder „Bold (⌘+B)"
              const de = TIP[k]; const rest = t.slice(k.length); // z. B. " (⌘+B)"
              if (!t.startsWith(de)) node.nodeValue = v.replace(t, de + rest);
              return;
            }
          }
        };
        const inTip = (node: any) => { const p = node && node.parentElement; return !!(p && p.closest && p.closest(TIP_SEL)); };
        const relabelTips = (root: any) => {
          try {
            if (!root || root.nodeType !== 1) return;
            const scopes: Element[] = [];
            if (root.matches && root.matches(TIP_SEL)) scopes.push(root);
            if (root.querySelectorAll) root.querySelectorAll(TIP_SEL).forEach((s: Element) => scopes.push(s));
            scopes.forEach((s) => { const w = document.createTreeWalker(s, NodeFilter.SHOW_TEXT); let x: any; while ((x = w.nextNode())) fixTip(x); });
          } catch (e) { /* egal */ }
        };
        const relabel = (root: Node) => {
          try {
            if (root.nodeType === 3) { fixText(root); return; }
            if (root.nodeType !== 1) return;
            const it = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
            let n: any; while ((n = it.nextNode())) fixText(n);
          } catch (e) { /* egal */ }
        };
        const obs = new MutationObserver((muts) => {
          for (const m of muts) {
            if (m.type === 'characterData') { fixText(m.target); if (inTip(m.target)) fixTip(m.target); }
            else m.addedNodes.forEach((nd) => { relabel(nd); relabelTips(nd); });
          }
        });
        const startI18n = () => {
          if (!document.body) { setTimeout(startI18n, 200); return; }
          relabel(document.body); relabelTips(document.body);
          obs.observe(document.body, { childList: true, subtree: true, characterData: true });
        };
        startI18n();
      }
    } catch (e) { /* ignore */ }

    // Sidebar-Ladekreis bei Navigation — eigenes Overlay über der Sidebar mit animierter
    // Kamera-Blende (Iris, 8 Lamellen), STATT der kurz aufblitzenden Dokument-Liste.
    // Hintergrund: Tina zeigt die Formular-Liste (`FormLists`, index.js:47275), wenn mehrere
    // Formulare registriert sind und noch kein aktives passt — die Lücke beim Seitenwechsel.
    // Tinas eingebauter Lade-Platzhalter wird bei Navigation nicht ausgelöst (in @tinacms/app
    // auskommentiert) und hat zudem ~1 s Mindestanzeige. Daher ein EIGENES Overlay, das wir
    // exakt timen: einblenden bei `url-changed` (senden die Vorschau-Inseln beim Wechsel),
    // ausblenden ~180 ms nach der Ruhephase (Debounce) → Dauer ≈ echte Ladezeit; danach steht
    // die neue Seite + der aktive Form (selectFormByFormId) fest und das Formular erscheint.
    // Hartes 3-s-Cap als Fangnetz. Overlay deckt NUR die Sidebar (links der Vorschau-iframe,
    // Breite aus deren linker Kante). Die Iris ist aus Geometrie berechnet (keine Fremddatei).
    // Editor-only; greift nie auf der Live-Seite; bricht bei Tina-Update nicht hart (try/catch).
    try {
      if (typeof window !== 'undefined' && typeof document !== 'undefined' && !(window as any).__wwIrisLoader) {
        (window as any).__wwIrisLoader = true;
        const cxx = 60, cyy = 60, RR = 35, NN = 8, DARK = '#3b3024', RINGC = '#cdbfa6', PANEL = '#f6f4ef';
        const sec = (2 * Math.PI) / NN, phi = 0.5, sw = sec * 0.45;
        const pol = (r: number, a: number): [number, number] => [cxx + r * Math.cos(a), cyy + r * Math.sin(a)];
        const blades = (ri: number) => {
          const rp = ri / Math.cos(sec / 2); let s = '';
          for (let k = 0; k < NN; k++) {
            const A = pol(RR, phi + (k - 0.6) * sec), B = pol(RR, phi + (k + 0.6) * sec);
            const Vb = pol(rp, phi + (k + 0.5) * sec + sw), Va = pol(rp, phi + (k - 0.5) * sec + sw);
            s += '<path d="M' + A[0].toFixed(1) + ' ' + A[1].toFixed(1) + ' A35 35 0 0 1 ' + B[0].toFixed(1) + ' ' + B[1].toFixed(1)
              + ' L' + Vb[0].toFixed(1) + ' ' + Vb[1].toFixed(1) + ' L' + Va[0].toFixed(1) + ' ' + Va[1].toFixed(1)
              + ' Z" fill="' + DARK + '" stroke="' + PANEL + '" stroke-width="2" stroke-linejoin="round"/>';
          }
          return s;
        };
        let ov: any = null, bg: any = null, raf: any = null, settle: any = null, cap: any = null, shown = false, t0 = 0;
        const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
        const ensure = () => {
          if (ov) return;
          ov = document.createElement('div');
          ov.setAttribute('data-ww', 'iris-loader');
          ov.style.cssText = 'position:fixed;top:0;left:0;height:100vh;width:360px;z-index:2147483000;display:none;align-items:center;justify-content:center;background:' + PANEL + ';';
          ov.innerHTML = '<svg width="84" height="84" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">'
            + '<defs><clipPath id="wwIrisClip"><circle cx="60" cy="60" r="35"/></clipPath></defs>'
            + '<circle cx="60" cy="60" r="37.5" fill="none" stroke="' + RINGC + '" stroke-width="3"/>'
            + '<g clip-path="url(#wwIrisClip)" data-ww="blades"></g></svg>';
          (document.body || document.documentElement).appendChild(ov);
          bg = ov.querySelector('[data-ww="blades"]');
        };
        const position = () => {
          let w = 360;
          try {
            const list = ([] as any[]).slice.call(document.querySelectorAll('iframe'))
              .map((f: any) => f.getBoundingClientRect())
              .filter((r: any) => r.width > 0 && r.height > 0)
              .sort((a: any, b: any) => b.width * b.height - a.width * a.height);
            if (list[0] && list[0].left > 200) w = list[0].left;
          } catch (e) { /* ignore */ }
          ov.style.width = w + 'px';
        };
        const loop = () => {
          const u = (1 - Math.cos(((now() - t0) / 1600) * Math.PI)) / 2; // 1,6 s je Halbzyklus
          if (bg) bg.innerHTML = blades(3 + u * 14);
          raf = requestAnimationFrame(loop);
        };
        const hide = () => {
          shown = false;
          if (ov) ov.style.display = 'none';
          if (raf) { cancelAnimationFrame(raf); raf = null; }
          if (cap) { clearTimeout(cap); cap = null; }
        };
        const show = () => {
          ensure(); position();
          ov.style.display = 'flex';
          if (!shown) {
            shown = true; t0 = now();
            if (raf) cancelAnimationFrame(raf);
            raf = requestAnimationFrame(loop);
            if (cap) clearTimeout(cap);
            cap = setTimeout(hide, 3000);
          }
        };
        window.addEventListener('message', (e: any) => {
          if (!e || !e.data || e.data.type !== 'url-changed') return;
          show();
          if (settle) clearTimeout(settle);
          settle = setTimeout(hide, 180);
        });
      }
    } catch (e) { /* ignore */ }

    return cms;
  },
  build: {
    outputFolder: 'admin',
    publicFolder: 'public',
  },
  media: {
    tina: {
      mediaRoot: 'uploads',
      publicFolder: 'public',
    },
  },
  schema: {
    collections: [
      // --- Startseite: Hero (Medien + Texte). Intro/Social folgen in Etappe 4. ---
      {
        name: 'startseite',
        label: '🏠 Startseite',
        path: 'src/data',
        format: 'json',
        match: { include: 'home-settings' },
        // Router -> Vorschau + Bearbeiten auf / (Hero/Intro/Sektion-Köpfe sind dort
        // useTina-Inseln -> Formular + Klick-ins-Feld, kein „nothing to edit").
        ui: { allowedActions: { create: false, delete: false }, router: () => '/' },
        fields: [
          { type: 'string', name: 'ww_here', label: '🏠 Startseite', ui: { component: SectionBanner } },
          {
            type: 'string', name: 'editor_language', label: 'Sprache',
            description: 'Nur Deutsch — oder Deutsch + Englisch. (Nur Anzeige im Editor.)',
            ui: { component: EnglishToggle },
          },
          {
            type: 'object', name: 'hero', label: 'Hero (Kopfbereich)',
            fields: [
              {
                type: 'string', name: 'mode', label: 'Hintergrund-Typ',
                description: 'Einzelbild, Diashow (mehrere Bilder) oder Video.',
                options: [
                  { value: 'image', label: 'Einzelbild' },
                  { value: 'random', label: 'Diashow (mehrere Bilder)' },
                  { value: 'video', label: 'Video' },
                ],
              },
              { type: 'image', name: 'image', label: 'Einzelbild (Auto-WebP)', ui: { component: SinglePhotoField } },
              { type: 'image', name: 'slideshow', label: 'Diashow-Bilder (Auto-WebP)', list: true, ui: { component: BulkPhotoField } },
              { type: 'string', name: 'video', label: 'Video (optional)', description: 'Pfad zu /uploads/… — Video vorher lokal komprimieren (HandBrake/CapCut).' },
              { type: 'image', name: 'video_poster', label: 'Video-Vorschaubild (Poster)', ui: { component: SinglePhotoField } },
              { type: 'string', name: 'kicker_de', label: 'Kleine Zeile über dem Titel (Editorial-Design)', description: 'Die goldene Mono-Zeile, z. B. „Travel & Outdoor Photography“. Leer = Standardtext.' },
              { type: 'string', name: 'kicker_en', label: '↳ English', ui: { component: EnglishOnlyField } },
              { type: 'string', name: 'title_de', label: 'Großer Hero-Titel (Editorial-Design)', description: 'Der große fette Titel, z. B. „Wide & Wild“. Zeilenumbruch = neue Zeile im Titel. Leer = „Wide & Wild“.', ui: { component: 'textarea' } },
              { type: 'string', name: 'title_en', label: '↳ English', ui: { component: EnglishOnlyTextField } },
              { type: 'string', name: 'headline_de', label: 'Überschrift', ui: { component: 'textarea' } },
              { type: 'string', name: 'headline_en', label: '↳ English', ui: { component: EnglishOnlyTextField } },
              { type: 'string', name: 'cta_portfolio_de', label: 'Knopf 1 (→ Portfolio)' },
              { type: 'string', name: 'cta_portfolio_en', label: '↳ English', ui: { component: EnglishOnlyField } },
              { type: 'string', name: 'cta_stories_de', label: 'Knopf 2 (→ Stories)' },
              { type: 'string', name: 'cta_stories_en', label: '↳ English', ui: { component: EnglishOnlyField } },
              {
                type: 'object', name: 'polish', label: 'Politur (edler Look, abschaltbar)',
                description: 'Feinschliff-Effekte für den Hero. Aus = 1:1 schlichter Look.',
                fields: [
                  { type: 'boolean', name: 'ken_burns', label: 'Langsamer Bild-Zoom (Ken-Burns)' },
                  { type: 'boolean', name: 'scrim', label: 'Stärkerer Verlauf (Text hebt sich ab)' },
                  { type: 'boolean', name: 'big_headline', label: 'Große, edle Überschrift (Display-Schrift)' },
                  {
                    type: 'string', name: 'scroll_style', label: 'Scroll-Hinweis (Stil)',
                    description: 'Welcher Hinweis unten im Hero zum Weiterscrollen.',
                    options: [
                      { value: 'line', label: 'Linie (elegant)' },
                      { value: 'arrow', label: 'Pfeil ↓ (klassisch / wie Live)' },
                      { value: 'mouse', label: 'Maus (Puls)' },
                      { value: 'none', label: 'Keiner' },
                    ],
                  },
                ],
              },
            ],
          },
          {
            type: 'object', name: 'intro', label: 'Intro-Block (unter dem Hero)',
            fields: [
              { type: 'string', name: 'subline_de', label: 'Zwischenüberschrift' },
              { type: 'string', name: 'subline_en', label: '↳ English', ui: { component: EnglishOnlyField } },
              { type: 'rich-text', name: 'subtext_de', label: 'Intro-Text', parser: { type: 'markdown', skipEscaping: 'html' } } as any,
              { type: 'rich-text', name: 'subtext_en', label: '↳ English', parser: { type: 'markdown', skipEscaping: 'html' }, ui: { component: EnglishRichTextField } } as any,
              // Social-Links (Instagram etc.) werden NICHT mehr hier gepflegt, sondern zentral
              // auf der KONTAKTSEITE (✉️ Kontakt -> Kanäle / contact.json -> channels). Die Intro-
              // Reihe zieht ihre Links von dort -> nur EINE Pflegestelle. An/aus via social_show.intro.
            ],
          },
          {
            type: 'object', name: 'sections', label: 'Sektion-Überschriften (Startseite)',
            fields: [
              { type: 'string', name: 'gallery_kicker_de', label: 'Momentaufnahmen — Kicker' },
              { type: 'string', name: 'gallery_kicker_en', label: '↳ English', ui: { component: EnglishOnlyField } },
              { type: 'string', name: 'gallery_title_de', label: 'Momentaufnahmen — Titel' },
              { type: 'string', name: 'gallery_title_en', label: '↳ English', ui: { component: EnglishOnlyField } },
              { type: 'string', name: 'latest_kicker_de', label: 'Aktuell — Kicker' },
              { type: 'string', name: 'latest_kicker_en', label: '↳ English', ui: { component: EnglishOnlyField } },
              { type: 'string', name: 'latest_title_de', label: 'Aktuell — Titel' },
              { type: 'string', name: 'latest_title_en', label: '↳ English', ui: { component: EnglishOnlyField } },
              { type: 'string', name: 'discover_kicker_de', label: 'Entdecken — Kicker' },
              { type: 'string', name: 'discover_kicker_en', label: '↳ English', ui: { component: EnglishOnlyField } },
              { type: 'string', name: 'discover_title_de', label: 'Entdecken — Titel' },
              { type: 'string', name: 'discover_title_en', label: '↳ English', ui: { component: EnglishOnlyField } },
            ],
          },
          {
            type: 'object', name: 'social_show', label: 'Social-Links anzeigen — wo?',
            description: 'Wo die Instagram-Links (aus der Kontaktseite) erscheinen. Standard: nur Intro (wie Live).',
            fields: [
              { type: 'boolean', name: 'intro', label: 'Im Intro-Block (unter dem Hero)' },
              { type: 'boolean', name: 'hero', label: 'Im Hero (unter den Buttons)' },
              { type: 'boolean', name: 'footer', label: 'Im Footer (auf jeder Seite)' },
            ],
          },
        ],
      },
      // --- Journal: Tagebuch — kurze, datierte Eintraege (neueste zuerst) ---
      {
        name: 'journal',
        label: '📔 Journal',
        path: 'src/content/journal',
        format: 'md',
        ui: {
          // Live-Vorschau je Eintrag (/journal/<slug>) — useTina-Insel wie bei Stories.
          router: ({ document }: any) => `/journal/${document._sys.filename}`,
          // Dateiname/Slug = Datum (+ optionaler Kurz-Titel). Bei mehreren Eintraegen am
          // selben Tag haengt Tina automatisch -1/-2 an -> eindeutige URL; im sichtbaren
          // Text erscheint immer nur das reine Datum (nie der Zaehler).
          filename: {
            slugify: (values: any) => {
              const d = String(values?.date || '').slice(0, 10) || 'eintrag';
              const t = String(values?.title_de || '')
                .toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '')
                .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 40);
              return t ? `${d}-${t}` : d;
            },
          },
        },
        fields: [
          { type: 'string', name: 'ww_here', label: '📔 Journal – Eintrag', ui: { component: SectionBanner } },
          { type: 'boolean', name: 'archived', label: 'Archiviert (von der Website nehmen)', description: 'An = für Besucher ausgeblendet, bleibt im CMS erhalten und ist jederzeit zurückholbar.' },
          { type: 'string', name: 'date', label: 'Datum (YYYY-MM-DD)', required: true, description: 'Bestimmt die Sortierung (neueste zuerst) und die sichtbare Überschrift, wenn kein Titel gesetzt ist.' },
          { type: 'boolean', name: 'pin', label: 'Oben anheften (nicht archivieren)', description: 'Bleibt oben im Journal und wandert nie ins Archiv — egal wie alt.' },
          { type: 'string', name: 'title_de', label: 'Titel (optional)', description: 'Wenn leer, erscheint das Datum als Überschrift.' },
          // Kurzer Tagebuch-Text — rich-text mit Mini-Leiste (fett/kursiv/Link), wie Stories „summary".
          { type: 'rich-text', name: 'text_de', label: 'Text', parser: { type: 'markdown', skipEscaping: 'html' }, overrides: { toolbar: ['bold', 'italic', 'link'] } } as any,
          // Foto(s) — meist eins, gelegentlich kleine Galerie (gleiches Feld wie Reisen-Stationen).
          { type: 'image', name: 'photos', label: 'Fotos (optional, Auto-WebP)', list: true, ui: { component: BulkPhotoField } },
          // Standort — gleiches GeoJSON-Point-Format + LocationSearchField wie Reisen-Stationen.
          { type: 'string', name: 'location', label: '📍 Ort auf der Karte (optional)', description: 'Suchen & auf der Karte feinjustieren. Detailseite zeigt eine echte Karte, die Liste nur ein Symbol.', ui: { component: LocationSearchField } },
          { type: 'string', name: 'place', label: '📍 Ortsname (kurz, optional)', description: 'Text neben dem Standort-Symbol (z. B. „Dresden"). Leer = „Auf der Karte". Gilt DE + EN.' },
          // Video — YouTube wie bei Stories (youtube-nocookie, kein Consent-Gate noetig).
          { type: 'string', name: 'youtube_url', label: 'YouTube-URL (optional)' },
          // Generischer externer Link (unabhaengig von „Verknüpfter Inhalt" unten).
          {
            type: 'object', name: 'link', label: 'Externer Link (optional)',
            fields: [
              { type: 'string', name: 'label_de', label: 'Link-Text' },
              { type: 'string', name: 'label_en', label: '↳ English', ui: { component: EnglishStoryField } },
              { type: 'string', name: 'url', label: 'URL (https://…)' },
            ],
          },
          // Interne Verknüpfung -> reiche Karte (Cover + Titel + Typ kommen automatisch vom Ziel).
          {
            type: 'reference', name: 'linked_content', label: 'Verknüpfter Inhalt (optional)',
            description: 'Album, Story oder Reise wählen — Cover-Bild und Titel erscheinen automatisch als Karte (kein Upload nötig).',
            collections: ['alben', 'story', 'reisen'],
            // Auswahlliste als KLARTEXT (Album-Name / Story- bzw. Reise-Titel) statt Dateipfad.
            ui: {
              optionComponent: (values: any, sys: any) =>
                (values && (values.name || values.title_de || values.title)) || (sys && sys.filename) || 'Eintrag',
            },
          },
          // Social-Beitrag als Karte (selbst gehostetes Vorschaubild, kein Fremd-Skript).
          {
            type: 'object', name: 'social', label: 'Social-Beitrag (optional)',
            fields: [
              { type: 'string', name: 'platform', label: 'Plattform', options: [{ value: 'instagram', label: 'Instagram' }, { value: 'tiktok', label: 'TikTok' }] },
              { type: 'string', name: 'url', label: 'Beitrags-URL (instagram.com/p/… oder tiktok.com/@…/video/…)' },
              { type: 'string', name: 'caption_de', label: 'Bildunterschrift (optional)' },
              { type: 'string', name: 'caption_en', label: '↳ English', ui: { component: EnglishStoryField } },
              { type: 'image', name: 'thumbnail', label: 'Vorschaubild (Instagram: manuell hochladen; TikTok: wird automatisch geholt)', ui: { component: SinglePhotoField } },
            ],
          },
          // --- Englische Version (pro Eintrag ueberspringbar, wie bei Stories) ---
          { type: 'boolean', name: 'has_english', label: 'Englische Version anzeigen?' },
          { type: 'string', name: 'title_en', label: 'Title (EN)', ui: { component: EnglishStoryField } },
          { type: 'rich-text', name: 'text_en', label: 'Text (EN)', parser: { type: 'markdown', skipEscaping: 'html' }, overrides: { toolbar: ['bold', 'italic', 'link'] }, ui: { component: EnglishStoryRichTextField } } as any,
        ],
      },
      // --- Journal: Seiten-Einstellungen (Kopf-Texte + Listen-Stil) ---
      {
        name: 'journal_settings',
        label: '📔 Journal',
        path: 'src/data',
        format: 'json',
        match: { include: 'journal-settings' },
        ui: { allowedActions: { create: false, delete: false }, router: () => '/journal' },
        fields: [
          { type: 'string', name: 'ww_here', label: '📔 Journal – Einstellungen', ui: { component: SectionBanner } },
          {
            type: 'string', name: 'editor_language', label: 'Sprache',
            description: 'Nur Deutsch — oder Deutsch + Englisch. (Nur Anzeige im Editor.)',
            ui: { component: EnglishToggle },
          },
          { type: 'string', name: 'kicker_de', label: 'Mini-Titel (Kicker)' },
          { type: 'string', name: 'kicker_en', label: '↳ English', ui: { component: EnglishOnlyField } },
          { type: 'string', name: 'title_de', label: 'Seiten-Titel' },
          { type: 'string', name: 'title_en', label: '↳ English', ui: { component: EnglishOnlyField } },
          { type: 'string', name: 'intro_de', label: 'Einleitung', ui: { component: 'textarea' } },
          { type: 'string', name: 'intro_en', label: '↳ English', ui: { component: EnglishOnlyTextField } },
          {
            type: 'string', name: 'journal_style', label: 'Listen-Stil',
            description: 'Aussehen der Journal-Einträge. Vorschau unten — einen Stil anklicken.',
            ui: { component: JournalStyleField },
            options: [
              { value: 'stream', label: 'Stream (wie jetzt)' },
              { value: 'plain', label: 'Schlicht' },
              { value: 'card', label: 'Karte' },
              { value: 'notes', label: 'Field-Notes' },
            ],
          },
          {
            type: 'number', name: 'archive_after_months', label: 'Ältere Einträge archivieren nach … Monaten',
            description: '0 = nie archivieren. Einträge, die älter sind, rutschen in einen aufklappbaren „Archiv"-Bereich unten. Angepinnte Einträge bleiben immer oben.',
          },
        ],
      },
      // --- Alben: jedes Album ein Eintrag (Mehrfach-Collection wie Reisen) ---
      {
        name: 'alben',
        label: '🖼️ Portfolio Alben',
        path: 'src/data/albums',
        format: 'json',
        // Router -> Live-Vorschau der Album-Unterseite /portfolio/<slug> (useTina).
        ui: {
          router: ({ document }: any) => `/portfolio/${document._sys.filename}`,
        },
        fields: [
          { type: 'string', name: 'ww_here', label: '🖼️ Portfolio – Album', ui: { component: SectionBanner } },
          { type: 'boolean', name: 'archived', label: 'Archiviert (von der Website nehmen)', description: 'An = für Besucher ausgeblendet, bleibt im CMS erhalten und ist jederzeit zurückholbar.' },
          {
            type: 'string', name: 'editor_language', label: 'Sprache',
            description: 'Nur Deutsch — oder Deutsch + Englisch. Gilt für alle Felder. (Nur Anzeige im Editor.)',
            ui: { component: EnglishToggle },
          },
          { type: 'string', name: 'name', label: 'Album-Name', isTitle: true, required: true, description: 'Erscheint als Anzeigename in der Übersicht.' },
          { type: 'string', name: 'name_en', label: 'Album-Name (Englisch)', ui: { component: EnglishOnlyField } },
          { type: 'string', name: 'note_de', label: 'Notiz (optional)', ui: { component: 'textarea' } },
          { type: 'string', name: 'note_en', label: '↳ English', ui: { component: EnglishOnlyTextField } },
          { type: 'string', name: 'date', label: 'Datum (YYYY-MM-DD)', description: 'Für Sortierung „Neueste" und die Galerie-Reihenfolge.' },
          { type: 'string', name: 'linked_trip', label: 'Verknüpfte Reise (Slug, optional)', description: 'Slug einer Reise (Dateiname ohne .json, z. B. „florida"). Dann zeigt diese Reise einen „Mehr Fotos im Album"-Link.' },
          {
            type: 'object', name: 'pin', label: 'In der Galerie anheften',
            description: 'Angeheftete Alben stehen in der Galerie vorne.',
            fields: [
              { type: 'boolean', name: 'highlight', label: 'Anheften?' },
              { type: 'number', name: 'highlight_order', label: 'Reihenfolge (kleiner = weiter vorne)' },
            ],
          },
          { type: 'image', name: 'photos', label: 'Fotos (Auto-WebP)', list: true, ui: { component: BulkPhotoField } },
        ],
      },
      // --- Galerie: Seiten-Einstellungen (Texte + Sortier-Modi) ---
      {
        name: 'galerie_settings',
        label: '🖼️ Portfolio',
        path: 'src/data',
        format: 'json',
        match: { include: 'gallery-settings' },
        // Router -> Vorschau + Bearbeiten auf /portfolio (Kopf-Block ist dort eine
        // useTina-Insel <SettingsHeader> -> Formular + Live-Update, kein „nothing to edit").
        ui: { allowedActions: { create: false, delete: false }, router: () => '/portfolio' },
        fields: [
          { type: 'string', name: 'ww_here', label: '🖼️ Portfolio – Einstellungen', ui: { component: SectionBanner } },
          {
            type: 'string', name: 'editor_language', label: 'Sprache',
            description: 'Nur Deutsch — oder Deutsch + Englisch. (Nur Anzeige im Editor.)',
            ui: { component: EnglishToggle },
          },
          { type: 'string', name: 'kicker_de', label: 'Mini-Titel (Kicker)' },
          { type: 'string', name: 'kicker_en', label: '↳ English', ui: { component: EnglishOnlyField } },
          { type: 'string', name: 'title_de', label: 'Seiten-Titel' },
          { type: 'string', name: 'title_en', label: '↳ English', ui: { component: EnglishOnlyField } },
          { type: 'string', name: 'intro_de', label: 'Einleitung', ui: { component: 'textarea' } },
          { type: 'string', name: 'intro_en', label: '↳ English', ui: { component: EnglishOnlyTextField } },
          {
            type: 'object', name: 'modes', label: 'Sichtbare Sortier-Modi',
            description: 'Welche Sortier-Knöpfe Besucher sehen. Ist nur einer (oder keiner) an, wird die Leiste versteckt und „Alben" als Standard genutzt.',
            fields: [
              { type: 'boolean', name: 'album', label: 'Alben (Karten)' },
              { type: 'boolean', name: 'chronological', label: 'Neueste (flach, nach Datum)' },
              { type: 'boolean', name: 'alphabetical', label: 'A–Z (flach, nach Name)' },
            ],
          },
        ],
      },
      {
        name: 'story',
        label: '📖 Stories',
        path: 'src/content/stories',
        format: 'md',
        ui: {
          // Damit Tina von einem Eintrag direkt die passende Seite oeffnet
          // (Voraussetzung fuer Live-Vorschau / Klick-zum-Feld).
          router: ({ document }) => `/stories/${document._sys.filename}`,
        },
        fields: [
          { type: 'string', name: 'ww_here', label: '📖 Stories – Beitrag', ui: { component: SectionBanner } },
          { type: 'boolean', name: 'archived', label: 'Archiviert (von der Website nehmen)', description: 'An = für Besucher ausgeblendet (aus Listen + Suchmaschinen), bleibt im CMS erhalten und ist jederzeit zurückholbar.' },
          // --- Deutsch (Haupt) ---
          { type: 'string', name: 'title_de', label: 'Titel', isTitle: true, required: true, description: 'Max. 35 Zeichen.', ui: { validate: validateTitleMax } },
          { type: 'string', name: 'category_de', label: 'Ort / Kategorie' },
          { type: 'string', name: 'date', label: 'Datum (YYYY-MM-DD)' },
          { type: 'image', name: 'cover', label: 'Titelbild (Auto-WebP)', ui: { component: SinglePhotoField } },
          { type: 'string', name: 'excerpt_de', label: 'Anriss / Vorschautext', ui: { component: 'textarea' } },
          // Haupttext: gespeichert als Markdown-String -> wird ueber unseren
          // mdToHtml-Port gerendert (Pullquote `>`, Listen, Bilder identisch zur
          // Live-Seite). BEWUSST kein Tina-Rich-Text (wuerde Speicherformat +
          // Rendering aendern). Editor = StoryBodyField: Laien-Knoepfe ueber dem
          // Textfeld — „📷 Bild einfuegen" (Auto-WebP-Upload an die Cursor-Stelle)
          // + „📸 Album hier einfuegen" (setzt den [[album]]-Platzhalter -> dort
          // erscheint die Lightbox des unten verknuepften Albums).
          { type: 'rich-text', name: 'body_de', label: 'Haupttext', description: 'Der erste Buchstabe des ersten Absatzes wird auf der Seite automatisch als großer Schmuck-Initial dargestellt.', overrides: { toolbar: ['heading', 'bold', 'italic', 'link', 'quote', 'ul', 'ol', 'embed'] }, templates: [
            { name: 'foto', label: '📷 Foto', fields: [ { name: 'src', type: 'string', label: 'Bild', ui: { component: PhotoUploadField } }, { name: 'alt', type: 'string', label: 'Alt-Text (optional, für Barrierefreiheit)' } ] },
            { name: 'album', label: '📸 Album-Galerie', fields: [ { name: 'hinweis', type: 'string', label: 'Album-Galerie', description: 'Die Fotos kommen automatisch aus dem unten gewählten „Verknüpften Album" — hier ist nichts auszufüllen.' } ] },
          ] } as any,
          // --- Verknuepftes Album: per Dropdown ein vorhandenes Album waehlen.
          //     Mit „📸 Album hier einfuegen" im Text frei platzierbar (Lightbox),
          //     ohne die Bilder erneut hochzuladen (sie kommen aus dem Album). ---
          {
            type: 'reference',
            name: 'linked_album',
            label: 'Verknüpftes Album (für „📸 Album hier einfügen")',
            description: 'Optional. Wähle ein vorhandenes Album — seine Fotos erscheinen als Lightbox an der [[album]]-Stelle im Text (kein erneuter Upload).',
            collections: ['alben'],
          },
          // --- Optionales Video ---
          { type: 'string', name: 'youtube_url', label: 'YouTube-URL (optional)' },
          // --- Englische Version ---
          { type: 'boolean', name: 'has_english', label: 'Englische Version anzeigen?' },
          { type: 'string', name: 'title_en', label: 'Title (EN)', description: 'Max. 35 characters.', ui: { component: EnglishStoryField, validate: validateTitleMax } },
          { type: 'string', name: 'category_en', label: 'Category (EN)', ui: { component: EnglishStoryField } },
          { type: 'string', name: 'excerpt_en', label: 'Excerpt (EN)', ui: { component: EnglishStoryTextField } },
          { type: 'rich-text', name: 'body_en', label: 'Body (EN)', description: 'The first letter of the first paragraph is automatically shown as a large decorative initial on the page.', ui: { component: EnglishStoryRichTextField }, overrides: { toolbar: ['heading', 'bold', 'italic', 'link', 'quote', 'ul', 'ol', 'embed'] }, templates: [
            { name: 'foto', label: '📷 Photo', fields: [ { name: 'src', type: 'string', label: 'Image', ui: { component: PhotoUploadField } }, { name: 'alt', type: 'string', label: 'Alt text (optional)' } ] },
            { name: 'album', label: '📸 Album-Galerie', fields: [ { name: 'hinweis', type: 'string', label: 'Album-Galerie', description: 'Photos come from the linked album below — nothing to fill in.' } ] },
          ] } as any,
        ],
      },
      // --- Stories: Seiten-Einstellungen (Kopf-Texte der Stories-Liste) ---
      {
        name: 'stories_settings',
        label: '📖 Stories',
        path: 'src/data',
        format: 'json',
        match: { include: 'stories-settings' },
        // Router -> Vorschau + Bearbeiten auf /stories (useTina-Insel <SettingsHeader>).
        ui: { allowedActions: { create: false, delete: false }, router: () => '/stories' },
        fields: [
          { type: 'string', name: 'ww_here', label: '📖 Stories – Einstellungen', ui: { component: SectionBanner } },
          {
            type: 'string', name: 'editor_language', label: 'Sprache',
            description: 'Nur Deutsch — oder Deutsch + Englisch. (Nur Anzeige im Editor.)',
            ui: { component: EnglishToggle },
          },
          { type: 'string', name: 'kicker_de', label: 'Mini-Titel (Kicker)' },
          { type: 'string', name: 'kicker_en', label: '↳ English', ui: { component: EnglishOnlyField } },
          { type: 'string', name: 'title_de', label: 'Seiten-Titel' },
          { type: 'string', name: 'title_en', label: '↳ English', ui: { component: EnglishOnlyField } },
          { type: 'string', name: 'intro_de', label: 'Einleitung', ui: { component: 'textarea' } },
          { type: 'string', name: 'intro_en', label: '↳ English', ui: { component: EnglishOnlyTextField } },
        ],
      },
      // --- Reisen: jede Reise ein Eintrag (Mehrfach-Collection wie Stories) ---
      {
        name: 'reisen',
        label: '🧭 Reisen',
        path: 'src/data/trips',
        format: 'json',
        // Router -> Live-Vorschau: eigene Pfad-Route je Reise (/trips/<slug>), damit
        // Tina die richtige Reise zuverlaessig anzeigt (Query-Strings verwirft Tina).
        // Die Route nutzt useTina -> Visual-Editing (Klick=Feld + Live-Update).
        ui: {
          router: ({ document }: any) => `/trips/${document._sys.filename}`,
        },
        fields: [
          { type: 'string', name: 'ww_here', label: '🧭 Reisen – Reise', ui: { component: SectionBanner } },
          { type: 'boolean', name: 'archived', label: 'Archiviert (von der Website nehmen)', description: 'An = für Besucher ausgeblendet, bleibt im CMS erhalten und ist jederzeit zurückholbar.' },
          {
            type: 'string', name: 'editor_language', label: 'Sprache',
            description: 'Schalter: nur Deutsch — oder Deutsch + Englisch. Gilt für alle Felder. (Nur Anzeige im Editor.)',
            ui: { component: EnglishToggle },
          },
          { type: 'number', name: 'order', label: 'Reihenfolge (Tab)', description: 'Kleinere Zahl = weiter links in den Reise-Tabs.' },
          { type: 'string', name: 'title', label: 'Reise-Titel (Tab)', isTitle: true, required: true, description: 'Erscheint als Anzeigename in der Übersicht & als Tab. Max. 35 Zeichen.', ui: { validate: validateTitleMax } },
          { type: 'string', name: 'title_en', label: 'Reise-Titel (Englisch)', description: 'Max. 35 Zeichen.', ui: { component: EnglishOnlyField, validate: validateTitleMax } },
          { type: 'string', name: 'titel_vorschau', label: 'Vorschau (Handy)', ui: { component: ReiseTitelPreview } },
          { type: 'string', name: 'date', label: 'Datum (YYYY-MM-DD)', description: 'Für Sortierung/Meta.' },
          { type: 'string', name: 'meta_de', label: 'Meta-Zeile (Datum · km · …)' },
          { type: 'string', name: 'meta_en', label: '↳ English', ui: { component: EnglishOnlyField } },
          { type: 'rich-text', name: 'summary_de', label: 'Zusammenfassung', parser: { type: 'markdown', skipEscaping: 'html' }, overrides: { toolbar: ['bold', 'italic'] } } as any,
          { type: 'rich-text', name: 'summary_en', label: '↳ English', parser: { type: 'markdown', skipEscaping: 'html' }, overrides: { toolbar: ['bold', 'italic'] }, ui: { component: EnglishRichTextField } } as any,
          { type: 'boolean', name: 'upcoming', label: 'Kommende Reise? (zeigt „bald ✦")' },
          {
            type: 'string', name: 'vehicle', label: 'Fahrzeug auf der Karte',
            description: 'Silhouette, die diese Reise auf der Karte fährt. Leer = Ford Expedition.',
            options: [
              { value: 'expedition', label: 'Ford Expedition (Standard)' },
              { value: 'pickup', label: 'Pickup' },
              { value: 'jeep', label: 'Jeep / SUV' },
            ],
          },
          { type: 'string', name: 'vehicle_custom_svg', label: '↳ Eigenes Fahrzeug-SVG (optional)', description: 'Fortgeschritten: kompletter <svg>…</svg>-Code. Überschreibt die Auswahl oben.', ui: { component: 'textarea' } },
          {
            type: 'object', name: 'stops', label: 'Stationen', list: true,
            // 2-in-1: Anreise (✈/🚗) + Zwischenstopp diskret direkt in der Listen-Beschriftung jeder Station.
            ui: { itemProps: (i: any) => ({ label: (i?.arriveBy === 'flight' ? '✈️ ' : '🚗 ') + (i?.name || 'Neue Station') + (i?.kind === 'intermediate' ? ' · Zwischenstopp' : '') }) },
            fields: [
              { type: 'string', name: 'name', label: 'Name (kurz – für Marker & Liste)', required: true, description: 'z. B. San Francisco' },
              {
                type: 'string', name: 'kind', label: 'Art der Station',
                description: 'Hauptstation = voller Block (Titelbild, Text, weitere Fotos). Zwischenstopp = schlank (Titel, Datum, 1–3 Sätze). Leer = Hauptstation.',
                options: [
                  { value: 'main', label: 'Hauptstation' },
                  { value: 'intermediate', label: 'Zwischenstopp' },
                ],
              },
              {
                type: 'string', name: 'arriveBy', label: 'Anreise zu dieser Station',
                description: 'Wie diese Station vom vorherigen Stopp erreicht wird. Fahrt = durchgezogene Linie + Auto. Flug = gekrümmter, gestrichelter Bogen + Flugzeug (zoomt heraus). Leer = Fahrt.',
                options: [
                  { value: 'drive', label: '🚗 Fahrt' },
                  { value: 'flight', label: '✈️ Flug' },
                ],
              },
              { type: 'string', name: 'location', label: '📍 Ort auf der Karte', description: 'Suchen & auf der Karte feinjustieren.', ui: { component: LocationSearchField } },
              { type: 'string', name: 'title_de', label: 'Stations-Titel' },
              { type: 'string', name: 'title_en', label: '↳ English', ui: { component: EnglishOnlyField } },
              { type: 'string', name: 'date_de', label: 'Datum/Zeitraum' },
              { type: 'string', name: 'date_en', label: '↳ English', ui: { component: EnglishOnlyField } },
              { type: 'rich-text', name: 'text_de', label: 'Text', parser: { type: 'markdown', skipEscaping: 'html' } } as any,
              { type: 'rich-text', name: 'text_en', label: '↳ English', parser: { type: 'markdown', skipEscaping: 'html' }, ui: { component: EnglishRichTextField } } as any,
              { type: 'string', name: 'photo', label: 'Titelbild (Zoom/Zuschnitt 16:10, Auto-WebP)', cropRatio: 16 / 10, ui: { component: CropPhotoField } },
              { type: 'image', name: 'photos', label: 'Weitere Fotos (Auto-WebP)', list: true, ui: { component: BulkPhotoField } },
              { type: 'string', name: 'video', label: 'Video-Loop (optional)', description: 'Pfad zu /uploads/… — Video vorher lokal komprimieren (HandBrake/CapCut).' },
              { type: 'string', name: 'youtube', label: 'YouTube-URL (optional)' },
            ],
          },
          {
            type: 'object', name: 'gallery', label: '„Reisefazit"-Galerie (optional)', list: true,
            ui: { itemProps: (i: any) => ({ label: i?.image ? i.image.split('/').pop() : 'Neues Bild' }) },
            fields: [
              { type: 'image', name: 'image', label: 'Bild (Auto-WebP)', ui: { component: SinglePhotoField } },
              { type: 'string', name: 'caption_de', label: 'Bildunterschrift' },
              { type: 'string', name: 'caption_en', label: '↳ English', ui: { component: EnglishOnlyField } },
            ],
          },
        ],
      },
      // --- Reisen: Seiten-Einstellungen (Texte + Karten-Stil) ---
      {
        name: 'reisen_settings',
        label: '🧭 Reisen',
        path: 'src/data',
        format: 'json',
        match: { include: 'trips-settings' },
        // Router -> Vorschau + Bearbeiten auf /trips (useTina-Insel <SettingsHeader>).
        ui: { allowedActions: { create: false, delete: false }, router: () => '/trips' },
        fields: [
          { type: 'string', name: 'ww_here', label: '🧭 Reisen – Einstellungen', ui: { component: SectionBanner } },
          {
            type: 'string', name: 'editor_language', label: 'Sprache',
            description: 'Nur Deutsch — oder Deutsch + Englisch. (Nur Anzeige im Editor.)',
            ui: { component: EnglishToggle },
          },
          { type: 'string', name: 'kicker_de', label: 'Mini-Titel (Kicker)' },
          { type: 'string', name: 'kicker_en', label: '↳ English', ui: { component: EnglishOnlyField } },
          { type: 'string', name: 'title_de', label: 'Seiten-Titel' },
          { type: 'string', name: 'title_en', label: '↳ English', ui: { component: EnglishOnlyField } },
          { type: 'string', name: 'intro_de', label: 'Einleitung', ui: { component: 'textarea' } },
          { type: 'string', name: 'intro_en', label: '↳ English', ui: { component: EnglishOnlyTextField } },
          {
            type: 'string', name: 'map_style', label: 'Karten-Stil',
            description: 'Stil der MapLibre-Karte (OpenFreeMap).',
            options: [
              { value: 'liberty', label: 'Liberty (Standard)' },
              { value: 'positron', label: 'Positron (hell/minimal)' },
              { value: 'bright', label: 'Bright' },
              { value: 'fiord', label: 'Fiord (gedeckt)' },
              { value: 'dark', label: 'Dark' },
            ],
          },
          {
            type: 'boolean', name: 'map_scroll_zoom', label: 'Karte: Mit Mausrad zoomen',
            description: 'AN (Standard): Mausrad über der Karte zoomt die Karte (am Handy: ein Finger bewegt die Karte). AUS: Mausrad scrollt die Seite (am Handy zwei Finger für die Karte) — wie auf der alten Live-Seite.',
          },
          {
            type: 'boolean', name: 'map_auto_popup', label: 'Karte: Info-Sprechblase automatisch zeigen',
            description: 'AN (Standard): Beim Öffnen/Scrollen erscheint die Sprechblase (Stationsname + Datum) der aktiven Station automatisch. AUS: nur, wenn man den Kartenpunkt anklickt.',
          },
          // --- Globale Timeline-Regler (gelten für ALLE Reisen, auch mobil). Leer = Standard. ---
          { type: 'number', name: 'spotlight_strength', label: 'Spotlight-Stärke (%)', description: 'Wie stark Stationen abseits des Lesefokus zurücktreten. Empfohlen: 70. Höher = klarer Spotlight, niedriger = ruhiger/gleichmäßiger. Bereich 0–90. Leer = 70.' },
          { type: 'number', name: 'dim_fade_ms', label: 'Übergang (ms)', description: 'Weiche Ein-/Ausblend-Dauer des Fokus. Leer = 800.' },
          { type: 'number', name: 'reveal_ms', label: 'Reveal-Dauer (ms)', description: 'Sanftes Einblenden, wenn eine Station erstmals erscheint. Leer = 800.' },
          { type: 'boolean', name: 'snap_enabled', label: 'Stationen einrasten', description: 'AUS (empfohlen): frei scrollen, nichts rastet ein. AN: beim Ruhen rückt die nächste Station sanft an die Lese-Position.' },
          // --- ZENTRALE Design-WAHL: gilt einheitlich für ALLE Reisen (kein pro-Reise-Unterschied). ---
          {
            type: 'string', name: 'design', label: 'Design für alle Reisen',
            description: 'Einheitliches Aussehen ALLER Reisen-Stationen. Leer/„Kräftig" = wie bisher. Die WERTE der Vorlagen stellst du unten unter „🎨 Design-Werte" ein.',
            options: [
              { value: 'none', label: 'Ohne Rahmen' },
              { value: 'soft', label: 'Ausgewogen' },
              { value: 'strong', label: 'Kräftig (Standard)' },
              { value: 'luftig', label: 'Luftig (Apple-leicht)' },
            ],
          },
          // --- Reisen-DESIGNS: zentrale WERTE der 4 Vorlagen (none/soft/strong/luftig). Wirken global;
          //     welche Vorlage AKTIV ist, steuert das Feld „Design für alle Reisen" oben. ---
          {
            type: 'object', name: 'designs', label: '🎨 Design-Werte (4 Vorlagen)',
            description: 'Werte der 4 Vorlagen. Welche Vorlage für alle Reisen aktiv ist, steuert oben „Design für alle Reisen".',
            // Schritt 3: Regler-Editor mit Live-Vorschau (ersetzt die Zahlenfelder-Anzeige). Nur UI -> kein Re-Index.
            ui: { component: TripDesignsEditor },
            fields: [
              designTuningField('none', 'Ohne Rahmen'),
              designTuningField('soft', 'Ausgewogen'),
              designTuningField('strong', 'Kräftig (Standard)'),
              designTuningField('luftig', 'Luftig (Apple-leicht)'),
            ],
          },
        ],
      },
      // --- Equipment / Gear: EIN Eintrag (Seitentexte + Liste) mit Live-Vorschau ---
      {
        name: 'gear',
        label: '🎒 Equipment',
        path: 'src/data',
        format: 'json',
        match: { include: 'gear' }, // nur src/data/gear.json
        ui: {
          // Eine einzige Datei -> kein Anlegen/Loeschen ueber Tina.
          allowedActions: { create: false, delete: false },
          // „Seite öffnen" / Live-Vorschau -> /gear
          router: () => '/gear',
        },
        fields: [
          { type: 'string', name: 'ww_here', label: '🎒 Equipment', ui: { component: SectionBanner } },
          // --- Sprach-Schalter (nur Editor; steuert die EN-Felder) ---
          {
            type: 'string', name: 'editor_language', label: 'Sprache',
            description: 'Nur Deutsch — oder Deutsch + Englisch. (Nur Anzeige im Editor.)',
            ui: { component: EnglishToggle },
          },
          // --- Seitenkopf-Texte (DE/EN, flach) ---
          { type: 'string', name: 'kicker_de', label: 'Mini-Titel (Kicker)' },
          { type: 'string', name: 'kicker_en', label: '↳ English', ui: { component: EnglishOnlyField } },
          { type: 'string', name: 'title_de', label: 'Titel' },
          { type: 'string', name: 'title_en', label: '↳ English', ui: { component: EnglishOnlyField } },
          { type: 'string', name: 'intro_de', label: 'Beschreibung', ui: { component: 'textarea' } },
          { type: 'string', name: 'intro_en', label: '↳ English', ui: { component: EnglishOnlyTextField } },
          // --- Listen-Stil (Vorschau im CMS) ---
          {
            type: 'string', name: 'gear_style', label: 'Listen-Stil',
            description: 'Aussehen der Ausrüstungs-Liste. Vorschau unten — einen Stil anklicken.',
            ui: { component: GearStyleField },
            options: [
              { value: 'plain', label: 'Schlicht' },
              { value: 'card', label: 'Karte (erhaben)' },
              { value: 'notes', label: 'Field-Notes / Notizzettel' },
            ],
          },
          {
            type: 'string', name: 'gear_scope', label: 'Reichweite des Stils',
            description: 'Nur relevant bei „Karte" / „Field-Notes": EIN Block um die ganze Liste — oder je Kategorie ein eigener Block.',
            options: [
              { value: 'whole', label: 'Ganze Liste (ein Block / ein Zettel)' },
              { value: 'groups', label: 'Nach Gruppe (je Kategorie ein Block)' },
            ],
          },
          // --- Kategorien (direkt hier pflegbar): Reihenfolge der Liste = Reihenfolge
          //     der Überschriften auf der Seite. Speist das Dropdown der Geräte unten. ---
          {
            type: 'object',
            name: 'categories',
            label: 'Kategorien',
            description: 'Deine Kategorie-Überschriften. Hinzufügen, umbenennen, per Drag&Drop sortieren. Die „Kennung" einmal vergeben (klein, ohne Leerzeichen) — daran hängen die Geräte; das Label kannst du jederzeit ändern.',
            list: true,
            ui: {
              itemProps: (item: any) => ({ label: item?.label_de || 'Neue Kategorie' }),
            },
            fields: [
              { type: 'string', name: 'label_de', label: 'Überschrift (Deutsch)', required: true, description: 'z. B. „Kameras". Frei änderbar.' },
              { type: 'string', name: 'label_en', label: '↳ English', description: 'Englische Überschrift (optional; leer = Deutsch).' },
              { type: 'string', name: 'key', label: 'Kennung', required: true, description: 'Kurz, klein, ohne Leerzeichen (z. B. „cooler"). Einmal vergeben, danach nicht mehr ändern — die Geräte hängen daran.' },
            ],
          },
          // --- Ausrüstungs-Liste ---
          {
            type: 'object',
            name: 'items',
            label: 'Ausrüstung',
            list: true,
            ui: {
              itemProps: (item: any) => ({
                label: item?.name
                  ? `${item.name}${item.brand ? ' — ' + item.brand : ''}`
                  : 'Neues Ausrüstungsteil',
              }),
            },
            fields: [
              { type: 'string', name: 'name', label: 'Name', required: true, description: 'z. B. Sony A7 IV' },
              { type: 'string', name: 'brand', label: 'Marke', description: 'z. B. Sony' },
              {
                // Dropdown, gespeist aus der „Kategorien"-Liste oben (gleiches Dokument).
                // Eigenes Feld (GearCategoryField), weil Tina-`options` nicht aus CMS-Inhalt
                // gefüllt werden können. Speichert die „Kennung" (key) der Kategorie.
                type: 'string',
                name: 'category',
                label: 'Kategorie',
                description: 'Bestimmt, unter welcher Überschrift das Teil erscheint. Auswahl aus deinen Kategorien (oben „Kategorien" pflegen).',
                ui: { component: GearCategoryField },
              },
              { type: 'string', name: 'link', label: 'Link (optional)', description: 'Volle URL (https://…). Leer lassen = kein Link.' },
            ],
          },
        ],
      },
      // --- Über uns: EIN Eintrag (Kopf-Texte + 2 Personen + „Warum die USA?") ---
      {
        name: 'ueber_uns',
        label: '📄 Über uns',
        path: 'src/data',
        format: 'json',
        match: { include: 'about' }, // nur src/data/about.json
        ui: {
          allowedActions: { create: false, delete: false },
          router: () => '/about',
        },
        fields: [
          { type: 'string', name: 'ww_here', label: '📄 Über uns', ui: { component: SectionBanner } },
          // --- Sprach-Schalter (nur Editor, nichts wird gespeichert) ---
          {
            type: 'string',
            name: 'editor_language',
            label: 'Sprache',
            description: 'Schalter: nur Deutsch — oder Deutsch + Englisch anzeigen. Gilt für alle Felder. (Nur Anzeige im Editor.)',
            ui: { component: EnglishToggle },
          },
          // --- Seitenkopf (Deutsch direkt; Englisch erscheint bei Schalter „an") ---
          { type: 'string', name: 'kicker_de', label: 'Mini-Titel (Kicker)' },
          { type: 'string', name: 'kicker_en', label: '↳ English', ui: { component: EnglishOnlyField } },
          { type: 'string', name: 'title_de', label: 'Titel' },
          { type: 'string', name: 'title_en', label: '↳ English', ui: { component: EnglishOnlyField } },
          { type: 'string', name: 'intro_de', label: 'Einleitung', ui: { component: 'textarea' } },
          { type: 'string', name: 'intro_en', label: '↳ English', ui: { component: EnglishOnlyTextField } },
          // --- Personen: aufklappbare Liste (Eintrag 1 = links, Eintrag 2 = rechts) ---
          {
            type: 'object',
            name: 'persons',
            label: 'Personen',
            list: true,
            // Jede Person = ein zuklappbarer Eintrag mit dem Namen als Titel.
            ui: { itemProps: (i: any) => ({ label: i?.name || 'Person' }) },
            fields: [
              { type: 'string', name: 'name', label: 'Name', description: 'z. B. Alexandra Apostel' },
              { type: 'string', name: 'photo', label: 'Foto (Zuschnitt 4:3, Auto-WebP)', cropRatio: 4 / 3, ui: { component: CropPhotoField } },
              { type: 'string', name: 'role_de', label: 'Rolle' },
              { type: 'string', name: 'role_en', label: '↳ English', ui: { component: EnglishOnlyField } },
              { type: 'rich-text', name: 'bio_de', label: 'Bio', parser: { type: 'markdown', skipEscaping: 'html' } } as any,
              { type: 'rich-text', name: 'bio_en', label: '↳ English', parser: { type: 'markdown', skipEscaping: 'html' }, ui: { component: EnglishRichTextField } } as any,
              {
                type: 'object', name: 'gear', label: 'Ausrüstung', list: true,
                description: 'Geräte einzeln hinzufügen (je eine Pille). Steht ein Gerät schon auf der Equipment-Seite, wird es automatisch dorthin verlinkt — sonst optional einen eigenen Link angeben.',
                ui: { itemProps: (i: any) => ({ label: i?.name || 'Gerät' }) },
                fields: [
                  { type: 'string', name: 'name', label: 'Gerät', description: 'z. B. Sony A7 IV' },
                  { type: 'string', name: 'link', label: 'Link (optional)', description: 'Leer lassen, wenn das Gerät schon auf der Equipment-Seite steht — wird dann automatisch verlinkt. Sonst eigene URL (z. B. Hersteller-Seite).' },
                ],
              },
            ],
          },
          {
            type: 'boolean', name: 'show_person_gear', label: 'Ausrüstung unter den Profilen zeigen?',
            description: 'AN (Standard): die Ausrüstungs-Zeile wird unter jedem Profil angezeigt (im dunklen Design als Kacheln, im hellen als Textzeile). AUS: die Ausrüstung wird ausgeblendet.',
          },
          {
            type: 'boolean', name: 'person_hover', label: 'Profile beim Drüberfahren anheben?',
            description: 'AN (Standard): die beiden Profil-Karten oben heben sich beim Hovern leicht an (wie die Story-Karten). AUS: keine Hover-Bewegung.',
          },
          // --- „Warum die USA?" — flach (Überschrift + Text), je inline aufklappbar ---
          { type: 'string', name: 'why_title_de', label: '„Warum die USA?" — Überschrift' },
          { type: 'string', name: 'why_title_en', label: '↳ English', ui: { component: EnglishOnlyField } },
          { type: 'string', name: 'why_text_de', label: '„Warum die USA?" — Text', ui: { component: 'textarea' } },
          { type: 'string', name: 'why_text_en', label: '↳ English', ui: { component: EnglishOnlyTextField } },
        ],
      },
      // --- Kontakt: EIN Eintrag (Kopf + Direkt-Block + Kanäle + Formular-Texte) ---
      {
        name: 'kontakt',
        label: '✉️ Kontakt',
        path: 'src/data',
        format: 'json',
        match: { include: 'contact' }, // nur src/data/contact.json
        ui: {
          allowedActions: { create: false, delete: false },
          router: () => '/contact',
        },
        fields: [
          { type: 'string', name: 'ww_here', label: '✉️ Kontakt', ui: { component: SectionBanner } },
          {
            type: 'string', name: 'editor_language', label: 'Sprache',
            description: 'Schalter: nur Deutsch — oder Deutsch + Englisch anzeigen. Gilt für alle Felder. (Nur Anzeige im Editor.)',
            ui: { component: EnglishToggle },
          },
          // --- Seitenkopf ---
          { type: 'string', name: 'kicker_de', label: 'Mini-Titel (Kicker)' },
          { type: 'string', name: 'kicker_en', label: '↳ English', ui: { component: EnglishOnlyField } },
          { type: 'string', name: 'title_de', label: 'Titel' },
          { type: 'string', name: 'title_en', label: '↳ English', ui: { component: EnglishOnlyField } },
          { type: 'string', name: 'intro_de', label: 'Einleitung', ui: { component: 'textarea' } },
          { type: 'string', name: 'intro_en', label: '↳ English', ui: { component: EnglishOnlyTextField } },
          // --- „Schreib uns direkt" ---
          { type: 'string', name: 'direct_title_de', label: '„Schreib uns direkt" — Überschrift' },
          { type: 'string', name: 'direct_title_en', label: '↳ English', ui: { component: EnglishOnlyField } },
          { type: 'string', name: 'direct_text_de', label: '„Schreib uns direkt" — Text', ui: { component: 'textarea' } },
          { type: 'string', name: 'direct_text_en', label: '↳ English', ui: { component: EnglishOnlyTextField } },
          { type: 'string', name: 'location_de', label: 'Standort-Zeile' },
          { type: 'string', name: 'location_en', label: '↳ English', ui: { component: EnglishOnlyField } },
          // --- Kontakt-Kanäle ---
          {
            type: 'object', name: 'channels', label: 'Kontakt-Kanäle (E-Mail, Social)', list: true,
            ui: { itemProps: (i: any) => ({ label: i?.label ? `${i.type || '?'}: ${i.label}` : 'Neuer Kanal' }) },
            fields: [
              {
                type: 'string', name: 'type', label: 'Typ / Plattform',
                description: 'Bestimmt das Symbol automatisch.',
                options: [
                  { value: 'email', label: 'E-Mail' },
                  { value: 'instagram', label: 'Instagram' },
                  { value: 'facebook', label: 'Facebook' },
                  { value: 'tiktok', label: 'TikTok' },
                  { value: 'youtube', label: 'YouTube' },
                  { value: 'x', label: 'X / Twitter' },
                  { value: 'phone', label: 'Telefon' },
                  { value: 'whatsapp', label: 'WhatsApp' },
                  { value: 'pinterest', label: 'Pinterest' },
                  { value: 'web', label: 'Website / Sonstiges' },
                ],
              },
              { type: 'string', name: 'label', label: 'Anzeigetext', description: 'z. B. @name oder die E-Mail-Adresse' },
              { type: 'string', name: 'url', label: 'Link (URL)', description: 'z. B. mailto:hallo@… oder https://…  (leer = kein Link)' },
            ],
          },
          // --- Formular-Texte ---
          { type: 'string', name: 'form_success_de', label: 'Formular — Erfolgs-Meldung', ui: { component: 'textarea' } },
          { type: 'string', name: 'form_success_en', label: '↳ English', ui: { component: EnglishOnlyTextField } },
          { type: 'string', name: 'form_name_de', label: 'Formular — Label „Name"' },
          { type: 'string', name: 'form_name_en', label: '↳ English', ui: { component: EnglishOnlyField } },
          { type: 'string', name: 'form_email_de', label: 'Formular — Label „E-Mail"' },
          { type: 'string', name: 'form_email_en', label: '↳ English', ui: { component: EnglishOnlyField } },
          { type: 'string', name: 'form_message_de', label: 'Formular — Label „Nachricht"' },
          { type: 'string', name: 'form_message_en', label: '↳ English', ui: { component: EnglishOnlyField } },
          { type: 'string', name: 'form_send_de', label: 'Formular — Senden-Button' },
          { type: 'string', name: 'form_send_en', label: '↳ English', ui: { component: EnglishOnlyField } },
          { type: 'string', name: 'form_note_de', label: 'Formular — Hinweis darunter (nur sichtbar, solange KEIN Access-Key gesetzt ist)', ui: { component: 'textarea' } },
          { type: 'string', name: 'form_note_en', label: '↳ English', ui: { component: EnglishOnlyTextField } },
          // --- Echter Versand (Web3Forms) ---
          {
            type: 'string',
            name: 'form_access_key',
            label: '✉️ Formular-Versand: Web3Forms Access-Key',
            description: 'Leer = Formular ist nur Vorschau (sendet nichts). Key holen auf web3forms.com (kostenlos, mit eurer E-Mail) und hier einfügen — dann versendet das Formular echt an dieses Postfach. Der Key ist öffentlich (kein Geheimnis).',
          },
          { type: 'string', name: 'form_consent_de', label: 'Formular — Datenschutz-Häkchen (Text)', description: 'Pflicht-Häkchen vor dem Senden. Leer = kein Häkchen.', ui: { component: 'textarea' } },
          { type: 'string', name: 'form_consent_en', label: '↳ English', ui: { component: EnglishOnlyTextField } },
          { type: 'string', name: 'form_error_de', label: 'Formular — Fehlermeldung (wenn Senden scheitert)', ui: { component: 'textarea' } },
          { type: 'string', name: 'form_error_en', label: '↳ English', ui: { component: EnglishOnlyTextField } },
        ],
      },
      // --- Highlights: album-übergreifende Lieblingsfotos (speisen die Home-Teaser) ---
      {
        name: 'highlights',
        label: '⭐ Highlights',
        path: 'src/data',
        format: 'json',
        match: { include: 'highlights' },
        // Router -> Startseiten-Vorschau (Highlights erscheinen dort) -> auffindbar + Live-Vorschau.
        ui: { allowedActions: { create: false, delete: false } },
        fields: [
          { type: 'string', name: 'ww_here', label: '⭐ Highlights', ui: { component: SectionBanner } },
          { type: 'image', name: 'images', label: 'Highlight-Fotos (Auto-WebP)', list: true, ui: { component: BulkPhotoField } },
        ],
      },
      // --- Darstellung: globale Optik (Logo + Sichtbarkeits-Schalter) ---
      {
        name: 'darstellung',
        label: '🎨 Darstellung',
        path: 'src/data',
        format: 'json',
        match: { include: 'appearance-settings' },
        // Router -> Startseiten-Vorschau, damit „Darstellung" (inkl. Logo) auffindbar ist + Live-Vorschau hat.
        ui: { allowedActions: { create: false, delete: false } },
        fields: [
          { type: 'string', name: 'ww_here', label: '🎨 Darstellung', ui: { component: SectionBanner } },
          {
            type: 'string', name: 'design', label: '🖤 Design-Variante (ganze Seite)',
            description: 'Schaltet das GESAMTE Seiten-Design um. „Klassisch" = die aktuelle helle Optik. „Editorial (dunkel)" = das neue dunkle Design. Nach dem Umschalten baut die Seite ~1–2 Min neu (Cloudflare), dann ist es live.',
            options: [
              { value: 'klassisch', label: 'Klassisch (hell)' },
              { value: 'editorial', label: 'Editorial (dunkel)' },
            ],
          },
          { type: 'image', name: 'logo', label: 'Logo (Nav / Hero / Footer)', ui: { component: SinglePhotoField } },
          {
            type: 'string', name: 'image_frame', label: 'Bild-Rahmen & Schatten',
            description: 'Gilt global für Kästchen der Seite (Karten, Kacheln, Fotos, Reise-Übersicht, Reise-Karte, optional Buttons/Felder). NICHT für Reise-STATIONEN — die haben jetzt ihr eigenes Design (siehe „🎨 Reisen – Designs"). Gleiche Rahmendicke pro Stufe. Hero-Bild & Lightbox bleiben vollflächig. Vorschau unten — eine Stufe anklicken.',
            ui: { component: ImageFrameField },
            options: [
              { value: 'none', label: 'Keine' },
              { value: 'soft', label: 'Ausgewogen' },
              { value: 'strong', label: 'Kräftig' },
            ],
          },
          {
            type: 'boolean', name: 'frame_controls', label: 'Auch Buttons & Eingabefelder rahmen?',
            description: 'AN (Standard): auch Buttons/CTAs (im Hero mit durchsichtigem Schatten) und die Kontakt-Eingabefelder bekommen den Rahmen+Schatten. AUS: nur Anzeige-Boxen (Karten/Kacheln/Fotos/Tabs/Stationen/Karte).',
          },
          {
            type: 'boolean', name: 'album_hover', label: 'Alben beim Drüberfahren anheben?',
            description: 'AN (Standard): Portfolio-Alben heben sich beim Hovern leicht an (Klick-Signal). AUS: keine Hover-Bewegung bei den Alben (sinnvoll, da man Alben auch ohne Klick durchscrollen kann).',
          },
          { type: 'boolean', name: 'show_hero_logo', label: 'Logo im Hero zeigen?' },
          { type: 'boolean', name: 'show_discover', label: '„Entdecken"-Bereich auf der Startseite zeigen?' },
          { type: 'boolean', name: 'show_stories', label: 'Stories zeigen? (Nav-Link, Footer, Startseiten-Teaser)' },
          { type: 'boolean', name: 'show_journal', label: 'Journal zeigen? (Nav-Link DE+EN, Footer, Startseiten-Teaser; aus = komplettes Journal verborgen inkl. Direktaufruf)' },
          { type: 'boolean', name: 'hero_journal', label: 'Neuesten Journal-Eintrag im Hero zeigen? (schwebende Kachel statt des Hero-Textes; nur wenn Journal an)' },
          { type: 'boolean', name: 'show_contact', label: 'Kontakt zeigen? (Nav-Link + Footer-Link)' },
          { type: 'boolean', name: 'show_admin_bar', label: 'Admin-Leiste auf der Website zeigen? (nur sichtbar, wenn im CMS angemeldet)' },
          {
            type: 'object', name: 'sprach_banner', label: '🌐 Sprach-Hinweis (für englischsprachige Besucher)',
            description: 'Kleiner Hinweis, der NUR Besuchern mit nicht-deutscher Browser-Sprache auf den deutschen Seiten angezeigt wird — mit einem Knopf zur englischen Version. Wird einmal weggeklickt und danach nie wieder gezeigt (lokal auf dem Gerät gemerkt).',
            fields: [
              { type: 'string', name: 'banner_preview', label: 'Vorschau', ui: { component: SprachBannerPreview } },
              { type: 'boolean', name: 'enabled', label: 'Hinweis anzeigen?' },
              {
                type: 'string', name: 'position', label: 'Position',
                options: [
                  { value: 'unten', label: 'Unten (schwebende Karte, unten rechts)' },
                  { value: 'oben', label: 'Oben (Streifen unter der Nav)' },
                ],
              },
              { type: 'string', name: 'text', label: 'Hinweis-Text (Englisch)', ui: { component: 'textarea' } },
              { type: 'string', name: 'switch_label', label: 'Knopf „Zur englischen Seite" (Englisch)' },
              { type: 'string', name: 'stay_label', label: 'Knopf „Auf Deutsch bleiben"' },
            ],
          },
        ],
      },
      // --- Datenschutzerklärung: eigene Rechtstext-Seite (/datenschutz) ---
      {
        name: 'datenschutz',
        label: '⚖️ Datenschutz',
        path: 'src/data',
        format: 'json',
        match: { include: 'datenschutz' }, // nur src/data/datenschutz.json
        ui: { allowedActions: { create: false, delete: false }, router: () => '/datenschutz' },
        fields: [
          { type: 'string', name: 'ww_here', label: '⚖️ Datenschutz', ui: { component: SectionBanner } },
          { type: 'string', name: 'title_de', label: 'Titel' },
          { type: 'string', name: 'title_en', label: '↳ English', ui: { component: EnglishOnlyField } },
          { type: 'string', name: 'updated_de', label: 'Stand (z. B. „Stand: Juni 2026")' },
          { type: 'string', name: 'updated_en', label: '↳ English', ui: { component: EnglishOnlyField } },
          { type: 'rich-text', name: 'body_de', label: 'Inhalt', description: 'Formatieren über die Knopfleiste (Überschrift, Liste, Link …).', parser: { type: 'markdown', skipEscaping: 'html' } } as any,
          { type: 'rich-text', name: 'body_en', label: '↳ English (leer = Deutsch wird gezeigt)', parser: { type: 'markdown', skipEscaping: 'html' }, ui: { component: EnglishRichTextField } } as any,
        ],
      },
      // --- Impressum: eigene Rechtstext-Seite (/impressum) ---
      {
        name: 'impressum',
        label: '⚖️ Impressum',
        path: 'src/data',
        format: 'json',
        match: { include: 'impressum' }, // nur src/data/impressum.json
        ui: { allowedActions: { create: false, delete: false }, router: () => '/impressum' },
        fields: [
          { type: 'string', name: 'ww_here', label: '⚖️ Impressum', ui: { component: SectionBanner } },
          { type: 'string', name: 'title_de', label: 'Titel' },
          { type: 'string', name: 'title_en', label: '↳ English', ui: { component: EnglishOnlyField } },
          { type: 'string', name: 'updated_de', label: 'Stand (optional)' },
          { type: 'string', name: 'updated_en', label: '↳ English', ui: { component: EnglishOnlyField } },
          { type: 'rich-text', name: 'body_de', label: 'Inhalt', description: 'Formatieren über die Knopfleiste (Überschrift, Liste, Link …).', parser: { type: 'markdown', skipEscaping: 'html' } } as any,
          { type: 'rich-text', name: 'body_en', label: '↳ English (leer = Deutsch wird gezeigt)', parser: { type: 'markdown', skipEscaping: 'html' }, ui: { component: EnglishRichTextField } } as any,
        ],
      },
      // --- Statistik: versteckte Auswerte-Seite (/statistik), cookielose Web-Analyse ---
      {
        name: 'statistik',
        label: '📊 Statistik',
        path: 'src/data',
        format: 'json',
        match: { include: 'statistik' }, // nur src/data/statistik.json
        ui: { allowedActions: { create: false, delete: false }, router: () => '/statistik' },
        fields: [
          { type: 'string', name: 'ww_here', label: '📊 Statistik', ui: { component: SectionBanner } },
          {
            type: 'boolean', name: 'enabled', label: 'Statistik aktiv? (Tracking-Code auf der Website einbinden)',
            description: 'AUS (Standard): es wird NICHTS getrackt. AN: der unten eingefügte Analytics-Code wird auf allen Seiten geladen. Nutze einen cookielosen Dienst, dann ist kein Cookie-Banner nötig.',
          },
          {
            type: 'string', name: 'analytics_snippet', label: 'Analytics-Code (Tracking-Snippet deines Diensts)',
            description: 'Den kompletten <script>…</script>-Schnipsel deines Analyse-Diensts (z. B. Cloudflare Web Analytics, Plausible, Umami) hier einfügen. Wird nur geladen, wenn „Statistik aktiv?" an ist. (Öffentlicher Code, kein Geheimnis.)',
            ui: { component: 'textarea' },
          },
          {
            type: 'string', name: 'dashboard_url', label: 'Dashboard-URL (öffentlicher Freigabe-Link zum Einbetten)',
            description: 'Optional: die öffentliche „Shared Dashboard"-URL deines Diensts (Plausible/Umami) — dann erscheint die Auswertung direkt auf /statistik. Cloudflare Web Analytics lässt sich nicht einbetten; dort dann leer lassen.',
          },
          { type: 'string', name: 'intro_de', label: 'Einleitungstext', ui: { component: 'textarea' } },
          { type: 'string', name: 'intro_en', label: '↳ English', ui: { component: EnglishOnlyTextField } },
        ],
      },
    ],
  },
});

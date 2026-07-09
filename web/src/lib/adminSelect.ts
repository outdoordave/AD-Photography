// Geteilter Auswahl-Speicher für die Mehrfach-Auswahl in der NICHT-archivierten Übersicht. Die Karten
// sind einzelne React-Inseln (eine pro Karte) — sie können sich nicht direkt sehen. Dieser winzige
// Modul-Singleton koppelt sie: AdminSectionBar/AdminArchive schaltet den Auswahl-Modus + zeigt die
// Bulk-Leiste, jede Karte (AdminDocTools) zeigt im Modus ein Häkchen. Abo via subscribe(); ein Modus
// ist an EINEN Bereich (collection) gebunden, damit Auswahlen sich nicht über Bereiche mischen.

type Listener = () => void;
type State = { mode: boolean; collection: string | null; selected: Set<string> };

const state: State = { mode: false, collection: null, selected: new Set() };
const listeners = new Set<Listener>();
const notify = () => { listeners.forEach((l) => { try { l(); } catch (e) { /* egal */ } }); };

export function subscribeSelect(l: Listener): () => void { listeners.add(l); return () => { listeners.delete(l); }; }
export function getSelect(): State { return state; }
export function enterSelect(collection: string) { state.mode = true; state.collection = collection; state.selected = new Set(); notify(); }
export function exitSelect() { state.mode = false; state.selected = new Set(); notify(); }
export function toggleSelectItem(rp: string) { const n = new Set(state.selected); if (n.has(rp)) n.delete(rp); else n.add(rp); state.selected = n; notify(); }
export function isSelectedItem(rp: string): boolean { return state.selected.has(rp); }

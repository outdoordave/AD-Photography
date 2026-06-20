// Gruppiert eine BEREITS sortierte Liste in Jahreskapitel (Jahr absteigend).
// Das Jahr wird aus einem vorhandenen Datums-String („YYYY-…") abgeleitet — KEIN
// eigenes year-Feld nötig. Einträge ohne gültiges Datum landen als „Archiv"-Gruppe
// (isArchive) GANZ UNTEN. Reihenfolge innerhalb eines Jahres = Eingabereihenfolge
// (die Aufrufer liefern bereits sortiert: Stories nach Datum, Reisen nach order/Datum).

export type YearGroup<T> = { year: string; isArchive: boolean; items: T[] };

export function groupByYear<T>(items: T[], getDate: (item: T) => string | undefined): YearGroup<T>[] {
  const groups = new Map<string, T[]>();
  for (const it of items || []) {
    const d = (getDate(it) || '').trim();
    const m = d.match(/^(\d{4})/);
    const key = m ? m[1] : ''; // '' = kein gültiges Jahr -> Archiv
    const bucket = groups.get(key);
    if (bucket) bucket.push(it);
    else groups.set(key, [it]);
  }
  const years = Array.from(groups.keys()).filter(Boolean).sort((a, b) => b.localeCompare(a)); // absteigend
  const out: YearGroup<T>[] = years.map((y) => ({ year: y, isArchive: false, items: groups.get(y)! }));
  if (groups.has('')) out.push({ year: '', isArchive: true, items: groups.get('')! });
  return out;
}

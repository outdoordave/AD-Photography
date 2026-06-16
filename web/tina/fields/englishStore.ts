import React from 'react';

// Globaler „Englisch anzeigen?"-Schalter fuer den Editor (NICHT im Inhalt gespeichert).
// Standard: aus -> nur Deutsch. Ein Schalter oben steuert ALLE zweisprachigen Felder.
let on = false;
const subs = new Set<() => void>();

export const englishStore = {
  get: () => on,
  set: (v: boolean) => {
    if (v !== on) {
      on = v;
      subs.forEach((f) => f());
    }
  },
  toggle: () => englishStore.set(!on),
  subscribe: (f: () => void) => {
    subs.add(f);
    return () => {
      subs.delete(f);
    };
  },
};

// Hook: re-rendert die Komponente, wenn der Schalter umgelegt wird.
export function useEnglishOn(): boolean {
  const [v, setV] = React.useState(englishStore.get());
  React.useEffect(() => englishStore.subscribe(() => setV(englishStore.get())), []);
  return v;
}

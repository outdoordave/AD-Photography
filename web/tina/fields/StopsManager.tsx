import React from 'react';
import { wrapFieldsWithMeta } from 'tinacms';
import {
  DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy, useSortable, sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Flacher „Stationen-Manager" fürs Reise-Formular (NICHT verschachtelt): immer oben sichtbar,
// egal in welcher Station man gerade ist. Hinzufügen / Sortieren (Ziehen) / Löschen / Name +
// Art (Haupt/Zwischenstopp) + Anreise (Fahrt/Flug) je Zeile. Die Detailfelder (Ort, Texte,
// Fotos …) bleiben in Tinas nativer „Stationen"-Liste darunter.
//
// STABIL über die offizielle Tina-Form-API (final-form): form.mutators.push/move/remove auf der
// 'stops'-Liste, form.change('stops[i].feld', wert). Kein Fernsteuern der Vorschau, kein Hack.

type Stop = { name?: string; kind?: string; arriveBy?: string; [k: string]: any };

const C = { ink: '#2e2418', soft: '#6e5e49', line: '#d8cab2', bg: '#faf6ef', accent: '#a7672f' };

function Row({ index, stop, form }: { index: number; stop: Stop; form: any }) {
  const id = 'stop-' + index;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const [name, setName] = React.useState(stop?.name || '');
  React.useEffect(() => { setName(stop?.name || ''); }, [stop?.name]);

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1,
    display: 'flex', alignItems: 'center', gap: 8, padding: '7px 8px', marginBottom: 6,
    border: `1px solid ${C.line}`, borderRadius: 8, background: '#fff',
  };
  const set = (fld: string, val: string) => { try { form.change(`stops[${index}].${fld}`, val); } catch (e) { /* ignore */ } };

  return (
    <div ref={setNodeRef} style={style}>
      <span {...attributes} {...listeners} title="Ziehen zum Sortieren"
        style={{ cursor: 'grab', color: C.soft, fontSize: 16, lineHeight: 1, padding: '0 2px', touchAction: 'none', userSelect: 'none' }}>⠿</span>
      <span style={{ color: C.soft, fontSize: 12, minWidth: 18, textAlign: 'right' }}>{index + 1}</span>
      <input
        value={name}
        placeholder="Stationsname"
        onChange={(e) => { setName(e.target.value); set('name', e.target.value); }}
        style={{ flex: 1, minWidth: 90, padding: '6px 8px', border: `1px solid ${C.line}`, borderRadius: 6, fontSize: 13, color: C.ink, background: C.bg }}
      />
      <select value={stop?.kind === 'intermediate' ? 'intermediate' : 'main'} onChange={(e) => set('kind', e.target.value)} title="Art der Station"
        style={selStyle}>
        <option value="main">Hauptstation</option>
        <option value="intermediate">Zwischenstopp</option>
      </select>
      <select value={stop?.arriveBy === 'flight' ? 'flight' : 'drive'} onChange={(e) => set('arriveBy', e.target.value)} title="Anreise zu dieser Station"
        style={selStyle}>
        <option value="drive">🚗 Fahrt</option>
        <option value="flight">✈️ Flug</option>
      </select>
      <button type="button" title="Station löschen"
        onClick={() => { if (window.confirm(`Station „${stop?.name || index + 1}" wirklich löschen?`)) { try { form.mutators.remove('stops', index); } catch (e) { /* ignore */ } } }}
        style={{ border: 'none', background: 'transparent', color: '#b5573a', cursor: 'pointer', fontSize: 15, padding: '2px 4px' }}>🗑</button>
    </div>
  );
}

const selStyle: React.CSSProperties = {
  padding: '6px 6px', border: `1px solid ${C.line}`, borderRadius: 6, fontSize: 12, color: C.ink, background: '#fff', cursor: 'pointer',
};

const StopsManager = wrapFieldsWithMeta(({ form }: any) => {
  const [stops, setStops] = React.useState<Stop[]>(() => {
    try { const v = form.getState().values.stops; return Array.isArray(v) ? v : []; } catch (e) { return []; }
  });
  React.useEffect(() => {
    if (!form || typeof form.subscribe !== 'function') return;
    const unsub = form.subscribe((s: any) => { setStops(Array.isArray(s?.values?.stops) ? s.values.stops : []); }, { values: true });
    return unsub;
  }, [form]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  if (!form || !form.mutators || typeof form.mutators.push !== 'function') {
    return <div style={{ color: '#b5573a', fontSize: 13 }}>Stationen-Manager nicht verfügbar (Formular-API fehlt) — bitte Tinas native „Stationen"-Liste unten nutzen.</div>;
  }

  const ids = stops.map((_, i) => 'stop-' + i);
  function onDragEnd(e: any) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const from = ids.indexOf(String(active.id)), to = ids.indexOf(String(over.id));
    if (from < 0 || to < 0) return;
    try { form.mutators.move('stops', from, to); } catch (err) { /* ignore */ }
  }
  function addStop() {
    try { form.mutators.push('stops', { name: 'Neue Station', kind: 'main', arriveBy: 'drive' }); } catch (e) { /* ignore */ }
  }

  return (
    <div>
      {stops.length === 0 ? (
        <div style={{ color: C.soft, fontSize: 13, marginBottom: 8 }}>Noch keine Stationen — füge die erste hinzu.</div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={ids} strategy={verticalListSortingStrategy}>
            {stops.map((s, i) => <Row key={'stop-' + i} index={i} stop={s} form={form} />)}
          </SortableContext>
        </DndContext>
      )}
      <button type="button" onClick={addStop}
        style={{ marginTop: 4, padding: '9px 14px', borderRadius: 7, background: C.accent, color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
        + Station hinzufügen
      </button>
      <div style={{ color: C.soft, fontSize: 12, marginTop: 8 }}>
        {stops.length} Station(en) · Ziehen zum Sortieren · 🗑 löschen. Detailfelder (Ort, Texte, Fotos …) unten in der „Stationen"-Liste.
      </div>
    </div>
  );
});

export default StopsManager;

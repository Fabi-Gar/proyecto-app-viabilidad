"use client";

/** Pestaña Requerimientos (input nuevo para el informe):
 *  ID · Requerimiento · Tipo (funcional/no funcional) · Prioridad (alta/media/baja). */
import { useProy } from "./contexto";
import { TextInput, Select } from "./campos";
import type { TipoRequerimiento, Prioridad } from "@/lib/tipos";

const TIPOS: [TipoRequerimiento, string][] = [
  ["Funcional", "Funcional"],
  ["No funcional", "No funcional"],
];
const PRIORIDADES: [Prioridad, string][] = [
  ["Alta", "Alta"],
  ["Media", "Media"],
  ["Baja", "Baja"],
];

export function PanelRequerimientos() {
  const { p, mut } = useProy();
  return (
    <section className="panel">
      <div className="phead">
        <div>
          <h2>Requerimientos</h2>
          <p>
            Lista de requerimientos del proyecto. Entran en el informe como tabla ID ·
            Requerimiento · Tipo · Prioridad.
          </p>
        </div>
      </div>
      <div className="card">
        <div className="tw">
          <table>
            <thead>
              <tr>
                <th className="l" style={{ width: 90 }}>ID</th>
                <th className="l">Requerimiento</th>
                <th className="l" style={{ width: 150 }}>Tipo</th>
                <th className="l" style={{ width: 120 }}>Prioridad</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {p.requerimientos.map((r, i) => (
                <tr key={i}>
                  <td className="l">
                    <TextInput value={r.id} onText={(v) => mut((n) => { n.requerimientos[i].id = v; })} aria-label="ID" placeholder="RF-01" />
                  </td>
                  <td className="l" style={{ minWidth: 240 }}>
                    <TextInput value={r.texto} onText={(v) => mut((n) => { n.requerimientos[i].texto = v; })} aria-label="Requerimiento" placeholder="Describe el requerimiento" invalid={!r.texto.trim()} />
                  </td>
                  <td className="l">
                    <Select value={r.tipo} onPick={(v) => mut((n) => { n.requerimientos[i].tipo = v; })} options={TIPOS} aria-label="Tipo" />
                  </td>
                  <td className="l">
                    <Select value={r.prioridad} onPick={(v) => mut((n) => { n.requerimientos[i].prioridad = v; })} options={PRIORIDADES} aria-label="Prioridad" />
                  </td>
                  <td>
                    <button className="x" aria-label="Quitar requerimiento" onClick={() => mut((n) => { n.requerimientos.splice(i, 1); })}>×</button>
                  </td>
                </tr>
              ))}
              {!p.requerimientos.length && (
                <tr>
                  <td className="l muted" colSpan={5}>
                    Aún no hay requerimientos. Agrega el primero.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div>
          <button
            className="btn"
            onClick={() =>
              mut((n) => {
                const num = String(n.requerimientos.length + 1).padStart(2, "0");
                n.requerimientos.push({ id: `RF-${num}`, texto: "", tipo: "Funcional", prioridad: "Media" });
              })
            }
          >
            Agregar requerimiento
          </button>
        </div>
      </div>
    </section>
  );
}

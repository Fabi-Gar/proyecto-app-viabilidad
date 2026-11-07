"use client";

/** Pestaña genérica de un enfoque con criterios 1-5 (Técnica, Operativa, Mercado,
 *  Socioambiental, Estratégica, Ciclo de vida). Incluye FODA (Estratégica) y el
 *  editor de fases del ciclo de vida (Ciclo de vida). */
import { useProy } from "./contexto";
import { TextInput, Select } from "./campos";
import { PestelEditor, BscEditor } from "./EstrategiaEditors";
import { KpiEditor } from "./KpiEditor";
import { RATING, fmt, type Dim } from "@/lib/calculo";
import type { DimScoreKey, EstadoFase } from "@/lib/tipos";

const RATING_OPTS: [number, string][] = RATING.map((r, j) => [j + 1, `${j + 1} · ${r}`]);
const ESTADOS: [EstadoFase, string][] = [
  ["Completada", "Completada"],
  ["En progreso", "En progreso"],
  ["Pendiente", "Pendiente"],
];

function Foda() {
  const { p, mut } = useProy();
  const campos: [keyof typeof p.foda, string][] = [
    ["f", "Fortalezas"],
    ["d", "Debilidades"],
    ["o", "Oportunidades"],
    ["a", "Amenazas"],
  ];
  return (
    <div className="card">
      <h3>Cuadro FODA</h3>
      <div className="grid">
        {campos.map(([k, label]) => (
          <div className="field" key={k}>
            <label>{label} (una por línea)</label>
            <textarea
              value={p.foda[k]}
              onChange={(e) => mut((n) => { n.foda[k] = e.target.value; })}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function CicloVidaEditor() {
  const { p, mut } = useProy();
  return (
    <div className="card">
      <h3>Fases del ciclo de vida</h3>
      <p className="hint">
        Preinversión (perfil, prefactibilidad, factibilidad) y las fases de monitoreo y
        evaluación ex-post. Indica el estado y la evidencia de cada una.
      </p>
      <div className="tw">
        <table>
          <thead>
            <tr>
              <th className="l">Fase</th>
              <th className="l">Estado</th>
              <th className="l">Nota / evidencia</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {p.cicloVida.map((fase, i) => (
              <tr key={i}>
                <td className="l" style={{ minWidth: 140 }}>
                  <TextInput value={fase.fase} onText={(v) => mut((n) => { n.cicloVida[i].fase = v; })} aria-label="Fase" />
                </td>
                <td className="l">
                  <Select value={fase.estado} onPick={(v) => mut((n) => { n.cicloVida[i].estado = v; })} options={ESTADOS} aria-label="Estado" />
                </td>
                <td className="l" style={{ minWidth: 220 }}>
                  <TextInput value={fase.nota} onText={(v) => mut((n) => { n.cicloVida[i].nota = v; })} aria-label="Nota" placeholder="Detalle o evidencia" />
                </td>
                <td>
                  <button className="x" aria-label="Quitar fase" onClick={() => mut((n) => { n.cicloVida.splice(i, 1); })}>×</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div>
        <button className="btn" onClick={() => mut((n) => { n.cicloVida.push({ fase: "Nueva fase", estado: "Pendiente", nota: "" }); })}>
          Agregar fase
        </button>
      </div>
    </div>
  );
}

export function PanelEnfoque({ dim }: { dim: Dim }) {
  const { p, mut, m } = useProy();
  const k = dim.k as DimScoreKey;
  const scores = p.scores[k];
  const notes = p.notes[k];

  return (
    <section className="panel">
      <div className="phead">
        <div>
          <h2>Viabilidad {dim.n.toLowerCase()}</h2>
          <p>{dim.intro}</p>
        </div>
        <div className="badge">
          <small>Puntaje</small>
          <span>{fmt(m.sc[dim.k], 0)} / 100</span>
        </div>
      </div>
      <div className="card">
        <div className="hint">
          Califica de 1 (muy deficiente) a 5 (excelente) según la evidencia disponible.
          Anota la evidencia en cada línea.
        </div>
        {dim.crit!.map((c, i) => (
          <div className="crit" key={i}>
            <div>
              <div className="q">{c[0]}</div>
              <div className="hint">{c[1]}</div>
            </div>
            <Select
              value={scores[i]}
              numeric
              onPick={(v) => mut((n) => { n.scores[k][i] = v; })}
              options={RATING_OPTS}
              aria-label="Calificación"
            />
            <div className="nt">
              <TextInput
                value={notes[i]}
                onText={(v) => mut((n) => { n.notes[k][i] = v; })}
                placeholder="Evidencia o comentario"
              />
            </div>
          </div>
        ))}
      </div>
      {dim.foda && <Foda />}
      {dim.foda && <PestelEditor />}
      {dim.foda && <BscEditor />}
      {dim.kpis && <CicloVidaEditor />}
      {dim.kpis && <KpiEditor />}
    </section>
  );
}

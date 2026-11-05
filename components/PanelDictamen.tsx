"use client";

/** Pestaña Dictamen: resultado integrado (Go / Go condicionado / No Go), radar,
 *  pesos por enfoque, condiciones de aprobación y recomendaciones. */
import { useProy } from "./contexto";
import { NumInput } from "./campos";
import { Radar } from "./Graficas";
import { BotonesEnvio } from "./BotonesEnvio";
import { DIMS, fmt } from "@/lib/calculo";

const NOMBRE: Record<string, string> = {
  go: "GO",
  cond: "GO CONDICIONADO",
  nogo: "NO GO",
};
const MENSAJE: Record<string, string> = {
  go: "El proyecto cumple todas las condiciones. Se recomienda aprobarlo.",
  cond: "El proyecto es financieramente atractivo, pero hay condiciones por resolver antes de aprobarlo.",
  nogo: "El proyecto no cumple los mínimos de viabilidad en su estado actual.",
};

export function PanelDictamen() {
  const { p, mut, m } = useProy();
  const v = m.verdict.v;

  return (
    <section className="panel">
      <div className="phead">
        <div>
          <h2>Dictamen de factibilidad</h2>
          <p>Resultado integrado de todos los enfoques.</p>
        </div>
      </div>

      <div className={"verdict " + v}>
        <div className="eyebrow" style={{ fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase" }}>
          Dictamen
        </div>
        <div className="big">{NOMBRE[v]}</div>
        <p>
          {MENSAJE[v]} Puntaje global {fmt(m.total, 0)} de 100.
        </p>
      </div>

      <div className="split">
        <div className="card">
          <h3>Perfil por enfoque</h3>
          <Radar sc={m.sc} />
        </div>
        <div className="card">
          <h3>Puntaje y peso</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {DIMS.map((d) => (
              <div className="dim" key={d.k}>
                <span>{d.n}</span>
                <div className="bar">
                  <i style={{ width: `${m.sc[d.k]}%` }} />
                </div>
                <span className="num">{fmt(m.sc[d.k], 0)}</span>
                <span title="Peso en el puntaje global">
                  <NumInput value={p.pesos[d.k]} onNum={(val) => mut((n) => { n.pesos[d.k] = val; })} min={0} aria-label={"Peso de " + d.n} />
                </span>
              </div>
            ))}
            <div className="hint">
              Los pesos se normalizan: no es necesario que sumen 100.
            </div>
          </div>
          <div className="grid" style={{ marginTop: 6 }}>
            <div className="field">
              <label>Umbral para Go</label>
              <NumInput value={p.umbralGo} onNum={(val) => mut((n) => { n.umbralGo = val; })} />
            </div>
            <div className="field">
              <label>Umbral mínimo (bajo esto, No Go)</label>
              <NumInput value={p.umbralCond} onNum={(val) => mut((n) => { n.umbralCond = val; })} />
            </div>
          </div>
        </div>
      </div>

      <div className="split">
        <div className="card">
          <h3>Condiciones de aprobación</h3>
          <div>
            {m.verdict.checks.map((c, i) => (
              <div className="chk" key={i}>
                <b className={c.ok ? "ok" : "ko"}>{c.ok ? "✓" : "✗"}</b>
                <div>
                  {c.n}
                  <div className="hint num">{c.d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <h3>Recomendaciones</h3>
          {m.verdict.recs.length ? (
            <ul className="recs">
              {m.verdict.recs.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          ) : (
            <p className="muted">Sin recomendaciones pendientes.</p>
          )}
        </div>
      </div>

      <BotonesEnvio />
    </section>
  );
}

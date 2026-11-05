"use client";

/** Pestaña Riesgos: matriz probabilidad × impacto, mapa de calor, escenarios y
 *  simulación Monte Carlo. */
import { useProy } from "./contexto";
import { NumInput, TextInput, Select } from "./campos";
import { MapaCalor } from "./MapaCalor";
import { Histograma } from "./Graficas";
import { lvlOf, LVN, money, pct, yrs, fmt, RISK_TYPES, type CalcResult } from "@/lib/calculo";

const CONTROLES: [number, string][] = [
  [0, "Sin control"],
  [25, "Bajo 25%"],
  [50, "Medio 50%"],
  [75, "Alto 75%"],
];
const UNO_A_CINCO: [number, string][] = [1, 2, 3, 4, 5].map((x) => [x, String(x)]);

function Tile({ k, v, s, cls }: { k: string; v: string; s?: string; cls?: "good" | "bad" | "" }) {
  return (
    <div className={"tile " + (cls || "")}>
      <div className="k">{k}</div>
      <div className="v">{v}</div>
      <div className="s">{s || ""}</div>
    </div>
  );
}

function FilaEscenario({
  titulo,
  tipo,
  x,
}: {
  titulo: string;
  tipo: "pes" | "opt" | "base";
  x: CalcResult;
}) {
  const { p, mut } = useProy();
  const mon = p.moneda;
  if (tipo === "base") {
    return (
      <tr>
        <td className="l">Base</td>
        <td className="n">100</td>
        <td className="n">100</td>
        <td className="n">100</td>
        <td className={"n " + (x.van >= 0 ? "ok" : "ko")}>{money(x.van, mon)}</td>
        <td className="n">{pct(x.tir)}</td>
        <td className="n">{yrs(x.pb)}</td>
      </tr>
    );
  }
  const esc = p.esc[tipo];
  const campo = (k: "b" | "c" | "i") => (
    <td>
      <NumInput
        value={esc[k]}
        onNum={(v) => mut((n) => { n.esc[tipo][k] = v; })}
        style={{ width: 78, textAlign: "right", padding: "4px 6px" }}
        aria-label={k}
      />
    </td>
  );
  return (
    <tr>
      <td className="l">{titulo}</td>
      {campo("b")}
      {campo("c")}
      {campo("i")}
      <td className={"n " + (x.van >= 0 ? "ok" : "ko")}>{money(x.van, mon)}</td>
      <td className="n">{pct(x.tir)}</td>
      <td className="n">{yrs(x.pb)}</td>
    </tr>
  );
}

export function PanelRiesgos() {
  const { p, mut, m } = useProy();
  const mon = p.moneda;
  const mc = m.mcr;
  const mcFields: [keyof typeof p.mc, string][] = [
    ["bmin", "Beneficios mín. %"],
    ["bmax", "Beneficios máx. %"],
    ["cmin", "Costos op. mín. %"],
    ["cmax", "Costos op. máx. %"],
    ["imin", "Inversión mín. %"],
    ["imax", "Inversión máx. %"],
  ];

  return (
    <section className="panel">
      <div className="phead">
        <div>
          <h2>Gestión de riesgos</h2>
          <p>
            Matriz cualitativa de probabilidad por impacto, con el control que reduce
            cada riesgo. Más abajo, escenarios y simulación Monte Carlo.
          </p>
        </div>
        <div className="badge">
          <small>Puntaje</small>
          <span>{fmt(m.sc.rie, 0)} / 100</span>
        </div>
      </div>

      <div className="card">
        <h3>Matriz de riesgos</h3>
        <div className="tw">
          <table className="rtbl">
            <thead>
              <tr>
                <th className="l">Riesgo</th>
                <th className="l">Tipo</th>
                <th>Prob. (1-5)</th>
                <th>Impacto (1-5)</th>
                <th>Control</th>
                <th>Inherente</th>
                <th>Residual</th>
                <th>Nivel</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {p.riesgos.map((r, i) => {
                const calc = m.rk.rs[i];
                const lv = lvlOf(calc.res);
                return (
                  <tr key={i}>
                    <td className="l" style={{ minWidth: 180 }}>
                      <TextInput
                        value={r.n}
                        onText={(v) => mut((n) => { n.riesgos[i].n = v; })}
                        aria-label="Riesgo"
                        invalid={!r.n.trim()}
                      />
                    </td>
                    <td className="l">
                      <Select
                        value={r.t}
                        onPick={(v) => mut((n) => { n.riesgos[i].t = v; })}
                        options={RISK_TYPES.map((x) => [x, x] as [string, string])}
                        aria-label="Tipo"
                      />
                    </td>
                    <td>
                      <Select value={r.p} numeric onPick={(v) => mut((n) => { n.riesgos[i].p = v; })} options={UNO_A_CINCO} aria-label="Probabilidad" />
                    </td>
                    <td>
                      <Select value={r.i} numeric onPick={(v) => mut((n) => { n.riesgos[i].i = v; })} options={UNO_A_CINCO} aria-label="Impacto" />
                    </td>
                    <td>
                      <Select value={r.m} numeric onPick={(v) => mut((n) => { n.riesgos[i].m = v; })} options={CONTROLES} aria-label="Control" />
                    </td>
                    <td className="n">{fmt(calc.inh, 0)}</td>
                    <td className="n">{fmt(calc.res, 1)}</td>
                    <td>
                      <span className={"lvl " + lv}>{LVN[lv]}</span>
                    </td>
                    <td>
                      <button
                        className="x"
                        aria-label="Quitar riesgo"
                        onClick={() => mut((n) => { if (n.riesgos.length > 1) n.riesgos.splice(i, 1); })}
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div>
          <button
            className="btn"
            onClick={() => mut((n) => { n.riesgos.push({ n: "Nuevo riesgo", t: "Operativo", p: 3, i: 3, m: 0 }); })}
          >
            Agregar riesgo
          </button>
        </div>
        <p className="hint">
          Residual = probabilidad × impacto × (1 − efectividad del control). Bajo menor a
          5, medio 5 a 9.9, alto 10 a 14.9, crítico desde 15.
        </p>
      </div>

      <div className="split">
        <div className="card">
          <h3>Mapa de calor (riesgo inherente)</h3>
          <MapaCalor riesgos={p.riesgos} />
        </div>
        <div className="card">
          <h3>Escenarios</h3>
          <div className="tw">
            <table>
              <thead>
                <tr>
                  <th className="l">Escenario</th>
                  <th>Beneficios %</th>
                  <th>Costos op. %</th>
                  <th>Inversión %</th>
                  <th>VAN</th>
                  <th>TIR</th>
                  <th>Recuperación</th>
                </tr>
              </thead>
              <tbody>
                <FilaEscenario titulo="Pesimista" tipo="pes" x={m.pes} />
                <FilaEscenario titulo="Base" tipo="base" x={m.f} />
                <FilaEscenario titulo="Optimista" tipo="opt" x={m.opt} />
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="card">
        <h3>Simulación Monte Carlo (5,000 corridas)</h3>
        <p className="hint">
          Cada variable cambia al azar entre un mínimo y un máximo (distribución
          triangular, con el caso base como valor más probable).
        </p>
        <div className="grid">
          {mcFields.map(([k, label]) => (
            <div className="field" key={k}>
              <label>{label}</label>
              <NumInput value={p.mc[k]} onNum={(v) => mut((n) => { n.mc[k] = v; })} />
            </div>
          ))}
        </div>
        <div className="tiles">
          <Tile k="VAN promedio" v={money(mc.mean, mon)} />
          <Tile k="Probabilidad de VAN > 0" v={pct(mc.p, 1)} cls={mc.p >= 0.7 ? "good" : "bad"} />
          <Tile k="VAN percentil 5" v={money(mc.p5, mon)} s="Caso adverso" cls={mc.p5 >= 0 ? "good" : ""} />
          <Tile k="VAN mediana" v={money(mc.p50, mon)} />
          <Tile k="VAN percentil 95" v={money(mc.p95, mon)} s="Caso favorable" />
        </div>
        <Histograma mc={mc} moneda={mon} />
      </div>
    </section>
  );
}

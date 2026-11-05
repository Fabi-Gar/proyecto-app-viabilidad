"use client";

/** Pestaña Financiera: inversión/beneficios/costos + VAN, TIR, B/C, recuperación,
 *  flujo de caja, sensibilidad y tornado. */
import { useProy } from "./contexto";
import { NumInput, TextInput } from "./campos";
import { Tornado, type TornadoItem } from "./Graficas";
import { calc, vanFrom, money, pct, yrs, fmt } from "@/lib/calculo";

type ListKey = "inv" | "ben" | "cos";
type Fila = { n: string; v: number; g?: number };

function Lista({ keyName, titulo }: { keyName: ListKey; titulo: string }) {
  const { p, mut } = useProy();
  const withG = keyName !== "inv";
  const lineas = p[keyName];
  return (
    <div className="card">
      <h3>{titulo}</h3>
      <div className={"lhead " + (withG ? "g" : "")}>
        <span>Concepto</span>
        <span>{withG ? "Monto del año 1" : "Monto"}</span>
        {withG && <span>Crec. anual %</span>}
        <span />
      </div>
      {lineas.map((x, i) => (
        <div key={i} className={"lrow " + (withG ? "g" : "")} style={{ marginBottom: 8 }}>
          <TextInput
            value={x.n}
            onText={(v) => mut((n) => { (n[keyName] as Fila[])[i].n = v; })}
            aria-label="Concepto"
            placeholder="Concepto"
          />
          <NumInput
            value={x.v}
            onNum={(v) => mut((n) => { (n[keyName] as Fila[])[i].v = v; })}
            aria-label="Monto"
            placeholder="0"
          />
          {withG && (
            <NumInput
              value={(x as Fila).g ?? 0}
              onNum={(v) => mut((n) => { (n[keyName] as Fila[])[i].g = v; })}
              aria-label="Crecimiento anual en porcentaje"
              placeholder="0"
            />
          )}
          <button
            className="x"
            aria-label="Quitar línea"
            onClick={() =>
              mut((n) => {
                const arr = n[keyName] as Fila[];
                if (arr.length > 1) arr.splice(i, 1);
              })
            }
          >
            ×
          </button>
        </div>
      ))}
      <div>
        <button
          className="btn"
          onClick={() =>
            mut((n) => {
              if (keyName === "inv") n.inv.push({ n: "Nuevo concepto", v: 0 });
              else if (keyName === "ben") n.ben.push({ n: "Nuevo concepto", v: 0, g: 0 });
              else n.cos.push({ n: "Nuevo concepto", v: 0, g: 0 });
            })
          }
        >
          Agregar línea
        </button>
      </div>
    </div>
  );
}

function Tile({
  k,
  v,
  s,
  cls,
}: {
  k: string;
  v: string;
  s?: string;
  cls?: "good" | "bad" | "";
}) {
  return (
    <div className={"tile " + (cls || "")}>
      <div className="k">{k}</div>
      <div className="v">{v}</div>
      <div className="s">{s || ""}</div>
    </div>
  );
}

export function PanelFinanciera() {
  const { p, mut, m } = useProy();
  const f = m.f;
  const mon = p.moneda;
  const tasaOk = f.tir != null && f.tir >= p.tasa / 100;

  // Flujo acumulado
  let cum = 0;
  const cumRow = f.net.map((x) => (cum += x));

  // Sensibilidad
  const bd = [-0.3, -0.2, -0.1, 0, 0.1, 0.2, 0.3];
  const cd = [-0.2, -0.1, 0, 0.1, 0.2, 0.3];
  const grid = bd.map((b) => cd.map((c) => vanFrom(f.pvB, f.pvC, f.inv0, b, c, c)));
  const mxa = Math.max(...grid.flat().map(Math.abs)) || 1;
  const kB = f.pvB > 0 ? (f.inv0 + f.pvC) / f.pvB : null;

  // Tornado
  const r = p.tasa / 100;
  const vv = (b: number, c: number, i: number) => calc(p, { b, c, i }).van;
  const tor: TornadoItem[] = (
    [
      { n: "Beneficios", lo: vv(0.8, 1, 1), hi: vv(1.2, 1, 1) },
      { n: "Costos operativos", lo: vv(1, 1.2, 1), hi: vv(1, 0.8, 1) },
      { n: "Inversión inicial", lo: vv(1, 1, 1.2), hi: vv(1, 1, 0.8) },
      {
        n: "Tasa de descuento",
        lo: calc(p, { b: 1, c: 1, i: 1 }, r + 0.05).van,
        hi: calc(p, { b: 1, c: 1, i: 1 }, Math.max(0, r - 0.05)).van,
      },
    ] as { n: string; lo: number; hi: number }[]
  )
    .map((t) => ({ ...t, ll: money(t.lo, mon), hl: money(t.hi, mon) }))
    .sort((a, b) => Math.abs(b.hi - b.lo) - Math.abs(a.hi - a.lo));

  return (
    <section className="panel">
      <div className="phead">
        <div>
          <h2>Viabilidad financiera</h2>
          <p>
            Ingresa inversión, beneficios y costos. Se calculan VAN, TIR,
            costo-beneficio, recuperación y sensibilidad.
          </p>
        </div>
        <div className="badge">
          <small>Puntaje</small>
          <span>{fmt(m.sc.fin, 0)} / 100</span>
        </div>
      </div>

      <div className="card">
        <div className="grid">
          <div className="field">
            <label>Horizonte (años, máx. 15)</label>
            <NumInput value={p.horizonte} onNum={(v) => mut((n) => { n.horizonte = v; })} min={1} max={15} invalid={p.horizonte < 1} />
          </div>
          <div className="field">
            <label>Tasa de descuento anual (%)</label>
            <NumInput value={p.tasa} onNum={(v) => mut((n) => { n.tasa = v; })} />
          </div>
          <div className="field">
            <label>Contingencia sobre la inversión (%)</label>
            <NumInput value={p.conting} onNum={(v) => mut((n) => { n.conting = v; })} />
          </div>
          <div className="field">
            <label>Valor residual al final</label>
            <NumInput value={p.residual} onNum={(v) => mut((n) => { n.residual = v; })} />
          </div>
          <div className="field">
            <label>Símbolo de moneda</label>
            <TextInput value={p.moneda} onText={(v) => mut((n) => { n.moneda = v; })} maxLength={4} invalid={!p.moneda.trim()} />
          </div>
        </div>
      </div>

      <div className="split">
        <Lista keyName="inv" titulo="Inversión inicial (año 0)" />
        <div style={{ display: "flex", flexDirection: "column", gap: 20, minWidth: 0 }}>
          <Lista keyName="ben" titulo="Beneficios anuales (ingresos y ahorros)" />
          <Lista keyName="cos" titulo="Costos operativos anuales" />
        </div>
      </div>

      <div className="tiles">
        <Tile k="VAN" v={money(f.van, mon)} s={f.van > 0 ? "Crea valor" : "Destruye valor"} cls={f.van > 0 ? "good" : "bad"} />
        <Tile k="TIR" v={pct(f.tir)} s={`Tasa de descuento ${fmt(p.tasa, 1)}%`} cls={tasaOk ? "good" : "bad"} />
        <Tile k="Beneficio / costo" v={f.bc == null ? "n/d" : fmt(f.bc, 2)} s="Valor presente de beneficios ÷ costos" cls={f.bc != null && f.bc > 1 ? "good" : "bad"} />
        <Tile k="Recuperación" v={yrs(f.pb)} s="Sin descontar" cls={f.pb != null && f.pb <= f.H ? "good" : "bad"} />
        <Tile k="Recuperación descontada" v={yrs(f.pbd)} s={`Horizonte ${f.H} años`} cls={f.pbd != null && f.pbd <= f.H ? "good" : "bad"} />
        <Tile k="Inversión total" v={money(f.inv0, mon)} s={`Incluye ${fmt(p.conting, 0)}% de contingencia`} />
      </div>

      <div className="card">
        <h3>Flujo de caja proyectado</h3>
        <div className="tw">
          <table>
            <thead>
              <tr>
                <th>Año</th>
                {f.net.map((_, t) => (
                  <th key={t}>{t}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Beneficios</td>
                {f.benT.map((x, t) => (
                  <td key={t} className="n">{fmt(x, 0)}</td>
                ))}
              </tr>
              <tr>
                <td>Costos operativos</td>
                {f.cosT.map((x, t) => (
                  <td key={t} className="n">{fmt(-x, 0)}</td>
                ))}
              </tr>
              <tr>
                <td>Inversión</td>
                {f.net.map((_, t) => (
                  <td key={t} className="n">{t === 0 ? fmt(-f.inv0, 0) : "0"}</td>
                ))}
              </tr>
              <tr>
                <td><b>Flujo neto</b></td>
                {f.net.map((x, t) => (
                  <td key={t} className="n"><b>{fmt(x, 0)}</b></td>
                ))}
              </tr>
              <tr>
                <td>Acumulado</td>
                {cumRow.map((x, t) => (
                  <td key={t} className={"n " + (x >= 0 ? "ok" : "ko")}>{fmt(x, 0)}</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h3>Análisis de sensibilidad</h3>
        <p className="hint">
          VAN al variar los beneficios (filas) y los costos de inversión y operación
          (columnas).
        </p>
        <div className="tw">
          <table className="sens">
            <thead>
              <tr>
                <th className="l">Beneficios \ Costos</th>
                {cd.map((c) => (
                  <th key={c}>{c > 0 ? "+" : ""}{c * 100}%</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bd.map((b, i) => (
                <tr key={b}>
                  <td style={{ fontWeight: 600, fontFamily: "var(--mono)" }}>
                    {b > 0 ? "+" : ""}{b * 100}%
                  </td>
                  {grid[i].map((val, j) => {
                    const a = Math.round((Math.abs(val) / mxa) * 55);
                    return (
                      <td
                        key={j}
                        style={{
                          background: `color-mix(in srgb, var(${val >= 0 ? "--good" : "--bad"}) ${a}%, var(--surface))`,
                        }}
                      >
                        {fmt(val, 0)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          {kB == null ? "" : kB < 1 ? (
            <>
              Los beneficios pueden caer hasta <b>{fmt((1 - kB) * 100, 1)}%</b> antes de que
              el VAN llegue a cero. Los costos totales pueden subir hasta{" "}
              <b>{fmt((1 / kB - 1) * 100, 1)}%</b>.
            </>
          ) : (
            <>
              Los beneficios deben subir al menos <b>{fmt((kB - 1) * 100, 1)}%</b> para que el
              VAN llegue a cero.
            </>
          )}
        </p>
      </div>

      <div className="card">
        <h3>Variables que más mueven el VAN</h3>
        <p className="hint">
          Cada barra aplica ±20% a la variable (±5 puntos en la tasa de descuento).
        </p>
        <Tornado items={tor} base={f.van} moneda={mon} />
      </div>
    </section>
  );
}

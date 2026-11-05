"use client";

/**
 * Vista pública del informe (solo lectura). Rinde las mismas secciones que el
 * PDF a partir de { p, m }, reutilizando el radar y el mapa de calor. Se usa en
 * la página /informe/[id] a la que llega el enlace de WhatsApp.
 */
import { useState } from "react";
import { Radar } from "./Graficas";
import { MapaCalor } from "./MapaCalor";
import { DIMS, lvlOf, LVN, money, pct, yrs, fmt } from "@/lib/calculo";
import { slug } from "@/lib/compartir";
import type { Proyecto } from "@/lib/tipos";
import type { Model } from "@/lib/calculo";

const PILL: Record<string, string> = { go: "GO", cond: "GO CONDICIONADO", nogo: "NO GO" };
const MSG: Record<string, string> = {
  go: "El proyecto cumple todas las condiciones. Se recomienda aprobarlo.",
  cond: "El proyecto es financieramente atractivo, pero hay condiciones por resolver antes de aprobarlo.",
  nogo: "El proyecto no cumple los mínimos de viabilidad en su estado actual.",
};

function Tile({ k, v, s, cls }: { k: string; v: string; s?: string; cls?: string }) {
  return (
    <div className={"tile " + (cls || "")}>
      <div className="k">{k}</div>
      <div className="v">{v}</div>
      {s ? <div className="s">{s}</div> : null}
    </div>
  );
}

export function InformeView({ p, m }: { p: Proyecto; m: Model }) {
  const mon = p.moneda;
  const f = m.f;
  const v = m.verdict.v;
  const [gen, setGen] = useState(false);

  let cum = 0;
  const flujo = f.net.map((net, t) => ({ t, ben: f.benT[t], cos: f.cosT[t], inv: t === 0 ? -f.inv0 : 0, net, cum: (cum += net) }));
  const riesgos = [...m.rk.rs].sort((a, b) => b.res - a.res);

  async function descargarPDF() {
    setGen(true);
    try {
      const [{ pdf }, { InformePDF }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("@/pdf/InformePDF"),
      ]);
      const blob = await pdf(<InformePDF p={p} m={m} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `informe-viabilidad-${slug(p.nombre)}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Error al generar el PDF:", e);
    } finally {
      setGen(false);
    }
  }

  return (
    <div className="wrap">
      <header className="top">
        <div className="t">
          <div className="eyebrow">Informe de viabilidad 360°</div>
          <div className="pname">{p.nombre || "Proyecto sin nombre"}</div>
        </div>
        <div className="right">
          <span className="gscore">{fmt(m.total, 0)} / 100</span>
          <span className={"pill " + v}>{PILL[v]}</span>
          <button className="btn" onClick={descargarPDF} disabled={gen}>
            {gen ? "Generando…" : "Descargar PDF"}
          </button>
        </div>
      </header>

      <main style={{ display: "flex", flexDirection: "column", gap: 20, paddingTop: 22 }}>
        <div className={"verdict " + v}>
          <div className="eyebrow">Dictamen</div>
          <div className="big">{PILL[v]}</div>
          <p>{MSG[v]} Puntaje global {fmt(m.total, 0)} de 100.</p>
        </div>

        <section>
          <div className="phead"><h2>Documentación y resumen</h2></div>
          <p className="muted" style={{ marginTop: 10 }}>{p.desc || "Sin descripción."}</p>
        </section>

        <section>
          <div className="phead"><h2>Requerimientos</h2></div>
          <div className="card" style={{ marginTop: 12 }}>
            {p.requerimientos.length === 0 ? (
              <p className="muted">No se registraron requerimientos.</p>
            ) : (
              <div className="tw">
                <table>
                  <thead><tr><th className="l">ID</th><th className="l">Requerimiento</th><th className="l">Tipo</th><th className="l">Prioridad</th></tr></thead>
                  <tbody>
                    {p.requerimientos.map((r, i) => (
                      <tr key={i}><td className="l">{r.id}</td><td className="l">{r.texto}</td><td className="l">{r.tipo}</td><td className="l">{r.prioridad}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        <section>
          <div className="phead"><h2>Ciclo de vida</h2></div>
          <div className="card" style={{ marginTop: 12 }}>
            {p.cicloVida.length === 0 ? (
              <p className="muted">Sin fases registradas.</p>
            ) : (
              <div className="tw">
                <table>
                  <thead><tr><th className="l">Fase</th><th className="l">Estado</th><th className="l">Nota / evidencia</th></tr></thead>
                  <tbody>
                    {p.cicloVida.map((c, i) => (
                      <tr key={i}><td className="l">{c.fase}</td><td className="l">{c.estado}</td><td className="l">{c.nota}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        <section>
          <div className="phead"><h2>Cronograma</h2></div>
          <div className="card" style={{ marginTop: 12 }}>
            {p.cronograma.length === 0 ? (
              <p className="muted">Sin fases de cronograma.</p>
            ) : (
              <div className="tw">
                <table>
                  <thead><tr><th className="l">Fase</th><th className="l">Inicio</th><th className="l">Fin</th><th className="l">Responsable</th></tr></thead>
                  <tbody>
                    {p.cronograma.map((c, i) => (
                      <tr key={i}><td className="l">{c.fase}</td><td className="l">{c.inicio || "—"}</td><td className="l">{c.fin || "—"}</td><td className="l">{c.responsable}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        <section>
          <div className="phead"><h2>Evaluación por enfoque</h2></div>
          <div className="split" style={{ marginTop: 12 }}>
            <div className="card">
              <div className="tw">
                <table>
                  <thead><tr><th className="l">Enfoque</th><th>Puntaje</th><th>Peso</th></tr></thead>
                  <tbody>
                    {DIMS.map((d) => (
                      <tr key={d.k}><td className="l">{d.n}</td><td className="n">{fmt(m.sc[d.k], 0)}</td><td className="n">{fmt(p.pesos[d.k], 0)}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="card"><Radar sc={m.sc} /></div>
          </div>
        </section>

        <section>
          <div className="phead"><h2>Análisis financiero</h2></div>
          <div className="tiles" style={{ marginTop: 12 }}>
            <Tile k="VAN" v={money(f.van, mon)} s={f.van > 0 ? "Crea valor" : "Destruye valor"} cls={f.van > 0 ? "good" : "bad"} />
            <Tile k="TIR" v={pct(f.tir)} s={`Tasa ${fmt(p.tasa, 1)}%`} />
            <Tile k="Beneficio / costo" v={f.bc == null ? "n/d" : fmt(f.bc, 2)} />
            <Tile k="Recuperación" v={yrs(f.pb)} s="Sin descontar" />
            <Tile k="Recuperación desc." v={yrs(f.pbd)} s={`Horizonte ${f.H} años`} />
            <Tile k="Inversión total" v={money(f.inv0, mon)} s={`Incluye ${fmt(p.conting, 0)}% conting.`} />
          </div>
          <div className="card" style={{ marginTop: 12 }}>
            <h3>Flujo de caja proyectado</h3>
            <div className="tw">
              <table>
                <thead><tr><th>Año</th><th>Beneficios</th><th>Costos</th><th>Inversión</th><th>Flujo neto</th><th>Acumulado</th></tr></thead>
                <tbody>
                  {flujo.map((r) => (
                    <tr key={r.t}>
                      <td>{r.t}</td>
                      <td className="n">{fmt(r.ben, 0)}</td>
                      <td className="n">{fmt(-r.cos, 0)}</td>
                      <td className="n">{fmt(r.inv, 0)}</td>
                      <td className="n"><b>{fmt(r.net, 0)}</b></td>
                      <td className={"n " + (r.cum >= 0 ? "ok" : "ko")}>{fmt(r.cum, 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="tiles" style={{ marginTop: 12 }}>
            <Tile k="VAN promedio" v={money(m.mcr.mean, mon)} />
            <Tile k="Prob. VAN > 0" v={pct(m.mcr.p, 1)} cls={m.mcr.p >= 0.7 ? "good" : "bad"} />
            <Tile k="VAN percentil 5" v={money(m.mcr.p5, mon)} s="Caso adverso" />
            <Tile k="VAN mediana" v={money(m.mcr.p50, mon)} />
            <Tile k="VAN percentil 95" v={money(m.mcr.p95, mon)} s="Caso favorable" />
          </div>
        </section>

        <section>
          <div className="phead"><h2>Mapa de calor de riesgos</h2></div>
          <div className="card" style={{ marginTop: 12 }}><MapaCalor riesgos={p.riesgos} /></div>
        </section>

        <section>
          <div className="phead"><h2>Matriz de riesgos</h2></div>
          <div className="card" style={{ marginTop: 12 }}>
            <div className="tw">
              <table>
                <thead><tr><th className="l">Riesgo</th><th className="l">Tipo</th><th>Prob</th><th>Imp</th><th>Control</th><th>Residual</th><th>Nivel</th></tr></thead>
                <tbody>
                  {riesgos.map((r, i) => {
                    const lv = lvlOf(r.res);
                    return (
                      <tr key={i}>
                        <td className="l">{r.n}</td><td className="l">{r.t}</td>
                        <td className="n">{fmt(r.p, 0)}</td><td className="n">{fmt(r.i, 0)}</td>
                        <td className="n">{fmt(r.m, 0)}%</td><td className="n">{fmt(r.res, 1)}</td>
                        <td><span className={"lvl " + lv}>{LVN[lv]}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section>
          <div className="phead"><h2>Dictamen y recomendaciones</h2></div>
          <div className="split" style={{ marginTop: 12 }}>
            <div className="card">
              <h3>Condiciones de aprobación</h3>
              <div>
                {m.verdict.checks.map((c, i) => (
                  <div className="chk" key={i}>
                    <b className={c.ok ? "ok" : "ko"}>{c.ok ? "✓" : "✗"}</b>
                    <div>{c.n}<div className="hint num">{c.d}</div></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="card">
              <h3>Recomendaciones</h3>
              {m.verdict.recs.length ? (
                <ul className="recs">{m.verdict.recs.map((r, i) => <li key={i}>{r}</li>)}</ul>
              ) : (
                <p className="muted">Sin recomendaciones pendientes.</p>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

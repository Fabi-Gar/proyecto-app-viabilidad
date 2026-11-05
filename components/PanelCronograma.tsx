"use client";

/** Pestaña Cronograma (input nuevo para el informe):
 *  Fase · Inicio · Fin · Responsable, con un Gantt simple de barras. */
import { useProy } from "./contexto";
import { TextInput } from "./campos";

/** Días entre dos fechas ISO (o 0 si falta/invalida). */
function dias(a: string, b: string): number {
  const d1 = Date.parse(a),
    d2 = Date.parse(b);
  if (!isFinite(d1) || !isFinite(d2)) return 0;
  return (d2 - d1) / 86400000;
}

export function PanelCronograma() {
  const { p, mut } = useProy();
  const crono = p.cronograma;

  // Rango global para el Gantt
  const fechas = crono
    .flatMap((c) => [Date.parse(c.inicio), Date.parse(c.fin)])
    .filter((x) => isFinite(x));
  const min = fechas.length ? Math.min(...fechas) : 0;
  const max = fechas.length ? Math.max(...fechas) : 0;
  const span = max - min || 1;

  return (
    <section className="panel">
      <div className="phead">
        <div>
          <h2>Cronograma</h2>
          <p>Fases de ejecución con fechas y responsables. Entran en el informe.</p>
        </div>
      </div>

      <div className="card">
        <div className="tw">
          <table>
            <thead>
              <tr>
                <th className="l">Fase</th>
                <th className="l" style={{ width: 160 }}>Inicio</th>
                <th className="l" style={{ width: 160 }}>Fin</th>
                <th className="l">Responsable</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {crono.map((c, i) => (
                <tr key={i}>
                  <td className="l" style={{ minWidth: 180 }}>
                    <TextInput value={c.fase} onText={(v) => mut((n) => { n.cronograma[i].fase = v; })} aria-label="Fase" placeholder="Nombre de la fase" invalid={!c.fase.trim()} />
                  </td>
                  <td className="l">
                    <input type="date" value={c.inicio} className={!c.inicio ? "invalid" : undefined} onChange={(e) => mut((n) => { n.cronograma[i].inicio = e.target.value; })} aria-label="Inicio" />
                  </td>
                  <td className="l">
                    <input type="date" value={c.fin} className={!c.fin ? "invalid" : undefined} onChange={(e) => mut((n) => { n.cronograma[i].fin = e.target.value; })} aria-label="Fin" />
                  </td>
                  <td className="l" style={{ minWidth: 160 }}>
                    <TextInput value={c.responsable} onText={(v) => mut((n) => { n.cronograma[i].responsable = v; })} aria-label="Responsable" placeholder="Responsable" />
                  </td>
                  <td>
                    <button className="x" aria-label="Quitar fase" onClick={() => mut((n) => { n.cronograma.splice(i, 1); })}>×</button>
                  </td>
                </tr>
              ))}
              {!crono.length && (
                <tr>
                  <td className="l muted" colSpan={5}>
                    Aún no hay fases. Agrega la primera.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div>
          <button className="btn" onClick={() => mut((n) => { n.cronograma.push({ fase: "Nueva fase", inicio: "", fin: "", responsable: "" }); })}>
            Agregar fase
          </button>
        </div>
      </div>

      {fechas.length > 0 && (
        <div className="card">
          <h3>Diagrama de Gantt</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {crono.map((c, i) => {
              const ini = Date.parse(c.inicio),
                fin = Date.parse(c.fin);
              const valido = isFinite(ini) && isFinite(fin) && fin >= ini;
              const left = valido ? ((ini - min) / span) * 100 : 0;
              const width = valido ? Math.max(1.5, (dias(c.inicio, c.fin) / (span / 86400000 || 1)) * 100) : 0;
              return (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: 10, alignItems: "center" }}>
                  <span className="hint" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {c.fase || "(sin nombre)"}
                  </span>
                  <div style={{ position: "relative", height: 18, background: "var(--surface2)", borderRadius: 5 }}>
                    {valido && (
                      <div
                        title={`${c.inicio} → ${c.fin}`}
                        style={{ position: "absolute", left: `${left}%`, width: `${width}%`, top: 0, bottom: 0, background: "var(--accent)", borderRadius: 5 }}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}

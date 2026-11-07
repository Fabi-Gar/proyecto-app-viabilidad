"use client";

/**
 * Editor del plan de monitoreo e indicadores (KPIs) de la pestaña Ciclo de vida.
 * El "valor real" se llena durante la operación y sirve para la evaluación
 * ex-post: comparar lo medido contra la meta proyectada.
 */
import { useProy } from "./contexto";
import { TextInput } from "./campos";

export function KpiEditor() {
  const { p, mut } = useProy();
  const kpis = p.kpis;

  return (
    <div className="card">
      <h3>Plan de monitoreo e indicadores (KPIs)</h3>
      <p className="hint">
        Indicadores para seguir el proyecto después del arranque. El <b>valor real</b> se llena
        cuando ya hay datos y sirve para la <b>evaluación ex-post</b>: comparar lo medido contra
        la meta proyectada.
      </p>
      <div className="tw">
        <table>
          <thead>
            <tr>
              <th className="l">Indicador</th>
              <th className="l" style={{ width: 120 }}>Meta</th>
              <th className="l" style={{ width: 120 }}>Frecuencia</th>
              <th className="l" style={{ width: 130 }}>Responsable</th>
              <th className="l" style={{ width: 140 }}>Fuente</th>
              <th className="l" style={{ width: 120 }}>Valor real</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {kpis.map((k, i) => (
              <tr key={i}>
                <td className="l" style={{ minWidth: 160 }}>
                  <TextInput value={k.indicador} onText={(v) => mut((n) => { n.kpis[i].indicador = v; })} aria-label="Indicador" placeholder="Indicador" invalid={!k.indicador.trim()} />
                </td>
                <td className="l">
                  <TextInput value={k.meta} onText={(v) => mut((n) => { n.kpis[i].meta = v; })} aria-label="Meta" placeholder="Meta" />
                </td>
                <td className="l">
                  <TextInput value={k.frecuencia} onText={(v) => mut((n) => { n.kpis[i].frecuencia = v; })} aria-label="Frecuencia" placeholder="Ej. Mensual" />
                </td>
                <td className="l">
                  <TextInput value={k.responsable} onText={(v) => mut((n) => { n.kpis[i].responsable = v; })} aria-label="Responsable" placeholder="Responsable" />
                </td>
                <td className="l">
                  <TextInput value={k.fuente} onText={(v) => mut((n) => { n.kpis[i].fuente = v; })} aria-label="Fuente" placeholder="De dónde sale el dato" />
                </td>
                <td className="l">
                  <TextInput value={k.valorReal ?? ""} onText={(v) => mut((n) => { n.kpis[i].valorReal = v; })} aria-label="Valor real" placeholder="Aún sin medir" />
                </td>
                <td>
                  <button className="x" aria-label="Quitar indicador" onClick={() => mut((n) => { n.kpis.splice(i, 1); })}>×</button>
                </td>
              </tr>
            ))}
            {!kpis.length && (
              <tr><td className="l muted" colSpan={7}>Aún no hay indicadores. Agrega el primero.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <div>
        <button className="btn" onClick={() => mut((n) => { n.kpis.push({ indicador: "", meta: "", frecuencia: "Mensual", responsable: "", fuente: "" }); })}>
          Agregar indicador
        </button>
      </div>
    </div>
  );
}

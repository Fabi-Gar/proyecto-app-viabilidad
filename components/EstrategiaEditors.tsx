"use client";

/**
 * Editores de la pestaña Estratégica: análisis PESTEL y Balanced Scorecard.
 * Reutilizan los campos de campos.tsx y el estilo de tablas de la app.
 */
import { useProy } from "./contexto";
import { TextInput, Select } from "./campos";
import { MapaEstrategico } from "./MapaEstrategico";
import { TIPOS_PESTEL, PERSPECTIVAS_BSC } from "@/lib/esquema";
import type { EfectoPestel, TipoPestel, PerspectivaBSC } from "@/lib/tipos";

const TIPO_OPTS: [TipoPestel, string][] = TIPOS_PESTEL.map((t) => [t, t]);
const EFECTO_OPTS: [EfectoPestel, string][] = [
  ["Favorable", "Favorable"],
  ["Neutro", "Neutro"],
  ["Desfavorable", "Desfavorable"],
];
const PERSP_OPTS: [PerspectivaBSC, string][] = PERSPECTIVAS_BSC.map((p) => [p, p]);

export function PestelEditor() {
  const { p, mut } = useProy();
  const pestel = p.pestel;
  const fav = pestel.filter((f) => f.efecto === "Favorable").length;
  const neu = pestel.filter((f) => f.efecto === "Neutro").length;
  const des = pestel.filter((f) => f.efecto === "Desfavorable").length;

  return (
    <div className="card">
      <h3>Análisis PESTEL</h3>
      <p className="hint">
        Factores del entorno (político, económico, social, tecnológico, ambiental y legal) y
        cómo afectan al proyecto. Anota la evidencia o fuente de cada uno.
      </p>
      <div className="tw">
        <table>
          <thead>
            <tr>
              <th className="l" style={{ width: 130 }}>Tipo</th>
              <th className="l">Descripción</th>
              <th className="l" style={{ width: 150 }}>Efecto</th>
              <th className="l">Nota / evidencia</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {pestel.map((f, i) => (
              <tr key={i}>
                <td className="l">
                  <Select value={f.tipo} onPick={(v) => mut((n) => { n.pestel[i].tipo = v; })} options={TIPO_OPTS} aria-label="Tipo" />
                </td>
                <td className="l" style={{ minWidth: 200 }}>
                  <TextInput value={f.descripcion} onText={(v) => mut((n) => { n.pestel[i].descripcion = v; })} aria-label="Descripción" placeholder="Factor del entorno" />
                </td>
                <td className="l">
                  <Select value={f.efecto} onPick={(v) => mut((n) => { n.pestel[i].efecto = v; })} options={EFECTO_OPTS} aria-label="Efecto" />
                </td>
                <td className="l" style={{ minWidth: 200 }}>
                  <TextInput value={f.nota} onText={(v) => mut((n) => { n.pestel[i].nota = v; })} aria-label="Nota" placeholder="Evidencia o fuente" />
                </td>
                <td>
                  <button className="x" aria-label="Quitar factor" onClick={() => mut((n) => { n.pestel.splice(i, 1); })}>×</button>
                </td>
              </tr>
            ))}
            {!pestel.length && (
              <tr><td className="l muted" colSpan={5}>Aún no hay factores. Agrega el primero.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <button className="btn" onClick={() => mut((n) => { n.pestel.push({ tipo: "Económico", descripcion: "", efecto: "Neutro", nota: "" }); })}>
          Agregar factor
        </button>
        <span className="hint">
          <b className="ok">{fav}</b> favorables · <b className="wn">{neu}</b> neutros · <b className="ko">{des}</b> desfavorables
        </span>
      </div>
    </div>
  );
}

export function BscEditor() {
  const { p, mut } = useProy();
  const bsc = p.bsc;

  return (
    <div className="card">
      <h3>Balanced Scorecard</h3>
      <p className="hint">
        Objetivos por perspectiva y la iniciativa de TI del proyecto que habilita cada uno.
        Con estos datos se dibuja el mapa estratégico de abajo.
      </p>
      <div className="tw">
        <table>
          <thead>
            <tr>
              <th className="l" style={{ width: 170 }}>Perspectiva</th>
              <th className="l">Objetivo</th>
              <th className="l">Iniciativa de TI</th>
              <th className="l">Indicador</th>
              <th className="l" style={{ width: 120 }}>Meta</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {bsc.map((o, i) => (
              <tr key={i}>
                <td className="l">
                  <Select value={o.perspectiva} onPick={(v) => mut((n) => { n.bsc[i].perspectiva = v; })} options={PERSP_OPTS} aria-label="Perspectiva" />
                </td>
                <td className="l" style={{ minWidth: 180 }}>
                  <TextInput value={o.objetivo} onText={(v) => mut((n) => { n.bsc[i].objetivo = v; })} aria-label="Objetivo" placeholder="Objetivo estratégico" />
                </td>
                <td className="l" style={{ minWidth: 180 }}>
                  <TextInput value={o.iniciativaTI} onText={(v) => mut((n) => { n.bsc[i].iniciativaTI = v; })} aria-label="Iniciativa de TI" placeholder="Componente de TI que lo habilita" />
                </td>
                <td className="l" style={{ minWidth: 140 }}>
                  <TextInput value={o.indicador} onText={(v) => mut((n) => { n.bsc[i].indicador = v; })} aria-label="Indicador" placeholder="Indicador" />
                </td>
                <td className="l">
                  <TextInput value={o.meta} onText={(v) => mut((n) => { n.bsc[i].meta = v; })} aria-label="Meta" placeholder="Meta" />
                </td>
                <td>
                  <button className="x" aria-label="Quitar objetivo" onClick={() => mut((n) => { n.bsc.splice(i, 1); })}>×</button>
                </td>
              </tr>
            ))}
            {!bsc.length && (
              <tr><td className="l muted" colSpan={6}>Aún no hay objetivos. Agrega el primero.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <div>
        <button className="btn" onClick={() => mut((n) => { n.bsc.push({ perspectiva: "Financiera", objetivo: "", iniciativaTI: "", indicador: "", meta: "" }); })}>
          Agregar objetivo
        </button>
      </div>

      <h3 style={{ marginTop: 6 }}>Mapa estratégico de TI</h3>
      <MapaEstrategico bsc={bsc} />
    </div>
  );
}

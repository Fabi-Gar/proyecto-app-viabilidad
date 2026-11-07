/**
 * Datos de arranque para la plantilla de viabilidad 360°.
 *
 *  - ejemplo():   caso del restaurante (sucursal Centro) con programa de lealtad en
 *                 Apple/Google Wallet. Datos en casos/restaurante-centro-lealtad.json.
 *                 Es SOLO un dato de ejemplo; no está amarrado a la lógica.
 *  - plantillaEnBlanco(): proyecto genérico en cero / calificaciones neutras,
 *                 para evaluar cualquier proyecto desde el botón "Empezar en blanco".
 *
 * Ambos portados desde calculadora_viabilidad.html, con los campos nuevos del
 * informe (requerimientos, ciclo de vida, cronograma) añadidos.
 */

import { DIMS } from "./calculo";
import { pestelVacio, bscVacio, validacionVacia, normalizarProyecto } from "./esquema";
import casoEjemplo from "../casos/restaurante-centro-lealtad.json";
import type { Proyecto, Scores, Notes, DimScoreKey } from "./tipos";

/** Construye scores (1-5) y notes por criterio. `v` da valores iniciales. */
function mkScores(v?: Partial<Record<DimScoreKey, number[]>>): {
  scores: Scores;
  notes: Notes;
} {
  const scores = {} as Scores;
  const notes = {} as Notes;
  DIMS.filter((d) => d.crit).forEach((d) => {
    const k = d.k as DimScoreKey;
    scores[k] = d.crit!.map((_, i) => (v && v[k] && v[k]![i]) || 3);
    notes[k] = d.crit!.map(() => "");
  });
  return { scores, notes };
}

export function ejemplo(): Proyecto {
  // Copia profunda para que nadie mute el JSON importado.
  const p = normalizarProyecto(structuredClone(casoEjemplo));
  if (!p) throw new Error("casos/restaurante-centro-lealtad.json no es un proyecto válido");
  return p;
}

export function plantillaEnBlanco(): Proyecto {
  const sc = mkScores();
  return {
    v: 1,
    nombre: "Nuevo proyecto",
    moneda: "Q",
    desc: "",
    horizonte: 5,
    tasa: 12,
    residual: 0,
    conting: 10,
    inv: [{ n: "Inversión inicial", v: 0 }],
    ben: [{ n: "Beneficio o ingreso anual", v: 0, g: 0 }],
    cos: [{ n: "Costo operativo anual", v: 0, g: 0 }],
    mc: { bmin: -30, bmax: 20, cmin: -5, cmax: 25, imin: -5, imax: 30 },
    esc: {
      pes: { b: 70, c: 120, i: 115 },
      opt: { b: 120, c: 95, i: 100 },
    },
    pesos: { tec: 15, ope: 10, mer: 5, fin: 25, amb: 5, est: 10, rie: 20, cic: 10 },
    umbralGo: 70,
    umbralCond: 55,
    foda: { f: "", d: "", o: "", a: "" },
    scores: sc.scores,
    notes: sc.notes,
    riesgos: [{ n: "Describe un riesgo", t: "Operativo", p: 3, i: 3, m: 0 }],
    // ---- Campos nuevos del informe (vacíos) ----
    requerimientos: [],
    cicloVida: [
      { fase: "Perfil", estado: "Pendiente", nota: "" },
      { fase: "Prefactibilidad", estado: "Pendiente", nota: "" },
      { fase: "Factibilidad", estado: "Pendiente", nota: "" },
      { fase: "Monitoreo", estado: "Pendiente", nota: "" },
      { fase: "Evaluación ex-post", estado: "Pendiente", nota: "" },
    ],
    cronograma: [],
    // ---- Evidencia estratégica (vacía, lista para llenar) ----
    pestel: pestelVacio(),
    bsc: bscVacio(),
    kpis: [],
    validacion: validacionVacia(),
  };
}

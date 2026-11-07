/**
 * Esquema del Proyecto: validación de estructura y completado con valores por
 * defecto.
 *
 * Centraliza la compatibilidad hacia atrás: los campos nuevos (requerimientos,
 * ciclo de vida, cronograma, PESTEL, BSC, KPIs y datos de validación) son
 * opcionales en el JSON persistido. `completarProyecto` los rellena con valores
 * vacíos, de modo que los proyectos guardados en localStorage y los enlaces de
 * WhatsApp ya compartidos siguen abriendo sin error, y el resto de la app puede
 * usarlos sin comprobar `undefined`.
 */

import type {
  Proyecto,
  FactorPestel,
  ObjetivoBSC,
  KPI,
  DatosValidacion,
  TipoPestel,
  PerspectivaBSC,
} from "./tipos";

/** Los 6 tipos del PESTEL, en orden. */
export const TIPOS_PESTEL: TipoPestel[] = [
  "Político",
  "Económico",
  "Social",
  "Tecnológico",
  "Ambiental",
  "Legal",
];

/** Perspectivas del BSC de arriba hacia abajo (como el mapa estratégico). */
export const PERSPECTIVAS_BSC: PerspectivaBSC[] = [
  "Financiera",
  "Clientes",
  "Procesos internos",
  "Aprendizaje y crecimiento",
];

/** PESTEL con las 6 filas ya nombradas y vacías. */
export const pestelVacio = (): FactorPestel[] =>
  TIPOS_PESTEL.map((tipo) => ({ tipo, descripcion: "", efecto: "Neutro", nota: "" }));

/** BSC con una fila vacía por perspectiva. */
export const bscVacio = (): ObjetivoBSC[] =>
  PERSPECTIVAS_BSC.map((perspectiva) => ({
    perspectiva,
    objetivo: "",
    iniciativaTI: "",
    indicador: "",
    meta: "",
  }));

export const validacionVacia = (): DatosValidacion => ({
  resultadoReal: "Sin dato",
  fuente: "",
  notas: "",
});

/** Comprueba la estructura mínima de un objeto para ser un Proyecto. */
export function esEstructuraValida(o: unknown): o is Proyecto {
  const p = o as Proyecto;
  return (
    !!p &&
    typeof p === "object" &&
    p.v === 1 &&
    Array.isArray(p.inv) &&
    !!p.scores &&
    Array.isArray(p.riesgos)
  );
}

const arr = <T,>(x: unknown): x is T[] => Array.isArray(x);

/**
 * Rellena los campos opcionales que falten con valores por defecto vacíos.
 * No altera los datos existentes. Muta y devuelve el mismo objeto.
 */
export function completarProyecto(o: Proyecto): Proyecto {
  o.requerimientos = arr(o.requerimientos) ? o.requerimientos : [];
  o.cicloVida = arr(o.cicloVida) ? o.cicloVida : [];
  o.cronograma = arr(o.cronograma) ? o.cronograma : [];
  o.pestel = arr<FactorPestel>(o.pestel) ? o.pestel : [];
  o.bsc = arr<ObjetivoBSC>(o.bsc) ? o.bsc : [];
  o.kpis = arr<KPI>(o.kpis) ? o.kpis : [];
  o.validacion =
    o.validacion && typeof o.validacion === "object"
      ? { ...validacionVacia(), ...o.validacion }
      : validacionVacia();
  return o;
}

export type ResultadoParseo =
  | { ok: true; p: Proyecto }
  | { ok: false; error: string };

/** Valida y completa un proyecto a partir de texto JSON. */
export function parsearProyecto(texto: string): ResultadoParseo {
  let o: unknown;
  try {
    o = JSON.parse(texto);
  } catch {
    return { ok: false, error: "El archivo no es un JSON válido." };
  }
  if (!esEstructuraValida(o)) {
    return {
      ok: false,
      error:
        "El archivo no tiene la estructura de un proyecto de viabilidad (faltan campos como inv, scores o riesgos).",
    };
  }
  return { ok: true, p: completarProyecto(o) };
}

/** Valida y completa a partir de un objeto ya parseado. null si no sirve. */
export function normalizarProyecto(o: unknown): Proyecto | null {
  if (!esEstructuraValida(o)) return null;
  return completarProyecto(o);
}

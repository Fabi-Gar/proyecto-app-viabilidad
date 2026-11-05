/**
 * Tipos del objeto Proyecto de la plantilla de viabilidad 360°.
 *
 * Reúne los campos que ya existían en la calculadora HTML
 * (nombre, moneda, inv/ben/cos, scores, riesgos, etc.) y los campos
 * nuevos para el informe: requerimientos, ciclo de vida y cronograma.
 *
 * La app es GENÉRICA: estos tipos sirven para cualquier proyecto
 * (ERP, CRM, app, etc.). El ejemplo de tarjetas de lealtad es solo un
 * dato de arranque (ver lib/ejemplos.ts), no está amarrado a la lógica.
 */

/** Clave de cada enfoque de evaluación. */
export type DimKey =
  | "tec" // Técnica
  | "ope" // Operativa
  | "mer" // Mercado
  | "fin" // Financiera
  | "amb" // Socioambiental
  | "est" // Estratégica
  | "rie" // Riesgos
  | "cic"; // Ciclo de vida

/** Enfoques que se califican con criterios 1-5 (tienen scores/notes). */
export type DimScoreKey = "tec" | "ope" | "mer" | "amb" | "est" | "cic";

/** Multiplicadores de escenario sobre beneficios, costos e inversión. */
export interface Multiplicadores {
  b: number; // beneficios
  c: number; // costos
  i: number; // inversión
}

/** Línea de inversión inicial (año 0). */
export interface LineaInversion {
  n: string; // concepto
  v: number; // monto
}

/** Línea de beneficio o costo anual, con crecimiento anual %. */
export interface LineaAnual {
  n: string; // concepto
  v: number; // monto del año 1
  g: number; // crecimiento anual en %
}

/** Riesgo de la matriz probabilidad × impacto. */
export interface Riesgo {
  n: string; // descripción
  t: string; // tipo (ver RISK_TYPES)
  p: number; // probabilidad 1-5
  i: number; // impacto 1-5
  m: number; // efectividad del control en % (0, 25, 50, 75)
}

/** Parámetros de Monte Carlo (rangos % por variable). */
export interface MonteCarloCfg {
  bmin: number;
  bmax: number;
  cmin: number;
  cmax: number;
  imin: number;
  imax: number;
}

/** Multiplicadores (%) de los escenarios pesimista y optimista. */
export interface Escenarios {
  pes: Multiplicadores;
  opt: Multiplicadores;
}

/** Pesos (relativos) de cada enfoque en el puntaje global. */
export type Pesos = Record<DimKey, number>;

/** Calificaciones 1-5 por criterio, por enfoque. */
export type Scores = Record<DimScoreKey, number[]>;

/** Notas/evidencia por criterio, por enfoque. */
export type Notes = Record<DimScoreKey, string[]>;

/** Cuadro FODA (una entrada por línea dentro de cada texto). */
export interface Foda {
  f: string; // fortalezas
  d: string; // debilidades
  o: string; // oportunidades
  a: string; // amenazas
}

/* ======================= Campos nuevos del informe ======================= */

export type TipoRequerimiento = "Funcional" | "No funcional";
export type Prioridad = "Alta" | "Media" | "Baja";

/** Requerimiento del proyecto. */
export interface Requerimiento {
  id: string; // ej. RF-01
  texto: string; // descripción del requerimiento
  tipo: TipoRequerimiento;
  prioridad: Prioridad;
}

export type EstadoFase = "Completada" | "En progreso" | "Pendiente";

/** Fase del ciclo de vida (preinversión + monitoreo/ex-post). */
export interface FaseCicloVida {
  fase: string; // ej. Perfil, Prefactibilidad, Factibilidad, Monitoreo, Ex-post
  estado: EstadoFase;
  nota: string; // detalle o evidencia
}

/** Fila del cronograma de ejecución. */
export interface FaseCronograma {
  fase: string;
  inicio: string; // fecha (YYYY-MM-DD o texto libre)
  fin: string;
  responsable: string;
}

/* ============================= Objeto Proyecto =========================== */

export interface Proyecto {
  v: 1; // versión del esquema
  nombre: string;
  moneda: string;
  desc: string;
  horizonte: number; // años (1-15)
  tasa: number; // tasa de descuento anual %
  residual: number; // valor residual al final
  conting: number; // contingencia sobre la inversión %
  inv: LineaInversion[];
  ben: LineaAnual[];
  cos: LineaAnual[];
  mc: MonteCarloCfg;
  esc: Escenarios;
  pesos: Pesos;
  umbralGo: number; // puntaje mínimo para Go
  umbralCond: number; // bajo esto, No Go
  foda: Foda;
  scores: Scores;
  notes: Notes;
  riesgos: Riesgo[];
  // Campos nuevos para el informe:
  requerimientos: Requerimiento[];
  cicloVida: FaseCicloVida[];
  cronograma: FaseCronograma[];
}

/**
 * Datos de arranque para la plantilla de viabilidad 360°.
 *
 *  - ejemplo():   proyecto de tarjetas de lealtad en Apple/Google Wallet.
 *                 Es SOLO un dato de ejemplo; no está amarrado a la lógica.
 *  - plantillaEnBlanco(): proyecto genérico en cero / calificaciones neutras,
 *                 para evaluar cualquier proyecto desde el botón "Empezar en blanco".
 *
 * Ambos portados desde calculadora_viabilidad.html, con los campos nuevos del
 * informe (requerimientos, ciclo de vida, cronograma) añadidos.
 */

import { DIMS } from "./calculo";
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
  const sc = mkScores({
    tec: [4, 4, 3, 4, 3, 4],
    ope: [3, 3, 3, 3, 4, 3],
    mer: [3, 3, 2, 3, 3],
    amb: [4, 4, 3, 2, 3],
    est: [4, 3, 3, 4, 3],
    cic: [4, 3, 2, 3, 3, 2],
  });
  sc.notes.tec[0] =
    "Emisión de pases con Apple Wallet (PassKit) y Google Wallet API; sellos actualizados por servidor.";
  sc.notes.tec[2] =
    "Pendiente: piloto con un negocio y 50 clientes en iOS y Android.";
  sc.notes.ope[4] =
    "El sellado en caja se hace con QR; el negocio sigue vendiendo si falla la conexión.";
  sc.notes.mer[2] =
    "Falta medir cuántos clientes agregan la tarjeta al wallet frente a una tarjeta física o app propia.";
  sc.notes.amb[3] =
    "Pendiente: consultar a clientes sobre privacidad y frecuencia de notificaciones.";
  sc.notes.cic[2] =
    "Se completará con datos reales de ventas y visitas del negocio piloto.";

  return {
    v: 1,
    nombre: "Programa de lealtad en Apple y Google Wallet",
    moneda: "Q",
    desc:
      "Tarjetas de sellos y de regalo que el cliente guarda en Apple Wallet o Google Wallet. Al completar los sellos obtiene un premio, y el negocio envía notificaciones para fomentar la recompra. Cifras de ejemplo basadas en supuestos; reemplazar con los datos reales del negocio.",
    horizonte: 5,
    tasa: 15,
    residual: 0,
    conting: 10,
    inv: [
      {
        n: "Desarrollo del servidor y panel de administración (sellos, premios, campañas)",
        v: 55000,
      },
      {
        n: "Integración con Apple Wallet (certificados, notificaciones push)",
        v: 8000,
      },
      { n: "Integración con Google Wallet API", v: 6000 },
      { n: "Diseño de tarjetas y marca", v: 3500 },
      { n: "Cuentas de desarrollador y certificados", v: 800 },
      { n: "Lector o código QR en caja (tablets, soportes)", v: 7000 },
      { n: "Capacitación y piloto", v: 3500 },
    ],
    ben: [
      {
        n: "Ventas por mayor frecuencia de visitas de clientes inscritos",
        v: 36000,
        g: 10,
      },
      {
        n: "Ventas por campañas de notificaciones y promociones",
        v: 14400,
        g: 8,
      },
      { n: "Ahorro en tarjetas físicas y reimpresiones", v: 3600, g: 0 },
      { n: "Ahorro en volantes y mensajes de marketing", v: 6000, g: 3 },
    ],
    cos: [
      { n: "Servidor y base de datos en la nube", v: 6000, g: 3 },
      { n: "Mantenimiento y soporte", v: 14400, g: 3 },
      { n: "Costo de los premios canjeados", v: 12000, g: 10 },
      { n: "Renovación de cuentas y certificados", v: 1000, g: 0 },
    ],
    mc: { bmin: -30, bmax: 20, cmin: -5, cmax: 25, imin: -5, imax: 30 },
    esc: {
      pes: { b: 70, c: 120, i: 115 },
      opt: { b: 120, c: 95, i: 100 },
    },
    pesos: { tec: 15, ope: 10, mer: 15, fin: 25, amb: 5, est: 10, rie: 15, cic: 5 },
    umbralGo: 70,
    umbralCond: 55,
    scores: sc.scores,
    notes: sc.notes,
    foda: {
      f: "No exige instalar una app: el cliente ya tiene su wallet\nLa tarjeta siempre está en el teléfono\nNotificaciones directas sin costo por mensaje",
      d: "Depende de Apple y Google\nRequiere que el cliente agregue la tarjeta\nDatos de ventas del negocio aún sin levantar",
      o: "Aumentar la frecuencia de compra\nSegmentar campañas con datos de consumo\nOfrecer el servicio a otros negocios",
      a: "Cambios de políticas o límites de las plataformas\nOtros programas de lealtad y apps de la competencia\nPérdida de confianza si hay mal uso de datos",
    },
    riesgos: (
      [
        ["Cambios en políticas o API de Apple o Google", "Tecnológico", 3, 4, 25],
        ["Baja adopción: pocos clientes agregan la tarjeta a su wallet", "Mercado", 4, 4, 25],
        ["Límites de notificaciones o bloqueo por exceso de mensajes", "Operativo", 3, 3, 50],
        ["Fraude o duplicación de sellos y canjes", "Seguridad", 3, 4, 50],
        ["Incumplimiento de privacidad y protección de datos", "Legal", 2, 5, 50],
        ["Vencimiento de certificados o suspensión de cuentas de desarrollador", "Tecnológico", 2, 4, 50],
        ["Falla de Internet al sellar en caja", "Operativo", 3, 3, 50],
        ["El personal no aplica el sellado correctamente", "Organizacional", 3, 3, 25],
        ["Costos mayores a los estimados", "Financiero", 3, 4, 25],
        ["El costo de los premios reduce el margen", "Financiero", 3, 3, 25],
      ] as [string, string, number, number, number][]
    ).map((r) => ({ n: r[0], t: r[1], p: r[2], i: r[3], m: r[4] })),
    // ---- Campos nuevos del informe ----
    requerimientos: [
      { id: "RF-01", texto: "Emitir pases para Apple Wallet y Google Wallet", tipo: "Funcional", prioridad: "Alta" },
      { id: "RF-02", texto: "Sellar visitas mediante lectura de QR en caja", tipo: "Funcional", prioridad: "Alta" },
      { id: "RF-03", texto: "Registrar canje de premios al completar los sellos", tipo: "Funcional", prioridad: "Alta" },
      { id: "RF-04", texto: "Enviar notificaciones y campañas a los clientes inscritos", tipo: "Funcional", prioridad: "Media" },
      { id: "RNF-01", texto: "Operar sin conexión en caja y sincronizar al reconectar", tipo: "No funcional", prioridad: "Media" },
      { id: "RNF-02", texto: "Cumplir protección de datos personales de los clientes", tipo: "No funcional", prioridad: "Alta" },
    ],
    cicloVida: [
      { fase: "Perfil", estado: "Completada", nota: "Problema, objetivo y alcance preliminar definidos." },
      { fase: "Prefactibilidad", estado: "En progreso", nota: "Alternativas y costos estimados con información secundaria." },
      { fase: "Factibilidad", estado: "Pendiente", nota: "Falta validar costos e ingresos con datos reales del negocio piloto." },
      { fase: "Monitoreo", estado: "Pendiente", nota: "Definir responsables, frecuencia y herramientas de seguimiento." },
      { fase: "Evaluación ex-post", estado: "Pendiente", nota: "Comparar resultados reales contra lo proyectado tras el arranque." },
    ],
    cronograma: [
      { fase: "Desarrollo del servidor y panel", inicio: "2026-01-06", fin: "2026-03-13", responsable: "Equipo de desarrollo" },
      { fase: "Integración Apple/Google Wallet", inicio: "2026-03-16", fin: "2026-04-17", responsable: "Equipo de desarrollo" },
      { fase: "Diseño de tarjetas y marca", inicio: "2026-01-06", fin: "2026-01-30", responsable: "Diseño" },
      { fase: "Piloto con un negocio", inicio: "2026-04-20", fin: "2026-05-29", responsable: "Negocio + soporte" },
      { fase: "Puesta en marcha", inicio: "2026-06-01", fin: "2026-06-12", responsable: "Soporte" },
    ],
  };
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
  };
}

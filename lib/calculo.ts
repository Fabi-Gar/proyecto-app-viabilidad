/**
 * Motor de cálculo de la plantilla de viabilidad 360°.
 *
 * Portado desde calculadora_viabilidad.html SIN cambiar las fórmulas.
 * La única diferencia de plumbing: donde el HTML usaba un estado global `S`,
 * aquí cada función recibe el `Proyecto` como parámetro `p`. Así el motor es
 * genérico y reutilizable (cualquier proyecto, server o cliente) y testeable.
 *
 * Funciones portadas: calc, irr, payback, monte, scoreDim, riskStats,
 * finScore, decide (+ model, que las orquesta). Fórmulas idénticas al HTML.
 */

import type {
  Proyecto,
  DimKey,
  Multiplicadores,
  Riesgo,
} from "./tipos";

/* ===================== Definición de enfoques y criterios ================== */

export const RATING = [
  "Muy deficiente",
  "Deficiente",
  "Aceptable",
  "Bueno",
  "Excelente",
] as const;

export interface Dim {
  k: DimKey;
  n: string;
  tab: string;
  kind: "score" | "fin" | "risk";
  intro?: string;
  crit?: [string, string][];
  foda?: boolean;
  kpis?: boolean;
}

export const DIMS: Dim[] = [
  {
    k: "tec",
    n: "Técnica",
    tab: "Técnica",
    kind: "score",
    intro:
      "¿Se puede construir y operar con la tecnología disponible? Evalúa requerimientos, alternativas, prototipos, escalabilidad y compatibilidad.",
    crit: [
      [
        "Requerimientos técnicos definidos y alcanzables",
        "Funciones, rendimiento, seguridad e integraciones están documentados.",
      ],
      [
        "Tecnologías alternativas comparadas",
        "Se evaluaron al menos dos opciones y la elegida se justifica.",
      ],
      [
        "Prototipo o prueba piloto exitosa",
        "Hay evidencia real de que la solución funciona en el entorno del cliente.",
      ],
      [
        "Escalabilidad",
        "Soporta más usuarios, volumen de datos o sucursales sin rediseñar.",
      ],
      [
        "Compatibilidad con la infraestructura existente",
        "Red, equipos, software y servicios actuales sirven sin cambios mayores.",
      ],
      [
        "Disponibilidad de talento y soporte técnico",
        "El equipo tiene las habilidades o se pueden conseguir a un costo razonable.",
      ],
    ],
  },
  {
    k: "ope",
    n: "Operativa",
    tab: "Operativa",
    kind: "score",
    intro:
      "¿La organización puede adoptar y sostener la solución en su operación diaria?",
    crit: [
      [
        "Disposición y aceptación del personal",
        "Los usuarios clave apoyan el cambio.",
      ],
      [
        "Capacitación suficiente",
        "Hay plan, tiempo y materiales para formar a los usuarios.",
      ],
      [
        "Los procesos actuales se adaptan con cambios mínimos",
        "El flujo de trabajo no se interrumpe de forma drástica.",
      ],
      [
        "Capacidad de soporte y mantenimiento posterior",
        "Hay responsables y presupuesto para operar después del arranque.",
      ],
      [
        "Continuidad durante la implementación",
        "El negocio sigue operando en horas pico durante la puesta en marcha.",
      ],
      [
        "Respaldo y recuperación ante fallas",
        "Existe un procedimiento probado para restaurar datos y servicio.",
      ],
    ],
  },
  {
    k: "mer",
    n: "Mercado",
    tab: "Mercado",
    kind: "score",
    intro: "¿Existe una necesidad real y quien la pague o la use?",
    crit: [
      [
        "Problema o necesidad validado con usuarios",
        "Entrevistas, encuestas o datos que lo respaldan.",
      ],
      [
        "Demanda o tamaño de mercado suficiente",
        "El número de usuarios o clientes justifica la inversión.",
      ],
      [
        "Diferenciación frente a alternativas",
        "Se conoce a la competencia y la propuesta aporta algo distinto.",
      ],
      [
        "Disposición de pago o adopción",
        "Los usuarios pagarían o usarían la solución de forma sostenida.",
      ],
      [
        "Canal de adquisición o difusión definido",
        "Hay un plan para llegar a los usuarios.",
      ],
    ],
  },
  { k: "fin", n: "Financiera", tab: "Financiera", kind: "fin" },
  {
    k: "amb",
    n: "Socioambiental",
    tab: "Socioambiental",
    kind: "score",
    intro:
      "Impacto ambiental (EIA), ciclo de vida (ACV), impacto social (EIS) y participación de los interesados.",
    crit: [
      [
        "Impacto ambiental bajo (EIA)",
        "Consumo de energía, residuos electrónicos y huella del proyecto.",
      ],
      [
        "Análisis de ciclo de vida (ACV)",
        "Vida útil de equipos, reuso, reciclaje y disposición final.",
      ],
      [
        "Impacto social positivo (EIS)",
        "Empleo, capacidades, acceso o bienestar de la comunidad y del personal.",
      ],
      [
        "Consulta a interesados realizada",
        "Se escuchó a usuarios, personal, clientes y comunidad.",
      ],
      [
        "Cumplimiento legal y protección de datos",
        "Normativa fiscal, laboral y de datos personales cubierta.",
      ],
    ],
  },
  {
    k: "est",
    n: "Estratégica",
    tab: "Estratégica",
    kind: "score",
    intro: "FODA, PESTEL, Balanced Scorecard y mapa estratégico de TI.",
    foda: true,
    crit: [
      [
        "Las fortalezas superan a las debilidades (FODA)",
        "Revisa el cuadro FODA de abajo.",
      ],
      [
        "Las oportunidades superan a las amenazas (FODA)",
        "El entorno ofrece más espacio que presión.",
      ],
      [
        "Entorno político, económico, social, tecnológico, ambiental y legal favorable (PESTEL)",
        "Sin factores externos que bloqueen el proyecto.",
      ],
      [
        "Alineación con los objetivos del negocio (Balanced Scorecard)",
        "Contribuye a perspectivas financiera, clientes, procesos y aprendizaje.",
      ],
      [
        "Alineación con el mapa estratégico de TI",
        "Encaja en la hoja de ruta tecnológica de la organización.",
      ],
    ],
  },
  { k: "rie", n: "Riesgos", tab: "Riesgos", kind: "risk" },
  {
    k: "cic",
    n: "Ciclo de vida",
    tab: "Ciclo de vida",
    kind: "score",
    intro:
      "Madurez del proyecto en las fases de preinversión, y qué tan listo está para monitoreo y evaluación ex-post.",
    kpis: true,
    crit: [
      [
        "Perfil o idea completado",
        "Problema, objetivo y alcance preliminar definidos.",
      ],
      [
        "Prefactibilidad completada",
        "Alternativas y costos estimados con información secundaria.",
      ],
      [
        "Factibilidad con datos reales",
        "Costos, ingresos y supuestos validados con el cliente.",
      ],
      [
        "Plan de monitoreo definido",
        "Responsables, frecuencia y herramientas de seguimiento.",
      ],
      [
        "Indicadores (KPI) con metas",
        "Cada beneficio esperado tiene un indicador medible.",
      ],
      [
        "Plan de evaluación ex-post",
        "Se medirán los resultados reales contra lo proyectado.",
      ],
    ],
  },
];

export const RISK_TYPES = [
  "Tecnológico",
  "Seguridad",
  "Operativo",
  "Organizacional",
  "Financiero",
  "Mercado",
  "Legal",
  "Ambiental/Social",
] as const;

/* ============================== Utilidades ================================ */

/** Convierte cualquier valor a número finito (0 si no lo es). */
export const N = (v: unknown): number => {
  const x = parseFloat(v as string);
  return isFinite(x) ? x : 0;
};

export const clamp = (x: number, a: number, b: number): number =>
  Math.min(b, Math.max(a, x));

/* ----------------------------- Formateadores ------------------------------ */

export const fmt = (x: number, d = 0): string =>
  (x < 0 ? "−" : "") +
  Math.abs(x).toLocaleString("es-GT", {
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  });

export const money = (x: number, moneda = "Q"): string =>
  (x < 0 ? "−" : "") +
  moneda +
  " " +
  Math.abs(Math.round(x)).toLocaleString("es-GT");

export const pct = (x: number | null, d = 1): string =>
  x == null || !isFinite(x) ? "n/d" : fmt(x * 100, d) + "%";

export const yrs = (x: number | null): string =>
  x == null ? "No se recupera" : fmt(x, 1) + " años";

/* ============================ Motor financiero ============================ */

export interface CalcResult {
  H: number;
  inv0: number;
  benT: number[];
  cosT: number[];
  net: number[];
  pvB: number;
  pvC: number;
  van: number;
  bc: number | null;
  tir: number | null;
  pb: number | null;
  pbd: number | null;
}

export function calc(
  p: Proyecto,
  m: Multiplicadores = { b: 1, c: 1, i: 1 },
  rate: number = p.tasa / 100
): CalcResult {
  const H = clamp(Math.round(N(p.horizonte)), 1, 15);
  const inv0 =
    p.inv.reduce((a, x) => a + N(x.v), 0) * (1 + N(p.conting) / 100) * m.i;
  const benT = [0];
  const cosT = [0];
  const net = [-inv0];
  for (let t = 1; t <= H; t++) {
    let b =
      p.ben.reduce((a, x) => a + N(x.v) * Math.pow(1 + N(x.g) / 100, t - 1), 0) *
      m.b;
    if (t === H) b += N(p.residual) * m.b;
    const c =
      p.cos.reduce((a, x) => a + N(x.v) * Math.pow(1 + N(x.g) / 100, t - 1), 0) *
      m.c;
    benT.push(b);
    cosT.push(c);
    net.push(b - c);
  }
  let pvB = 0,
    pvC = 0,
    van = -inv0;
  for (let t = 1; t <= H; t++) {
    const d = Math.pow(1 + rate, t);
    pvB += benT[t] / d;
    pvC += cosT[t] / d;
    van += net[t] / d;
  }
  const den = inv0 + pvC;
  return {
    H,
    inv0,
    benT,
    cosT,
    net,
    pvB,
    pvC,
    van,
    bc: den > 0 ? pvB / den : null,
    tir: irr(net),
    pb: payback(net, 0),
    pbd: payback(net, rate),
  };
}

/** TIR por bisección sobre el flujo neto. null si no existe. */
export function irr(net: number[]): number | null {
  const f = (r: number) => net.reduce((a, x, t) => a + x / Math.pow(1 + r, t), 0);
  let lo = -0.95,
    hi = 10,
    flo = f(lo),
    fhi = f(hi);
  if (!isFinite(flo) || !isFinite(fhi) || flo * fhi > 0) return null;
  for (let k = 0; k < 120; k++) {
    const mid = (lo + hi) / 2,
      fm = f(mid);
    if (flo * fm <= 0) {
      hi = mid;
      fhi = fm;
    } else {
      lo = mid;
      flo = fm;
    }
  }
  return (lo + hi) / 2;
}

/** Años hasta recuperar (interpolado). rate=0 para payback simple. */
export function payback(net: number[], rate: number): number | null {
  let cum = 0,
    prev = 0;
  for (let t = 0; t < net.length; t++) {
    const v = net[t] / Math.pow(1 + rate, t);
    prev = cum;
    cum += v;
    if (t > 0 && cum >= 0 && prev < 0) return t - 1 + -prev / v;
  }
  return null;
}

export function vanFrom(
  pvB: number,
  pvC: number,
  inv0: number,
  db: number,
  dc: number,
  di: number
): number {
  return (1 + db) * pvB - (1 + dc) * pvC - (1 + di) * inv0;
}

/* Monte Carlo con semilla fija para que el resultado sea reproducible. */
function mulberry(a: number): () => number {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function tri(r: () => number, a: number, m: number, b: number): number {
  if (b <= a) return a;
  const u = r(),
    c = (m - a) / (b - a);
  return u < c
    ? a + Math.sqrt(u * (b - a) * (m - a))
    : b - Math.sqrt((1 - u) * (b - a) * (b - m));
}

export interface MonteResult {
  n: number;
  v: number[];
  mean: number;
  p: number; // probabilidad VAN > 0
  p5: number;
  p50: number;
  p95: number;
}

export function monte(p: Proyecto, base: CalcResult): MonteResult {
  const r = mulberry(20261015),
    n = 5000,
    mc = p.mc,
    out = new Array<number>(n);
  for (let k = 0; k < n; k++) {
    const db = tri(r, N(mc.bmin) / 100, 0, N(mc.bmax) / 100),
      dc = tri(r, N(mc.cmin) / 100, 0, N(mc.cmax) / 100),
      di = tri(r, N(mc.imin) / 100, 0, N(mc.imax) / 100);
    out[k] = vanFrom(base.pvB, base.pvC, base.inv0, db, dc, di);
  }
  out.sort((a, b) => a - b);
  const q = (pp: number) => out[Math.min(n - 1, Math.floor(pp * n))];
  return {
    n,
    v: out,
    mean: out.reduce((a, x) => a + x, 0) / n,
    p: out.filter((x) => x > 0).length / n,
    p5: q(0.05),
    p50: q(0.5),
    p95: q(0.95),
  };
}

/* ================================ Puntajes ================================ */

export const lvlOf = (x: number): "b" | "m" | "a" | "c" =>
  x >= 15 ? "c" : x >= 10 ? "a" : x >= 5 ? "m" : "b";

export const LVN: Record<"b" | "m" | "a" | "c", string> = {
  b: "Bajo",
  m: "Medio",
  a: "Alto",
  c: "Crítico",
};

export function scoreDim(p: Proyecto, k: Exclude<DimKey, "fin" | "rie">): number {
  const a = p.scores[k];
  return (a.reduce((s, x) => s + (N(x) - 1), 0) / (4 * a.length)) * 100;
}

export interface RiesgoCalc extends Riesgo {
  inh: number;
  res: number;
}

export interface RiskStats {
  rs: RiesgoCalc[];
  avg: number;
  crit: number;
  score: number;
}

export function riskStats(p: Proyecto): RiskStats {
  const rs: RiesgoCalc[] = p.riesgos.map((r) => ({
    ...r,
    inh: N(r.p) * N(r.i),
    res: N(r.p) * N(r.i) * (1 - N(r.m) / 100),
  }));
  const avg = rs.length ? rs.reduce((a, r) => a + r.res, 0) / rs.length : 0;
  const crit = rs.filter((r) => r.res >= 15).length;
  return {
    rs,
    avg,
    crit,
    score: rs.length ? clamp(100 - avg * 6.67 - 8 * crit, 0, 100) : 50,
  };
}

export function finScore(p: Proyecto, f: CalcResult, mcr: MonteResult): number {
  let s = 0;
  if (f.van > 0) s += 30;
  const tr = f.tir == null ? -1 : f.tir - p.tasa / 100;
  s += tr >= 0.05 ? 20 : tr >= 0 ? 10 : 0;
  s += f.bc != null && f.bc >= 1.2 ? 15 : f.bc != null && f.bc >= 1 ? 8 : 0;
  s += f.pb != null && f.pb <= f.H / 2 ? 15 : f.pb != null && f.pb <= f.H ? 8 : 0;
  s += 20 * mcr.p;
  return s;
}

/* ============================ Dictamen y modelo =========================== */

export interface Check {
  n: string;
  ok: boolean;
  d: string;
}

export type Veredicto = "go" | "cond" | "nogo";

export interface Verdict {
  v: Veredicto;
  checks: Check[];
  recs: string[];
  minDim: number;
}

export function decide(
  p: Proyecto,
  f: CalcResult,
  mcr: MonteResult,
  rk: RiskStats,
  sc: Record<DimKey, number>,
  total: number,
  pes: CalcResult
): Verdict {
  const minDim = Math.min(...DIMS.map((d) => sc[d.k]));
  const checks: Check[] = [
    ["VAN positivo", f.van > 0, `VAN ${money(f.van, p.moneda)}`],
    [
      "TIR mayor o igual a la tasa de descuento",
      f.tir != null && f.tir >= p.tasa / 100,
      `TIR ${pct(f.tir)} frente a ${fmt(p.tasa, 1)}%`,
    ],
    [
      "Relación beneficio/costo mayor a 1",
      f.bc != null && f.bc > 1,
      `B/C ${f.bc == null ? "n/d" : fmt(f.bc, 2)}`,
    ],
    [
      "Recuperación dentro del horizonte",
      f.pb != null && f.pb <= f.H,
      `${yrs(f.pb)} de ${f.H}`,
    ],
    [
      "Probabilidad de VAN positivo (Monte Carlo) de al menos 70%",
      mcr.p >= 0.7,
      `${pct(mcr.p, 0)}`,
    ],
    [
      "El escenario pesimista mantiene VAN positivo",
      pes.van > 0,
      `VAN pesimista ${money(pes.van, p.moneda)}`,
    ],
    ["Sin riesgos críticos residuales", rk.crit === 0, `${rk.crit} críticos`],
    [
      "Ninguna dimensión por debajo de 50 puntos",
      minDim >= 50,
      `Mínimo ${fmt(minDim, 0)}`,
    ],
    [
      `Puntaje global de al menos ${p.umbralGo}`,
      total >= p.umbralGo,
      `${fmt(total, 0)} puntos`,
    ],
  ].map((c) => ({ n: c[0] as string, ok: c[1] as boolean, d: c[2] as string }));
  const hard =
    f.van <= 0 || total < p.umbralCond || rk.crit >= 3 || minDim < 30;
  const allOk = checks.every((c) => c.ok);
  const v: Veredicto = hard ? "nogo" : allOk ? "go" : "cond";
  const recs: string[] = [];
  checks
    .filter((c) => !c.ok)
    .forEach((c) => recs.push(`Resolver: ${c.n} (${c.d}).`));
  DIMS.filter((d) => d.crit).forEach((d) =>
    p.scores[d.k as Exclude<DimKey, "fin" | "rie">].forEach((x, i) => {
      if (N(x) <= 2)
        recs.push(
          `${d.n}: mejorar «${d.crit![i][0]}» (${RATING[N(x) - 1]}).`
        );
    })
  );
  rk.rs
    .filter((r) => r.res >= 10)
    .sort((a, b) => b.res - a.res)
    .slice(0, 3)
    .forEach((r) =>
      recs.push(`Reforzar control de «${r.n}» (riesgo residual ${fmt(r.res, 1)}).`)
    );
  return { v, checks, recs, minDim };
}

export interface Model {
  f: CalcResult;
  mcr: MonteResult;
  rk: RiskStats;
  sc: Record<DimKey, number>;
  total: number;
  pes: CalcResult;
  opt: CalcResult;
  verdict: Verdict;
}

/** Orquesta todo el cálculo de un proyecto y devuelve el modelo completo. */
export function model(p: Proyecto): Model {
  const f = calc(p),
    mcr = monte(p, f),
    rk = riskStats(p);
  const sc = {} as Record<DimKey, number>;
  DIMS.forEach((d) => {
    sc[d.k] =
      d.kind === "score"
        ? scoreDim(p, d.k as Exclude<DimKey, "fin" | "rie">)
        : d.kind === "fin"
        ? finScore(p, f, mcr)
        : rk.score;
  });
  const W = p.pesos,
    tw = DIMS.reduce((a, d) => a + N(W[d.k]), 0) || 1;
  const total = DIMS.reduce((a, d) => a + sc[d.k] * N(W[d.k]), 0) / tw;
  const pes = calc(p, {
    b: N(p.esc.pes.b) / 100,
    c: N(p.esc.pes.c) / 100,
    i: N(p.esc.pes.i) / 100,
  });
  const opt = calc(p, {
    b: N(p.esc.opt.b) / 100,
    c: N(p.esc.opt.c) / 100,
    i: N(p.esc.opt.i) / 100,
  });
  return {
    f,
    mcr,
    rk,
    sc,
    total,
    pes,
    opt,
    verdict: decide(p, f, mcr, rk, sc, total, pes),
  };
}

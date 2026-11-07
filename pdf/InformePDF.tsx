/**
 * Informe de viabilidad en PDF (@react-pdf/renderer).
 *
 * Diez secciones (plan, sección 6), en orden. El radar y el mapa de calor se
 * dibujan con primitivas de react-pdf (Svg / View), no con <canvas>, y reusan
 * los mismos colores por nivel que la app.
 *
 * Nota: las fuentes estándar (Helvetica) no incluyen algunos glifos Unicode
 * (−, ≥, ✓…). `fix()` los reemplaza por ASCII para que el PDF no quede con
 * caracteres vacíos.
 */
import { Fragment } from "react";
import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  Svg,
  Polygon,
  Line,
  Rect,
  Circle,
  Text as SvgText,
} from "@react-pdf/renderer";
import {
  DIMS,
  RATING,
  calc,
  money,
  pct,
  yrs,
  fmt,
  lvlOf,
  LVN,
  vanFrom,
  type Model,
} from "@/lib/calculo";
import type { Proyecto, DimKey, DimScoreKey } from "@/lib/tipos";

/* ------------------------------- Paleta ---------------------------------- */
const C = {
  ink: "#14263b",
  muted: "#5a6b7d",
  line: "#cbd4de",
  surface: "#ffffff",
  surface2: "#e6ebf1",
  navy: "#0e2a47",
  accent: "#1f4e87",
  good: "#1e6b4f",
  goodBg: "#e2efe9",
  warn: "#8a6a1e",
  warnBg: "#f3ead3",
  bad: "#a32f2a",
  badBg: "#f1dedc",
};
const LVL_BG: Record<string, string> = { b: "#e2efe9", m: "#f3ead3", a: "#f2e2d6", c: "#f1dedc" };
const LVL_FG: Record<string, string> = { b: "#1e6b4f", m: "#8a6a1e", a: "#9a4826", c: "#a32f2a" };
const VERD_BG: Record<string, string> = { go: C.goodBg, cond: C.warnBg, nogo: C.badBg };
const VERD_FG: Record<string, string> = { go: C.good, cond: C.warn, nogo: C.bad };
const VERD_TXT: Record<string, string> = { go: "GO", cond: "GO CONDICIONADO", nogo: "NO GO" };

/** Reemplaza glifos que Helvetica no tiene. */
const fix = (s: string): string =>
  s
    .replace(/−/g, "-")
    .replace(/≥/g, ">=")
    .replace(/≤/g, "<=")
    .replace(/[✓✗]/g, "");

const styles = StyleSheet.create({
  page: { padding: 34, fontSize: 9, color: C.ink, fontFamily: "Helvetica" },
  // Portada
  coverEyebrow: { fontSize: 10, color: C.muted, letterSpacing: 1, textTransform: "uppercase" },
  coverTitle: { fontSize: 22, lineHeight: 1.2, fontFamily: "Helvetica-Bold", marginTop: 8, color: C.navy },
  coverMeta: { fontSize: 10, color: C.muted, marginTop: 5 },
  coverRule: { borderBottomWidth: 2, borderBottomColor: C.navy, marginTop: 10 },
  verdictBox: { marginTop: 18, borderRadius: 2, padding: 16, borderLeftWidth: 5 },
  verdictLabel: { fontSize: 9, letterSpacing: 1, textTransform: "uppercase" },
  verdictBig: { fontSize: 26, lineHeight: 1.2, fontFamily: "Helvetica-Bold", marginTop: 4, marginBottom: 2 },
  verdictP: { fontSize: 10, marginTop: 4 },
  // Secciones
  h2: { fontSize: 12.5, lineHeight: 1.2, fontFamily: "Helvetica-Bold", color: C.navy, marginBottom: 7, paddingBottom: 3, borderBottomWidth: 1.5, borderBottomColor: C.navy, textTransform: "uppercase", letterSpacing: 0.3 },
  section: { marginTop: 16 },
  p: { fontSize: 9.5, lineHeight: 1.45, color: C.ink, marginBottom: 3 },
  muted: { color: C.muted },
  // Tablas
  table: { borderWidth: 1, borderColor: C.line, borderRadius: 2 },
  tr: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: C.line },
  trLast: { flexDirection: "row" },
  th: { fontSize: 7.5, color: "#ffffff", fontFamily: "Helvetica-Bold", padding: 4, backgroundColor: C.navy, textTransform: "uppercase", letterSpacing: 0.2 },
  td: { fontSize: 8.5, padding: 4, color: C.ink },
  // Tiles
  tilesRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  tile: { borderWidth: 1, borderColor: C.line, borderLeftWidth: 2.5, borderLeftColor: C.accent, borderRadius: 2, padding: 8, width: "31.5%" },
  tileK: { fontSize: 8, color: C.muted, textTransform: "uppercase", letterSpacing: 0.2 },
  tileV: { fontSize: 13, fontFamily: "Helvetica-Bold", marginTop: 2, color: C.navy },
  tileS: { fontSize: 7.5, color: C.muted, marginTop: 1 },
  chip: { fontSize: 8, fontFamily: "Helvetica-Bold", paddingVertical: 1, paddingHorizontal: 5, borderRadius: 8 },
  split: { flexDirection: "row", gap: 10 },
  fodaBox: { borderWidth: 1, borderColor: C.line, borderTopWidth: 2.5, borderRadius: 2, padding: 8 },
  fodaTitle: { fontSize: 9, fontFamily: "Helvetica-Bold", textTransform: "uppercase", letterSpacing: 0.3, marginBottom: 3 },
  fodaItem: { fontSize: 8.5, lineHeight: 1.4, color: C.ink, marginBottom: 1 },
});

/* ----------------------------- Utilidades UI ----------------------------- */
function Cell({ children, w, align = "left", bold, bg, color }: {
  children: React.ReactNode; w: string | number; align?: "left" | "right" | "center";
  bold?: boolean; bg?: string; color?: string;
}) {
  return (
    <Text style={[styles.td, { width: w, textAlign: align }, bold ? { fontFamily: "Helvetica-Bold" } : {}, bg ? { backgroundColor: bg } : {}, color ? { color } : {}]}>
      {children}
    </Text>
  );
}
function HCell({ children, w, align = "left" }: { children: React.ReactNode; w: string | number; align?: "left" | "right" | "center" }) {
  return <Text style={[styles.th, { width: w, textAlign: align }]}>{children}</Text>;
}

/* ------------------------------ Radar (Svg) ------------------------------ */
function RadarPDF({ sc }: { sc: Record<DimKey, number> }) {
  const cx = 150, cy = 135, R = 92, n = DIMS.length;
  const pt = (i: number, v: number): [number, number] => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    return [cx + Math.cos(a) * R * (v / 100), cy + Math.sin(a) * R * (v / 100)];
  };
  const shape = DIMS.map((d, i) => pt(i, sc[d.k]));
  return (
    <Svg width={300} height={270} viewBox="0 0 300 270">
      {[25, 50, 75, 100].map((l) => (
        <Polygon key={l} points={DIMS.map((_, i) => pt(i, l).join(",")).join(" ")} fill="none" stroke={C.line} strokeWidth={0.7} />
      ))}
      {DIMS.map((d, i) => {
        const p = pt(i, 100), q = pt(i, 128);
        return (
          <Fragment key={d.k}>
            <Line x1={cx} y1={cy} x2={p[0]} y2={p[1]} stroke={C.line} strokeWidth={0.7} />
            <SvgText x={q[0]} y={q[1]} style={{ fontSize: 7, fill: C.muted }} textAnchor={q[0] < cx - 8 ? "end" : q[0] > cx + 8 ? "start" : "middle"}>
              {d.n}
            </SvgText>
          </Fragment>
        );
      })}
      <Polygon points={shape.map((p) => p.join(",")).join(" ")} fill={C.accent} fillOpacity={0.22} stroke={C.accent} strokeWidth={1.6} />
      {shape.map((p, i) => (
        <Circle key={i} cx={p[0]} cy={p[1]} r={2.4} fill={C.accent} />
      ))}
    </Svg>
  );
}

/* -------------------------- Mapa de calor (View) ------------------------- */
function HeatPDF({ p }: { p: Proyecto }) {
  const N = (v: number) => (Number.isFinite(v) ? v : 0);
  const probs = [5, 4, 3, 2, 1];
  const cols = [1, 2, 3, 4, 5];
  const cellW = 30;
  return (
    <View>
      <View style={{ flexDirection: "row" }}>
        <View style={{ width: 22 }} />
        {cols.map((i) => (
          <Text key={i} style={{ width: cellW, fontSize: 7, color: C.muted, textAlign: "center" }}>I{i}</Text>
        ))}
      </View>
      {probs.map((pr) => (
        <View key={pr} style={{ flexDirection: "row", marginBottom: 2, alignItems: "center" }}>
          <Text style={{ width: 22, fontSize: 7, color: C.muted }}>P{pr}</Text>
          {cols.map((i) => {
            const c = p.riesgos.filter((r) => N(r.p) === pr && N(r.i) === i).length;
            const lv = lvlOf(pr * i);
            return (
              <View key={i} style={{ width: cellW, height: 22, marginRight: 2, backgroundColor: LVL_BG[lv], borderRadius: 2, alignItems: "center", justifyContent: "center" }}>
                <Text style={{ fontSize: 8, color: C.ink }}>{c || ""}</Text>
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

/* --------------------------- Tornado (Svg) ------------------------------- */
interface TorItem { n: string; lo: number; hi: number }

/** Mismos cálculos que el tornado de la app: ±20% por variable (±5 pts en la tasa). */
function tornadoItems(p: Proyecto): TorItem[] {
  const r = p.tasa / 100;
  const vv = (b: number, c: number, i: number) => calc(p, { b, c, i }).van;
  return (
    [
      { n: "Beneficios", lo: vv(0.8, 1, 1), hi: vv(1.2, 1, 1) },
      { n: "Costos operativos", lo: vv(1, 1.2, 1), hi: vv(1, 0.8, 1) },
      { n: "Inversión inicial", lo: vv(1, 1, 1.2), hi: vv(1, 1, 0.8) },
      {
        n: "Tasa de descuento",
        lo: calc(p, { b: 1, c: 1, i: 1 }, r + 0.05).van,
        hi: calc(p, { b: 1, c: 1, i: 1 }, Math.max(0, r - 0.05)).van,
      },
    ] as TorItem[]
  ).sort((a, b) => Math.abs(b.hi - b.lo) - Math.abs(a.hi - a.lo));
}

function TornadoPDF({ items, base }: { items: TorItem[]; base: number }) {
  const W = 520, rowH = 30, top = 6, L = 118, Rr = 14;
  const H = items.length * rowH + top + 22;
  const vals = [base];
  items.forEach((i) => vals.push(i.lo, i.hi));
  const mn = Math.min(...vals), mx = Math.max(...vals);
  const X = (v: number) => L + ((v - mn) / (mx - mn || 1)) * (W - L - Rr);
  const xb = X(base);
  return (
    <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      {items.map((it, k) => {
        const y = top + k * rowH;
        return (
          <Fragment key={it.n}>
            <SvgText x={0} y={y + 16} style={{ fontSize: 8, fill: C.ink }}>{it.n}</SvgText>
            {[it.lo, it.hi].map((v, j) => {
              const x1 = X(Math.min(v, base)), x2 = X(Math.max(v, base));
              return (
                <Rect key={j} x={x1} y={y + 4} width={Math.max(1.5, x2 - x1)} height={16}
                  fill={v >= base ? C.good : C.bad} fillOpacity={0.8} />
              );
            })}
          </Fragment>
        );
      })}
      <Line x1={xb} x2={xb} y1={top} y2={H - 18} stroke={C.ink} strokeWidth={0.8} />
      <SvgText x={xb} y={H - 5} style={{ fontSize: 7.5, fill: C.muted }} textAnchor="middle">
        VAN base
      </SvgText>
    </Svg>
  );
}

/* ================================ Documento ============================== */
export function InformePDF({ p, m, autores }: { p: Proyecto; m: Model; autores?: string }) {
  const mon = p.moneda;
  const M = (x: number) => fix(money(x, mon));
  const F = (x: number, d = 0) => fix(fmt(x, d));
  const P = (x: number | null, d = 1) => fix(pct(x, d));
  const Y = (x: number | null) => fix(yrs(x));

  const f = m.f;
  const v = m.verdict.v;
  const fecha = new Date().toLocaleDateString("es-GT", { year: "numeric", month: "long", day: "numeric" });

  // Flujo de caja transpuesto (años en filas).
  let cum = 0;
  const flujo = f.net.map((net, t) => {
    cum += net;
    return { t, ben: f.benT[t], cos: f.cosT[t], inv: t === 0 ? -f.inv0 : 0, net, cum };
  });

  // Sensibilidad.
  const bd = [-0.3, -0.2, -0.1, 0, 0.1, 0.2, 0.3];
  const cd = [-0.2, -0.1, 0, 0.1, 0.2, 0.3];
  const grid = bd.map((b) => cd.map((c) => vanFrom(f.pvB, f.pvC, f.inv0, b, c, c)));

  // Riesgos ordenados por residual desc.
  const riesgos = [...m.rk.rs].sort((a, b) => b.res - a.res);

  // Tornado: variable que más mueve el VAN.
  const tor = tornadoItems(p);

  // Enfoques calificados por criterios (para el detalle de evidencia).
  const dimsCrit = DIMS.filter((d) => d.crit);

  // Escenarios con VAN y TIR.
  const escenarios = [
    { n: "Base", mul: { b: 100, c: 100, i: 100 }, r: f },
    { n: "Pesimista", mul: p.esc.pes, r: m.pes },
    { n: "Optimista", mul: p.esc.opt, r: m.opt },
  ];

  return (
    <Document title={`Informe de viabilidad: ${p.nombre}`} author="Viabilidad 360">
      <Page size="A4" style={styles.page}>
        {/* 1. Portada */}
        <Text style={styles.coverEyebrow}>Informe de viabilidad 360{"°"}</Text>
        <Text style={styles.coverTitle}>{p.nombre || "Proyecto sin nombre"}</Text>
        <Text style={styles.coverMeta}>{fecha}</Text>
        <Text style={styles.coverMeta}>
          {autores ? autores + " · " : ""}Análisis y Evaluación de Proyectos
        </Text>
        <View style={styles.coverRule} />
        <View style={[styles.verdictBox, { backgroundColor: VERD_BG[v], borderLeftColor: VERD_FG[v] }]} wrap={false}>
          <Text style={[styles.verdictLabel, { color: VERD_FG[v] }]}>Dictamen</Text>
          <Text style={[styles.verdictBig, { color: VERD_FG[v] }]}>{VERD_TXT[v]}</Text>
          <Text style={[styles.verdictP, { color: VERD_FG[v] }]}>
            Puntaje global {F(m.total)} de 100.
          </Text>
        </View>

        {/* 2. Documentación / resumen */}
        <View style={styles.section} wrap={false}>
          <Text style={styles.h2}>Documentación y resumen</Text>
          <Text style={styles.p}>{p.desc || "Sin descripción."}</Text>
        </View>

        {/* 3. Requerimientos */}
        <View style={styles.section}>
          <Text style={styles.h2}>Requerimientos</Text>
          {p.requerimientos.length === 0 ? (
            <Text style={[styles.p, styles.muted]}>No se registraron requerimientos.</Text>
          ) : (
            <View style={styles.table}>
              <View style={styles.tr}>
                <HCell w="12%">ID</HCell>
                <HCell w="54%">Requerimiento</HCell>
                <HCell w="20%">Tipo</HCell>
                <HCell w="14%">Prioridad</HCell>
              </View>
              {p.requerimientos.map((r, i) => (
                <View key={i} style={i === p.requerimientos.length - 1 ? styles.trLast : styles.tr} wrap={false}>
                  <Cell w="12%">{r.id}</Cell>
                  <Cell w="54%">{r.texto}</Cell>
                  <Cell w="20%">{r.tipo}</Cell>
                  <Cell w="14%">{r.prioridad}</Cell>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* 4. Ciclo de vida */}
        <View style={styles.section}>
          <Text style={styles.h2}>Ciclo de vida</Text>
          {p.cicloVida.length === 0 ? (
            <Text style={[styles.p, styles.muted]}>Sin fases registradas.</Text>
          ) : (
            <View style={styles.table}>
              <View style={styles.tr}>
                <HCell w="26%">Fase</HCell>
                <HCell w="20%">Estado</HCell>
                <HCell w="54%">Nota / evidencia</HCell>
              </View>
              {p.cicloVida.map((c, i) => (
                <View key={i} style={i === p.cicloVida.length - 1 ? styles.trLast : styles.tr} wrap={false}>
                  <Cell w="26%">{c.fase}</Cell>
                  <Cell w="20%">{c.estado}</Cell>
                  <Cell w="54%">{c.nota}</Cell>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* 5. Cronograma */}
        <View style={styles.section}>
          <Text style={styles.h2}>Cronograma</Text>
          {p.cronograma.length === 0 ? (
            <Text style={[styles.p, styles.muted]}>Sin fases de cronograma.</Text>
          ) : (
            <View style={styles.table}>
              <View style={styles.tr}>
                <HCell w="40%">Fase</HCell>
                <HCell w="18%">Inicio</HCell>
                <HCell w="18%">Fin</HCell>
                <HCell w="24%">Responsable</HCell>
              </View>
              {p.cronograma.map((c, i) => (
                <View key={i} style={i === p.cronograma.length - 1 ? styles.trLast : styles.tr} wrap={false}>
                  <Cell w="40%">{c.fase}</Cell>
                  <Cell w="18%">{c.inicio || "-"}</Cell>
                  <Cell w="18%">{c.fin || "-"}</Cell>
                  <Cell w="24%">{c.responsable}</Cell>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* 6. Evaluación por enfoque */}
        <View style={styles.section}>
          <Text style={styles.h2}>Evaluación por enfoque</Text>
          <View style={styles.split}>
            <View style={{ width: "48%" }}>
              <View style={styles.table}>
                <View style={styles.tr}>
                  <HCell w="56%">Enfoque</HCell>
                  <HCell w="24%" align="right">Puntaje</HCell>
                  <HCell w="20%" align="right">Peso</HCell>
                </View>
                {DIMS.map((d, i) => (
                  <View key={d.k} style={i === DIMS.length - 1 ? styles.trLast : styles.tr}>
                    <Cell w="56%">{d.n}</Cell>
                    <Cell w="24%" align="right">{F(m.sc[d.k])}</Cell>
                    <Cell w="20%" align="right">{F(p.pesos[d.k])}</Cell>
                  </View>
                ))}
              </View>
            </View>
            <View style={{ width: "52%", alignItems: "center" }}>
              <RadarPDF sc={m.sc} />
            </View>
          </View>
        </View>

        {/* 6b. Detalle de la evaluación por criterio (evidencia) */}
        <View style={styles.section}>
          <Text style={styles.h2}>Detalle de la evaluación por criterio</Text>
          <Text style={[styles.p, styles.muted]}>
            El puntaje de cada enfoque es el promedio de sus criterios (1 a 5)
            llevado a escala 0-100. Aquí se ve la calificación y la evidencia de
            cada criterio.
          </Text>
          {dimsCrit.map((d) => {
            const k = d.k as DimScoreKey;
            const cals = p.scores[k];
            const nts = p.notes[k];
            return (
              <View key={d.k} style={{ marginTop: 8 }} wrap={false}>
                <Text style={[styles.p, { fontFamily: "Helvetica-Bold" }]}>
                  {d.n} — {F(m.sc[d.k])} / 100
                </Text>
                <View style={styles.table}>
                  <View style={styles.tr}>
                    <HCell w="40%">Criterio</HCell>
                    <HCell w="18%">Calificación</HCell>
                    <HCell w="42%">Nota / evidencia</HCell>
                  </View>
                  {d.crit!.map((c, i) => {
                    const val = Math.min(5, Math.max(1, Math.round(cals[i] || 0)));
                    return (
                      <View key={i} style={i === d.crit!.length - 1 ? styles.trLast : styles.tr} wrap={false}>
                        <Cell w="40%">{c[0]}</Cell>
                        <Cell w="18%">{`${val} · ${RATING[val - 1]}`}</Cell>
                        <Cell w="42%" color={C.muted}>{(nts[i] || "").trim() || "—"}</Cell>
                      </View>
                    );
                  })}
                </View>
              </View>
            );
          })}
        </View>

        {/* 6c. Análisis FODA */}
        <View style={styles.section} wrap={false}>
          <Text style={styles.h2}>Análisis FODA</Text>
          <View style={styles.split}>
            <View style={{ width: "50%", gap: 8 }}>
              <FodaBox title="Fortalezas" text={p.foda.f} v="go" />
              <FodaBox title="Oportunidades" text={p.foda.o} v="go" />
            </View>
            <View style={{ width: "50%", gap: 8 }}>
              <FodaBox title="Debilidades" text={p.foda.d} v="bad" />
              <FodaBox title="Amenazas" text={p.foda.a} v="bad" />
            </View>
          </View>
        </View>

        {/* 7. Análisis financiero */}
        <View style={styles.section}>
          <Text style={styles.h2}>Análisis financiero</Text>

          <Text style={[styles.p, { fontFamily: "Helvetica-Bold" }]}>Supuestos del modelo</Text>
          <View style={styles.tilesRow}>
            <Tile k="Horizonte" v={`${f.H} años`} />
            <Tile k="Tasa de descuento" v={`${F(p.tasa, 1)}%`} s="Anual" />
            <Tile k="Contingencia" v={`${F(p.conting)}%`} s="Sobre la inversión" />
            <Tile k="Valor residual" v={M(p.residual)} s={`Año ${f.H}`} />
          </View>

          <View style={[styles.split, { marginTop: 8 }]}>
            <View style={{ width: "100%" }}>
              <Text style={[styles.p, styles.muted, { marginBottom: 3 }]}>Líneas de inversión (año 0)</Text>
              <View style={styles.table}>
                <View style={styles.tr}>
                  <HCell w="76%">Concepto</HCell>
                  <HCell w="24%" align="right">Monto</HCell>
                </View>
                {p.inv.map((x, i) => (
                  <View key={i} style={i === p.inv.length - 1 ? styles.trLast : styles.tr} wrap={false}>
                    <Cell w="76%">{x.n}</Cell>
                    <Cell w="24%" align="right">{F(x.v)}</Cell>
                  </View>
                ))}
              </View>
            </View>
          </View>

          <View style={[styles.split, { marginTop: 8 }]}>
            <View style={{ width: "50%" }}>
              <Text style={[styles.p, styles.muted, { marginBottom: 3 }]}>Beneficios anuales (año 1)</Text>
              <View style={styles.table}>
                <View style={styles.tr}>
                  <HCell w="64%">Concepto</HCell>
                  <HCell w="22%" align="right">Monto</HCell>
                  <HCell w="14%" align="right">Crec.</HCell>
                </View>
                {p.ben.map((x, i) => (
                  <View key={i} style={i === p.ben.length - 1 ? styles.trLast : styles.tr} wrap={false}>
                    <Cell w="64%">{x.n}</Cell>
                    <Cell w="22%" align="right">{F(x.v)}</Cell>
                    <Cell w="14%" align="right">{F(x.g)}%</Cell>
                  </View>
                ))}
              </View>
            </View>
            <View style={{ width: "50%" }}>
              <Text style={[styles.p, styles.muted, { marginBottom: 3 }]}>Costos anuales (año 1)</Text>
              <View style={styles.table}>
                <View style={styles.tr}>
                  <HCell w="64%">Concepto</HCell>
                  <HCell w="22%" align="right">Monto</HCell>
                  <HCell w="14%" align="right">Crec.</HCell>
                </View>
                {p.cos.map((x, i) => (
                  <View key={i} style={i === p.cos.length - 1 ? styles.trLast : styles.tr} wrap={false}>
                    <Cell w="64%">{x.n}</Cell>
                    <Cell w="22%" align="right">{F(x.v)}</Cell>
                    <Cell w="14%" align="right">{F(x.g)}%</Cell>
                  </View>
                ))}
              </View>
            </View>
          </View>

          <Text style={[styles.p, { marginTop: 10, fontFamily: "Helvetica-Bold" }]}>Resultados</Text>
          <View style={styles.tilesRow}>
            <Tile k="VAN" v={M(f.van)} s={f.van > 0 ? "Crea valor" : "Destruye valor"} />
            <Tile k="TIR" v={P(f.tir)} s={`Tasa ${F(p.tasa, 1)}%`} />
            <Tile k="Beneficio / costo" v={f.bc == null ? "n/d" : F(f.bc, 2)} s="VP beneficios / costos" />
            <Tile k="Recuperación" v={Y(f.pb)} s="Sin descontar" />
            <Tile k="Recuperación desc." v={Y(f.pbd)} s={`Horizonte ${f.H} años`} />
            <Tile k="Inversión total" v={M(f.inv0)} s={`Incluye ${F(p.conting)}% conting.`} />
          </View>

          <Text style={[styles.p, { marginTop: 10, fontFamily: "Helvetica-Bold" }]}>Flujo de caja proyectado</Text>
          <View style={styles.table}>
            <View style={styles.tr}>
              <HCell w="12%">Año</HCell>
              <HCell w="20%" align="right">Beneficios</HCell>
              <HCell w="18%" align="right">Costos</HCell>
              <HCell w="18%" align="right">Inversión</HCell>
              <HCell w="16%" align="right">Flujo neto</HCell>
              <HCell w="16%" align="right">Acumulado</HCell>
            </View>
            {flujo.map((r, i) => (
              <View key={r.t} style={i === flujo.length - 1 ? styles.trLast : styles.tr} wrap={false}>
                <Cell w="12%">{r.t}</Cell>
                <Cell w="20%" align="right">{F(r.ben)}</Cell>
                <Cell w="18%" align="right">{F(-r.cos)}</Cell>
                <Cell w="18%" align="right">{F(r.inv)}</Cell>
                <Cell w="16%" align="right" bold>{F(r.net)}</Cell>
                <Cell w="16%" align="right" color={r.cum >= 0 ? C.good : C.bad}>{F(r.cum)}</Cell>
              </View>
            ))}
          </View>

          <Text style={[styles.p, { marginTop: 10, fontFamily: "Helvetica-Bold" }]}>
            Análisis de sensibilidad (VAN)
          </Text>
          <Text style={[styles.p, styles.muted]}>Beneficios (filas) vs. costos de inversión y operación (columnas).</Text>
          <View style={styles.table}>
            <View style={styles.tr}>
              <HCell w="16%">Ben \ Cost</HCell>
              {cd.map((c) => (
                <HCell key={c} w="14%" align="right">{(c > 0 ? "+" : "") + c * 100 + "%"}</HCell>
              ))}
            </View>
            {bd.map((b, i) => (
              <View key={b} style={i === bd.length - 1 ? styles.trLast : styles.tr} wrap={false}>
                <Cell w="16%" bold>{(b > 0 ? "+" : "") + b * 100 + "%"}</Cell>
                {grid[i].map((val, j) => (
                  <Cell key={j} w="14%" align="right" bg={val >= 0 ? C.goodBg : C.badBg} color={val >= 0 ? C.good : C.bad}>
                    {F(val)}
                  </Cell>
                ))}
              </View>
            ))}
          </View>

          <Text style={[styles.p, { marginTop: 10, fontFamily: "Helvetica-Bold" }]}>Escenarios</Text>
          <Text style={[styles.p, styles.muted]}>
            Multiplicadores (%) aplicados a beneficios (B), costos (C) e inversión (I).
          </Text>
          <View style={styles.table}>
            <View style={styles.tr}>
              <HCell w="24%">Escenario</HCell>
              <HCell w="30%">Multiplicadores</HCell>
              <HCell w="26%" align="right">VAN</HCell>
              <HCell w="20%" align="right">TIR</HCell>
            </View>
            {escenarios.map((e, i) => (
              <View key={e.n} style={i === escenarios.length - 1 ? styles.trLast : styles.tr} wrap={false}>
                <Cell w="24%" bold>{e.n}</Cell>
                <Cell w="30%" color={C.muted}>
                  {`B ${F(e.mul.b)}% · C ${F(e.mul.c)}% · I ${F(e.mul.i)}%`}
                </Cell>
                <Cell w="26%" align="right" color={e.r.van >= 0 ? C.good : C.bad}>{M(e.r.van)}</Cell>
                <Cell w="20%" align="right">{P(e.r.tir)}</Cell>
              </View>
            ))}
          </View>

          <Text style={[styles.p, { marginTop: 10, fontFamily: "Helvetica-Bold" }]}>Simulación Monte Carlo (5,000 corridas)</Text>
          <View style={styles.tilesRow}>
            <Tile k="VAN promedio" v={M(m.mcr.mean)} />
            <Tile k="Prob. VAN > 0" v={P(m.mcr.p, 1)} />
            <Tile k="VAN percentil 5" v={M(m.mcr.p5)} s="Caso adverso" />
            <Tile k="VAN mediana" v={M(m.mcr.p50)} />
            <Tile k="VAN percentil 95" v={M(m.mcr.p95)} s="Caso favorable" />
          </View>

          <Text style={[styles.p, { marginTop: 10, fontFamily: "Helvetica-Bold" }]}>
            Sensibilidad por variable (tornado)
          </Text>
          <Text style={[styles.p, styles.muted]}>
            Cada barra aplica ±20% a la variable (±5 puntos en la tasa de descuento).
            La variable que más mueve el VAN es «{tor[0].n}».
          </Text>
          <View wrap={false}>
            <TornadoPDF items={tor} base={f.van} />
          </View>
        </View>

        {/* 8. Mapa de calor de riesgos */}
        <View style={styles.section} wrap={false}>
          <Text style={styles.h2}>Mapa de calor de riesgos (inherente)</Text>
          <HeatPDF p={p} />
          <Text style={[styles.p, styles.muted, { marginTop: 4 }]}>
            Filas: probabilidad. Columnas: impacto. El numero es la cantidad de riesgos por celda.
          </Text>
        </View>

        {/* 9. Matriz de riesgos */}
        <View style={styles.section}>
          <Text style={styles.h2}>Matriz de riesgos</Text>
          <View style={styles.table}>
            <View style={styles.tr}>
              <HCell w="34%">Riesgo</HCell>
              <HCell w="16%">Tipo</HCell>
              <HCell w="10%" align="right">Prob</HCell>
              <HCell w="10%" align="right">Imp</HCell>
              <HCell w="10%" align="right">Control</HCell>
              <HCell w="10%" align="right">Residual</HCell>
              <HCell w="10%">Nivel</HCell>
            </View>
            {riesgos.map((r, i) => {
              const lv = lvlOf(r.res);
              return (
                <View key={i} style={i === riesgos.length - 1 ? styles.trLast : styles.tr} wrap={false}>
                  <Cell w="34%">{r.n}</Cell>
                  <Cell w="16%">{r.t}</Cell>
                  <Cell w="10%" align="right">{F(r.p)}</Cell>
                  <Cell w="10%" align="right">{F(r.i)}</Cell>
                  <Cell w="10%" align="right">{F(r.m)}%</Cell>
                  <Cell w="10%" align="right">{F(r.res, 1)}</Cell>
                  <Cell w="10%" bg={LVL_BG[lv]} color={LVL_FG[lv]}>{LVN[lv]}</Cell>
                </View>
              );
            })}
          </View>
        </View>

        {/* 10. Dictamen y recomendaciones */}
        <View style={styles.section}>
          <Text style={styles.h2}>Dictamen y recomendaciones</Text>
          <View style={styles.table} wrap={false}>
            {m.verdict.checks.map((c, i) => (
              <View key={i} style={i === m.verdict.checks.length - 1 ? styles.trLast : styles.tr} wrap={false}>
                <Cell w="14%" bold color={c.ok ? C.good : C.bad}>{c.ok ? "Cumple" : "Falta"}</Cell>
                <Cell w="58%">{fix(c.n)}</Cell>
                <Cell w="28%" color={C.muted}>{fix(c.d)}</Cell>
              </View>
            ))}
          </View>
          <Text style={[styles.p, { marginTop: 10, fontFamily: "Helvetica-Bold" }]}>Recomendaciones</Text>
          {m.verdict.recs.length === 0 ? (
            <Text style={[styles.p, styles.muted]}>Sin recomendaciones pendientes.</Text>
          ) : (
            m.verdict.recs.map((r, i) => (
              <Text key={i} style={styles.p}>{"• " + fix(r)}</Text>
            ))
          )}
        </View>

        <Text style={{ marginTop: 18, fontSize: 7.5, color: C.muted }}>
          Generado por la Plantilla de viabilidad 360{"°"} {"·"} {fecha}
        </Text>
      </Page>
    </Document>
  );
}

function Tile({ k, v, s }: { k: string; v: string; s?: string }) {
  return (
    <View style={styles.tile}>
      <Text style={styles.tileK}>{k}</Text>
      <Text style={styles.tileV}>{v}</Text>
      {s ? <Text style={styles.tileS}>{s}</Text> : null}
    </View>
  );
}

function FodaBox({ title, text, v }: { title: string; text: string; v: "go" | "bad" }) {
  const col = v === "go" ? C.good : C.bad;
  const lines = (text || "").split("\n").map((l) => l.trim()).filter(Boolean);
  return (
    <View style={[styles.fodaBox, { borderTopColor: col }]} wrap={false}>
      <Text style={[styles.fodaTitle, { color: col }]}>{title}</Text>
      {lines.length === 0 ? (
        <Text style={[styles.fodaItem, { color: C.muted }]}>Sin datos.</Text>
      ) : (
        lines.map((l, i) => (
          <Text key={i} style={styles.fodaItem}>{"• " + l}</Text>
        ))
      )}
    </View>
  );
}

/**
 * Tabla de validación de casos en PDF (@react-pdf/renderer), con la misma
 * estética del informe. Una fila por caso: métricas de la calculadora,
 * resultado real y si coincide con el dictamen.
 */
import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
} from "@react-pdf/renderer";
import type { Coincidencia } from "@/lib/coincidencia";

const C = {
  ink: "#14263b",
  muted: "#5a6b7d",
  line: "#cbd4de",
  navy: "#0e2a47",
  good: "#1e6b4f",
  goodBg: "#e2efe9",
  warn: "#8a6a1e",
  warnBg: "#f3ead3",
  bad: "#a32f2a",
  badBg: "#f1dedc",
};

const COINC_BG: Record<Coincidencia, string> = {
  Coincide: C.goodBg,
  Parcial: C.warnBg,
  "No coincide": C.badBg,
  "Sin dato": "#eef1f5",
};
const COINC_FG: Record<Coincidencia, string> = {
  Coincide: C.good,
  Parcial: C.warn,
  "No coincide": C.bad,
  "Sin dato": C.muted,
};

const fix = (s: string): string =>
  (s || "").replace(/−/g, "-").replace(/≥/g, ">=").replace(/≤/g, "<=").replace(/[✓✗]/g, "");

export interface FilaValidacion {
  caso: string;
  resultadoReal: string;
  fuente: string;
  van: string;
  tir: string;
  bc: string;
  recuperacion: string;
  puntaje: string;
  dictamen: string;
  coincidencia: Coincidencia;
}

export interface ResumenValidacion {
  total: number;
  coincide: number;
  parcial: number;
  noCoincide: number;
  sinDato: number;
}

const s = StyleSheet.create({
  page: { padding: 30, fontSize: 8.5, color: C.ink, fontFamily: "Helvetica" },
  eyebrow: { fontSize: 9, color: C.muted, letterSpacing: 1, textTransform: "uppercase" },
  title: { fontSize: 18, fontFamily: "Helvetica-Bold", color: C.navy, marginTop: 4 },
  meta: { fontSize: 9, color: C.muted, marginTop: 3 },
  rule: { borderBottomWidth: 2, borderBottomColor: C.navy, marginTop: 8, marginBottom: 12 },
  table: { borderWidth: 1, borderColor: C.line, borderRadius: 2 },
  tr: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: C.line },
  trLast: { flexDirection: "row" },
  th: { fontSize: 7, color: "#ffffff", fontFamily: "Helvetica-Bold", padding: 4, backgroundColor: C.navy, textTransform: "uppercase" },
  td: { fontSize: 8, padding: 4, color: C.ink },
  resumen: { marginTop: 12, flexDirection: "row", gap: 8, flexWrap: "wrap" },
  chip: { borderWidth: 1, borderColor: C.line, borderRadius: 2, padding: "5 9", fontSize: 9 },
});

const COLS: [keyof FilaValidacion, string, string, "left" | "right" | "center"][] = [
  ["caso", "Caso", "16%", "left"],
  ["resultadoReal", "Resultado real", "9%", "left"],
  ["fuente", "Fuente", "14%", "left"],
  ["van", "VAN", "10%", "right"],
  ["tir", "TIR", "8%", "right"],
  ["bc", "B/C", "7%", "right"],
  ["recuperacion", "Recuperación", "9%", "right"],
  ["puntaje", "Puntaje", "8%", "right"],
  ["dictamen", "Dictamen", "10%", "left"],
  ["coincidencia", "¿Coincide?", "9%", "left"],
];

export function ValidacionPDF({
  filas,
  resumen,
}: {
  filas: FilaValidacion[];
  resumen: ResumenValidacion;
}) {
  const fecha = new Date().toLocaleDateString("es-GT", { year: "numeric", month: "long", day: "numeric" });
  return (
    <Document title="Validación de casos" author="Viabilidad 360">
      <Page size="A4" orientation="landscape" style={s.page}>
        <Text style={s.eyebrow}>Viabilidad 360{"°"}</Text>
        <Text style={s.title}>Validación de casos</Text>
        <Text style={s.meta}>
          Comparación del dictamen de la calculadora contra el resultado real conocido {"·"} {fecha}
        </Text>
        <View style={s.rule} />

        <View style={s.table}>
          <View style={s.tr}>
            {COLS.map(([k, label, w, al]) => (
              <Text key={k} style={[s.th, { width: w, textAlign: al }]}>{label}</Text>
            ))}
          </View>
          {filas.map((fila, i) => (
            <View key={i} style={i === filas.length - 1 ? s.trLast : s.tr} wrap={false}>
              {COLS.map(([k, , w, al]) => {
                const esCoinc = k === "coincidencia";
                return (
                  <Text
                    key={k}
                    style={[
                      s.td,
                      { width: w, textAlign: al },
                      esCoinc
                        ? { backgroundColor: COINC_BG[fila.coincidencia], color: COINC_FG[fila.coincidencia], fontFamily: "Helvetica-Bold" }
                        : {},
                    ]}
                  >
                    {fix(String(fila[k]))}
                  </Text>
                );
              })}
            </View>
          ))}
        </View>

        <View style={s.resumen}>
          <Text style={s.chip}>Casos: {resumen.total}</Text>
          <Text style={[s.chip, { color: C.good }]}>Coinciden: {resumen.coincide}</Text>
          <Text style={[s.chip, { color: C.warn }]}>Parciales: {resumen.parcial}</Text>
          <Text style={[s.chip, { color: C.bad }]}>No coinciden: {resumen.noCoincide}</Text>
          <Text style={[s.chip, { color: C.muted }]}>Sin dato: {resumen.sinDato}</Text>
        </View>
      </Page>
    </Document>
  );
}

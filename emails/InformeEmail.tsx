/**
 * Cuerpo del correo (React Email). Resumen del dictamen + aviso de informe adjunto.
 * Estilo corporativo (azul marino), coherente con la app y el PDF.
 */
import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Row,
  Column,
  Heading,
  Text,
  Hr,
  Link,
} from "@react-email/components";
import { money, pct, yrs, fmt, type Model } from "@/lib/calculo";
import type { Proyecto } from "@/lib/tipos";

const NAVY = "#0e2a47";
const INK = "#14263b";
const MUTED = "#5a6b7d";
const LINE = "#cbd4de";
const VERD: Record<string, { txt: string; bg: string; fg: string }> = {
  go: { txt: "GO", bg: "#e2efe9", fg: "#1e6b4f" },
  cond: { txt: "GO CONDICIONADO", bg: "#f3ead3", fg: "#8a6a1e" },
  nogo: { txt: "NO GO", bg: "#f1dedc", fg: "#a32f2a" },
};

export function InformeEmail({
  proyecto,
  modelo,
  urlInforme,
}: {
  proyecto: Proyecto;
  modelo: Model;
  urlInforme?: string;
}) {
  const v = VERD[modelo.verdict.v];
  const f = modelo.f;
  const mon = proyecto.moneda;
  const metrica = (k: string, val: string) => (
    <Column style={{ padding: "6px 0" }}>
      <Text style={{ margin: 0, fontSize: 11, color: MUTED, textTransform: "uppercase", letterSpacing: "0.4px" }}>
        {k}
      </Text>
      <Text style={{ margin: 0, fontSize: 18, fontWeight: 700, color: NAVY }}>{val}</Text>
    </Column>
  );

  return (
    <Html lang="es">
      <Head />
      <Preview>{`Informe de viabilidad de ${proyecto.nombre}: ${v.txt} (${fmt(modelo.total, 0)}/100)`}</Preview>
      <Body style={{ backgroundColor: "#eef1f5", fontFamily: "Arial, Helvetica, sans-serif", margin: 0, padding: "24px 0" }}>
        <Container style={{ maxWidth: 560, margin: "0 auto", backgroundColor: "#ffffff", border: `1px solid ${LINE}` }}>
          <Section style={{ backgroundColor: NAVY, padding: "18px 24px", borderBottom: "3px solid #1f4e87" }}>
            <Text style={{ margin: 0, fontSize: 10, letterSpacing: "1.5px", color: "#9fb2c9", textTransform: "uppercase" }}>
              Plantilla de viabilidad 360°
            </Text>
            <Heading as="h1" style={{ margin: "4px 0 0", fontSize: 18, color: "#ffffff", fontWeight: 700 }}>
              {proyecto.nombre || "Proyecto sin nombre"}
            </Heading>
          </Section>

          <Section style={{ padding: "20px 24px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                <tr>
                  <td style={{ backgroundColor: v.bg, borderLeft: `5px solid ${v.fg}`, padding: "14px 16px" }}>
                    <Text style={{ margin: 0, fontSize: 10, letterSpacing: "1px", color: v.fg, textTransform: "uppercase" }}>
                      Dictamen
                    </Text>
                    <Text style={{ margin: "2px 0 0", fontSize: 22, fontWeight: 700, color: v.fg }}>{v.txt}</Text>
                    <Text style={{ margin: "2px 0 0", fontSize: 13, color: v.fg }}>
                      Puntaje global {fmt(modelo.total, 0)} de 100.
                    </Text>
                  </td>
                </tr>
              </tbody>
            </table>

            <Row style={{ marginTop: 10 }}>
              {metrica("VAN", money(f.van, mon))}
              {metrica("TIR", pct(f.tir))}
            </Row>
            <Row>
              {metrica("Beneficio / costo", f.bc == null ? "n/d" : fmt(f.bc, 2))}
              {metrica("Recuperación", yrs(f.pb))}
            </Row>

            <Hr style={{ borderColor: LINE, margin: "16px 0" }} />
            <Text style={{ margin: 0, fontSize: 14, color: INK, lineHeight: 1.5 }}>
              Se adjunta el <strong>informe completo en PDF</strong> con todas las secciones:
              documentación, requerimientos, ciclo de vida y monitoreo (KPIs), cronograma,
              evaluación por enfoque, análisis estratégico (FODA, PESTEL, BSC y mapa
              estratégico), análisis financiero, mapa de riesgos y dictamen.
            </Text>
            {urlInforme && (
              <Text style={{ margin: "12px 0 0", fontSize: 14 }}>
                <Link href={urlInforme} style={{ color: "#1f4e87", fontWeight: 700 }}>
                  Ver el informe en línea →
                </Link>
              </Text>
            )}
          </Section>

          <Section style={{ padding: "12px 24px", borderTop: `1px solid ${LINE}` }}>
            <Text style={{ margin: 0, fontSize: 11, color: MUTED }}>
              Generado con la Plantilla de viabilidad 360° · Análisis y Evaluación de Proyectos.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default InformeEmail;

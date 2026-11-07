/**
 * Validación de campos vacíos / incompletos del Proyecto.
 *
 * Es advisory: no bloquea el cálculo (el motor tolera ceros), pero avisa al
 * usuario qué falta llenar. Así, al "empezar en blanco" y meter datos de
 * prueba, se ve claramente qué campos quedan pendientes.
 */

import type { Proyecto } from "./tipos";
import { N } from "./calculo";
import { PERSPECTIVAS_BSC } from "./esquema";

export type Nivel = "error" | "aviso";

export interface Aviso {
  nivel: Nivel;
  campo: string; // pestaña o sección a la que pertenece
  msg: string;
}

export function validar(p: Proyecto): Aviso[] {
  const a: Aviso[] = [];
  const err = (campo: string, msg: string) => a.push({ nivel: "error", campo, msg });
  const avi = (campo: string, msg: string) => a.push({ nivel: "aviso", campo, msg });

  // Datos generales
  if (!p.nombre.trim()) err("Proyecto", "El proyecto no tiene nombre.");
  if (!p.desc.trim()) avi("Proyecto", "Falta la descripción del proyecto.");
  if (!p.moneda.trim()) err("Financiera", "Falta el símbolo de moneda.");
  if (N(p.horizonte) < 1) err("Financiera", "El horizonte debe ser de al menos 1 año.");

  // Finanzas
  const invTot = p.inv.reduce((s, x) => s + N(x.v), 0);
  if (invTot <= 0) err("Financiera", "La inversión inicial total es 0.");
  if (p.inv.some((x) => !x.n.trim())) avi("Financiera", "Hay líneas de inversión sin concepto.");
  const benTot = p.ben.reduce((s, x) => s + N(x.v), 0);
  if (benTot <= 0) err("Financiera", "Los beneficios anuales suman 0.");
  if (p.ben.some((x) => !x.n.trim())) avi("Financiera", "Hay beneficios sin concepto.");
  if (p.cos.some((x) => !x.n.trim())) avi("Financiera", "Hay costos sin concepto.");

  // Riesgos
  if (!p.riesgos.length) avi("Riesgos", "No se registró ningún riesgo.");
  if (p.riesgos.some((r) => !r.n.trim())) avi("Riesgos", "Hay riesgos sin descripción.");

  // Campos nuevos del informe
  if (!p.requerimientos.length)
    avi("Requerimientos", "No se registró ningún requerimiento.");
  if (p.requerimientos.some((r) => !r.texto.trim()))
    avi("Requerimientos", "Hay requerimientos sin descripción.");
  if (!p.cronograma.length) avi("Cronograma", "El cronograma está vacío.");
  if (p.cronograma.some((c) => !c.fase.trim() || !c.inicio || !c.fin))
    avi("Cronograma", "Hay fases del cronograma sin nombre o sin fechas.");

  // Estrategia: PESTEL y BSC (pestaña Estratégica)
  if (!p.pestel.length) {
    avi("Estratégica", "No se registró el análisis PESTEL.");
  } else if (p.pestel.some((f) => !f.descripcion.trim())) {
    avi("Estratégica", "Hay factores PESTEL sin describir.");
  }
  if (!p.bsc.length) {
    avi("Estratégica", "No se registraron objetivos del Balanced Scorecard.");
  } else {
    PERSPECTIVAS_BSC.forEach((persp) => {
      const hay = p.bsc.some((o) => o.perspectiva === persp && o.objetivo.trim());
      if (!hay) avi("Estratégica", `La perspectiva «${persp}» del BSC no tiene objetivos.`);
    });
  }

  // Monitoreo: KPIs (pestaña Ciclo de vida)
  if (!p.kpis.length) {
    avi("Ciclo de vida", "No se registraron indicadores (KPIs) de monitoreo.");
  } else if (p.kpis.some((k) => !k.indicador.trim())) {
    avi("Ciclo de vida", "Hay indicadores (KPIs) sin nombre.");
  }

  return a;
}

export const contarErrores = (avisos: Aviso[]): number =>
  avisos.filter((x) => x.nivel === "error").length;

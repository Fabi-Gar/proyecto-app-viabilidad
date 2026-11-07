"use client";

/**
 * Calculadora de viabilidad 360° — página principal.
 *
 * Mantiene el proyecto en estado, lo calcula en vivo con el motor (lib/calculo)
 * y lo persiste en localStorage. Es genérica: arranca con el ejemplo, pero con
 * "Empezar en blanco" se evalúa cualquier proyecto.
 */
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ProyCtx, type Mut } from "@/components/contexto";
import { PanelProyecto } from "@/components/PanelProyecto";
import { PanelRequerimientos } from "@/components/PanelRequerimientos";
import { PanelEnfoque } from "@/components/PanelEnfoque";
import { PanelFinanciera } from "@/components/PanelFinanciera";
import { PanelRiesgos } from "@/components/PanelRiesgos";
import { PanelCronograma } from "@/components/PanelCronograma";
import { PanelDictamen } from "@/components/PanelDictamen";
import { DIMS, model, fmt } from "@/lib/calculo";
import { validar, contarErrores } from "@/lib/validacion";
import { ejemplo } from "@/lib/ejemplos";
import { normalizarProyecto } from "@/lib/esquema";
import type { Proyecto } from "@/lib/tipos";

const CLAVE = "viabilidad360-v1";

const PILL: Record<string, string> = { go: "GO", cond: "GO CONDICIONADO", nogo: "NO GO" };

interface Tab {
  id: string;
  n: string;
  dot?: string;
  render: () => React.ReactNode;
}

export default function Page() {
  const [p, setP] = useState<Proyecto>(() => ejemplo());
  const [tab, setTab] = useState("proy");

  // Cargar desde localStorage después de montar (evita desajuste de hidratación).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(CLAVE);
      if (raw) {
        const o = normalizarProyecto(JSON.parse(raw));
        if (o) setP(o);
      }
    } catch {
      /* ignora almacenamiento no disponible */
    }
  }, []);

  // Persistir en cada cambio.
  useEffect(() => {
    try {
      localStorage.setItem(CLAVE, JSON.stringify(p));
    } catch {
      /* ignora almacenamiento no disponible */
    }
  }, [p]);

  const mut: Mut = (fn) =>
    setP((prev) => {
      const n = structuredClone(prev);
      fn(n);
      return n;
    });

  const reemplazar = (np: Proyecto) => setP(np);

  const m = useMemo(() => model(p), [p]);
  const errores = useMemo(() => contarErrores(validar(p)), [p]);

  const [generando, setGenerando] = useState(false);
  async function descargarPDF() {
    setGenerando(true);
    try {
      const [{ pdf }, { InformePDF }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("@/pdf/InformePDF"),
      ]);
      const blob = await pdf(<InformePDF p={p} m={m} />).toBlob();
      const slug =
        (p.nombre || "proyecto")
          .toLowerCase()
          .normalize("NFD")
          .replace(/[̀-ͯ]/g, "")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "")
          .slice(0, 50) || "proyecto";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `informe-viabilidad-${slug}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Error al generar el PDF:", e);
    } finally {
      setGenerando(false);
    }
  }

  const tabs: Tab[] = [
    {
      id: "proy",
      n: "Proyecto",
      dot: errores > 0 ? String(errores) : undefined,
      render: () => <PanelProyecto />,
    },
    { id: "req", n: "Requerimientos", render: () => <PanelRequerimientos /> },
    ...DIMS.map((d) => ({
      id: d.k,
      n: d.tab,
      dot: fmt(m.sc[d.k], 0),
      render: () =>
        d.kind === "fin" ? (
          <PanelFinanciera />
        ) : d.kind === "risk" ? (
          <PanelRiesgos />
        ) : (
          <PanelEnfoque dim={d} />
        ),
    })),
    { id: "crono", n: "Cronograma", render: () => <PanelCronograma /> },
    { id: "dic", n: "Dictamen", dot: fmt(m.total, 0), render: () => <PanelDictamen /> },
  ];

  // Inserta Requerimientos justo después de Proyecto y Cronograma después de Ciclo de vida.
  const orden = ["proy", "req", "tec", "ope", "mer", "fin", "amb", "est", "rie", "cic", "crono", "dic"];
  tabs.sort((a, b) => orden.indexOf(a.id) - orden.indexOf(b.id));

  const activa = tabs.find((t) => t.id === tab) ?? tabs[0];

  return (
    <ProyCtx.Provider value={{ p, mut, m, reemplazar }}>
      <div className="wrap">
        <header className="top">
          <div className="t">
            <div className="eyebrow">Plantilla de viabilidad 360°</div>
            <div className="pname">{p.nombre || "Proyecto sin nombre"}</div>
          </div>
          <div className="right">
            <span className="gscore">{fmt(m.total, 0)} / 100</span>
            <span className={"pill " + m.verdict.v}>{PILL[m.verdict.v]}</span>
            <Link className="btn" href="/validacion">Validación</Link>
            <button className="btn primary" onClick={descargarPDF} disabled={generando}>
              {generando ? "Generando…" : "Descargar PDF"}
            </button>
          </div>
        </header>

        <nav id="tabs" role="tablist">
          {tabs.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={t.id === tab}
              onClick={() => {
                setTab(t.id);
                window.scrollTo({ top: 0 });
              }}
            >
              {t.n}
              {t.dot !== undefined && <span className="dot">{t.dot}</span>}
            </button>
          ))}
        </nav>

        <main>{activa.render()}</main>
      </div>
    </ProyCtx.Provider>
  );
}

"use client";

/**
 * Página de validación de casos (/validacion).
 *
 * Carga varios archivos .json de casos, calcula el dictamen de cada uno con el
 * motor y los compara contra el resultado real conocido (regla de coincidencia).
 * Permite abrir el informe completo de cada caso y exportar la tabla a CSV
 * (con BOM, para Excel) y a PDF con la estética del informe.
 */
import { useRef, useState } from "react";
import Link from "next/link";
import { model, money, pct, yrs, fmt } from "@/lib/calculo";
import { parsearProyecto } from "@/lib/esquema";
import { coincidencia, type Coincidencia } from "@/lib/coincidencia";
import { codificar, slug } from "@/lib/compartir";
import { ejemplo } from "@/lib/ejemplos";
import type { Proyecto } from "@/lib/tipos";
import type { FilaValidacion, ResumenValidacion } from "@/pdf/ValidacionPDF";

const PILL: Record<string, string> = { go: "Go", cond: "Go condicionado", nogo: "No Go" };
const COINC_CLS: Record<Coincidencia, string> = {
  Coincide: "ok",
  Parcial: "wn",
  "No coincide": "ko",
  "Sin dato": "muted",
};

interface Caso {
  p: Proyecto;
  archivo: string;
}

/** Deriva las columnas visibles (y del CSV/PDF) de un caso. */
function filaDe(c: Caso): FilaValidacion {
  const m = model(c.p);
  return {
    caso: c.p.nombre || c.archivo || "Proyecto sin nombre",
    resultadoReal: c.p.validacion.resultadoReal,
    fuente: c.p.validacion.fuente || "—",
    van: money(m.f.van, c.p.moneda),
    tir: pct(m.f.tir),
    bc: m.f.bc == null ? "n/d" : fmt(m.f.bc, 2),
    recuperacion: yrs(m.f.pb),
    puntaje: fmt(m.total, 0),
    dictamen: PILL[m.verdict.v],
    coincidencia: coincidencia(c.p.validacion.resultadoReal, m.verdict.v),
  };
}

function campoCSV(s: string): string {
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export default function ValidacionPage() {
  const [casos, setCasos] = useState<Caso[]>([]);
  const [msg, setMsg] = useState("");
  const [gen, setGen] = useState(false);
  const inputArchivo = useRef<HTMLInputElement>(null);

  const filas = casos.map((c) => ({ caso: c, fila: filaDe(c) }));
  const resumen: ResumenValidacion = {
    total: filas.length,
    coincide: filas.filter((f) => f.fila.coincidencia === "Coincide").length,
    parcial: filas.filter((f) => f.fila.coincidencia === "Parcial").length,
    noCoincide: filas.filter((f) => f.fila.coincidencia === "No coincide").length,
    sinDato: filas.filter((f) => f.fila.coincidencia === "Sin dato").length,
  };

  async function onArchivos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!files.length) return;
    const nuevos: Caso[] = [];
    const errores: string[] = [];
    for (const file of files) {
      try {
        const r = parsearProyecto(await file.text());
        if (r.ok) nuevos.push({ p: r.p, archivo: file.name });
        else errores.push(`«${file.name}»: ${r.error}`);
      } catch {
        errores.push(`«${file.name}»: no se pudo leer el archivo.`);
      }
    }
    setCasos((prev) => [...prev, ...nuevos]);
    setMsg(
      [
        nuevos.length ? `${nuevos.length} caso(s) cargado(s).` : "",
        errores.length ? `No se cargaron: ${errores.join("; ")}` : "",
      ].filter(Boolean).join(" ")
    );
  }

  function quitar(i: number) {
    setCasos((prev) => prev.filter((_, j) => j !== i));
  }

  function cargarEjemplo() {
    setCasos((prev) => [...prev, { p: ejemplo(), archivo: "restaurante-centro-lealtad.json" }]);
    setMsg("Caso de ejemplo agregado.");
  }

  function exportarCSV() {
    const cabeceras = [
      "Caso", "Resultado real", "Fuente", "VAN", "TIR", "B/C",
      "Recuperación", "Puntaje", "Dictamen", "¿Coincide?",
    ];
    const lineas = [cabeceras.join(",")];
    for (const { fila } of filas) {
      lineas.push(
        [
          fila.caso, fila.resultadoReal, fila.fuente, fila.van, fila.tir, fila.bc,
          fila.recuperacion, fila.puntaje, fila.dictamen, fila.coincidencia,
        ].map(campoCSV).join(",")
      );
    }
    // BOM UTF-8 para que Excel reconozca los acentos.
    const blob = new Blob(["﻿" + lineas.join("\r\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "validacion-casos.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function exportarPDF() {
    setGen(true);
    try {
      const [{ pdf }, { ValidacionPDF }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("@/pdf/ValidacionPDF"),
      ]);
      const blob = await pdf(
        <ValidacionPDF filas={filas.map((f) => f.fila)} resumen={resumen} />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "validacion-casos.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Error al generar el PDF de validación:", e);
      setMsg("No se pudo generar el PDF.");
    } finally {
      setGen(false);
    }
  }

  function enlaceInforme(p: Proyecto): string {
    return `/informe/${slug(p.nombre)}#d=${codificar(p)}`;
  }

  return (
    <div className="wrap">
      <header className="top">
        <div className="t">
          <div className="eyebrow">Viabilidad 360°</div>
          <div className="pname">Validación de casos</div>
        </div>
        <div className="right">
          <Link className="btn" href="/">← Volver a la calculadora</Link>
        </div>
      </header>

      <main className="panel">
        <div className="phead">
          <div>
            <h2>Validación de casos</h2>
            <p>
              Carga los archivos .json de cada caso. La herramienta calcula el dictamen y lo
              compara con el resultado real conocido. Puedes abrir el informe de cada caso y
              exportar la tabla.
            </p>
          </div>
        </div>

        <div className="card">
          <div className="row">
            <button className="btn primary" onClick={() => inputArchivo.current?.click()}>
              Cargar casos (.json)
            </button>
            <input
              ref={inputArchivo}
              type="file"
              accept="application/json,.json"
              multiple
              onChange={onArchivos}
              style={{ display: "none" }}
              aria-hidden="true"
            />
            <button className="btn" onClick={cargarEjemplo}>Agregar caso de ejemplo</button>
            {casos.length > 0 && (
              <>
                <button className="btn" onClick={exportarCSV}>Exportar CSV</button>
                <button className="btn" onClick={exportarPDF} disabled={gen}>
                  {gen ? "Generando…" : "Exportar PDF"}
                </button>
                <button className="btn" onClick={() => { setCasos([]); setMsg(""); }}>Limpiar</button>
              </>
            )}
          </div>
          {msg && <p className="hint" role="status">{msg}</p>}
        </div>

        {casos.length === 0 ? (
          <div className="card">
            <p className="muted">
              Aún no hay casos cargados. Usa «Cargar casos (.json)» para añadir los archivos de
              validación, o «Agregar caso de ejemplo» para ver cómo se ve la tabla.
            </p>
          </div>
        ) : (
          <>
            <div className="card">
              <div className="tw">
                <table>
                  <thead>
                    <tr>
                      <th className="l">Caso</th>
                      <th className="l">Resultado real</th>
                      <th className="l src">Fuente</th>
                      <th>VAN</th>
                      <th>TIR</th>
                      <th>B/C</th>
                      <th>Recuperación</th>
                      <th>Puntaje</th>
                      <th className="l">Dictamen</th>
                      <th className="l">¿Coincide?</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {filas.map(({ caso, fila }, i) => (
                      <tr key={i}>
                        <td className="l">
                          <Link href={enlaceInforme(caso.p)} target="_blank" rel="noopener">
                            {fila.caso}
                          </Link>
                        </td>
                        <td className="l">{fila.resultadoReal}</td>
                        <td className="l src">{fila.fuente}</td>
                        <td className="n">{fila.van}</td>
                        <td className="n">{fila.tir}</td>
                        <td className="n">{fila.bc}</td>
                        <td className="n">{fila.recuperacion}</td>
                        <td className="n">{fila.puntaje}</td>
                        <td className="l">{fila.dictamen}</td>
                        <td className="l"><b className={COINC_CLS[fila.coincidencia]}>{fila.coincidencia}</b></td>
                        <td>
                          <button className="x" aria-label="Quitar caso" onClick={() => quitar(i)}>×</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="card">
              <h3>Resumen</h3>
              <div className="tiles">
                <div className="tile"><div className="k">Casos</div><div className="v">{resumen.total}</div></div>
                <div className="tile good"><div className="k">Coinciden</div><div className="v">{resumen.coincide}</div></div>
                <div className="tile"><div className="k">Parciales</div><div className="v">{resumen.parcial}</div></div>
                <div className="tile bad"><div className="k">No coinciden</div><div className="v">{resumen.noCoincide}</div></div>
                <div className="tile"><div className="k">Sin dato</div><div className="v">{resumen.sinDato}</div></div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

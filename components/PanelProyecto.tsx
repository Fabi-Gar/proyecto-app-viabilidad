"use client";

/** Pestaña Proyecto: datos generales, cómo se decide, validación de campos y
 *  botones para cargar el ejemplo, empezar en blanco e importar/copiar JSON. */
import { useState } from "react";
import { useProy } from "./contexto";
import { TextInput } from "./campos";
import { ejemplo, plantillaEnBlanco } from "@/lib/ejemplos";
import { validar } from "@/lib/validacion";
import { parsearProyecto } from "@/lib/esquema";

export function PanelProyecto() {
  const { p, mut, reemplazar } = useProy();
  const [io, setIo] = useState("");
  const [msg, setMsg] = useState("");
  const avisos = validar(p);
  const esEjemplo = /Cifras de ejemplo/.test(p.desc);

  function copiar() {
    const txt = JSON.stringify(p, null, 1);
    const fallback = () => {
      setIo(txt);
      setMsg("Texto listo abajo: cópialo con Ctrl+C.");
    };
    try {
      navigator.clipboard.writeText(txt).then(() => setMsg("Datos copiados."), fallback);
    } catch {
      fallback();
    }
  }

  function importar() {
    const r = parsearProyecto(io);
    if (r.ok) {
      reemplazar(r.p);
      setMsg("Datos importados.");
    } else {
      setMsg(r.error);
    }
  }

  return (
    <section className="panel">
      <div className="phead">
        <div>
          <h2>Datos del proyecto</h2>
          <p>
            Describe el proyecto que vas a evaluar. Recorre cada pestaña, y el dictamen Go
            / No Go se actualiza solo.
          </p>
        </div>
      </div>

      <div className="card">
        <div className="field">
          <label>Nombre del proyecto</label>
          <TextInput value={p.nombre} onText={(v) => mut((n) => { n.nombre = v; })} invalid={!p.nombre.trim()} placeholder="Ej. Implementación de ERP" />
        </div>
        <div className="field">
          <label>Descripción</label>
          <textarea value={p.desc} onChange={(e) => mut((n) => { n.desc = e.target.value; })} placeholder="Describe el objetivo y alcance del proyecto" />
        </div>
        {esEjemplo && (
          <div className="note">
            Estos datos son un ejemplo con supuestos propios. Reemplázalos con la
            información real antes de decidir.
          </div>
        )}
      </div>

      <div className="card">
        <h3>Validación de campos</h3>
        {avisos.length === 0 ? (
          <p className="ok">✓ Todos los campos clave están completos.</p>
        ) : (
          <div>
            {avisos.map((a, i) => (
              <div className="valrow" key={i}>
                <b className={a.nivel === "error" ? "ko" : "wn"}>
                  {a.nivel === "error" ? "✗" : "!"}
                </b>
                <span>
                  <span className="hint">[{a.campo}]</span> {a.msg}
                </span>
              </div>
            ))}
            <p className="hint" style={{ marginTop: 8 }}>
              Los errores (✗) conviene resolverlos antes de generar el informe; los avisos
              (!) son recomendaciones.
            </p>
          </div>
        )}
      </div>

      <div className="card">
        <h3>Cómo se decide</h3>
        <p>
          Cada enfoque recibe un puntaje de 0 a 100. El puntaje global es el promedio
          ponderado con los pesos que fijes en la pestaña Dictamen.
        </p>
        <ul className="recs">
          <li>
            <b>Go</b> cuando se cumplen todas las condiciones: VAN positivo, TIR sobre la
            tasa, recuperación en el horizonte, Monte Carlo favorable, pesimista positivo,
            sin riesgos críticos, ninguna dimensión bajo 50 y puntaje global sobre el
            umbral.
          </li>
          <li>
            <b>Go condicionado</b> cuando el VAN es positivo pero falta cumplir alguna
            condición. La lista de recomendaciones indica qué corregir.
          </li>
          <li>
            <b>No Go</b> con VAN negativo, puntaje global bajo el umbral mínimo, tres o más
            riesgos críticos o una dimensión bajo 30.
          </li>
        </ul>
      </div>

      <div className="card">
        <h3>Datos del análisis</h3>
        <div className="row">
          <button className="btn" onClick={() => reemplazar(ejemplo())}>
            Cargar ejemplo de tarjetas de lealtad
          </button>
          <button className="btn primary" onClick={() => reemplazar(plantillaEnBlanco())}>
            Empezar un proyecto en blanco
          </button>
          <button className="btn" onClick={copiar}>
            Copiar datos (JSON)
          </button>
        </div>
        <div className="field">
          <label>
            Para guardar un análisis, copia el JSON y pégalo en un archivo. Para retomarlo,
            pégalo aquí.
          </label>
          <textarea value={io} onChange={(e) => setIo(e.target.value)} placeholder="Pega aquí el JSON para importar" />
        </div>
        <div className="row">
          <button className="btn" onClick={importar}>
            Importar JSON
          </button>
          <span className="hint" role="status">
            {msg}
          </span>
        </div>
      </div>
    </section>
  );
}

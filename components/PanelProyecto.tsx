"use client";

/** Pestaña Proyecto: datos generales, cómo se decide, validación de campos y
 *  botones para cargar el ejemplo, empezar en blanco e importar/copiar JSON. */
import { useRef, useState } from "react";
import { useProy } from "./contexto";
import { TextInput, Select } from "./campos";
import { ejemplo, plantillaEnBlanco } from "@/lib/ejemplos";
import { validar } from "@/lib/validacion";
import { parsearProyecto } from "@/lib/esquema";
import { slug } from "@/lib/compartir";
import type { ResultadoValidacion } from "@/lib/tipos";

const RESULTADO_OPTS: [ResultadoValidacion, string][] = [
  ["Sin dato", "Sin dato"],
  ["Éxito", "Éxito"],
  ["Fracaso", "Fracaso"],
];

export function PanelProyecto() {
  const { p, mut, reemplazar } = useProy();
  const [io, setIo] = useState("");
  const [msg, setMsg] = useState("");
  const inputArchivo = useRef<HTMLInputElement>(null);
  const avisos = validar(p);
  const esEjemplo = /Cifras de ejemplo/.test(p.desc);

  function descargarJSON() {
    try {
      const blob = new Blob([JSON.stringify(p, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `proyecto-${slug(p.nombre)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setMsg("Proyecto descargado como archivo .json.");
    } catch {
      setMsg("No se pudo descargar el archivo.");
    }
  }

  async function onArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // permite volver a cargar el mismo archivo
    if (!file) return;
    try {
      const texto = await file.text();
      const r = parsearProyecto(texto);
      if (r.ok) {
        reemplazar(r.p);
        setMsg(`Proyecto cargado desde «${file.name}».`);
      } else {
        setMsg(`No se pudo cargar «${file.name}»: ${r.error}`);
      }
    } catch {
      setMsg("No se pudo leer el archivo.");
    }
  }

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
        <h3>Datos de validación del caso</h3>
        <p className="hint">
          Para el anexo de validación: registra el resultado real conocido del proyecto
          (si lo hubo), de dónde salen las cifras y cualquier nota. Sirve para comparar el
          dictamen de la calculadora contra lo que de verdad pasó.
        </p>
        <div className="grid">
          <div className="field">
            <label>Resultado real</label>
            <Select
              value={p.validacion.resultadoReal}
              onPick={(v) => mut((n) => { n.validacion.resultadoReal = v; })}
              options={RESULTADO_OPTS}
              aria-label="Resultado real"
            />
          </div>
          <div className="field">
            <label>Fuente</label>
            <TextInput
              value={p.validacion.fuente}
              onText={(v) => mut((n) => { n.validacion.fuente = v; })}
              placeholder="Texto o URL de la fuente del caso"
            />
          </div>
        </div>
        <div className="field">
          <label>Notas</label>
          <textarea
            value={p.validacion.notas}
            onChange={(e) => mut((n) => { n.validacion.notas = e.target.value; })}
            placeholder="Contexto del caso, observaciones o por qué coincide o no con el dictamen"
          />
        </div>
      </div>

      <div className="card">
        <h3>Guardar y cargar</h3>
        <p className="hint">
          Guarda el proyecto en un archivo <b>.json</b> para retomarlo después o compartirlo
          con el equipo. Al cargar, se valida el archivo y se completan los campos que falten.
        </p>
        <div className="row">
          <button className="btn primary" onClick={descargarJSON}>
            Descargar proyecto (.json)
          </button>
          <button className="btn" onClick={() => inputArchivo.current?.click()}>
            Cargar proyecto (.json)
          </button>
          <input
            ref={inputArchivo}
            type="file"
            accept="application/json,.json"
            onChange={onArchivo}
            style={{ display: "none" }}
            aria-hidden="true"
          />
        </div>
        <div className="row">
          <button className="btn" onClick={() => reemplazar(ejemplo())}>
            Cargar ejemplo de tarjetas de lealtad
          </button>
          <button className="btn" onClick={() => reemplazar(plantillaEnBlanco())}>
            Empezar un proyecto en blanco
          </button>
        </div>
        <span className="hint" role="status">{msg}</span>
      </div>

      <details className="card">
        <summary style={{ cursor: "pointer", fontWeight: 600 }}>
          Copiar o pegar JSON (avanzado)
        </summary>
        <div className="row" style={{ marginTop: 10 }}>
          <button className="btn" onClick={copiar}>Copiar datos (JSON)</button>
          <button className="btn" onClick={importar}>Importar JSON pegado</button>
        </div>
        <div className="field">
          <textarea value={io} onChange={(e) => setIo(e.target.value)} placeholder="Pega aquí el JSON para importar" />
        </div>
      </details>
    </section>
  );
}

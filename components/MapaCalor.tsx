"use client";

/**
 * Mapa de calor de riesgo inherente: cuadrícula 5×5 (probabilidad × impacto)
 * coloreada por nivel, con el conteo de riesgos en cada celda.
 */
import { lvlOf, N } from "@/lib/calculo";
import type { Riesgo } from "@/lib/tipos";

export function MapaCalor({ riesgos }: { riesgos: Riesgo[] }) {
  const cols = [1, 2, 3, 4, 5];
  const probs = [5, 4, 3, 2, 1]; // de arriba (P5) hacia abajo (P1)
  return (
    <div>
      <div className="heat">
        <span />
        {cols.map((i) => (
          <span key={i} style={{ textAlign: "center" }}>
            I{i}
          </span>
        ))}
        {probs.map((p) => (
          <Fila key={p} p={p} riesgos={riesgos} />
        ))}
      </div>
      <p className="hint" style={{ marginTop: 8 }}>
        Filas: probabilidad. Columnas: impacto. El número es la cantidad de riesgos en
        cada celda.
      </p>
    </div>
  );
}

function Fila({ p, riesgos }: { p: number; riesgos: Riesgo[] }) {
  return (
    <>
      <span>P{p}</span>
      {[1, 2, 3, 4, 5].map((i) => {
        const c = riesgos.filter((r) => N(r.p) === p && N(r.i) === i).length;
        return (
          <div key={i} className={"c " + lvlOf(p * i)}>
            {c || ""}
          </div>
        );
      })}
    </>
  );
}

/**
 * Regla de coincidencia para el anexo de validación: compara el resultado real
 * conocido de un caso contra el dictamen que produce la calculadora.
 *
 *   Éxito   + Go            -> Coincide
 *   Éxito   + Go condicion. -> Parcial
 *   Éxito   + No Go         -> No coincide
 *   Fracaso + No Go         -> Coincide
 *   Fracaso + Go condicion. -> Parcial
 *   Fracaso + Go            -> No coincide
 *   Sin dato                -> Sin dato (no se puede comparar)
 */
import type { ResultadoValidacion } from "./tipos";
import type { Veredicto } from "./calculo";

export type Coincidencia = "Coincide" | "Parcial" | "No coincide" | "Sin dato";

export function coincidencia(
  resultadoReal: ResultadoValidacion,
  veredicto: Veredicto
): Coincidencia {
  if (resultadoReal === "Éxito") {
    return veredicto === "go" ? "Coincide" : veredicto === "cond" ? "Parcial" : "No coincide";
  }
  if (resultadoReal === "Fracaso") {
    return veredicto === "nogo" ? "Coincide" : veredicto === "cond" ? "Parcial" : "No coincide";
  }
  return "Sin dato";
}

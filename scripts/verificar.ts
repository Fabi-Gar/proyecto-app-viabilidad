/**
 * Verificación del motor con el ejemplo del restaurante (sucursal Centro).
 * Esperado: VAN ≈ −Q 139,052, TIR ≈ −26.7%, sin recuperación,
 * dictamen "No Go" (nogo) con 38/100.
 *
 * Correr: npx tsx scripts/verificar.ts
 */
import { model, money, pct, yrs, fmt } from "../lib/calculo";
import { ejemplo } from "../lib/ejemplos";

const m = model(ejemplo());
const v = { go: "Go", cond: "Go condicionado", nogo: "No Go" }[m.verdict.v];

console.log("VAN:          ", money(m.f.van, "Q"));
console.log("TIR:          ", pct(m.f.tir));
console.log("Recuperación: ", yrs(m.f.pb));
console.log("B/C:          ", m.f.bc == null ? "n/d" : fmt(m.f.bc, 2));
console.log("Puntaje:      ", fmt(m.total, 0) + " / 100");
console.log("Dictamen:     ", v);
console.log("Prob VAN>0:   ", pct(m.mcr.p, 0));

const ok =
  Math.round(m.f.van) === -139052 &&
  Math.abs((m.f.tir ?? 0) * 100 - -26.7) < 0.1 &&
  m.f.pb == null &&
  Math.round(m.total) === 38 &&
  m.verdict.v === "nogo";

console.log("\n" + (ok ? "✓ COINCIDE con lo esperado" : "✗ NO coincide"));
process.exit(ok ? 0 : 1);

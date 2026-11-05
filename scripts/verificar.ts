/**
 * Verificación del motor con el ejemplo de tarjetas de lealtad.
 * Esperado: VAN ≈ Q 16,796, TIR ≈ 21.9%, recuperación ≈ 3.1 años,
 * dictamen "Go condicionado" (cond) con 60/100.
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
  Math.round(m.f.van) === 16796 &&
  Math.abs((m.f.tir ?? 0) * 100 - 21.9) < 0.1 &&
  Math.abs((m.f.pb ?? 0) - 3.1) < 0.1 &&
  Math.round(m.total) === 60 &&
  m.verdict.v === "cond";

console.log("\n" + (ok ? "✓ COINCIDE con lo esperado" : "✗ NO coincide"));
process.exit(ok ? 0 : 1);

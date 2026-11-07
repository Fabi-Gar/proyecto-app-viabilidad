/**
 * Pruebas de regresión del motor y de la regla de coincidencia.
 *
 * Correr con: npm test  (usa tsx --test).
 * Las cifras esperadas están verificadas contra el Excel de la plantilla.
 * Tolerancia: 0.01 en métricas, 0.1 en puntajes.
 */
import { test } from "node:test";
import assert from "node:assert/strict";

import { model } from "../lib/calculo";
import { ejemplo, plantillaEnBlanco } from "../lib/ejemplos";
import { normalizarProyecto } from "../lib/esquema";
import { coincidencia } from "../lib/coincidencia";
import type { Proyecto } from "../lib/tipos";

const MET = 0.01; // tolerancia de métricas
const PTS = 0.1; // tolerancia de puntajes

function cerca(a: number, b: number, tol: number, etq: string) {
  assert.ok(Math.abs(a - b) <= tol, `${etq}: ${a} != ${b} (tol ${tol})`);
}

interface Esperado {
  van: number;
  tir: number | null; // en %, null si no hay
  bc: number | null;
  pb: number | null;
  total: number;
  v: "go" | "cond" | "nogo";
}

function comprobar(p: Proyecto, e: Esperado, etq: string) {
  const m = model(p);
  cerca(m.f.van, e.van, MET, `${etq} VAN`);
  if (e.tir === null) assert.equal(m.f.tir, null, `${etq} TIR debe ser null`);
  else cerca((m.f.tir ?? 0) * 100, e.tir, MET, `${etq} TIR`);
  if (e.bc === null) assert.equal(m.f.bc, null, `${etq} B/C debe ser null`);
  else cerca(m.f.bc ?? 0, e.bc, MET, `${etq} B/C`);
  if (e.pb === null) assert.equal(m.f.pb, null, `${etq} recuperación debe ser null`);
  else cerca(m.f.pb ?? 0, e.pb, MET, `${etq} recuperación`);
  cerca(m.total, e.total, PTS, `${etq} puntaje`);
  assert.equal(m.verdict.v, e.v, `${etq} dictamen`);
}

test("Caso A: ejemplo() sin cambios → No Go (restaurante Centro)", () => {
  comprobar(ejemplo(), { van: -139052.47, tir: -26.73, bc: 0.744, pb: null, total: 37.64, v: "nogo" }, "A");
});

test("Caso B: éxito claro → Go", () => {
  const p = ejemplo();
  p.ben = p.ben.map((b) => ({ ...b, v: b.v * 3 }));
  (Object.keys(p.scores) as (keyof typeof p.scores)[]).forEach((k) => {
    p.scores[k] = p.scores[k].map(() => 4);
  });
  p.riesgos = p.riesgos.map((r) => ({ ...r, p: 1, i: 1 }));
  comprobar(p, { van: 668590.43, tir: 124.5, bc: 2.232, pb: 0.789, total: 84.4, v: "go" }, "B");
});

test("Caso C: fracaso → No Go (TIR y recuperación nulas)", () => {
  const p = ejemplo();
  p.ben = p.ben.map((b) => ({ ...b, v: b.v * 0.4 }));
  p.scores.tec = [2, 2, 1, 2, 2, 2];
  p.scores.mer = [1, 2, 1, 1, 2];
  p.riesgos = p.riesgos.map((r, i) => (i < 4 ? { ...r, p: 5, i: 5, m: 0 } : r));
  comprobar(p, { van: -381345.34, tir: null, bc: 0.298, pb: null, total: 20.71, v: "nogo" }, "C");
});

test("Caso E: borde (horizonte 3, beneficios ×0.9) → No Go", () => {
  const p = ejemplo();
  p.horizonte = 3;
  p.ben = p.ben.map((b) => ({ ...b, v: b.v * 0.9 }));
  comprobar(p, { van: -182086.62, tir: -75.11, bc: 0.571, pb: null, total: 37.38, v: "nogo" }, "E");
});

test("Plantilla en blanco → No Go", () => {
  assert.equal(model(plantillaEnBlanco()).verdict.v, "nogo");
});

test("Monte Carlo reproducible: dos corridas idénticas", () => {
  const a = model(ejemplo()).mcr;
  const b = model(ejemplo()).mcr;
  assert.equal(a.mean, b.mean);
  assert.equal(a.p, b.p);
  assert.equal(a.p5, b.p5);
  assert.equal(a.p50, b.p50);
  assert.equal(a.p95, b.p95);
  assert.deepEqual(a.v, b.v);
});

test("Compatibilidad: proyecto antiguo sin campos nuevos se carga sin error", () => {
  const viejo = ejemplo() as unknown as Record<string, unknown>;
  // Simula un proyecto guardado antes de estos campos.
  delete viejo.pestel;
  delete viejo.bsc;
  delete viejo.kpis;
  delete viejo.validacion;
  delete viejo.requerimientos;
  delete viejo.cicloVida;
  delete viejo.cronograma;
  const norm = normalizarProyecto(JSON.parse(JSON.stringify(viejo)));
  assert.ok(norm, "normalizarProyecto no debe devolver null");
  assert.ok(Array.isArray(norm.pestel));
  assert.ok(Array.isArray(norm.bsc));
  assert.ok(Array.isArray(norm.kpis));
  assert.ok(norm.validacion && norm.validacion.resultadoReal === "Sin dato");
  assert.doesNotThrow(() => model(norm));
});

test("Regla de coincidencia: los 6 casos de la tabla + sin dato", () => {
  assert.equal(coincidencia("Éxito", "go"), "Coincide");
  assert.equal(coincidencia("Éxito", "cond"), "Parcial");
  assert.equal(coincidencia("Éxito", "nogo"), "No coincide");
  assert.equal(coincidencia("Fracaso", "nogo"), "Coincide");
  assert.equal(coincidencia("Fracaso", "cond"), "Parcial");
  assert.equal(coincidencia("Fracaso", "go"), "No coincide");
  assert.equal(coincidencia("Sin dato", "go"), "Sin dato");
});

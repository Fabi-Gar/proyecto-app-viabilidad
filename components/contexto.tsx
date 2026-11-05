"use client";

/**
 * Contexto compartido para toda la calculadora: el proyecto en edición,
 * un mutador inmutable, y el modelo calculado en vivo.
 */
import { createContext, useContext } from "react";
import type { Proyecto } from "@/lib/tipos";
import type { Model } from "@/lib/calculo";

/** Muta el proyecto con un draft (se clona por debajo, inmutable para React). */
export type Mut = (fn: (p: Proyecto) => void) => void;

export interface Ctx {
  p: Proyecto;
  mut: Mut;
  m: Model;
  /** Reemplaza el proyecto completo (cargar ejemplo, empezar en blanco, importar). */
  reemplazar: (p: Proyecto) => void;
}

export const ProyCtx = createContext<Ctx | null>(null);

export function useProy(): Ctx {
  const c = useContext(ProyCtx);
  if (!c) throw new Error("useProy debe usarse dentro de <ProyCtx.Provider>");
  return c;
}

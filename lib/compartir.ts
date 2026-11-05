/**
 * Compartir un informe por enlace, sin base de datos (MVP del plan, sección 8).
 *
 * El proyecto se codifica (base64url de su JSON) y viaja en el hash de la URL
 * (#d=...). El hash no se envía al servidor, así que la página pública
 * /informe/[id] lo lee y reconstruye en el cliente. La URL es larga pero no
 * necesita servidor de datos: suficiente para el curso.
 */
import type { Proyecto } from "./tipos";

/** Codifica un proyecto a una cadena segura para URL. */
export function codificar(p: Proyecto): string {
  const bytes = new TextEncoder().encode(JSON.stringify(p));
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Reconstruye un proyecto desde la cadena del enlace. null si no es válida. */
export function decodificar(s: string): Proyecto | null {
  try {
    const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
    const bin = atob(b64);
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    const o = JSON.parse(new TextDecoder().decode(bytes)) as Proyecto;
    if (!o || o.v !== 1 || !o.inv || !o.scores || !o.riesgos) return null;
    o.requerimientos = o.requerimientos ?? [];
    o.cicloVida = o.cicloVida ?? [];
    o.cronograma = o.cronograma ?? [];
    return o;
  } catch {
    return null;
  }
}

/** Slug corto a partir del nombre, para que la URL sea legible. */
export function slug(nombre: string): string {
  return (
    (nombre || "proyecto")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 50) || "proyecto"
  );
}

/** URL pública del informe con el proyecto codificado en el hash. */
export function urlInforme(p: Proyecto, base?: string): string {
  const origen =
    base ||
    process.env.NEXT_PUBLIC_APP_URL ||
    (typeof window !== "undefined" ? window.location.origin : "");
  return `${origen.replace(/\/$/, "")}/informe/${slug(p.nombre)}#d=${codificar(p)}`;
}

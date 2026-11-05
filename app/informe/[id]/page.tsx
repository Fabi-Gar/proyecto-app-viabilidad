"use client";

/**
 * Página pública del informe (sin login), destino del enlace de WhatsApp.
 * El proyecto llega codificado en el hash (#d=...); se lee en el cliente y se
 * reconstruye el informe. No necesita base de datos (MVP del plan, sección 8).
 */
import { useEffect, useMemo, useState } from "react";
import { decodificar } from "@/lib/compartir";
import { model } from "@/lib/calculo";
import { InformeView } from "@/components/InformeView";
import type { Proyecto } from "@/lib/tipos";

function Mensaje({ titulo, detalle }: { titulo: string; detalle?: string }) {
  return (
    <div className="wrap" style={{ paddingTop: 80, textAlign: "center" }}>
      <h2>{titulo}</h2>
      {detalle && <p className="muted" style={{ marginTop: 8 }}>{detalle}</p>}
    </div>
  );
}

export default function InformePublico() {
  const [p, setP] = useState<Proyecto | null>(null);
  const [estado, setEstado] = useState<"cargando" | "ok" | "error">("cargando");

  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, "");
    const m = hash.match(/(?:^|&)d=([A-Za-z0-9\-_]+)/);
    const o = m ? decodificar(m[1]) : null;
    if (o) {
      setP(o);
      setEstado("ok");
    } else {
      setEstado("error");
    }
  }, []);

  const modelo = useMemo(() => (p ? model(p) : null), [p]);

  if (estado === "cargando") return <Mensaje titulo="Cargando informe…" />;
  if (estado === "error" || !p || !modelo)
    return (
      <Mensaje
        titulo="No se pudo abrir el informe"
        detalle="El enlace está incompleto o no es válido. Pide que te lo compartan de nuevo."
      />
    );

  return <InformeView p={p} m={modelo} />;
}

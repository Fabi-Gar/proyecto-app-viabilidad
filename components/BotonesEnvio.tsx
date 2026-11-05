"use client";

/**
 * Envío del informe: correo (Resend, vía /api/enviar-correo) y WhatsApp
 * (enlace wa.me con un enlace público al informe). También copia el enlace.
 */
import { useState } from "react";
import { useProy } from "./contexto";
import { urlInforme } from "@/lib/compartir";
import { fmt } from "@/lib/calculo";

const PILL: Record<string, string> = { go: "Go", cond: "Go condicionado", nogo: "No Go" };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function BotonesEnvio() {
  const { p, m } = useProy();
  const [destino, setDestino] = useState("");
  const [estado, setEstado] = useState<"idle" | "enviando" | "ok" | "error">("idle");
  const [msg, setMsg] = useState("");
  const [copiado, setCopiado] = useState(false);

  async function enviarCorreo() {
    if (!EMAIL_RE.test(destino.trim())) {
      setEstado("error");
      setMsg("Escribe un correo de destino válido.");
      return;
    }
    setEstado("enviando");
    setMsg("");
    try {
      const res = await fetch("/api/enviar-correo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proyecto: p, destino: destino.trim(), urlInforme: urlInforme(p) }),
      });
      const data = await res.json();
      if (res.ok) {
        setEstado("ok");
        setMsg(`Informe enviado a ${destino.trim()}.`);
      } else {
        setEstado("error");
        setMsg(data?.error || "No se pudo enviar el correo.");
      }
    } catch {
      setEstado("error");
      setMsg("Error de red al enviar el correo.");
    }
  }

  function compartirWhatsApp() {
    const url = urlInforme(p);
    const texto = `Informe de viabilidad de "${p.nombre || "proyecto"}": dictamen ${PILL[m.verdict.v]} (${fmt(m.total, 0)}/100). Vela aquí: ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, "_blank", "noopener");
  }

  async function copiarEnlace() {
    try {
      await navigator.clipboard.writeText(urlInforme(p));
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      setCopiado(false);
    }
  }

  return (
    <div className="card">
      <h3>Enviar el informe</h3>
      <div className="field">
        <label htmlFor="destino">Correo de destino</label>
        <input
          id="destino"
          type="email"
          inputMode="email"
          placeholder="nombre@correo.com"
          value={destino}
          onChange={(e) => setDestino(e.target.value)}
        />
      </div>
      <div className="row">
        <button className="btn primary" onClick={enviarCorreo} disabled={estado === "enviando"}>
          {estado === "enviando" ? "Enviando…" : "Enviar por correo"}
        </button>
        <button className="btn" onClick={compartirWhatsApp}>
          Compartir por WhatsApp
        </button>
        <button className="btn" onClick={copiarEnlace}>
          {copiado ? "Enlace copiado" : "Copiar enlace del informe"}
        </button>
      </div>
      {msg && (
        <p className={estado === "ok" ? "ok" : estado === "error" ? "ko" : "hint"} role="status" style={{ fontSize: 13 }}>
          {msg}
        </p>
      )}
      <p className="hint">
        El correo adjunta el PDF (requiere configurar Resend al desplegar). El enlace de
        WhatsApp abre un mensaje con una página pública del informe; la URL lleva los datos
        codificados, no se guarda en ningún servidor.
      </p>
    </div>
  );
}

"use client";

/**
 * Envío del informe: correo (Resend, vía /api/enviar-correo) y WhatsApp
 * (enlace wa.me con un enlace público al informe). También copia el enlace.
 *
 * No se registran en consola ni el correo de destino ni ningún dato sensible.
 */
import { useState } from "react";
import { useProy } from "./contexto";
import { urlInforme } from "@/lib/compartir";
import { money, pct, fmt } from "@/lib/calculo";

const PILL: Record<string, string> = { go: "Go", cond: "Go condicionado", nogo: "No Go" };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Estado = "idle" | "enviando" | "ok" | "error" | "noConfig";

export function BotonesEnvio() {
  const { p, m } = useProy();
  const [destino, setDestino] = useState("");
  const [estado, setEstado] = useState<Estado>("idle");
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
      } else if (res.status === 503 || data?.noConfigurado) {
        setEstado("noConfig");
        setMsg(data?.error || "El envío por correo aún no está configurado.");
      } else {
        setEstado("error");
        setMsg(data?.error || "No se pudo enviar el correo.");
      }
    } catch {
      setEstado("error");
      setMsg("Error de red al enviar el correo. Revisa tu conexión e inténtalo de nuevo.");
    }
  }

  function compartirWhatsApp() {
    const url = urlInforme(p);
    const f = m.f;
    const texto =
      `Viabilidad de "${p.nombre || "proyecto"}": ${PILL[m.verdict.v]} · ` +
      `${fmt(m.total, 0)}/100 · VAN ${money(f.van, p.moneda)} · TIR ${pct(f.tir)}. ` +
      `Informe: ${url}`;
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

      {msg && estado === "noConfig" && (
        <div className="note" role="status">{msg}</div>
      )}
      {msg && estado !== "noConfig" && (
        <p className={estado === "ok" ? "ok" : estado === "error" ? "ko" : "hint"} role="status" style={{ fontSize: 13 }}>
          {msg}
        </p>
      )}

      <p className="hint">
        <b>Correo:</b> adjunta el PDF completo (requiere que el equipo haya configurado el
        envío al desplegar). <b>WhatsApp:</b> no adjunta el PDF; abre un mensaje con el
        dictamen y un <b>enlace</b> a la página del informe.
      </p>
      <p className="hint">
        El enlace lleva todos los datos del proyecto <b>codificados en la propia URL</b> (no se
        guarda en ningún servidor): quien reciba el enlace podrá ver el informe completo. No lo
        compartas si el proyecto es confidencial.
      </p>
    </div>
  );
}

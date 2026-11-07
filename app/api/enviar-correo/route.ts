/**
 * POST /api/enviar-correo
 * Recibe { proyecto, destino, urlInforme? }, calcula el modelo, arma el PDF y
 * lo envía por correo con Resend (PDF adjunto). La clave vive solo en el
 * servidor (variables de entorno); nunca en el cliente.
 */
import { renderToBuffer } from "@react-pdf/renderer";
import { Resend } from "resend";
import { InformePDF } from "@/pdf/InformePDF";
import { InformeEmail } from "@/emails/InformeEmail";
import { model } from "@/lib/calculo";
import { esEstructuraValida, completarProyecto } from "@/lib/esquema";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  let body: { proyecto?: unknown; destino?: unknown; urlInforme?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Cuerpo de la solicitud inválido." }, { status: 400 });
  }

  const { proyecto, destino, urlInforme } = body;

  if (typeof destino !== "string" || !EMAIL_RE.test(destino.trim())) {
    return Response.json({ error: "Correo de destino inválido." }, { status: 400 });
  }
  if (!esEstructuraValida(proyecto)) {
    return Response.json({ error: "Datos del proyecto inválidos." }, { status: 400 });
  }
  completarProyecto(proyecto);

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) {
    return Response.json(
      {
        error:
          "El envío de correo no está configurado todavía. Falta RESEND_API_KEY y/o EMAIL_FROM en el servidor (se configura al desplegar con el dominio verificado).",
      },
      { status: 503 }
    );
  }

  try {
    const m = model(proyecto);
    const pdf = await renderToBuffer(InformePDF({ p: proyecto, m }));

    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from,
      to: destino.trim(),
      subject: `Informe de viabilidad: ${proyecto.nombre || "Proyecto"}`,
      react: InformeEmail({
        proyecto,
        modelo: m,
        urlInforme: typeof urlInforme === "string" ? urlInforme : undefined,
      }),
      attachments: [
        {
          filename: "informe-viabilidad.pdf",
          content: Buffer.from(pdf),
        },
      ],
    });

    if (error) {
      return Response.json({ error: error.message || "Resend rechazó el envío." }, { status: 502 });
    }
    return Response.json({ ok: true, id: data?.id });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error desconocido al enviar el informe.";
    return Response.json({ error: msg }, { status: 500 });
  }
}

import { Router } from "express";
import { db } from "@workspace/db";
import { operatorsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { Resend } from "resend";

const router = Router();

const FROM = process.env.CONTACT_FROM_EMAIL ?? "Directorio Turístico <noreply@tourup.pe>";
const PLATFORM_EMAIL = process.env.PLATFORM_CONTACT_EMAIL ?? "villanuevaronaldinho@gmail.com";

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY no configurado");
  return new Resend(key);
}

router.post("/operators/:id/contact", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return void res.status(400).json({ error: "Invalid id" });

    const { nombre, email, asunto, mensaje } = req.body as {
      nombre?: string; email?: string; asunto?: string; mensaje?: string;
    };

    if (!nombre?.trim() || !email?.trim() || !mensaje?.trim()) {
      return void res.status(400).json({ error: "nombre, email y mensaje son obligatorios" });
    }

    const [op] = await db.select({
      id: operatorsTable.id,
      commercialName: operatorsTable.commercialName,
      email: operatorsTable.email,
      region: operatorsTable.region,
    }).from(operatorsTable).where(eq(operatorsTable.id, id));

    if (!op) return void res.status(404).json({ error: "Operador no encontrado" });

    const subject = asunto?.trim()
      ? `[Directorio Turístico] ${asunto.trim()}`
      : `[Directorio Turístico] Consulta sobre ${op.commercialName}`;

    const html = `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1a1a2e">
        <div style="background:#0d1b3e;padding:24px 32px;border-radius:12px 12px 0 0">
          <p style="margin:0;font-size:11px;color:#38bdf8;font-weight:700;letter-spacing:2px;text-transform:uppercase">
            Directorio Inteligente de Prestadores Turísticos
          </p>
          <h2 style="margin:8px 0 0;color:#fff;font-size:20px">Nueva consulta recibida</h2>
        </div>
        <div style="background:#f8fafc;padding:28px 32px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px">
          <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
            <tr><td style="padding:8px 0;color:#64748b;font-size:13px;width:120px">Operador</td>
                <td style="padding:8px 0;font-weight:600;font-size:13px">${op.commercialName}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b;font-size:13px">Región</td>
                <td style="padding:8px 0;font-size:13px">${op.region}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b;font-size:13px">De</td>
                <td style="padding:8px 0;font-size:13px">${nombre} &lt;${email}&gt;</td></tr>
            <tr><td style="padding:8px 0;color:#64748b;font-size:13px">Asunto</td>
                <td style="padding:8px 0;font-size:13px">${asunto?.trim() || "Sin asunto"}</td></tr>
          </table>
          <div style="background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:16px 20px">
            <p style="margin:0 0 6px;font-size:12px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px">Mensaje</p>
            <p style="margin:0;font-size:14px;line-height:1.7;white-space:pre-wrap">${mensaje.trim()}</p>
          </div>
          <p style="margin:20px 0 0;font-size:12px;color:#94a3b8">
            Para responder, escribe directamente a <a href="mailto:${email}" style="color:#0ea5e9">${email}</a>
          </p>
        </div>
      </div>
    `;

    // Send to operator email (if available) AND platform email
    const toList: string[] = [PLATFORM_EMAIL];
    if (op.email && op.email !== PLATFORM_EMAIL) toList.push(op.email);

    await getResend().emails.send({
      from: FROM,
      to: toList,
      reply_to: email,
      subject,
      html,
    });

    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Error sending contact email");
    res.status(500).json({ error: "No se pudo enviar el mensaje" });
  }
});

export default router;

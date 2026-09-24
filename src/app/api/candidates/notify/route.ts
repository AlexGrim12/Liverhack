import { handle, HttpError, readJson, requireUser, assertUuid } from "@/lib/server/http";
import { getAccessToken } from "@/lib/google/tokens";
import { sendEmail } from "@/lib/google/gmail";

export const dynamic = "force-dynamic";

const PLANTILLAS: Record<string, { asunto: (v: string) => string; cuerpo: (n: string, v: string) => string }> = {
  recibida: {
    asunto: (v) => `Recibimos tu postulación — ${v}`,
    cuerpo: (n, v) => `Hola ${n},\n\nGracias por postularte a "${v}" en El Puerto de Liverpool. Ya revisamos tu perfil y estamos en el proceso de selección.\nTe mantendremos informada(o) en cada etapa.\n\nEquipo de Talento`,
  },
  avanza: {
    asunto: (v) => `Tu proceso avanza — ${v}`,
    cuerpo: (n, v) => `Hola ${n},\n\nTenemos buenas noticias: tu perfil avanza en el proceso para "${v}". En breve te compartiremos los siguientes pasos.\n\nEquipo de Talento`,
  },
  entrevista: {
    asunto: (v) => `Tu entrevista — ${v}`,
    cuerpo: (n, v) => `Hola ${n},\n\nTe enviamos la invitación de calendario con el enlace de Google Meet para tu entrevista de "${v}". Si necesitas reprogramar, responde a este correo.\n\nEquipo de Talento`,
  },
  cierre: {
    asunto: (v) => `Resultado de tu proceso — ${v}`,
    cuerpo: (n, v) => `Hola ${n},\n\nAgradecemos mucho tu tiempo e interés en "${v}". En esta ocasión decidimos continuar con otros perfiles, pero conservaremos tus datos para futuras oportunidades y te contactaremos si surge una posición afín.\n\nMucho éxito, y gracias por ser parte del proceso.\n\nEquipo de Talento`,
  },
};

// Correo al candidato (por Gmail, desde la cuenta de quien lo envía) con plantillas por etapa y bitácora.
export const POST = handle(async (req) => {
  const { db, admin, user } = await requireUser(["at"]);
  const b = await readJson<{ applicationId?: string; plantilla?: string }>(req);
  const applicationId = assertUuid(b.applicationId, "La postulación");
  const plantilla = b.plantilla && PLANTILLAS[b.plantilla] ? b.plantilla : null;
  if (!plantilla) throw new HttpError(400, "Plantilla inválida.");

  const { data: app } = await db
    .from("applications")
    .select("id, estatus, candidates(nombre, email), vacancies(titulo, at_id, etapa)")
    .eq("id", applicationId)
    .maybeSingle();
  if (!app) throw new HttpError(404, "No encontramos esa postulación.");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cand = app.candidates as any, vac = app.vacancies as any;
  if (vac.at_id !== user.id) throw new HttpError(403, "Solo el reclutador asignado puede escribir al candidato.");
  if (!cand.email) throw new HttpError(409, "Este candidato no tiene correo registrado.");
  if (plantilla === "cierre" && app.estatus !== "descartado" && vac.etapa !== "cerrada")
    throw new HttpError(409, "El correo de cierre solo se envía cuando el candidato ya está descartado.");

  const t = PLANTILLAS[plantilla];
  const asunto = t.asunto(vac.titulo);
  const token = await getAccessToken(admin, user.id);
  const gmailId = await sendEmail(token, { to: cand.email, subject: asunto, text: t.cuerpo(cand.nombre.split(" ")[0], vac.titulo) });
  await admin.from("candidate_messages").insert({ application_id: applicationId, plantilla, asunto, gmail_message_id: gmailId, enviado_por: user.id });
  return { enviado: true, para: cand.email };
});

import { handle, HttpError, readJson, requireUser, assertUuid } from "@/lib/server/http";
import { getAccessToken } from "@/lib/google/tokens";
import { createInterviewEvent, deleteEvent } from "@/lib/google/calendar";
import { marker } from "@/lib/server/meet-sync";

export const dynamic = "force-dynamic";

const TIPOS: Record<string, string> = { screening: "Screening", tecnica: "Entrevista técnica", cultural: "Entrevista cultural", final: "Entrevista final" };

// Agenda una entrevista: crea el evento en el Calendar de quien agenda (con Meet, invitando al panel y a la persona
// candidata) y registra la entrevista en la base. Si la base rechaza algo, el evento se elimina (no quedan huérfanos).
export const POST = handle(async (req) => {
  const { db, admin, user } = await requireUser(["at"]);
  const b = await readJson<{ applicationId?: string; inicio?: string; duracionMin?: number; tipo?: string; entrevistadores?: string[] }>(req);

  const applicationId = assertUuid(b.applicationId, "La postulación");
  const tipo = b.tipo && TIPOS[b.tipo] ? b.tipo : "tecnica";
  const dur = Number(b.duracionMin ?? 60);
  const inicio = new Date(b.inicio ?? "");
  if (Number.isNaN(inicio.getTime())) throw new HttpError(400, "La fecha y hora son inválidas.");
  if (!(dur >= 15 && dur <= 240)) throw new HttpError(400, "La duración debe estar entre 15 y 240 minutos.");
  if (inicio.getTime() < Date.now() - 5 * 60_000) throw new HttpError(400, "La entrevista debe ser en el futuro.");
  const fin = new Date(inicio.getTime() + dur * 60_000);
  const panelIds = [...new Set(b.entrevistadores ?? [])].map((id) => assertUuid(id, "Entrevistador"));
  if (panelIds.length === 0 || panelIds.length > 6) throw new HttpError(400, "Elige de 1 a 6 entrevistadores.");

  // La postulación y su vacante (RLS: solo si participas en ella) — y debe ser una vacante tuya
  const { data: app } = await db
    .from("applications")
    .select("id, vacancy_id, candidates(nombre, email), vacancies(titulo, at_id, etapa)")
    .eq("id", applicationId)
    .maybeSingle();
  if (!app) throw new HttpError(404, "No encontramos esa postulación.");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cand = app.candidates as any, vac = app.vacancies as any;
  if (vac.at_id !== user.id) throw new HttpError(403, "Solo el reclutador asignado puede agendar entrevistas de esta vacante.");

  const { data: panel } = await db.from("profiles").select("id, nombre, email").in("id", panelIds).eq("activo", true);
  if (!panel || panel.length !== panelIds.length) throw new HttpError(400, "Alguno de los entrevistadores no existe o no está activo.");

  const interviewId = crypto.randomUUID();
  const token = await getAccessToken(admin, user.id);
  const attendees = [...panel.map((p) => p.email), ...(cand.email ? [cand.email] : [])];
  const ev = await createInterviewEvent(token, {
    interviewId,
    summary: `${TIPOS[tipo]} — ${cand.nombre} — ${vac.titulo} [${marker(interviewId)}]`,
    description:
      `Entrevista para la vacante "${vac.titulo}" organizada desde Talento 360.\n` +
      `Panel: ${panel.map((p) => p.nombre).join(", ")}.\n\nActiva las notas de Gemini en Meet para que el resumen llegue a la plataforma.`,
    startISO: inicio.toISOString(),
    endISO: fin.toISOString(),
    attendees,
    vacancyId: app.vacancy_id,
    applicationId,
  });

  const rollback = async () => {
    try {
      await deleteEvent(token, ev.eventId);
    } catch {
      /* mejor esfuerzo */
    }
  };
  const { error: e1 } = await db.from("interviews").insert({
    id: interviewId,
    application_id: applicationId,
    vacancy_id: app.vacancy_id,
    tipo,
    estado: "agendada",
    inicio: inicio.toISOString(),
    fin: fin.toISOString(),
    calendar_event_id: ev.eventId,
    meet_link: ev.meetLink,
    agendada_por: user.id,
  });
  if (e1) {
    await rollback();
    throw new HttpError(422, e1.message);
  }
  const { error: e2 } = await db.from("interview_panel").insert(panelIds.map((profile_id) => ({ interview_id: interviewId, profile_id })));
  if (e2) {
    await db.from("interviews").update({ estado: "cancelada" }).eq("id", interviewId); // sin panel no hay entrevista válida
    await rollback();
    throw new HttpError(422, e2.message);
  }
  return { interviewId, eventId: ev.eventId, meetLink: ev.meetLink, htmlLink: ev.htmlLink, sinCorreoCandidato: !cand.email };
});

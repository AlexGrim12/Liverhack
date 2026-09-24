import { handle, requireCron } from "@/lib/server/http";
import { createAdminClient } from "@/lib/server/admin";
import { postChat } from "@/lib/google/chat";

export const dynamic = "force-dynamic";

// Cron diario (Bearer CRON_SECRET): recordatorios y escalamiento.
//  · Vacantes al ≥80% de su SLA → aviso a AT y HM (y al BP si ya está en rojo).
//  · Feedback de entrevistas completadas sin capturar tras 24 h → recordatorio; tras 48 h → escala al BP.
// Crea notificaciones (sin duplicar el mismo día) y publica un resumen en Google Chat si hay webhook.
const run = handle(async (req) => {
  requireCron(req);
  const admin = createAdminClient();
  const desde = new Date(Date.now() - 20 * 3600_000).toISOString();
  const nuevas: { recipient_id: string; tipo: string; titulo: string; detalle: string; vacancy_id: string; interview_id?: string; urgente: boolean }[] = [];
  const lineas: string[] = [];

  const yaAvisado = async (tipo: string, recipient: string, vacancyId: string, interviewId?: string) => {
    let q = admin.from("notifications").select("id").eq("tipo", tipo).eq("recipient_id", recipient).eq("vacancy_id", vacancyId).gte("created_at", desde).limit(1);
    if (interviewId) q = q.eq("interview_id", interviewId);
    return ((await q).data ?? []).length > 0;
  };

  const { data: vacs } = await admin
    .from("vacancy_overview")
    .select("id, titulo, etapa, sla, dias_habiles_en_etapa, dias_habiles_objetivo, at_id, hm_id, hrbp_id")
    .in("sla", ["amarillo", "rojo"]);
  for (const v of vacs ?? []) {
    const rojo = v.sla === "rojo";
    const destinos = [v.at_id, v.hm_id, ...(rojo ? [v.hrbp_id] : [])].filter(Boolean) as string[];
    for (const r of destinos) {
      if (await yaAvisado("sla_riesgo", r, v.id)) continue;
      nuevas.push({
        recipient_id: r, tipo: "sla_riesgo", vacancy_id: v.id, urgente: rojo,
        titulo: rojo ? "Vacante fuera de SLA" : "Vacante por vencer su SLA",
        detalle: `${v.titulo} — ${v.dias_habiles_en_etapa}/${v.dias_habiles_objetivo} días hábiles en ${v.etapa}.`,
      });
    }
    lineas.push(`${rojo ? "🔴" : "🟡"} ${v.titulo}: ${v.dias_habiles_en_etapa}/${v.dias_habiles_objetivo} días hábiles en ${v.etapa}`);
  }

  const hace24 = new Date(Date.now() - 24 * 3600_000).toISOString();
  const hace48 = new Date(Date.now() - 48 * 3600_000).toISOString();
  const { data: fb } = await admin
    .from("interview_panel")
    .select("profile_id, interviews!inner(id, vacancy_id, fin, estado, vacancies(titulo, hrbp_id))")
    .is("veredicto", null)
    .eq("interviews.estado", "completada")
    .lt("interviews.fin", hace24);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const f of (fb ?? []) as any[]) {
    const i = f.interviews;
    if (!(await yaAvisado("feedback_pendiente", f.profile_id, i.vacancy_id, i.id))) {
      nuevas.push({ recipient_id: f.profile_id, tipo: "feedback_pendiente", vacancy_id: i.vacancy_id, interview_id: i.id, urgente: true, titulo: "Recordatorio: captura tu feedback", detalle: i.vacancies.titulo });
    }
    if (i.fin < hace48 && !(await yaAvisado("feedback_pendiente", i.vacancies.hrbp_id, i.vacancy_id, i.id))) {
      nuevas.push({ recipient_id: i.vacancies.hrbp_id, tipo: "feedback_pendiente", vacancy_id: i.vacancy_id, interview_id: i.id, urgente: true, titulo: "Escalamiento: feedback vencido (+48 h)", detalle: i.vacancies.titulo });
    }
    lineas.push(`⏰ Feedback pendiente: ${i.vacancies.titulo}${i.fin < hace48 ? " (+48 h, escalado al BP)" : ""}`);
  }

  if (nuevas.length) await admin.from("notifications").insert(nuevas);
  const chat = lineas.length ? await postChat(`*Talento 360 — recordatorios*\n${[...new Set(lineas)].join("\n")}`) : false;
  return { notificaciones: nuevas.length, chat };
});
export const GET = run;
export const POST = run;

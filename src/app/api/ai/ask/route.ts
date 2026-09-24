import { handle, HttpError, readJson, requireUser, assertUuid } from "@/lib/server/http";
import { geminiText } from "@/lib/google/gemini";

export const dynamic = "force-dynamic";

const SYSTEM = `Eres el asistente de selección de Talento 360 (El Puerto de Liverpool). Ayudas a comparar candidatos de UNA vacante.
Reglas:
- Usa SOLO el contexto JSON que recibes. Si algo no está en el contexto, di que no hay información; no inventes.
- Cita en cada afirmación la fuente entre paréntesis: (entrevista), (feedback de <nombre>), (CV/atributos), (compatibilidad) o (compensación).
- Recomienda, pero aclara que la decisión final es del Hiring Manager. No decidas por él.
- Considera únicamente criterios laborales. No uses ni infieras edad, género, estado civil, salud, religión, origen ni otros datos sensibles.
- Sé breve y estructurado (viñetas). Responde en español.`;

// Chat del HM/AT sobre los candidatos de una vacante (Gemini). El contexto se arma con los permisos del usuario (RLS).
export const POST = handle(async (req) => {
  const { db, user } = await requireUser(["hm", "at", "hrbp"]);
  const b = await readJson<{ vacancyId?: string; question?: string; conversationId?: string }>(req);
  const vacancyId = assertUuid(b.vacancyId, "La vacante");
  const question = (b.question ?? "").trim();
  if (!question || question.length > 2000) throw new HttpError(400, "Escribe una pregunta (máx. 2000 caracteres).");

  const { data: vac } = await db
    .from("vacancy_overview")
    .select("titulo, area, etapa, estudios_minimos, exp_minima, stack_requerido, competencias, habilidades_clave, salario_min, salario_max")
    .eq("id", vacancyId)
    .maybeSingle();
  if (!vac) throw new HttpError(404, "No encontramos esa vacante.");

  const { data: apps, error } = await db
    .from("applications")
    .select(
      `id, estatus, compat_pct, decision_justificacion,
       candidates(nombre, institucion, carrera, compensacion_actual, compensacion_deseada, moneda,
                  candidate_languages(idioma, nivel), candidate_attributes(tag, fuente)),
       interviews(tipo, estado, inicio, resumen_ia, interview_panel(veredicto, notas, profiles(nombre, cargo)))`
    )
    .eq("vacancy_id", vacancyId);
  if (error) throw new HttpError(422, error.message);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const contexto = (apps as any[]).map((a) => ({
    candidato: a.candidates.nombre,
    estatus: a.estatus,
    compatibilidad_pct: a.compat_pct,
    escolaridad: [a.candidates.institucion, a.candidates.carrera].filter(Boolean).join(" — "),
    idiomas: a.candidates.candidate_languages,
    atributos: a.candidates.candidate_attributes,
    compensacion: { actual: a.candidates.compensacion_actual, deseada: a.candidates.compensacion_deseada, moneda: a.candidates.moneda },
    motivo_descarte: a.decision_justificacion,
    entrevistas: a.interviews.map((i: { tipo: string; estado: string; inicio: string; resumen_ia: string | null; interview_panel: unknown[] }) => ({
      tipo: i.tipo, estado: i.estado, fecha: i.inicio, resumen: i.resumen_ia, feedback: i.interview_panel,
    })),
  }));

  // Conversación (propia por RLS)
  let conversationId = b.conversationId ? assertUuid(b.conversationId, "La conversación") : null;
  if (!conversationId) {
    const { data: conv, error: ce } = await db.from("ai_conversations").insert({ user_id: user.id, vacancy_id: vacancyId, titulo: question.slice(0, 80) }).select("id").single();
    if (ce) throw new HttpError(422, ce.message);
    conversationId = conv.id;
  }
  const { data: previos } = await db.from("ai_messages").select("role, content").eq("conversation_id", conversationId).order("created_at", { ascending: false }).limit(6);
  const historial = (previos ?? []).reverse().map((m) => ({ role: (m.role === "assistant" ? "model" : "user") as "user" | "model", text: m.content }));

  const prompt = `Vacante: ${JSON.stringify(vac)}\n\nCandidatos (JSON):\n${JSON.stringify(contexto)}\n\nPregunta: ${question}`;
  const answer = await geminiText(SYSTEM, historial, prompt);

  await db.from("ai_messages").insert([
    { conversation_id: conversationId, role: "user", content: question },
    { conversation_id: conversationId, role: "assistant", content: answer, fuentes: contexto.map((c) => ({ candidato: c.candidato })) },
  ]);
  return { conversationId, answer };
});

// Plantillas fijas de los avisos a Google Chat. Las usan el servidor (webhook real) y la interfaz (espacio de Chat simulado),
// así el mensaje que se ve en pantalla es el mismo que llegaría a Google Chat. Solo campos cortos y saneados.
export type ChatEvento = "requisicion_validada" | "finalista" | "entrevista_agendada" | "retraso";

export const clean = (v: unknown, max = 90) => String(v ?? "").replace(/[\u0000-\u001F\u007F*_`~<>]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
export const meetOk = (v: string) => (/^(https:\/\/)?meet\.google\.com\/[a-z0-9-]{1,30}$/i.test(v) ? v : "");

export const PLANTILLAS: Record<ChatEvento, (d: Record<string, string>) => string> = {
  requisicion_validada: (d) => `✅ *Requisición validada* — ${d.vacante}\nReclutador asignado: ${d.responsable}. Pasa a Alineación.`,
  finalista: (d) => `🎯 *Nuevo finalista* — ${d.candidato} (${d.vacante})\nFeedback de entrevistadores: ${d.feedback}. Decisión del Hiring Manager registrada hoy.`,
  entrevista_agendada: (d) => `📅 *Entrevista agendada* — ${d.candidato} · ${d.vacante}\n${d.cuando}${d.meet ? `\nMeet: ${d.meet}` : ""}`,
  retraso: (d) => `🔴 *Fuera de tiempo* — ${d.vacante}\nEtapa: ${d.etapa}. Responsable: ${d.responsable}. Hay que destrabarla hoy.`,
};
export const CAMPOS = ["vacante", "responsable", "candidato", "feedback", "cuando", "etapa"];

export function renderAviso(evento: ChatEvento, datos: Record<string, unknown> | undefined): string {
  const d: Record<string, string> = Object.fromEntries(CAMPOS.map((k) => [k, clean(datos?.[k])]));
  d.meet = meetOk(clean(datos?.meet, 60));
  return PLANTILLAS[evento](d);
}

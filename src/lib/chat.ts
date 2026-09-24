// Avisos a Google Chat desde la interfaz (a través de /api/notify/chat, que guarda el webhook en el servidor).
export type ChatEvento = "requisicion_validada" | "finalista" | "entrevista_agendada" | "retraso";
export type ChatResultado = "enviado" | "no_configurado" | "error";

export async function avisarChat(evento: ChatEvento, datos: Record<string, string>): Promise<ChatResultado> {
  try {
    const res = await fetch("/api/notify/chat", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ evento, datos }) });
    const j = await res.json().catch(() => ({}));
    if (res.ok && j.sent) return "enviado";
    return j.reason === "no_configurado" ? "no_configurado" : "error";
  } catch {
    return "error";
  }
}

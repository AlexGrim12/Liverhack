// Avisos a Google Chat desde la interfaz (a través de /api/notify/chat, que guarda el webhook en el servidor).
import { renderAviso, type ChatEvento } from "@/lib/chat-plantillas";
export type { ChatEvento };
export const CHAT_EVENT = "liver-chat"; // el espacio de Chat simulado de la interfaz escucha este evento
export type ChatResultado = "enviado" | "no_configurado" | "error";

export async function avisarChat(evento: ChatEvento, datos: Record<string, string>): Promise<ChatResultado> {
  // 1) se muestra siempre en el espacio de Chat de la interfaz (no depende de ningún permiso de Google)
  try {
    window.dispatchEvent(new CustomEvent(CHAT_EVENT, { detail: { texto: renderAviso(evento, datos), hora: new Date().toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", hour12: false }) } }));
  } catch {
    /* sin window (SSR): no aplica */
  }
  // 2) si hay webhook configurado en el servidor, también llega a Google Chat
  try {
    const res = await fetch("/api/notify/chat", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ evento, datos }) });
    const j = await res.json().catch(() => ({}));
    if (res.ok && j.sent) return "enviado";
    return j.reason === "no_configurado" ? "no_configurado" : "error";
  } catch {
    return "error";
  }
}

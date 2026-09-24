import { GOOGLE } from "./config";

// Aviso a un espacio de Google Chat mediante webhook entrante (GOOGLE_CHAT_WEBHOOK_URL). Sin webhook no hace nada.
export async function postChat(text: string): Promise<boolean> {
  if (!GOOGLE.chatWebhook) return false;
  const res = await fetch(GOOGLE.chatWebhook, {
    method: "POST",
    headers: { "content-type": "application/json; charset=UTF-8" },
    body: JSON.stringify({ text }),
  });
  return res.ok;
}

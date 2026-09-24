import { NextResponse } from "next/server";
import { postChat } from "@/lib/google/chat";
import { GOOGLE } from "@/lib/google/config";
import { PLANTILLAS, renderAviso, type ChatEvento } from "@/lib/chat-plantillas";

export const dynamic = "force-dynamic";

// Publica un aviso en el espacio de Google Chat (webhook en GOOGLE_CHAT_WEBHOOK_URL). No requiere sesión, así que
// NO acepta texto libre: solo plantillas fijas con campos cortos y saneados, y limita la frecuencia (no sirve para hacer spam).
const hits = new Map<string, number[]>();
function limitado(ip: string): boolean {
  const now = Date.now();
  const recientes = (hits.get(ip) ?? []).filter((t) => now - t < 60_000);
  recientes.push(now);
  hits.set(ip, recientes);
  return recientes.length > 20;
}

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (limitado(ip)) return NextResponse.json({ sent: false, reason: "limite" }, { status: 429 });
  const b = (await req.json().catch(() => null)) as { evento?: string; datos?: Record<string, unknown> } | null;
  const evento = b?.evento as ChatEvento | undefined;
  if (!b || !evento || !(evento in PLANTILLAS)) return NextResponse.json({ sent: false, reason: "evento_invalido" }, { status: 400 });
  if (!GOOGLE.chatWebhook) return NextResponse.json({ sent: false, reason: "no_configurado" });

  const texto = renderAviso(evento, b.datos);
  try {
    const ok = await postChat(`${texto}\n_Liver Companion_`);
    return NextResponse.json({ sent: ok, reason: ok ? undefined : "chat_rechazo" });
  } catch {
    return NextResponse.json({ sent: false, reason: "error" }, { status: 502 });
  }
}

import { NextResponse } from "next/server";
import { postChat } from "@/lib/google/chat";
import { GOOGLE } from "@/lib/google/config";

export const dynamic = "force-dynamic";

// Publica un aviso en el espacio de Google Chat (webhook en GOOGLE_CHAT_WEBHOOK_URL). No requiere sesión, así que
// NO acepta texto libre: solo plantillas fijas con campos cortos y saneados, y limita la frecuencia (no sirve para hacer spam).
const clean = (v: unknown, max = 90) => String(v ?? "").replace(/[\u0000-\u001F\u007F*_`~<>]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
const meetOk = (v: string) => /^(https:\/\/)?meet\.google\.com\/[a-z0-9-]{1,30}$/i.test(v) ? v : "";

const PLANTILLAS: Record<string, (d: Record<string, string>) => string> = {
  requisicion_validada: (d) => `✅ *Requisición validada* — ${d.vacante}\nReclutador asignado: ${d.responsable}. Pasa a Alineación.`,
  finalista: (d) => `🎯 *Nuevo finalista* — ${d.candidato} (${d.vacante})\nFeedback de entrevistadores: ${d.feedback}. Decisión del Hiring Manager registrada hoy.`,
  entrevista_agendada: (d) => `📅 *Entrevista agendada* — ${d.candidato} · ${d.vacante}\n${d.cuando}${d.meet ? `\nMeet: ${d.meet}` : ""}`,
  retraso: (d) => `🔴 *Fuera de tiempo* — ${d.vacante}\nEtapa: ${d.etapa}. Responsable: ${d.responsable}. Hay que destrabarla hoy.`,
};
const CAMPOS = ["vacante", "responsable", "candidato", "feedback", "cuando", "etapa"];

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
  const plantilla = b?.evento ? PLANTILLAS[b.evento] : undefined;
  if (!b || !plantilla) return NextResponse.json({ sent: false, reason: "evento_invalido" }, { status: 400 });
  if (!GOOGLE.chatWebhook) return NextResponse.json({ sent: false, reason: "no_configurado" });

  const d: Record<string, string> = Object.fromEntries(CAMPOS.map((k) => [k, clean(b.datos?.[k])]));
  d.meet = meetOk(clean(b.datos?.meet, 60));
  try {
    const ok = await postChat(`${plantilla(d)}\n_Liver Companion_`);
    return NextResponse.json({ sent: ok, reason: ok ? undefined : "chat_rechazo" });
  } catch {
    return NextResponse.json({ sent: false, reason: "error" }, { status: 502 });
  }
}

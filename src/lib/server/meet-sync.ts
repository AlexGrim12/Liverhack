import type { SupabaseClient } from "@supabase/supabase-js";
import { exportDocText, findMeetNotes } from "@/lib/google/drive";
import { geminiJson } from "@/lib/google/gemini";
import { getAccessToken } from "@/lib/google/tokens";
import { GoogleNotConnectedError } from "@/lib/google/http";

export type SyncItem = { interviewId: string; status: "sincronizada" | "sin_notas" | "sin_google" | "error"; detail?: string };

export const marker = (interviewId: string) => `T360-${interviewId.slice(0, 8)}`;

type Resumen = { resumen: string; puntos: string[]; atributos: { tag: string; contexto: string }[] };
const SCHEMA = {
  type: "OBJECT",
  properties: {
    resumen: { type: "STRING" },
    puntos: { type: "ARRAY", items: { type: "STRING" } },
    atributos: { type: "ARRAY", items: { type: "OBJECT", properties: { tag: { type: "STRING" }, contexto: { type: "STRING" } }, required: ["tag", "contexto"] } },
  },
  required: ["resumen", "puntos", "atributos"],
};
const SYSTEM = `Eres un asistente de reclutamiento. Recibes las notas automáticas de una entrevista (Gemini en Google Meet).
Devuelve SOLO lo que aparece en el texto, sin inferir ni inventar:
- resumen: 3 a 5 oraciones en español sobre lo que demostró la persona candidata (habilidades, experiencia, comunicación).
- puntos: 3 a 5 frases cortas (máx. 5 palabras) que resuman lo más relevante.
- atributos: habilidades, certificaciones, herramientas, logros o idiomas mencionados explícitamente (tag corto + contexto breve).
No incluyas datos personales sensibles (edad, género, salud, religión, estado civil, etc.).`;

// Busca las notas de Gemini en el Drive de quien agendó, las resume con Gemini y actualiza la entrevista.
// Se ejecuta con service_role (auth.uid() nulo = "sistema"): los triggers actualizan el estatus del candidato
// y crean el pendiente de feedback.
export async function syncMeetNotes(admin: SupabaseClient, opts: { agendadaPor?: string; limit?: number } = {}): Promise<SyncItem[]> {
  let q = admin
    .from("interviews")
    .select("id, agendada_por, application_id")
    .in("estado", ["agendada", "completada"])
    .is("resumen_ia", null)
    .lt("fin", new Date().toISOString())
    .order("fin")
    .limit(opts.limit ?? 25);
  if (opts.agendadaPor) q = q.eq("agendada_por", opts.agendadaPor);
  const { data: pendientes, error } = await q;
  if (error) throw new Error(error.message);

  const out: SyncItem[] = [];
  for (const it of pendientes ?? []) {
    try {
      const token = await getAccessToken(admin, it.agendada_por);
      const doc = await findMeetNotes(token, marker(it.id));
      if (!doc) {
        out.push({ interviewId: it.id, status: "sin_notas" });
        continue;
      }
      const texto = await exportDocText(token, doc.id);
      const r = await geminiJson<Resumen>(SYSTEM, [{ text: texto.slice(0, 60_000) }], SCHEMA);

      const notasPath = `${it.id}/notas.txt`;
      await admin.storage.from("interview-notes").upload(notasPath, new Blob([texto], { type: "text/plain" }), { upsert: true, contentType: "text/plain" });

      const { error: upErr } = await admin
        .from("interviews")
        .update({
          estado: "completada",
          drive_doc_id: doc.id,
          notas_path: notasPath,
          resumen_ia: r.resumen,
          resumen_puntos: r.puntos.slice(0, 5),
          resumen_actualizado_at: new Date().toISOString(),
        })
        .eq("id", it.id);
      if (upErr) throw new Error(upErr.message);

      // Atributos detectados en la entrevista (sin duplicar los que ya existan, sin importar mayúsculas)
      const { data: app } = await admin.from("applications").select("candidate_id").eq("id", it.application_id).single();
      if (app && r.atributos.length) {
        const { data: existentes } = await admin.from("candidate_attributes").select("tag").eq("candidate_id", app.candidate_id);
        const ya = new Set((existentes ?? []).map((e) => e.tag.toLowerCase()));
        const nuevos = r.atributos
          .filter((a) => a.tag.trim() && !ya.has(a.tag.trim().toLowerCase()))
          .map((a) => ({ candidate_id: app.candidate_id, tag: a.tag.trim(), fuente: "entrevista", contexto: a.contexto, interview_id: it.id }));
        if (nuevos.length) await admin.from("candidate_attributes").insert(nuevos);
      }
      out.push({ interviewId: it.id, status: "sincronizada" });
    } catch (e) {
      if (e instanceof GoogleNotConnectedError) out.push({ interviewId: it.id, status: "sin_google", detail: e.message });
      else out.push({ interviewId: it.id, status: "error", detail: e instanceof Error ? e.message : String(e) });
    }
  }
  return out;
}

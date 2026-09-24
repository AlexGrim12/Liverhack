import { handle, HttpError, requireUser, assertUuid } from "@/lib/server/http";
import { geminiJson } from "@/lib/google/gemini";

export const dynamic = "force-dynamic";

const SCHEMA = {
  type: "OBJECT",
  properties: {
    resumen: { type: "STRING" },
    atributos: { type: "ARRAY", items: { type: "OBJECT", properties: { tag: { type: "STRING" }, contexto: { type: "STRING" } }, required: ["tag", "contexto"] } },
    idiomas: { type: "ARRAY", items: { type: "OBJECT", properties: { idioma: { type: "STRING" }, nivel: { type: "STRING", enum: ["basico", "intermedio", "avanzado", "nativo"] } }, required: ["idioma", "nivel"] } },
  },
  required: ["resumen", "atributos", "idiomas"],
};
const SYSTEM = `Eres un asistente de reclutamiento. Del CV adjunto extrae SOLO lo que aparece explícitamente, sin inferir:
- resumen: 2 a 4 oraciones en español con la trayectoria profesional.
- atributos: habilidades, herramientas, certificaciones, logros o años de experiencia mencionados (tag corto + contexto breve).
- idiomas: idioma y nivel (basico, intermedio, avanzado o nativo).
Ignora y NO devuelvas datos personales sensibles: edad, género, estado civil, salud, religión, nacionalidad, foto.`;

// Analiza el CV (PDF) con Gemini y guarda atributos e idiomas detectados (fuente "cv"). Rol AT.
export const POST = handle(async (_req, params) => {
  const { db, admin } = await requireUser(["at"]);
  const id = assertUuid(params.id, "El candidato");
  const { data: c } = await db.from("candidates").select("id, cv_path").eq("id", id).maybeSingle();
  if (!c) throw new HttpError(404, "No encontramos a ese candidato.");
  if (!c.cv_path) throw new HttpError(409, "Este candidato aún no tiene CV cargado.");
  if (!c.cv_path.toLowerCase().endsWith(".pdf")) throw new HttpError(415, "Por ahora solo se analizan CVs en PDF.");

  const { data: file, error } = await db.storage.from("cvs").download(c.cv_path);
  if (error || !file) throw new HttpError(404, "No se pudo leer el CV.");
  const data = Buffer.from(await file.arrayBuffer()).toString("base64");
  const r = await geminiJson<{ resumen: string; atributos: { tag: string; contexto: string }[]; idiomas: { idioma: string; nivel: string }[] }>(
    SYSTEM,
    [{ inlineData: { mimeType: "application/pdf", data } }, { text: "Extrae la información del CV." }],
    SCHEMA
  );

  const { data: existentes } = await admin.from("candidate_attributes").select("tag").eq("candidate_id", id);
  const ya = new Set((existentes ?? []).map((e) => e.tag.toLowerCase()));
  const nuevos = r.atributos.filter((a) => a.tag.trim() && !ya.has(a.tag.trim().toLowerCase())).map((a) => ({ candidate_id: id, tag: a.tag.trim(), fuente: "cv", contexto: a.contexto }));
  if (nuevos.length) await admin.from("candidate_attributes").insert(nuevos);
  const idiomas = r.idiomas.filter((l) => ["basico", "intermedio", "avanzado", "nativo"].includes(l.nivel)).map((l) => ({ candidate_id: id, idioma: l.idioma.trim(), nivel: l.nivel }));
  if (idiomas.length) await admin.from("candidate_languages").upsert(idiomas, { onConflict: "candidate_id,idioma", ignoreDuplicates: true });
  await admin.from("candidates").update({ cv_texto: r.resumen, cv_procesado_at: new Date().toISOString() }).eq("id", id);
  return { atributosNuevos: nuevos.length, idiomas: idiomas.length, resumen: r.resumen };
});

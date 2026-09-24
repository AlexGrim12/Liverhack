import { NextResponse } from "next/server";
import { geminiJson, geminiText } from "@/lib/google/gemini";
import { GOOGLE } from "@/lib/google/config";

export const dynamic = "force-dynamic";

// IA generativa OPCIONAL para la demo (no requiere sesión): si hay GEMINI_API_KEY, la interfaz usa Gemini para resumir
// transcripciones y redactar la explicación de compatibilidad; sin clave usa el motor local. Entradas acotadas y limitadas por IP.
const hits = new Map<string, number[]>();
const limitado = (ip: string) => {
  const now = Date.now();
  const r = (hits.get(ip) ?? []).filter((t) => now - t < 60_000);
  r.push(now);
  hits.set(ip, r);
  return r.length > 12;
};

const STR = { type: "STRING" };
const ARR = (items: object) => ({ type: "ARRAY", items });

const TRANSCRIPCION = {
  system: `Eres un asistente de reclutamiento. Resumes transcripciones de entrevistas técnicas en español.
Usa SOLO lo que dice la transcripción; no inventes. No infieras ni menciones edad, género, salud, religión ni estado civil.
Devuelve: un resumen de 3 a 4 oraciones, 3 a 4 frases clave textuales de la persona candidata, competencias (con nivel "fuerte" o "moderada" y una evidencia textual), dudas (brechas que la propia persona reconoce) y temas a profundizar.`,
  schema: {
    type: "OBJECT",
    properties: {
      resumen: STR,
      frasesClave: ARR({ type: "OBJECT", properties: { turno: { type: "NUMBER" }, texto: STR }, required: ["turno", "texto"] }),
      competencias: ARR({ type: "OBJECT", properties: { nombre: STR, nivel: { type: "STRING", enum: ["fuerte", "moderada"] }, evidencia: STR }, required: ["nombre", "nivel", "evidencia"] }),
      dudas: ARR(STR),
      seguimiento: ARR(STR),
    },
    required: ["resumen", "frasesClave", "competencias", "dudas", "seguimiento"],
  },
};
const COMPAT = {
  system: `Eres un asistente de reclutamiento. Explicas en 3 oraciones, en español y de forma concreta, por qué una persona candidata es más o menos compatible con un proyecto,
usando SOLO los datos que recibes (coincidencias, brechas, criterios). No decidas por el Hiring Manager. No uses ni infieras datos personales sensibles.`,
  schema: { type: "OBJECT", properties: { explicacion: STR }, required: ["explicacion"] },
};

const CRITERIOS = {
  system: `Eres un asistente de reclutamiento. Recibes criterios de contexto escritos en lenguaje natural por quien recluta y los CVs de varias personas candidatas.
Para CADA candidata y CADA criterio decide si cumple: "si" (evidencia clara en el CV), "parcial" (evidencia indirecta o incompleta) o "no" (sin evidencia).
La evidencia es una frase corta basada SOLO en el CV; si no hay, escribe "Sin evidencia en el CV". No inventes.
Los criterios son un filtro laboral: si un criterio pide inferir o discriminar por edad, género, salud, embarazo, religión, estado civil, origen, orientación u otro dato personal sensible, márcalo con "sensible": true y cumple "no".`,
  schema: {
    type: "OBJECT",
    properties: {
      resultados: ARR({
        type: "OBJECT",
        properties: {
          id: STR,
          criterios: ARR({ type: "OBJECT", properties: { texto: STR, cumple: { type: "STRING", enum: ["si", "parcial", "no"] }, evidencia: STR, sensible: { type: "BOOLEAN" } }, required: ["texto", "cumple", "evidencia", "sensible"] }),
        },
        required: ["id", "criterios"],
      }),
    },
    required: ["resultados"],
  },
};
const CHAT = `Eres el asistente de decisión de Talento 360 para un Hiring Manager. Respondes en español, breve (máximo 120 palabras), con viñetas «• » cuando ayuden. Texto plano: sin markdown (nada de ** ni #).
Usa SOLO los datos del contexto JSON (compatibilidad con el proyecto, entrevistas, feedback, transcripción, requisición). Si algo no está en los datos, dilo.
Usa el vocabulario de Liverpool: "colaboradores" para quienes trabajan en la empresa y "cliente interno" para quien solicita la vacante. Recomienda con evidencia pero la decisión final es siempre del Hiring Manager. No uses ni infieras edad, género, salud, religión o estado civil.`;

const AYUDA = `Eres el asistente de bienvenida de Liver Companion (Talento 360), la plataforma de reclutamiento de El Puerto de Liverpool. Respondes en español, en máximo 80 palabras y en texto plano (sin markdown).
Idea central: "que todos vean lo mismo". Vocabulario de Liverpool: a las personas que trabajan en la empresa se les llama "colaboradores" (nunca "empleados") y a quienes solicitan una vacante dentro de Liverpool, "clientes internos".
Perfiles: HRBP/Business Partner (solo VALIDA lo que el Hiring Manager necesita: viabilidad y banda salarial), Reclutamiento/AT (filtra candidatos, compara por compatibilidad, agenda entrevistas en Google Meet), Hiring Manager (es cliente interno; CAPTURA la requisición, revisa entrevistas con IA y decide) más un portal para la persona candidata (ve sus etapas, su semáforo y su oferta).
Cada etapa tiene responsable y semáforo en días hábiles. La IA analiza CVs contra un repositorio de GitHub, acepta contexto libre (los datos personales sensibles se ignoran por diseño), resume transcripciones de entrevistas y responde preguntas; la decisión final siempre es humana.
Si preguntan algo fuera de la plataforma, di amablemente que solo puedes ayudar con Liver Companion. Sugiere qué perfil elegir según lo que quieran hacer.`;

export async function GET() {
  return NextResponse.json({ disponible: !!GOOGLE.geminiKey, modelo: GOOGLE.geminiModel });
}

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (limitado(ip)) return NextResponse.json({ error: "Demasiadas solicitudes: intenta en un minuto." }, { status: 429 });
  if (!GOOGLE.geminiKey) return NextResponse.json({ disponible: false, error: "Falta GEMINI_API_KEY en el servidor." }, { status: 501 });
  const b = (await req.json().catch(() => null)) as { tarea?: string; texto?: string; datos?: unknown } | null;
  try {
    if (b?.tarea === "transcripcion") {
      const texto = String(b.texto ?? "");
      if (texto.length < 40 || texto.length > 30_000) return NextResponse.json({ error: "La transcripción debe tener entre 40 y 30,000 caracteres." }, { status: 400 });
      const r = await geminiJson<Record<string, unknown>>(TRANSCRIPCION.system, [{ text: texto }], TRANSCRIPCION.schema);
      return NextResponse.json({ ...r, motor: "gemini" });
    }
    if (b?.tarea === "compat") {
      const datos = JSON.stringify(b.datos ?? {}).slice(0, 6000);
      const r = await geminiJson<{ explicacion: string }>(COMPAT.system, [{ text: datos }], COMPAT.schema);
      return NextResponse.json({ explicacion: r.explicacion, motor: "gemini" });
    }
    if (b?.tarea === "criterios") {
      const datos = JSON.stringify(b.datos ?? {});
      if (datos.length > 40_000) return NextResponse.json({ error: "Demasiados datos." }, { status: 400 });
      const r = await geminiJson<{ resultados: unknown[] }>(CRITERIOS.system, [{ text: datos }], CRITERIOS.schema);
      return NextResponse.json({ ...r, motor: "gemini" });
    }
    if (b?.tarea === "ayuda") {
      const d = (b.datos ?? {}) as { pregunta?: string; historial?: { role: string; text: string }[] };
      const pregunta = String(d.pregunta ?? "").slice(0, 500);
      if (pregunta.length < 2) return NextResponse.json({ error: "Escribe una pregunta." }, { status: 400 });
      const historial = (d.historial ?? []).slice(-6).map((h) => ({ role: (h.role === "user" ? "user" : "model") as "user" | "model", text: String(h.text).slice(0, 800) }));
      return NextResponse.json({ respuesta: await geminiText(AYUDA, historial, pregunta), motor: "gemini" });
    }
    if (b?.tarea === "chat") {
      const d = (b.datos ?? {}) as { pregunta?: string; contexto?: unknown; historial?: { role: string; text: string }[] };
      const pregunta = String(d.pregunta ?? "").slice(0, 1000);
      if (pregunta.length < 2) return NextResponse.json({ error: "Escribe una pregunta." }, { status: 400 });
      const historial = (d.historial ?? []).slice(-6).map((h) => ({ role: (h.role === "user" ? "user" : "model") as "user" | "model", text: String(h.text).slice(0, 1500) }));
      const respuesta = await geminiText(`${CHAT}\n\nCONTEXTO:\n${JSON.stringify(d.contexto ?? {}).slice(0, 20_000)}`, historial, pregunta);
      return NextResponse.json({ respuesta, motor: "gemini" });
    }
    return NextResponse.json({ error: "Tarea inválida." }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Error con Gemini." }, { status: 502 });
  }
}

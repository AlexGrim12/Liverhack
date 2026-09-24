import { GOOGLE } from "./config";
import { gfetch } from "./http";

export type GeminiPart = { text: string } | { inlineData: { mimeType: string; data: string } };
type GeminiResponse = { candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[]; promptFeedback?: { blockReason?: string } };

async function generateOnce(opts: { system?: string; contents: { role: "user" | "model"; parts: GeminiPart[] }[]; schema?: object; temperature?: number }): Promise<string> {
  if (!GOOGLE.geminiKey) throw new Error("Falta GEMINI_API_KEY en el servidor.");
  const r = await gfetch<GeminiResponse>(`${GOOGLE.geminiBase}/models/${GOOGLE.geminiModel}:generateContent`, null, {
    method: "POST",
    headers: { "x-goog-api-key": GOOGLE.geminiKey },
    body: JSON.stringify({
      ...(opts.system ? { systemInstruction: { parts: [{ text: opts.system }] } } : {}),
      contents: opts.contents,
      generationConfig: {
        temperature: opts.temperature ?? 0.2,
        // gemini-2.5-flash "razona" antes de responder (10+ s); en la demo se prioriza la rapidez
        ...(/2\.5-flash/.test(GOOGLE.geminiModel) ? { thinkingConfig: { thinkingBudget: 0 } } : {}),
        ...(opts.schema ? { responseMimeType: "application/json", responseSchema: opts.schema } : {}),
      },
    }),
  });
  const text = r.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("");
  if (!text) throw new Error(`Gemini no devolvió texto${r.promptFeedback?.blockReason ? ` (bloqueado: ${r.promptFeedback.blockReason})` : ""}.`);
  return text;
}

// Gemini responde 503 en picos de demanda: un par de reintentos cortos evitan caer al motor local sin necesidad
async function generate(opts: Parameters<typeof generateOnce>[0]): Promise<string> {
  for (let i = 0; ; i++) {
    try {
      return await generateOnce(opts);
    } catch (e) {
      if (i >= 2 || !/\b(503|429|500)\b/.test(e instanceof Error ? e.message : "")) throw e;
      await new Promise((r) => setTimeout(r, 700 * (i + 1)));
    }
  }
}

export async function geminiText(system: string, history: { role: "user" | "model"; text: string }[], question: string): Promise<string> {
  return generate({
    system,
    contents: [...history.map((h) => ({ role: h.role, parts: [{ text: h.text }] })), { role: "user", parts: [{ text: question }] }],
    temperature: 0.3,
  });
}

// Salida estructurada: el modelo responde JSON con el esquema indicado (tipos de Gemini: STRING, ARRAY, OBJECT, NUMBER…).
export async function geminiJson<T>(system: string, parts: GeminiPart[], schema: object): Promise<T> {
  const text = await generate({ system, contents: [{ role: "user", parts }], schema });
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error("Gemini devolvió un JSON inválido.");
  }
}

import { LEXICON } from "./lexicon";
import { cuenta, norm, oraciones } from "./text";
import type { TranscriptSummary } from "./types";

// Competencias observables en una entrevista y las señales de lenguaje que las evidencian.
const COMPETENCIAS: { nombre: string; senales: string[] }[] = [
  { nombre: "Liderazgo", senales: ["lidero", "lidere", "lidera", "mi equipo", "delegue", "priorice", "dirigi"] },
  { nombre: "Comunicación con negocio", senales: ["negocio", "stakeholders", "producto", "explique", "presente", "alinear", "documente", "traduje"] },
  { nombre: "Resolución de problemas", senales: ["incidente", "causa raiz", "postmortem", "diagnostique", "depure", "resolvi", "alarma"] },
  { nombre: "Orientación a resultados", senales: ["reduje", "mejore", "logre", "aumente", "ahorr", "cero ", "0 cobros", "metrica"] },
  { nombre: "Mentoría", senales: ["mentor", "junior", "ensene", "acompan", "promovid", "crecimiento de"] },
  { nombre: "Pensamiento de arquitectura", senales: ["arquitectura", "microservicios", "trade-off", "tradeoff", "escalar", "idempotencia", "eventos", "disene"] },
  { nombre: "Aprendizaje continuo", senales: ["estoy aprendiendo", "aprendi", "curso", "certific", "autodidact", "me gustaria aprender"] },
];
const DUDAS = /(tampoco he|no he trabajado|nunca he|todavia no|me falta|poca experiencia|no tengo experiencia|estoy aprendiendo|no domino|menos experiencia|no me siento|no lo he hecho)/;
const LOGRO = /(reduje|mejore|logre|aumente|implemente|migre|disene|escale|lidere|ahorre|automatice|construi|cree)/;

type Turno = { quien: string; texto: string; entrevistador: boolean };

const ROL_ENTREVISTADOR = /(entrevistador|entrevistadora|interviewer|recruiter|reclutador|reclutadora|tech lead|product lead|hiring|gerente|rh\b|moderador)/;

// Separa los turnos "Nombre: texto" e identifica quién es la persona candidata: por nombre si coincide y, si no, la persona
// que más habla y cuya etiqueta no parece de entrevistador.
export function parseTurnos(transcripcion: string, candidato: string): { turnos: Turno[]; candidatoLabel: string } {
  const primerNombre = norm(candidato).split(" ")[0];
  const crudos = transcripcion
    .split(/\r?\n/)
    .map((l) => /^\s*([^:]{2,60}):\s*(.+)$/.exec(l))
    .filter((m): m is RegExpExecArray => !!m)
    .map((m) => ({ quien: m[1].trim(), texto: m[2].trim() }));
  const palabras: Record<string, number> = {};
  for (const t of crudos) palabras[t.quien] = (palabras[t.quien] ?? 0) + t.texto.split(/\s+/).length;
  const porNombre = Object.keys(palabras).find((q) => norm(q).includes(primerNombre));
  const porRol = Object.keys(palabras)
    .filter((q) => !ROL_ENTREVISTADOR.test(norm(q)))
    .sort((a, b) => palabras[b] - palabras[a])[0];
  const etiqueta = porNombre ?? porRol ?? Object.keys(palabras).sort((a, b) => palabras[b] - palabras[a])[0] ?? candidato;
  return { turnos: crudos.map((t) => ({ ...t, entrevistador: t.quien !== etiqueta })), candidatoLabel: porNombre ? candidato : etiqueta };
}

// Resume una transcripción de Meet/Gemini con un motor local: turnos, frases clave, competencias con evidencia,
// dudas y temas por profundizar. (Con GEMINI_API_KEY el servidor puede generar el mismo formato con un LLM.)
export function summarizeTranscript(transcripcion: string, candidato: string, requeridas: string[] = []): TranscriptSummary {
  const { turnos, candidatoLabel } = parseTurnos(transcripcion, candidato);
  const suyos = turnos.map((t, i) => ({ ...t, i })).filter((t) => !t.entrevistador);
  const palabras = (t: string) => t.split(/\s+/).filter(Boolean).length;
  const wCand = suyos.reduce((a, t) => a + palabras(t.texto), 0);
  const wTotal = turnos.reduce((a, t) => a + palabras(t.texto), 0) || 1;

  const frases = suyos.flatMap((t) => oraciones(t.texto).map((o) => ({ turno: t.i + 1, texto: o, n: norm(o) })));

  // Frases clave: métricas, verbos de logro, competencias y tecnologías mencionadas
  const puntuadas = frases
    .filter((f) => palabras(f.texto) >= 6)
    .map((f) => {
      let p = 0;
      if (/\d/.test(f.texto)) p += 2;
      if (LOGRO.test(f.n)) p += 1.5;
      p += COMPETENCIAS.reduce((a, c) => a + (c.senales.some((s) => f.n.includes(s)) ? 1 : 0), 0);
      p += LEXICON.reduce((a, s) => a + (!s.ambiguo && s.aliases.some((x) => cuenta(f.n, x) > 0) ? 0.5 : 0), 0);
      if (DUDAS.test(f.n)) p -= 2;
      return { ...f, p };
    })
    .sort((a, b) => b.p - a.p);
  const frasesClave = puntuadas.slice(0, 4).sort((a, b) => a.turno - b.turno).map((f) => ({ turno: f.turno, texto: f.texto }));

  const competencias: TranscriptSummary["competencias"] = [];
  for (const c of COMPETENCIAS) {
    const hits = frases.filter((f) => c.senales.some((s) => f.n.includes(s)));
    if (!hits.length) continue;
    const sinDudas = hits.filter((f) => !DUDAS.test(f.n));
    const mejor = [...(sinDudas.length ? sinDudas : hits)].sort((a, b) => (/\d/.test(b.texto) ? 1 : 0) - (/\d/.test(a.texto) ? 1 : 0) || palabras(b.texto) - palabras(a.texto))[0];
    competencias.push({ nombre: c.nombre, nivel: hits.length >= 2 ? "fuerte" : "moderada", evidencia: mejor.texto });
  }
  competencias.sort((a, b) => Number(b.nivel === "fuerte") - Number(a.nivel === "fuerte"));

  const dudas = frases.filter((f) => DUDAS.test(f.n)).map((f) => f.texto).slice(0, 4);

  const textoCand = norm(suyos.map((t) => t.texto).join(" "));
  const sinTocar = requeridas.filter((r) => {
    const s = LEXICON.find((x) => x.label === r);
    return s ? !s.aliases.some((a) => cuenta(textoCand, a) > 0) : !textoCand.includes(norm(r));
  });
  const seguimiento = [
    ...sinTocar.slice(0, 3).map((r) => `Profundizar en ${r}: no se abordó en la entrevista.`),
    ...dudas.slice(0, 2).map((d) => `Preguntar cómo planea cerrar esta brecha: “${d.length > 90 ? d.slice(0, 90) + "…" : d}”`),
  ].slice(0, 4);

  const minutos = Math.max(1, Math.round(wTotal / 130));
  const fuertes = competencias.filter((c) => c.nivel === "fuerte").map((c) => c.nombre.toLowerCase());
  const resumen =
    `Entrevista de ${candidatoLabel}: ${turnos.length} intervenciones; ${Math.round((100 * wCand) / wTotal)}% del tiempo habló la persona candidata. ` +
    (fuertes.length ? `Mostró evidencia sólida de ${fuertes.slice(0, 3).join(", ")}. ` : "") +
    (frasesClave[0] ? `Destacó: “${frasesClave[0].texto}” ` : "") +
    (dudas.length ? `Reconoció ${dudas.length} brecha${dudas.length > 1 ? "s" : ""} a explorar.` : "No mostró dudas relevantes.");

  return {
    resumen: resumen.trim(),
    frasesClave,
    competencias,
    dudas,
    seguimiento,
    metricas: {
      turnos: turnos.length,
      preguntas: turnos.filter((t) => t.entrevistador && /[?¿]/.test(t.texto)).length,
      palabrasCandidato: wCand,
      participacionCandidato: Math.round((100 * wCand) / wTotal),
      minutos,
    },
    motor: "local",
  };
}

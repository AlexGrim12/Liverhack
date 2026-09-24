import { LEXICON } from "./lexicon";
import { cuenta, norm } from "./text";
import type { CvAnalysis, CvData, CvSkill } from "./types";

const ANIO_ACTUAL = new Date().getFullYear();

// Texto completo del CV (el mismo contenido que trae el PDF).
export function cvTexto(c: CvData): string {
  return [
    c.nombre,
    c.titular,
    c.ubicacion,
    c.resumen,
    ...c.experiencia.flatMap((e) => [`${e.puesto} — ${e.empresa} (${e.periodo})`, ...e.logros]),
    ...c.educacion.map((d) => `${d.titulo} — ${d.institucion} (${d.periodo})`),
    `Habilidades: ${c.skills.join(", ")}`,
    c.certificaciones.length ? `Certificaciones: ${c.certificaciones.join(", ")}` : "",
    `Idiomas: ${c.idiomas.map((i) => `${i.idioma} ${i.nivel}`).join(", ")}`,
    `Intereses: ${c.intereses.join(", ")}`,
  ]
    .filter(Boolean)
    .join("\n");
}

function aniosDe(c: CvData): number {
  const dicho = /(\d{1,2})\s*anos?/.exec(norm(c.resumen));
  if (dicho) return Number(dicho[1]);
  let total = 0;
  for (const e of c.experiencia) {
    const m = /(\d{4})\s*[–-]\s*(\d{4}|actualidad)/i.exec(e.periodo);
    if (m) total += (m[2].toLowerCase() === "actualidad" ? ANIO_ACTUAL : Number(m[2])) - Number(m[1]);
  }
  return total;
}

// Extrae habilidades, años de experiencia, seniority y señales de colaboración del CV (motor local, sin servicios externos).
export function analyzeCv(c: CvData): CvAnalysis {
  const frases = [...c.experiencia.flatMap((e) => e.logros), c.resumen, ...c.intereses, `Habilidades: ${c.skills.join(", ")}`, ...c.certificaciones];
  // Las frases en negativo ("sin experiencia profesional en X") no cuentan como habilidad
  const normFrases = frases.map((f) => norm(f).replace(/sin experiencia[^.]*/g, " "));
  const todo = normFrases.join(" \n ");

  const skills: CvSkill[] = [];
  for (const s of LEXICON) {
    let menciones = 0;
    for (const a of s.aliases) menciones += cuenta(todo, a);
    if (menciones === 0) continue;
    // evidencia: prefiere un logro concreto sobre la lista de habilidades
    const idx = normFrases.findIndex((f, i) => !frases[i].startsWith("Habilidades:") && s.aliases.some((a) => cuenta(f, a) > 0));
    const fallback = normFrases.findIndex((f) => s.aliases.some((a) => cuenta(f, a) > 0));
    skills.push({ id: s.id, label: s.label, cat: s.cat, menciones, evidencia: frases[idx >= 0 ? idx : fallback] ?? "" });
  }

  const anios = aniosDe(c);
  const lidera = /(lidero|lidere|liderar|lider tecnico|tech lead|lidera)/.test(todo);
  const mentoria = /mentor/.test(todo);
  const opensource = skills.some((s) => s.id === "opensource") || /contribu/.test(todo);
  const comunidad = /(comunidad|meetup|charla|speaker|organizador|voluntariado|talleres|docencia)/.test(todo);
  const seniority: CvAnalysis["seniority"] = anios < 2 ? "junior" : anios < 5 ? "semi" : lidera && anios >= 7 ? "lead" : "senior";
  const destacados = [
    ...c.certificaciones,
    ...c.experiencia.flatMap((e) => e.logros).filter((l) => /\d/.test(l)).slice(0, 2),
    ...(lidera ? ["Lidera equipos"] : []),
  ].slice(0, 4);

  return { skills, anios, seniority, dominios: skills.filter((s) => s.cat === "dominio").map((s) => s.id), lidera, mentoria, opensource, comunidad, destacados };
}

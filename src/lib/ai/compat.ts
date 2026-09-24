import { byId, RELATED } from "./lexicon";
import type { Compat, CriterioResultado, CvAnalysis, RepoProfile } from "./types";

const clamp = (x: number) => Math.max(0, Math.min(1, x));
const pct = (x: number) => Math.round(clamp(x) * 100);

// Compatibilidad de un candidato con el proyecto (repo) — cada componente es explicable:
//   55 % stack técnico (exacto o emparentado) · 15 % dominio · 20 % experiencia · 10 % colaboración
// Si hay contexto libre (criterios en lenguaje natural), pesa 25 % y las demás partes el 75 %.
export function scoreCompat(id: string, cv: CvAnalysis, repo: RepoProfile, todos: CriterioResultado[] = []): Compat {
  const criterios = todos.filter((c) => !c.ignorado);
  const tiene = new Set(cv.skills.map((s) => s.id));
  const tecnicas = repo.skills.filter((s) => s.cat !== "dominio" && s.cat !== "blanda");
  const pesoTotal = tecnicas.reduce((a, s) => a + s.peso, 0) || 1;

  let stack = 0;
  const coincidencias: Compat["coincidencias"] = [];
  const brechas: string[] = [];
  for (const s of tecnicas) {
    if (tiene.has(s.id)) {
      stack += s.peso;
      coincidencias.push({ label: s.label, tipo: "exacta" });
      continue;
    }
    let mejor = 0;
    let via = "";
    for (const c of cv.skills) {
      const w = RELATED[s.id]?.[c.id] ?? 0;
      if (w > mejor) {
        mejor = w;
        via = c.label;
      }
    }
    if (mejor >= 0.4) {
      stack += s.peso * mejor;
      coincidencias.push({ label: `${s.label} ≈ ${via}`, tipo: "relacionada" });
    } else if (s.peso >= 1.5) brechas.push(s.label);
  }
  const stackPct = stack / pesoTotal;

  const dominiosRepo = repo.dominios;
  const dominio = dominiosRepo.length
    ? dominiosRepo.reduce((a, d) => a + (cv.dominios.includes(d) ? 1 : Math.max(0, ...cv.dominios.map((x) => RELATED[d]?.[x] ?? 0))), 0) / dominiosRepo.length
    : 0.5;

  const experiencia = clamp(cv.anios / 7) * (cv.seniority === "junior" ? 0.7 : 1);
  const colaboracion = clamp(0.4 * Number(cv.lidera) + 0.25 * Number(cv.mentoria) + 0.2 * Number(cv.opensource) + 0.2 * Number(cv.comunidad));

  const base = 0.55 * stackPct + 0.15 * dominio + 0.2 * experiencia + 0.1 * colaboracion;
  const puntosCtx = criterios.length ? criterios.reduce((a, c) => a + (c.cumple === "si" ? 1 : c.cumple === "parcial" ? 0.5 : 0), 0) / criterios.length : null;
  const total = puntosCtx === null ? base : base * 0.75 + puntosCtx * 0.25;

  const fuertes = coincidencias.filter((c) => c.tipo === "exacta").map((c) => c.label).slice(0, 4);
  const explicacion =
    `${pct(total)}% de compatibilidad. ` +
    (fuertes.length ? `Coincide en ${fuertes.join(", ")}. ` : "Coincidencia técnica baja. ") +
    (brechas.length ? `Le faltaría ${brechas.slice(0, 3).join(", ")}. ` : "") +
    (dominiosRepo.length && dominio >= 0.6 ? `Conoce el dominio (${dominiosRepo.map((d) => byId[d]?.label).join(", ")}). ` : "") +
    (criterios.length ? `Cumple ${criterios.filter((c) => c.cumple === "si").length} de ${criterios.length} criterios de contexto.` : "");

  return {
    id,
    total: pct(total),
    base: pct(base),
    componentes: { stack: pct(stackPct), dominio: pct(dominio), experiencia: pct(experiencia), colaboracion: pct(colaboracion), contexto: puntosCtx === null ? null : pct(puntosCtx) },
    coincidencias,
    brechas,
    criterios: todos,
    explicacion: explicacion.trim(),
  };
}

import { LEXICON, byId } from "./lexicon";
import { cuenta, norm } from "./text";
import type { RepoInfo, RepoProfile, RepoSkill } from "./types";

const LANG_A_SKILL: Record<string, string> = {
  TypeScript: "typescript", JavaScript: "javascript", Python: "python", Java: "java", Kotlin: "kotlin", Go: "go", Rust: "rust",
  "C#": "csharp", PHP: "php", Ruby: "ruby", Swift: "swift", Dart: "dart", "C++": "cpp", Scala: "java", PLpgSQL: "postgresql", Dockerfile: "docker", Shell: "bash",
};

// Convierte un repositorio de GitHub (lenguajes, topics, README, dependencias) en el "perfil de habilidades" que pide el proyecto.
// `requisicion` (opcional): lo que el HM pidió y el BP validó. Se suma al proyecto: la compatibilidad se mide contra el código
// Y contra la requisición (así la IA parte de la misma versión de la vacante que ven todos).
export function analyzeRepo(info: RepoInfo, requisicion?: { stack: string[]; habilidades: string }): RepoProfile {
  const peso: Record<string, number> = {};
  const add = (id: string, w: number) => {
    if (byId[id]) peso[id] = Math.max(peso[id] ?? 0, 0) + w;
  };

  // 1) Lenguajes: peso según la proporción de bytes
  const total = Object.values(info.lenguajes).reduce((a, b) => a + b, 0) || 1;
  for (const [lang, bytes] of Object.entries(info.lenguajes)) {
    const share = bytes / total;
    const id = LANG_A_SKILL[lang];
    if (id && share >= 0.02) add(id, id === "bash" ? 0.3 : 1 + 5 * share);
  }

  // 2) Topics del repositorio
  const topics = info.topics.map(norm);
  for (const s of LEXICON) if (topics.some((t) => s.aliases.some((a) => t === a || t === a.replace(/\s+/g, "-")))) add(s.id, 2);

  // 3) README y archivos de dependencias (solo alias no ambiguos, para no confundir "go to" con Go)
  const texto = norm(`${info.descripcion} ${info.readme} ${Object.values(info.archivos).join(" ")}`);
  for (const s of LEXICON) {
    if (s.ambiguo) continue;
    const n = s.aliases.reduce((acc, a) => acc + cuenta(texto, a), 0);
    if (n > 0) add(s.id, Math.min(2, 1 + (n - 1) * 0.25));
  }
  // 3b) Requisición validada de la vacante
  if (requisicion) {
    const req = norm(`${requisicion.stack.join(" ")} ${requisicion.habilidades}`);
    for (const s of LEXICON) if (s.aliases.some((a) => cuenta(req, a) > 0)) add(s.id, 1.5);
  }
  // dominios ambiguos ("rest", "eventos") no cuentan, pero el nombre del lenguaje principal sí
  if (info.lenguajePrincipal && LANG_A_SKILL[info.lenguajePrincipal]) add(LANG_A_SKILL[info.lenguajePrincipal], 1);

  const skills: RepoSkill[] = Object.entries(peso)
    .map(([id, p]) => ({ id, label: byId[id].label, cat: byId[id].cat, peso: Math.round(p * 100) / 100 }))
    .sort((a, b) => b.peso - a.peso)
    .slice(0, 14);
  const dominios = skills.filter((s) => s.cat === "dominio").map((s) => s.id);
  const stack = skills.filter((s) => s.cat !== "dominio" && s.cat !== "blanda").slice(0, 6).map((s) => s.label);
  return { skills, dominios, resumen: `${info.fullName}: ${stack.join(", ")}${dominios.length ? ` · dominio ${dominios.map((d) => byId[d].label).join(", ")}` : ""}` };
}

// Pool de la vacante "Backend Developer Sr — Pagos" en la demo: 10 CVs (PDF en /public/cvs) analizados con el motor local.
import type { CandidatoRaw } from "@/lib/data";
import { analyzeCv } from "@/lib/ai/cv";
import { analyzeRepo } from "@/lib/ai/repo";
import { scoreCompat } from "@/lib/ai/compat";
import { evaluarCriterios, parseCriterios } from "@/lib/ai/criteria";
import type { Compat, CvAnalysis, CvData, RepoInfo, RepoProfile } from "@/lib/ai/types";
import cvsJson from "./cvs.json";
import { REPOS_DEMO } from "./repos";

export const CVS = cvsJson as CvData[];
export const VACANTE_CON_CVS = "v1";

// Lo que el HM pidió y el BP validó en la requisición de esta vacante (la IA mide contra esto Y contra el código).
export const REQUISICION_V1 = { stack: ["Node.js", "AWS", "Docker"], habilidades: "Arquitectura de microservicios en sistemas de pagos" };

export type Fila = { cv: CvData; analisis: CvAnalysis; compat: Compat };

export function correrAnalisis(repo: RepoInfo, contexto: string, conRequisicion: boolean): { perfil: RepoProfile; filas: Fila[] } {
  const perfil = analyzeRepo(repo, conRequisicion ? REQUISICION_V1 : undefined);
  const criterios = parseCriterios(contexto);
  const filas = CVS.map((cv) => {
    const analisis = analyzeCv(cv);
    return { cv, analisis, compat: scoreCompat(cv.id, analisis, perfil, evaluarCriterios(criterios, cv)) };
  }).sort((a, b) => b.compat.total - a.compat.total);
  return { perfil, filas };
}

export const REPO_POR_DEFECTO: RepoInfo = REPOS_DEMO[0];
export const BASELINE = correrAnalisis(REPO_POR_DEFECTO, "", true);
export const compatBase = (cvId: string) => BASELINE.filas.find((f) => f.cv.id === cvId)?.compat.total ?? 0;

const ESTATUS: Record<string, string> = { c1: "En proceso", c2: "Entrevista agendada" };
const money = (n: number) => `$${n.toLocaleString("es-MX")} MXN`;
const nivelIdioma = (c: CvData) => c.idiomas.map((i) => `${i.idioma} ${i.nivel}`).join(", ");

export function candidatoDesdeCv(f: Fila): CandidatoRaw {
  const c = f.cv;
  return {
    id: `cv-${c.id}`,
    cvId: c.id,
    nombre: c.nombre,
    escolaridad: `${c.educacion[0].institucion} — ${c.educacion[0].titulo}`,
    compat: f.compat.total,
    estatus: ESTATUS[c.id] ?? "Screening",
    idiomas: nivelIdioma(c),
    compActual: money(c.compAct),
    compDeseada: money(c.compDes),
    atributosIA: f.analisis.destacados.slice(0, 3),
  };
}

export const CANDIDATOS_V1: CandidatoRaw[] = BASELINE.filas.map(candidatoDesdeCv);

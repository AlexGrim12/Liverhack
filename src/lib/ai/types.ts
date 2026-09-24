export type RepoInfo = {
  fullName: string;
  url: string;
  descripcion: string;
  lenguajePrincipal: string | null;
  lenguajes: Record<string, number>; // bytes por lenguaje (API de GitHub)
  topics: string[];
  stars: number;
  readme: string;
  archivos: Record<string, string>; // package.json, requirements.txt, go.mod, Cargo.toml…
  fuente: "github" | "cache";
};

export type Cat = "lenguaje" | "framework" | "datos" | "nube" | "devops" | "arquitectura" | "calidad" | "dominio" | "blanda";

export type CvData = {
  id: string;
  nombre: string;
  titular: string;
  ubicacion: string;
  email: string;
  github: string;
  resumen: string;
  experiencia: { puesto: string; empresa: string; periodo: string; logros: string[] }[];
  educacion: { titulo: string; institucion: string; periodo: string }[];
  skills: string[];
  certificaciones: string[];
  idiomas: { idioma: string; nivel: string }[];
  intereses: string[];
  compAct: number;
  compDes: number;
  fuente: string;
};

export type CvSkill = { id: string; label: string; cat: Cat; menciones: number; evidencia: string };
export type CvAnalysis = {
  skills: CvSkill[];
  anios: number;
  seniority: "junior" | "semi" | "senior" | "lead";
  dominios: string[];
  lidera: boolean;
  mentoria: boolean;
  opensource: boolean;
  comunidad: boolean; // charlas, meetups, organización de comunidades
  destacados: string[]; // certificaciones y logros con métricas
};

export type RepoSkill = { id: string; label: string; cat: Cat; peso: number };
export type RepoProfile = { skills: RepoSkill[]; dominios: string[]; resumen: string };

export type Cumple = "si" | "parcial" | "no";
export type CriterioResultado = { texto: string; cumple: Cumple; evidencia: string; ignorado?: boolean };

export type Compat = {
  id: string;
  total: number; // 0–100
  base: number; // sin contexto
  componentes: { stack: number; dominio: number; experiencia: number; colaboracion: number; contexto: number | null }; // 0–100
  coincidencias: { label: string; tipo: "exacta" | "relacionada" }[];
  brechas: string[];
  criterios: CriterioResultado[];
  explicacion: string;
};

export type TranscriptSummary = {
  resumen: string;
  frasesClave: { turno: number; texto: string }[];
  competencias: { nombre: string; nivel: "fuerte" | "moderada"; evidencia: string }[];
  dudas: string[];
  seguimiento: string[];
  metricas: { turnos: number; preguntas: number; palabrasCandidato: number; participacionCandidato: number; minutos: number };
  motor: "local" | "gemini";
};

import { CANDIDATOS_V1 } from "@/lib/demo/candidatos";

// Datos y lógica portados 1:1 desde el prototipo aprobado en Claude Design.

export const ETAPAS = ["Requisición", "Alineación", "Búsqueda", "Atracción", "Selección", "Oferta"];

export type Nivel = "bajo" | "medio" | "alto" | "complejo";

// Estado de la validación del BP sobre lo que capturó el HM (bp_validado_at / bp_comentarios en la BD).
//  por_validar: el HM la envió (o cambió algo ya validado → revalidación)
//  validada:    el BP la aprobó
//  devuelta:    el BP la devolvió con comentarios
export type BpEstado = "por_validar" | "validada" | "devuelta";

export type Requisitos = {
  stack: string[];
  competencias: string[];
  expMinima: number;
  cert: string;
  estudios: string;
  habilidades: string;
  salarioMin: number | null;
  salarioMax: number | null;
};

export type VacanteRaw = {
  id: string;
  titulo: string;
  area: string;
  categoria: string;
  responsable: string;
  responsableIniciales: string;
  etapaIndex: number;
  sla: string;
  candidatosCount: number;
  solicitante: string;
  hm: string; // captura la requisición
  hrbp: string; // BP que la valida
  nivel: Nivel;
  bpEstado: BpEstado;
  bpComentarios?: string;
  requisitos: Requisitos;
};

export const VACANTES_RAW: VacanteRaw[] = [
  {
    id: "v1",
    titulo: "Backend Developer Sr — Equipo Pagos",
    area: "TI y Sistemas",
    categoria: "TI-Sistemas",
    responsable: "Sofía Martínez",
    responsableIniciales: "SM",
    etapaIndex: 4,
    sla: "#F9A825",
    candidatosCount: CANDIDATOS_V1.length,
    solicitante: "Carlos Núñez Ibarra",
    hm: "Luis Herrera",
    hrbp: "Patricia Vega",
    nivel: "medio",
    bpEstado: "validada",
    requisitos: {
      stack: ["Node.js", "AWS", "Docker"],
      competencias: ["Liderazgo", "Comunicación efectiva"],
      expMinima: 3,
      cert: "AWS Certified Solutions Architect",
      estudios: "Licenciatura terminada",
      habilidades: "Arquitectura de microservicios en sistemas de pagos",
      salarioMin: 55000,
      salarioMax: 75000,
    },
  },
  {
    id: "v2",
    titulo: "Especialista en Marketing Digital",
    area: "Mercadotecnia",
    categoria: "Mercadotecnia",
    responsable: "Andrea López",
    responsableIniciales: "AL",
    etapaIndex: 3,
    sla: "#1E8E3E",
    candidatosCount: 1,
    solicitante: "Renata Cifuentes",
    hm: "Valeria Campos",
    hrbp: "Patricia Vega",
    nivel: "medio",
    bpEstado: "validada",
    requisitos: {
      stack: ["Google Ads", "Analytics"],
      competencias: ["Orientación a resultados"],
      expMinima: 2,
      cert: "Google Ads Certified",
      estudios: "Licenciatura terminada",
      habilidades: "Campañas de performance y reporteo",
      salarioMin: 38000,
      salarioMax: 48000,
    },
  },
  {
    id: "v3",
    titulo: "Coordinador de Logística CDMX",
    area: "Logística",
    categoria: "Logística",
    responsable: "Jorge Salinas",
    responsableIniciales: "JS",
    etapaIndex: 5,
    sla: "#D93025",
    candidatosCount: 2,
    solicitante: "Pablo Estrada",
    hm: "Ricardo Mena",
    hrbp: "Patricia Vega",
    nivel: "medio",
    bpEstado: "validada",
    requisitos: {
      stack: ["SAP WM", "Comercio Exterior"],
      competencias: ["Liderazgo", "Trabajo en equipo"],
      expMinima: 3,
      cert: "Certificación en Comercio Exterior",
      estudios: "Licenciatura terminada",
      habilidades: "Operación de centros de distribución",
      salarioMin: 34000,
      salarioMax: 42000,
    },
  },
];

export type CandidatoRaw = {
  id: string;
  nombre: string;
  escolaridad: string;
  compat: number;
  estatus: string;
  idiomas: string;
  compActual: string;
  compDeseada: string;
  atributosIA: string[];
  cvId?: string; // CV cargado (PDF en /cvs/<id>.pdf) analizado con IA
};

export const CANDIDATOS_RAW: Record<string, CandidatoRaw[]> = {
  v1: CANDIDATOS_V1,
  v2: [
    {
      id: "c4",
      cvId: "c4",
      nombre: "Ximena Alcántara Robles",
      escolaridad: "Universidad Iberoamericana",
      compat: 76,
      estatus: "Screening",
      idiomas: "Inglés avanzado",
      compActual: "$38,000 MXN",
      compDeseada: "$46,000 MXN",
      atributosIA: ["Google Ads Certified"],
    },
  ],
  v3: [
    {
      id: "c5",
      cvId: "c5",
      nombre: "Rodrigo Beltrán Ochoa",
      escolaridad: "IPN — Ing. Industrial",
      compat: 72,
      estatus: "Oferta enviada",
      idiomas: "Inglés intermedio",
      compActual: "$34,000 MXN",
      compDeseada: "$40,000 MXN",
      atributosIA: ["Certificación en Comercio Exterior"],
    },
    {
      id: "c6",
      cvId: "c6",
      nombre: "Paulina Estrada Cano",
      escolaridad: "Universidad Anáhuac",
      compat: 65,
      estatus: "Descartado",
      idiomas: "Inglés básico",
      compActual: "$32,000 MXN",
      compDeseada: "$39,000 MXN",
      atributosIA: ["Manejo de SAP WM"],
    },
  ],
};

export const CAMPOS_CATEGORIA: Record<string, { stack: string[]; cert: string; exp: number }> = {
  "TI-Sistemas": { stack: ["Node.js", "Python", "Java", "AWS", "GCP", "Docker", "React"], cert: "p.ej. AWS Certified Solutions Architect", exp: 3 },
  RH: { stack: ["Reclutamiento IT", "Compensaciones", "Nómina", "SAP SuccessFactors"], cert: "p.ej. Certificación SHRM", exp: 2 },
  Mercadotecnia: { stack: ["SEO/SEM", "Google Ads", "Meta Ads", "Analytics", "Branding"], cert: "p.ej. Google Ads Certified", exp: 2 },
  Logística: { stack: ["SAP WM", "Comercio Exterior", "Rutas y Distribución", "WMS"], cert: "p.ej. Certificación en Comercio Exterior", exp: 3 },
  Finanzas: { stack: ["SAP FI", "Excel avanzado", "Forecasting", "NIIF"], cert: "p.ej. Certificación CFA nivel I", exp: 3 },
};

export const ESCOLARIDADES = ["UNAM", "ITESO", "Tec de Monterrey"];
export const ESTATUSES = ["Screening", "Entrevista agendada", "En proceso", "Finalista", "Oferta enviada", "Oferta aceptada", "Descartado"];
export const COMPETENCIAS = ["Liderazgo", "Trabajo en equipo", "Comunicación efectiva", "Orientación a resultados"];

export const NIVELES: { value: Nivel; label: string }[] = [
  { value: "bajo", label: "Bajo" },
  { value: "medio", label: "Medio" },
  { value: "alto", label: "Alto" },
  { value: "complejo", label: "Complejo" },
];
export const ESTUDIOS = ["Preparatoria", "Licenciatura trunca", "Licenciatura terminada", "Posgrado"];
// Personas de la demo: el HM elige a su BP y al solicitante; el BP asigna al reclutador (AT) al validar.
export const SOLICITANTES = ["Carlos Núñez Ibarra", "Renata Cifuentes", "Pablo Estrada"];
export const BPS = ["Patricia Vega"];
// HM con el que "inicia sesión" la demo cuando captura requisiciones.
export const HM_PERSONA = "Valeria Campos";
export const CATEGORIA_AREA: Record<string, string> = {
  "TI-Sistemas": "TI y Sistemas",
  RH: "Recursos Humanos",
  Mercadotecnia: "Mercadotecnia",
  Logística: "Logística",
  Finanzas: "Finanzas",
};
export const ATS = ["Sofía Martínez", "Andrea López", "Jorge Salinas"];

export type Role = "hrbp" | "at" | "hm" | "user" | "candidato";

export const ROLE_LABELS: Record<Role, string> = {
  hrbp: "HRBP",
  at: "Reclutamiento (AT)",
  hm: "Hiring Manager",
  user: "Cliente interno (seguimiento)",
  candidato: "Candidato/a",
};

export const DEFAULT_SCREEN: Record<Role, string> = {
  hrbp: "hrbp-dashboard",
  at: "at-dashboard",
  hm: "hm-dashboard",
  user: "user-dashboard",
  candidato: "candidato-portal",
};

export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export function compatColors(p: number): { bg: string; color: string } {
  if (p >= 85) return { bg: "#E9F5EC", color: "#1E8E3E" };
  if (p >= 70) return { bg: "#FDF1E3", color: "#B8720B" };
  return { bg: "#FBEAE9", color: "#D93025" };
}

export type CalendarEvent = {
  id: string;
  day: number; // día del mes, septiembre 2026
  time: string;
  title: string;
  subtitle: string;
  vacanteId?: string;
  screen: string;
};

// Septiembre 2026 — mismo mes/año que la fecha de "hoy" en el entorno de demo.
export const CALENDAR_MONTH = { year: 2026, month: 8, label: "Septiembre 2026" }; // month: 0-indexed

export const CALENDAR_EVENTS: Record<Role, CalendarEvent[]> = {
  hrbp: [
    { id: "e1", day: 18, time: "3:00 pm", title: "Entrevista completada", subtitle: "Mariana Coronado Reyes · Backend Developer Sr", vacanteId: "v1", screen: "hrbp-dashboard" },
    { id: "e2", day: 26, time: "11:00 am", title: "Entrevista técnica agendada", subtitle: "Emiliano Vázquez Tello · Backend Developer Sr", vacanteId: "v1", screen: "hrbp-dashboard" },
    { id: "e3", day: 30, time: "5:00 pm", title: "Revisión de SLA", subtitle: "Coordinador de Logística CDMX · en riesgo", vacanteId: "v3", screen: "hrbp-dashboard" },
  ],
  at: [
    { id: "e1", day: 18, time: "3:00 pm", title: "Entrevista completada", subtitle: "Mariana Coronado Reyes · Backend Developer Sr", vacanteId: "v1", screen: "at-dashboard" },
    { id: "e4", day: 22, time: "9:30 am", title: "Screening", subtitle: "Ximena Alcántara Robles · Marketing Digital", vacanteId: "v2", screen: "at-dashboard" },
    { id: "e5", day: 24, time: "10:00 am", title: "Entrevista", subtitle: "Rodrigo Beltrán Ochoa · Logística CDMX", vacanteId: "v3", screen: "at-dashboard" },
    { id: "e2", day: 26, time: "11:00 am", title: "Entrevista técnica agendada", subtitle: "Emiliano Vázquez Tello · Backend Developer Sr", vacanteId: "v1", screen: "at-dashboard" },
  ],
  hm: [
    { id: "e1", day: 18, time: "3:00 pm", title: "Entrevista completada", subtitle: "Mariana Coronado Reyes · pendiente de evaluar", vacanteId: "v1", screen: "hm-dashboard" },
    { id: "e2", day: 26, time: "11:00 am", title: "Entrevista técnica agendada", subtitle: "Emiliano Vázquez Tello · Backend Developer Sr", vacanteId: "v1", screen: "hm-dashboard" },
  ],
  user: [
    { id: "e2", day: 26, time: "11:00 am", title: "Tu entrevista programada", subtitle: "Backend Developer Sr — Equipo Pagos", vacanteId: "v1", screen: "user-detalle" },
    { id: "e6", day: 28, time: "—", title: "Próxima actualización de estatus", subtitle: "Backend Developer Sr — Equipo Pagos", vacanteId: "v1", screen: "user-detalle" },
  ],
  candidato: [],
};

export type PendienteItem = {
  id: string;
  title: string;
  subtitle: string;
  due: string;
  urgent?: boolean;
  screen: string;
  vacanteId?: string;
};

export const PENDIENTES: Record<Role, PendienteItem[]> = {
  hrbp: [
    { id: "p1", title: "Vacante en riesgo de SLA", subtitle: "Coordinador de Logística CDMX lleva más tiempo del esperado en Oferta.", due: "Hoy", urgent: true, screen: "hrbp-dashboard", vacanteId: "v3" },
    { id: "p2", title: "Candidato esperando revisión", subtitle: "Especialista en Marketing Digital tiene 1 candidato en Screening.", due: "Mañana", screen: "hrbp-dashboard", vacanteId: "v2" },
  ],
  at: [
    { id: "p1", title: "Agendar entrevista", subtitle: "Daniela Ríos Landa sigue en Screening — Backend Developer Sr.", due: "Hoy", urgent: true, screen: "at-candidatos", vacanteId: "v1" },
    { id: "p2", title: "Vacante en riesgo", subtitle: "Coordinador de Logística CDMX necesita avanzar a Oferta.", due: "Hoy", urgent: true, screen: "at-candidatos", vacanteId: "v3" },
    { id: "p3", title: "Confirmar entrevista", subtitle: "Emiliano Vázquez Tello — 26 sep, 11:00 am.", due: "26 sep", screen: "at-candidatos", vacanteId: "v1" },
  ],
  hm: [
    { id: "p1", title: "Evaluar entrevista completada", subtitle: "Mariana Coronado Reyes — feedback pendiente.", due: "Hoy", urgent: true, screen: "hm-entrevista", vacanteId: "v1" },
    { id: "p2", title: "Entrevista próxima", subtitle: "Emiliano Vázquez Tello — 26 sep, 11:00 am.", due: "26 sep", screen: "hm-dashboard", vacanteId: "v1" },
  ],
  user: [
    { id: "p1", title: "Entrevista programada", subtitle: "Backend Developer Sr — Equipo Pagos, 26 sep 11:00 am.", due: "26 sep", screen: "user-detalle", vacanteId: "v1" },
    { id: "p2", title: "Actualización de estatus", subtitle: "Especialista en Marketing Digital avanzó a Atracción.", due: "Ayer", screen: "user-detalle", vacanteId: "v2" },
  ],
  candidato: [],
};

export function estatusColors(s: string): { bg: string; color: string } {
  const map: Record<string, { bg: string; color: string }> = {
    Screening: { bg: "#EDEBEC", color: "#5F5560" },
    "Entrevista agendada": { bg: "#FDEBDD", color: "#B8560E" },
    "En proceso": { bg: "#FDF0F8", color: "#A30071" },
    Finalista: { bg: "#E9F5EC", color: "#1E8E3E" },
    "Oferta enviada": { bg: "#FDF0F8", color: "#E10098" },
    "Oferta aceptada": { bg: "#E9F5EC", color: "#1E8E3E" },
    Contratado: { bg: "#E9F5EC", color: "#1E8E3E" },
    Descartado: { bg: "#FBEAE9", color: "#D93025" },
  };
  return map[s] || { bg: "#EDEBEC", color: "#5F5560" };
}

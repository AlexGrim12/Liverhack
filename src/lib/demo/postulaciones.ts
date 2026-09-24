// Evaluación previa (assessment) y comentarios del equipo sobre cada postulación. Datos ficticios para la demo.
// Las llaves son los ids de candidato de la app (v1: "cv-c1"…"cv-c10"; v2: "c4"; v3: "c5" y "c6").
export type TipoEvaluacion = "tecnica" | "caso" | "ingles";
export type EstadoEvaluacion = "enviada" | "entregada" | "calificada" | "vencida";
export type Evaluacion = { tipo: TipoEvaluacion; estado: EstadoEvaluacion; enviada: string; vence: string; score?: number };
export type RolComentario = "at" | "hm" | "hrbp";
export type Comentario = { id: string; candidatoId: string; autor: string; rol: RolComentario; texto: string; hora: string };

export const TIPOS_EVALUACION: Record<TipoEvaluacion, { label: string; mensaje: string }> = {
  tecnica: { label: "Prueba técnica de código", mensaje: "Hola, antes de la entrevista te compartimos una prueba técnica breve (aprox. 90 minutos). Puedes resolverla cuando quieras dentro del plazo." },
  caso: { label: "Caso práctico", mensaje: "Hola, te compartimos un caso práctico del área para conocer cómo abordas un problema real. Toma alrededor de 60 minutos." },
  ingles: { label: "Prueba de inglés", mensaje: "Hola, te compartimos una prueba de inglés conversacional de 20 minutos, para conocer tu nivel en contexto laboral." },
};

export const AUTOR_POR_ROL: Record<RolComentario, string> = { at: "Sofía Martínez", hm: "Luis Herrera", hrbp: "Patricia Vega" };
export const ROL_LABEL: Record<RolComentario, string> = { at: "Reclutamiento", hm: "Hiring Manager", hrbp: "BP" };

// "Hoy" de la demo (el calendario de la app está en septiembre de 2026)
export const HOY = new Date(2026, 8, 23);
const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
export const fmtDia = (d: Date) => `${d.getDate()} ${MESES[d.getMonth()]}`;
export function sumaDiasHabiles(desde: Date, n: number): Date {
  const d = new Date(desde);
  let k = 0;
  while (k < n) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 0 && d.getDay() !== 6) k += 1;
  }
  return d;
}

export function etiquetaEvaluacion(e: Evaluacion | undefined): { texto: string; cls: string } {
  if (!e) return { texto: "Sin enviar", cls: "text-ink-muted bg-surface-subtle" };
  if (e.estado === "calificada") return { texto: `${e.score}/100`, cls: (e.score ?? 0) >= 80 ? "text-emerald-700 bg-emerald-50" : (e.score ?? 0) >= 65 ? "text-amber-800 bg-amber-50" : "text-rose-700 bg-rose-50" };
  if (e.estado === "entregada") return { texto: "Entregada · por calificar", cls: "text-accent-dark bg-accent-tint" };
  if (e.estado === "vencida") return { texto: `Vencida ${e.vence}`, cls: "text-rose-700 bg-rose-50" };
  return { texto: `Enviada · vence ${e.vence}`, cls: "text-amber-800 bg-amber-50" };
}

export const SEED_EVALUACIONES: Record<string, Evaluacion> = {
  "cv-c1": { tipo: "tecnica", estado: "calificada", enviada: "10 sep", vence: "15 sep", score: 91 },
  "cv-c2": { tipo: "tecnica", estado: "calificada", enviada: "10 sep", vence: "15 sep", score: 84 },
  "cv-c3": { tipo: "caso", estado: "enviada", enviada: "22 sep", vence: "25 sep" },
  "cv-c4": { tipo: "tecnica", estado: "calificada", enviada: "10 sep", vence: "15 sep", score: 76 },
  "cv-c6": { tipo: "tecnica", estado: "vencida", enviada: "14 sep", vence: "21 sep" },
  "cv-c7": { tipo: "tecnica", estado: "entregada", enviada: "17 sep", vence: "22 sep" },
  "cv-c8": { tipo: "tecnica", estado: "calificada", enviada: "12 sep", vence: "17 sep", score: 88 },
  "cv-c9": { tipo: "caso", estado: "enviada", enviada: "22 sep", vence: "26 sep" },
  "cv-c10": { tipo: "caso", estado: "calificada", enviada: "12 sep", vence: "17 sep", score: 72 },
  c4: { tipo: "caso", estado: "enviada", enviada: "21 sep", vence: "24 sep" },
  c5: { tipo: "caso", estado: "calificada", enviada: "10 sep", vence: "15 sep", score: 80 },
  c6: { tipo: "caso", estado: "calificada", enviada: "10 sep", vence: "15 sep", score: 58 },
};

let n = 0;
const c = (candidatoId: string, rol: RolComentario, texto: string, hora: string): Comentario => ({ id: `seed-${++n}`, candidatoId, autor: AUTOR_POR_ROL[rol], rol, texto, hora });
export const SEED_COMENTARIOS: Comentario[] = [
  c("cv-c1", "at", "Portafolio sólido en pagos. Su evaluación técnica salió en 91/100: recomiendo avanzar a screening.", "12 sep · 10:15"),
  c("cv-c1", "hrbp", "La pretensión de $68,000 está dentro de la banda aprobada.", "12 sep · 12:40"),
  c("cv-c1", "hm", "Me gustaría profundizar en su experiencia con Kafka durante la entrevista técnica.", "13 sep · 09:05"),
  c("cv-c1", "at", "Screening hecho: disponible en 30 días. La paso al panel de Diego y Karla.", "17 sep · 16:20"),
  c("cv-c2", "at", "Buen perfil full-stack. Falta confirmar su experiencia real con AWS.", "14 sep · 11:30"),
  c("cv-c2", "hm", "Lo comparamos con Mariana antes de decidir; agendemos su técnica esta semana.", "15 sep · 15:10"),
  c("cv-c3", "at", "Le envié el caso práctico. Si no lo entrega mañana, le mando un recordatorio.", "22 sep · 09:45"),
  c("cv-c6", "at", "La evaluación venció sin respuesta. ¿La reenviamos con más plazo?", "22 sep · 10:00"),
  c("cv-c6", "hm", "Prioridad baja: un perfil de DevOps no encaja con este equipo.", "22 sep · 13:25"),
  c("cv-c7", "at", "Ya entregó la prueba; falta calificarla.", "22 sep · 17:10"),
  c("cv-c8", "at", "Rust y Go muy fuertes, pero le falta Node.js. Buena alternativa si cambiamos el proyecto de referencia.", "18 sep · 12:00"),
  c("cv-c8", "hrbp", "Su pretensión queda en el techo de la banda: hay que negociar.", "18 sep · 14:30"),
  c("cv-c9", "at", "Egresado de bootcamp: le mandé el caso práctico para medir nivel real.", "22 sep · 11:20"),
  c("c4", "at", "Certificada en Google Ads. Evaluación enviada, vence mañana.", "21 sep · 10:30"),
  c("c5", "hm", "Conoce la operación del CEDIS y cumple la banda. Aprobado.", "20 sep · 09:00"),
  c("c5", "hrbp", "La oferta de $40,000 está dentro de la banda de $34,000 a $42,000.", "21 sep · 12:00"),
  c("c6", "at", "No cubre la certificación en comercio exterior requerida.", "19 sep · 16:45"),
];

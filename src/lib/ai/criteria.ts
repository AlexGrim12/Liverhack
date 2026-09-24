import { cvTexto } from "./cv";
import { norm, oraciones } from "./text";
import type { CriterioResultado, CvData, Cumple } from "./types";

// Sinónimos y conceptos de "vida diaria" para entender criterios escritos en lenguaje natural.
const SYN: Record<string, string[]> = {
  fintech: ["fintech", "banca", "bancario", "pagos", "financiera", "financiero", "spei", "pasarela"],
  pagos: ["pagos", "pasarela", "payments", "stripe", "adyen", "conekta", "checkout"],
  banca: ["banca", "bancario", "banco", "financiera"],
  comunidad: ["comunidad", "meetup", "meetups", "charla", "charlas", "speaker", "organizadora", "organizador", "voluntariado", "talleres", "docencia"],
  opensource: ["open source", "codigo abierto", "contribu"],
  open: ["open source", "codigo abierto", "contribu"],
  source: ["open source", "codigo abierto", "contribu"],
  mentoria: ["mentor", "mentoria", "mentorear", "mentoreo", "docencia", "capacito", "guiando"],
  mentorear: ["mentor", "mentoria", "mentoreo", "docencia", "capacito"],
  mentoreado: ["mentor", "mentoria", "mentoreo", "docencia", "capacito"],
  liderar: ["lidero", "lidere", "lider", "tech lead", "lidera", "encabec"],
  liderado: ["lidero", "lidere", "lider", "tech lead", "lidera"],
  lider: ["lidero", "lidere", "lider", "tech lead", "lidera"],
  liderazgo: ["lidero", "lidere", "lider", "tech lead", "lidera"],
  personas: ["equipo", "personas", "junior", "companeros"],
  guardias: ["guardia", "guardias", "on-call", "oncall", "24/7"],
  guardia: ["guardia", "guardias", "on-call", "oncall", "24/7"],
  viajar: ["viajar", "viajes"],
  trasladarse: ["reubicarse", "reubicacion", "remoto", "viajar"],
  reubicarse: ["reubicarse", "reubicacion", "remoto"],
  remoto: ["remoto", "reubicarse"],
  ensenar: ["docencia", "talleres", "capacito", "mentor", "charlas", "speaker", "voluntariado"],
  ensenanza: ["docencia", "talleres", "capacito", "mentor", "charlas", "speaker"],
  talleres: ["talleres", "docencia", "capacito"],
  autodidacta: ["autodidacta", "cursos en linea", "cursos"],
  aprender: ["autodidacta", "cursos", "certificado", "certificacion", "certified"],
  certificaciones: ["certified", "certificacion", "certificado", "certificate"],
  hackathons: ["hackathon", "hackathons"],
  startups: ["startup", "startups"],
  seguridad: ["seguridad", "ciberseguridad", "pci", "oauth"],
  calidad: ["calidad", "pruebas", "testing", "tdd"],
  retail: ["retail", "tienda", "e-commerce", "ecommerce", "marketplace"],
  comercio: ["e-commerce", "ecommerce", "comercio", "marketplace", "retail"],
  ecommerce: ["e-commerce", "ecommerce", "marketplace", "retail", "comercio"],
};
const CIUDADES: Record<string, string[]> = {
  cdmx: ["ciudad de mexico"], "ciudad de mexico": ["ciudad de mexico"], monterrey: ["monterrey"], guadalajara: ["guadalajara"],
  queretaro: ["queretaro"], puebla: ["puebla"], merida: ["merida"],
};
const STOP = new Set("con sin para por que como una uno unos unas del las los debe tiene tener puede pueda ser esta este esto esta han hay muy mas menos algo alguien persona candidato candidata experiencia haya haber trabajado trabaja gusta gustaria busco buscamos nos algun alguna cualquier disponible dispuesto dispuesta".split(" "));

// Guardarraíl: criterios sobre datos personales sensibles NO se usan para evaluar a nadie.
const SENSIBLE = /\b(edad|joven|jovenes|mayor de|menor de|genero|hombre|mujer|embaraz\w*|hijos|casad\w*|solter\w*|estado civil|religion|religios\w*|iglesia|nacionalidad|raza|etnia|color de piel|discapacidad|orientacion sexual|politic\w*|salud|enfermedad|apariencia|foto)\b/;

function evaluarUno(criterio: string, cv: CvData): CriterioResultado {
  const c = norm(criterio);
  if (SENSIBLE.test(c)) {
    return { texto: criterio, cumple: "no", ignorado: true, evidencia: "Ignorado por diseño: se refiere a un dato personal sensible y no se usa para evaluar." };
  }
  const texto = norm(cvTexto(cv));
  const frases = oraciones(cvTexto(cv));
  const frasesN = frases.map(norm);
  const evid = (terminos: string[]) => {
    const i = frasesN.findIndex((f) => terminos.some((t) => f.includes(t)));
    return i >= 0 ? frases[i].slice(0, 140) : "";
  };

  // Ubicación
  const ciudad = Object.keys(CIUDADES).find((k) => new RegExp(`(?<![a-z])${k}(?![a-z])`).test(c));
  if (ciudad) {
    const vive = CIUDADES[ciudad].some((x) => norm(cv.ubicacion).includes(x));
    const flexible = /(reubicarse|remoto|viajar)/.test(texto);
    const permite = /(traslad|reubic|remoto|viajar)/.test(c);
    if (vive) return { texto: criterio, cumple: "si", evidencia: `Vive en ${cv.ubicacion}` };
    if (permite && flexible) return { texto: criterio, cumple: "parcial", evidencia: `Vive en ${cv.ubicacion}; ${evid(["reubicarse", "remoto", "viajar"])}` };
    return { texto: criterio, cumple: "no", evidencia: `Vive en ${cv.ubicacion}` };
  }
  // Idioma con nivel
  if (/ingles|english/.test(c)) {
    const i = cv.idiomas.find((x) => norm(x.idioma).startsWith("ingl"));
    const need = /avanzado|fluido|c1|c2/.test(c) ? 3 : /intermedio|b2/.test(c) ? 2 : 1;
    const has = i ? ({ basico: 1, intermedio: 2, avanzado: 3, nativo: 4 } as Record<string, number>)[i.nivel] ?? 0 : 0;
    return { texto: criterio, cumple: has >= need ? "si" : has === need - 1 && has > 0 ? "parcial" : "no", evidencia: i ? `Inglés ${i.nivel}` : "No indica inglés" };
  }

  // Criterios generales: cobertura de conceptos con sinónimos. "A o B" se cumple si se cumple cualquiera de las alternativas.
  let mejor: { cobertura: number; usados: string[] } = { cobertura: 0, usados: [] };
  for (const alt of c.split(/\s+o\s+/).filter(Boolean)) {
    const tokens = alt.split(" ").filter((t) => t.length >= 4 && !STOP.has(t));
    if (!tokens.length) continue;
    const usados: string[] = [];
    let hits = 0;
    for (const t of tokens) {
      const opciones = SYN[t] ?? [t, t.slice(0, Math.max(5, t.length - 2))];
      const ok = opciones.filter((o) => texto.includes(o));
      if (ok.length) {
        hits++;
        usados.push(...ok);
      }
    }
    if (hits / tokens.length > mejor.cobertura) mejor = { cobertura: hits / tokens.length, usados };
  }
  const cumple: Cumple = mejor.cobertura >= 0.6 ? "si" : mejor.cobertura >= 0.34 ? "parcial" : "no";
  return { texto: criterio, cumple, evidencia: cumple === "no" ? "Sin evidencia en el CV" : evid(mejor.usados) };
}

// "Contexto" en lenguaje natural: una idea por línea (o separadas por coma o punto y coma).
export function parseCriterios(contexto: string): string[] {
  return contexto
    .split(/[\n;]+|,(?![^(]*\))/)
    .map((s) => s.trim())
    .filter((s) => s.length > 3)
    .slice(0, 8);
}

export const evaluarCriterios = (criterios: string[], cv: CvData): CriterioResultado[] => criterios.map((c) => evaluarUno(c, cv));

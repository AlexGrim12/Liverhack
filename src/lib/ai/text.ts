// Normaliza texto para comparar sin importar mayúsculas ni acentos.
export const norm = (s: string): string =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9.#+/\-\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// ¿aparece el término como palabra completa? (evita que "java" coincida dentro de "javascript")
export const reTermino = (alias: string, flags = "g") => new RegExp(`(?<![a-z0-9.])${escapeRe(alias)}(?![a-z0-9])`, flags);
export const cuenta = (texto: string, alias: string): number => (texto.match(reTermino(alias)) || []).length;

export function oraciones(texto: string): string[] {
  return texto
    .split(/(?<=[.!?…])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 2);
}

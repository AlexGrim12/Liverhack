// Invitación de calendario (.ics, RFC 5545) generada en el navegador: abre en Google Calendar, Outlook o Apple Calendar
// sin cuentas ni servidores. La hora se captura en CDMX (UTC-6 fijo desde 2022) y se exporta en UTC.

export type IcsInput = {
  uid: string;
  titulo: string;
  descripcion: string;
  ubicacion: string;
  inicio: Date;
  duracionMin: number;
  alarmaMin?: number;
};

const fmtUtc = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

// Las líneas de más de 75 octetos se pliegan (la línea siguiente empieza con un espacio).
function fold(line: string): string {
  const enc = new TextEncoder();
  const out: string[] = [];
  let cur = "";
  let bytes = 0;
  for (const ch of line) {
    const b = enc.encode(ch).length;
    if (bytes + b > (out.length === 0 ? 75 : 74)) {
      out.push(cur);
      cur = "";
      bytes = 0;
    }
    cur += ch;
    bytes += b;
  }
  out.push(cur);
  return out.map((l, i) => (i === 0 ? l : " " + l)).join("\r\n");
}

export function buildIcs(i: IcsInput): string {
  const fin = new Date(i.inicio.getTime() + i.duracionMin * 60_000);
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Liver Companion//Talento 360//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${i.uid}@liver-companion`,
    `DTSTAMP:${fmtUtc(new Date())}`,
    `DTSTART:${fmtUtc(i.inicio)}`,
    `DTEND:${fmtUtc(fin)}`,
    `SUMMARY:${esc(i.titulo)}`,
    `DESCRIPTION:${esc(i.descripcion)}`,
    `LOCATION:${esc(i.ubicacion)}`,
    ...(i.ubicacion.startsWith("http") ? [`URL:${i.ubicacion}`] : []),
    "STATUS:CONFIRMED",
    ...(i.alarmaMin ? ["BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${esc(i.titulo)}`, `TRIGGER:-PT${i.alarmaMin}M`, "END:VALARM"] : []),
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.map(fold).join("\r\n") + "\r\n";
}

export function descargarIcs(nombreArchivo: string, contenido: string) {
  const url = URL.createObjectURL(new Blob([contenido], { type: "text/calendar;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = nombreArchivo.replace(/[^a-zA-Z0-9._-]+/g, "_");
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

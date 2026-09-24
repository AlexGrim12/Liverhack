"use client";

// Ícono de Liverpool vectorizado: dos "L" anidadas de 4 líneas cada una. La segunda es la primera girada 180° sobre el centro,
// así que basta un solo trazado. Al animarse, cada línea se dibuja desde su extremo (arriba-izquierda / abajo-derecha) hacia el centro,
// donde las dos "L" encajan.
const CX = 106.5;
const CY = 112;
const L = [
  { x: 51, y: 160.5, r: 10 },
  { x: 65, y: 147, r: 6 },
  { x: 78, y: 134, r: 3 },
  { x: 91, y: 121, r: 0 },
];
const trazo = ({ x, y, r }: (typeof L)[number]) => `M${x} 60V${y - r}${r ? `A${r} ${r} 0 0 0 ${x + r} ${y}` : ""}H113`;

function Lineas({ animated }: { animated: boolean }) {
  const grupo = (rotado: boolean) => (
    <g transform={rotado ? `rotate(180 ${CX} ${CY})` : undefined}>
      {L.map((l, i) => (
        <path key={i} d={trazo(l)} pathLength={1} className={animated ? "liver-linea" : undefined} style={{ ["--i" as string]: i + (rotado ? 0.5 : 0) }} />
      ))}
    </g>
  );
  return (
    <g fill="none" stroke="currentColor" strokeWidth={8.6} strokeLinejoin="round">
      {grupo(false)}
      {grupo(true)}
    </g>
  );
}

// variant "tile": cuadro magenta con el ícono blanco (como el logotipo); "glyph": solo el ícono, toma el color del texto.
export function LiverMark({ size = 48, animated = true, once = false, variant = "tile", className = "" }: { size?: number; animated?: boolean; once?: boolean; variant?: "tile" | "glyph"; className?: string }) {
  if (once) className = `liver-una-vez ${className}`;
  if (variant === "glyph")
    return (
      <svg viewBox="40 54 133 117" width={size} height={size * (117 / 133)} className={className} role="img" aria-label="Liverpool">
        <Lineas animated={animated} />
      </svg>
    );
  return (
    <svg viewBox="0 0 225 225" width={size} height={size} className={`text-white ${className}`} role="img" aria-label="Liverpool">
      <rect width="225" height="225" rx="44" fill="#E10098" />
      <g transform="translate(6 0.5)">
        <Lineas animated={animated} />
      </g>
    </svg>
  );
}

// Carga en línea (junto a un texto de estado)
export function LiverLoader({ label, size = 44, className = "" }: { label?: string; size?: number; className?: string }) {
  return (
    <div role="status" className={`inline-flex items-center gap-3 ${className}`}>
      <LiverMark size={size} />
      {label && <span className="text-sm font-semibold text-ink-muted">{label}</span>}
    </div>
  );
}

// Pantalla de carga completa
export function LiverSplash({ label = "Liver Companion", saliendo = false }: { label?: string; saliendo?: boolean }) {
  return (
    <div role="status" aria-label="Cargando" className={`fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center gap-5 transition-opacity duration-500 ${saliendo ? "opacity-0 pointer-events-none" : "opacity-100"}`}>
      <LiverMark size={104} />
      <div className="text-center leading-tight">
        <div className="text-lg font-black text-ink-title">Liverpool</div>
        <div className="text-xs font-bold text-accent">{label}</div>
      </div>
    </div>
  );
}

// Transición entre perfiles (~0.75 s). Cambia `clave` para dispararla de nuevo.
export function LiverTransicion({ clave }: { clave: number }) {
  if (!clave) return null;
  return (
    <div key={clave} aria-hidden className="liver-transicion fixed inset-0 z-[90] bg-white flex items-center justify-center pointer-events-none">
      <LiverMark size={84} once />
    </div>
  );
}

// Momento de éxito: tarjeta breve con el ícono y una palomita (~1.4 s)
export function LiverExito({ clave, texto }: { clave: number; texto: string }) {
  if (!clave) return null;
  return (
    <div key={clave} role="status" className="liver-exito fixed left-1/2 top-20 z-[95] pointer-events-none flex items-center gap-3 bg-white border border-ink-border rounded-2xl shadow-lg pl-3 pr-5 py-3 max-w-[92vw]">
      <div className="relative shrink-0">
        <LiverMark size={44} once />
        <svg viewBox="0 0 24 24" className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 p-1" fill="none" stroke="white" strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12.5l4.5 4.5L19 7.5" pathLength={1} className="liver-check" />
        </svg>
      </div>
      <span className="text-sm font-bold text-ink-title">{texto}</span>
    </div>
  );
}

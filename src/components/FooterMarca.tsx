"use client";

import { useRef } from "react";
import { LiverMark } from "@/components/LiverLoader";

// Pie de página con el ícono de Liverpool. Gesto oculto (también en celular): tres toques seguidos reinician la demo.
// El conteo es propio (ventana de 700 ms) porque event.detail no es confiable en pantallas táctiles.
export default function FooterMarca({ onReiniciar }: { onReiniciar?: () => void }) {
  const toques = useRef<number[]>([]);
  return (
    <footer className="flex items-center justify-center gap-2 py-5 text-[11px] text-ink-muted/80 select-none">
      <button
        type="button"
        aria-label="Liverpool"
        onClick={() => {
          const ahora = Date.now();
          toques.current = [...toques.current.filter((t) => ahora - t < 700), ahora];
          if (toques.current.length >= 3) {
            toques.current = [];
            onReiniciar?.();
          }
        }}
        className="rounded-lg focus:outline-none"
      >
        <LiverMark size={28} animated={false} />
      </button>
      <span>Liver Companion · El Puerto de Liverpool</span>
    </footer>
  );
}

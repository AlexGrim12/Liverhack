"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { ROL_LABEL, type Comentario, type RolComentario } from "@/lib/demo/postulaciones";

const ROL_CLS: Record<RolComentario, string> = {
  at: "text-amber-800 bg-amber-50",
  hm: "text-sky-800 bg-sky-50",
  hrbp: "text-violet-800 bg-violet-50",
};

// Hilo de comentarios internos sobre una postulación: lo ven y lo escriben AT, HM y BP (la persona candidata no lo ve).
export default function HiloComentarios({
  comentarios,
  puedeComentar,
  onComentar,
  compacto = false,
}: {
  comentarios: Comentario[];
  puedeComentar: boolean;
  onComentar: (texto: string) => void;
  compacto?: boolean;
}) {
  const [texto, setTexto] = useState("");
  const enviar = () => {
    const t = texto.trim();
    if (!t) return;
    onComentar(t);
    setTexto("");
  };
  return (
    <div className="space-y-2">
      {comentarios.length === 0 && <p className="text-xs text-ink-muted">Aún no hay comentarios sobre esta postulación.</p>}
      <ul className={`space-y-2 ${compacto ? "max-h-52 overflow-y-auto pr-1" : ""}`}>
        {comentarios.map((m) => (
          <li key={m.id} className="text-xs">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-ink-title">{m.autor}</span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${ROL_CLS[m.rol]}`}>{ROL_LABEL[m.rol]}</span>
              <span className="text-[10px] text-ink-muted">{m.hora}</span>
            </div>
            <p className="text-ink-body leading-relaxed mt-0.5">{m.texto}</p>
          </li>
        ))}
      </ul>
      {puedeComentar && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            enviar();
          }}
          className="flex items-center gap-2 pt-1"
        >
          <input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            maxLength={400}
            placeholder="Escribe un comentario para el equipo…"
            className="flex-1 text-xs px-3 py-2 rounded-lg border border-ink-border focus:outline-none focus:border-accent"
          />
          <button type="submit" disabled={!texto.trim()} aria-label="Enviar comentario" className="p-2 rounded-lg bg-accent text-white disabled:opacity-40">
            <Send className="w-4 h-4" />
          </button>
        </form>
      )}
    </div>
  );
}

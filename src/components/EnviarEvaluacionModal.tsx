"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { TIPOS_EVALUACION, type TipoEvaluacion } from "@/lib/demo/postulaciones";

export type ConfigEvaluacion = { tipo: TipoEvaluacion; plazoDias: number; mensaje: string };

// El AT envía la evaluación previa a una o varias postulaciones a la vez.
export default function EnviarEvaluacionModal({
  destinatarios,
  onEnviar,
  onCerrar,
}: {
  destinatarios: string[];
  onEnviar: (cfg: ConfigEvaluacion) => void;
  onCerrar: () => void;
}) {
  const [tipo, setTipo] = useState<TipoEvaluacion>("tecnica");
  const [plazoDias, setPlazoDias] = useState(3);
  const [mensaje, setMensaje] = useState(TIPOS_EVALUACION.tecnica.mensaje);
  return (
    <div className="fixed inset-0 z-[80] bg-black/40 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Enviar evaluación previa">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-black text-ink-title">Enviar evaluación previa</h2>
            <p className="text-xs text-ink-muted mt-0.5">
              A {destinatarios.length} {destinatarios.length === 1 ? "postulación" : "postulaciones"}: {destinatarios.slice(0, 3).join(", ")}
              {destinatarios.length > 3 ? ` y ${destinatarios.length - 3} más` : ""}.
            </p>
          </div>
          <button type="button" onClick={onCerrar} aria-label="Cerrar" className="p-1 rounded hover:bg-surface-subtle">
            <X className="w-4 h-4" />
          </button>
        </div>
        <label className="block text-xs font-bold text-ink-title">
          Tipo de evaluación
          <select
            value={tipo}
            onChange={(e) => {
              const t = e.target.value as TipoEvaluacion;
              setTipo(t);
              setMensaje(TIPOS_EVALUACION[t].mensaje);
            }}
            className="mt-1 w-full text-sm font-normal px-3 py-2 rounded-lg border border-ink-border"
          >
            {Object.entries(TIPOS_EVALUACION).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs font-bold text-ink-title">
          Plazo para entregarla
          <select value={plazoDias} onChange={(e) => setPlazoDias(Number(e.target.value))} className="mt-1 w-full text-sm font-normal px-3 py-2 rounded-lg border border-ink-border">
            {[2, 3, 5, 7].map((d) => (
              <option key={d} value={d}>
                {d} días hábiles
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs font-bold text-ink-title">
          Mensaje para la persona candidata
          <textarea value={mensaje} onChange={(e) => setMensaje(e.target.value.slice(0, 500))} rows={4} className="mt-1 w-full text-sm font-normal px-3 py-2 rounded-lg border border-ink-border" />
        </label>
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onCerrar} className="text-xs font-bold px-4 py-2 rounded-xl border border-ink-border">
            Cancelar
          </button>
          <button type="button" onClick={() => onEnviar({ tipo, plazoDias, mensaje })} className="text-xs font-bold px-4 py-2 rounded-xl bg-accent text-white active:scale-95">
            Enviar
          </button>
        </div>
      </div>
    </div>
  );
}

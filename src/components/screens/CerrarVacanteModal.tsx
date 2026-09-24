"use client";

import { useState } from "react";
import { X } from "lucide-react";

export type MotivoCierre = "contratado" | "cancelada" | "sin_candidatos" | "presupuesto";

const MOTIVOS: { value: MotivoCierre; label: string }[] = [
  { value: "contratado", label: "Se contrató a una persona" },
  { value: "cancelada", label: "Se canceló la posición" },
  { value: "sin_candidatos", label: "No hubo candidatos adecuados" },
  { value: "presupuesto", label: "Falta de presupuesto" },
];

// Cierre de vacante: motivo obligatorio y, si se contrató, quién fue (una de las personas finalistas).
export default function CerrarVacanteModal({
  titulo,
  permiteContratado,
  finalistas,
  error,
  onConfirm,
  onClose,
}: {
  titulo: string;
  permiteContratado: boolean; // solo el BP y solo desde Oferta
  finalistas: { id: string; nombre: string }[];
  error: string | null;
  onConfirm: (motivo: MotivoCierre, applicationId?: string) => Promise<void>;
  onClose: () => void;
}) {
  const opciones = MOTIVOS.filter((m) => permiteContratado || m.value !== "contratado");
  const [motivo, setMotivo] = useState<MotivoCierre>(permiteContratado ? "contratado" : "cancelada");
  const [app, setApp] = useState(finalistas[0]?.id ?? "");
  const [busy, setBusy] = useState(false);
  const [local, setLocal] = useState<string | null>(null);

  async function confirmar() {
    if (motivo === "contratado" && !app) return setLocal("No hay finalistas registrados: elige otro motivo o vuelve a Selección.");
    setBusy(true);
    setLocal(null);
    try {
      await onConfirm(motivo, motivo === "contratado" ? app : undefined);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" role="dialog" aria-modal="true" aria-label="Cerrar vacante">
      <div className="bg-white rounded-2xl p-5 max-w-sm w-full shadow-xl border border-ink-border space-y-4">
        <div className="flex items-start justify-between gap-2 pb-2 border-b border-ink-border">
          <div>
            <h3 className="text-sm font-bold text-ink-title">Cerrar vacante</h3>
            <p className="text-xs text-ink-muted mt-0.5">{titulo}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar ventana" className="text-ink-muted hover:text-ink-title">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div>
          <label htmlFor="cierre-motivo" className="block text-xs font-bold text-ink-title mb-1">Motivo</label>
          <select
            id="cierre-motivo"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value as MotivoCierre)}
            className="w-full px-3 py-2 text-xs bg-surface-canvas rounded-lg border border-ink-border focus:outline-none focus:border-primary"
          >
            {opciones.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>

        {motivo === "contratado" && (
          <div>
            <label htmlFor="cierre-persona" className="block text-xs font-bold text-ink-title mb-1">Persona contratada</label>
            {finalistas.length ? (
              <select
                id="cierre-persona"
                value={app}
                onChange={(e) => setApp(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-surface-canvas rounded-lg border border-ink-border focus:outline-none focus:border-primary"
              >
                {finalistas.map((f) => (
                  <option key={f.id} value={f.id}>{f.nombre}</option>
                ))}
              </select>
            ) : (
              <p className="text-xs text-ink-muted">No hay finalistas registrados.</p>
            )}
          </div>
        )}

        {(error || local) && (
          <div role="alert" className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">{local ?? error}</div>
        )}

        <p className="text-[11px] text-ink-muted">Al cerrar, la vacante deja de aparecer en los tableros y ya no admite cambios.</p>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-ink-border">
          <button type="button" onClick={onClose} className="px-3 py-2 text-xs font-semibold text-ink-muted">Volver</button>
          <button
            type="button"
            onClick={confirmar}
            disabled={busy}
            className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white rounded-lg"
          >
            {busy ? "Cerrando…" : "Cerrar vacante"}
          </button>
        </div>
      </div>
    </div>
  );
}

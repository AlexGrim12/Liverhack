"use client";

import { useState } from "react";
import { CheckCircle, CornerUpLeft, ShieldCheck } from "lucide-react";

export type RequisicionPorValidar = {
  id: string;
  titulo: string;
  area: string;
  categoria: string;
  hm: string;
  solicitante: string;
  nivelLabel: string;
  stack: string[];
  competencias: string[];
  expMinima: number;
  cert: string;
  estudios: string;
  habilidades: string;
  banda: string;
  revalidacion: boolean;
  atActual: string | null;
};

export default function HrbpValidar({
  items,
  ats,
  resultado,
  error,
  onAprobar,
  onDevolver,
}: {
  items: RequisicionPorValidar[];
  ats: string[];
  resultado: string | null;
  error?: string | null;
  onAprobar: (id: string, at: string) => void;
  onDevolver: (id: string, comentarios: string) => void;
}) {
  const [atSel, setAtSel] = useState<Record<string, string>>({});
  const [comentarios, setComentarios] = useState<Record<string, string>>({});
  const [errores, setErrores] = useState<Record<string, string>>({});

  function aprobar(r: RequisicionPorValidar) {
    const at = atSel[r.id] || r.atActual || "";
    if (!at) {
      setErrores((e) => ({ ...e, [r.id]: "Asigna un reclutador (AT) para aprobar." }));
      return;
    }
    setErrores((e) => ({ ...e, [r.id]: "" }));
    onAprobar(r.id, at);
  }
  function devolver(r: RequisicionPorValidar) {
    const c = (comentarios[r.id] || "").trim();
    if (!c) {
      setErrores((e) => ({ ...e, [r.id]: "Escribe un comentario para que el HM sepa qué ajustar." }));
      return;
    }
    setErrores((e) => ({ ...e, [r.id]: "" }));
    onDevolver(r.id, c);
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4 pb-12">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-ink-title">Por validar</h1>
        <p className="text-xs text-ink-muted mt-0.5">
          Validas lo que necesita el Hiring Manager: viabilidad y banda salarial. No editas su contenido.
        </p>
      </div>

      {resultado && (
        <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{resultado}</span>
        </div>
      )}

      {error && (
        <div role="alert" className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
          {error}
        </div>
      )}

      {items.length === 0 ? (
        <div className="bg-white border border-ink-border rounded-2xl p-8 text-center text-sm text-ink-muted">
          <ShieldCheck className="w-8 h-8 mx-auto mb-2 text-ink-subtle" />
          No hay requisiciones pendientes de validar.
        </div>
      ) : (
        items.map((r) => (
          <div key={r.id} className="bg-white border border-ink-border rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold text-primary bg-primary-tint px-2.5 py-0.5 rounded-md">{r.area}</span>
                  {r.revalidacion && (
                    <span className="text-[10px] font-bold text-accent-dark bg-accent-tint border border-accent-border px-2 py-0.5 rounded-full">
                      Revalidación · el HM cambió algo
                    </span>
                  )}
                </div>
                <h2 className="text-base font-bold text-ink-title leading-snug">{r.titulo}</h2>
                <p className="text-xs text-ink-muted mt-0.5">
                  Solicita: <b className="text-ink-title font-medium">{r.hm}</b> · Seguimiento: {r.solicitante} · Nivel {r.nivelLabel}
                </p>
              </div>
            </div>

            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs">
              <div><dt className="text-ink-muted">Banda salarial</dt><dd className="font-semibold text-ink-title">{r.banda}</dd></div>
              <div><dt className="text-ink-muted">Experiencia mínima</dt><dd className="font-semibold text-ink-title">{r.expMinima} años</dd></div>
              <div><dt className="text-ink-muted">Estudios indispensables</dt><dd className="font-semibold text-ink-title">{r.estudios}</dd></div>
              <div><dt className="text-ink-muted">Certificación deseable</dt><dd className="font-semibold text-ink-title">{r.cert || "—"}</dd></div>
              <div className="sm:col-span-2"><dt className="text-ink-muted">Habilidades clave</dt><dd className="font-semibold text-ink-title">{r.habilidades || "—"}</dd></div>
              <div>
                <dt className="text-ink-muted mb-1">Herramientas</dt>
                <dd className="flex flex-wrap gap-1">
                  {r.stack.length ? r.stack.map((s) => <span key={s} className="bg-surface-canvas border border-ink-border px-2 py-0.5 rounded">{s}</span>) : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-ink-muted mb-1">Competencias a evaluar</dt>
                <dd className="flex flex-wrap gap-1">
                  {r.competencias.length ? r.competencias.map((c) => <span key={c} className="bg-accent-tint text-accent-dark px-2 py-0.5 rounded">{c}</span>) : "—"}
                </dd>
              </div>
            </dl>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-ink-border">
              <div>
                <label className="block text-xs font-bold text-ink-title mb-1" htmlFor={`at-${r.id}`}>Reclutador (AT) que la atenderá</label>
                <select
                  id={`at-${r.id}`}
                  value={atSel[r.id] ?? r.atActual ?? ""}
                  onChange={(e) => setAtSel((m) => ({ ...m, [r.id]: e.target.value }))}
                  className="w-full px-3 py-2 text-xs bg-surface-canvas rounded-xl border border-ink-border focus:outline-none focus:border-primary"
                >
                  <option value="">Selecciona…</option>
                  {ats.map((a) => <option key={a}>{a}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-ink-title mb-1" htmlFor={`c-${r.id}`}>Comentarios (obligatorios si la devuelves)</label>
                <textarea
                  id={`c-${r.id}`}
                  rows={2}
                  value={comentarios[r.id] ?? ""}
                  onChange={(e) => setComentarios((m) => ({ ...m, [r.id]: e.target.value }))}
                  placeholder="Ej. La banda salarial rebasa el presupuesto del área."
                  className="w-full px-3 py-2 text-xs bg-surface-canvas rounded-xl border border-ink-border focus:outline-none focus:border-primary resize-y"
                />
              </div>
            </div>

            {errores[r.id] && (
              <div role="alert" className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
                {errores[r.id]}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                onClick={() => aprobar(r)}
                className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm py-2.5 px-5 rounded-xl transition-all active:scale-95"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Aprobar y pasar a Alineación</span>
              </button>
              <button
                type="button"
                onClick={() => devolver(r)}
                className="inline-flex items-center justify-center gap-2 bg-white hover:bg-amber-50 text-amber-800 border border-amber-300 font-bold text-xs sm:text-sm py-2.5 px-4 rounded-xl transition-all"
              >
                <CornerUpLeft className="w-4 h-4" />
                <span>Devolver con comentarios</span>
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

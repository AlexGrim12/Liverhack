"use client";

import { useState } from "react";

import { ArrowLeft, CheckCircle2 } from "lucide-react";

type CompareCandidato = {
  id: string;
  nombre: string;
  iniciales: string;
  compat: number;
  compatBg: string;
  compatColor: string;
};

type CompareRow = {
  label: string;
  values: string[];
};

export default function AtComparar({
  candidatos,
  rows,
  onNavAtCandidatos,
  onExportSheets,
}: {
  candidatos: CompareCandidato[];
  rows: CompareRow[];
  onNavAtCandidatos: () => void;
  onExportSheets?: () => Promise<string>; // con Supabase: exporta a Google Sheets
}) {
  const [sheetMsg, setSheetMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [exporting, setExporting] = useState(false);
  async function exportar() {
    if (!onExportSheets) return;
    setExporting(true);
    setSheetMsg(null);
    try {
      setSheetMsg({ ok: true, text: await onExportSheets() });
    } catch (e) {
      setSheetMsg({ ok: false, text: e instanceof Error ? e.message : "No se pudo exportar." });
    } finally {
      setExporting(false);
    }
  }
  return (
    <div className="space-y-4 max-w-4xl mx-auto pb-12">
      {/* Back button */}
      <div>
        <button
          type="button"
          onClick={onNavAtCandidatos}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-primary hover:text-primary-dark transition-colors py-1"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver a candidatos</span>
        </button>
      </div>

      {/* Header */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-ink-border shadow-xs">
        <h1 className="text-lg sm:text-xl font-black text-ink-title">
          Comparativa de Candidatos
        </h1>
        <p className="text-xs text-ink-muted mt-0.5">
          Comparando {candidatos.length} perfiles seleccionados
        </p>
        {onExportSheets && (
          <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-2">
            <button
              type="button"
              onClick={exportar}
              disabled={exporting}
              className="inline-flex items-center justify-center gap-1.5 bg-white hover:bg-surface-canvas border border-ink-border text-ink-title text-xs font-bold px-3 py-2 rounded-lg disabled:opacity-60"
            >
              <span>{exporting ? "Exportando…" : "Exportar a Google Sheets"}</span>
            </button>
            {sheetMsg && (
              <span role={sheetMsg.ok ? "status" : "alert"} className={`text-xs font-semibold ${sheetMsg.ok ? "text-emerald-700" : "text-rose-700"}`}>
                {sheetMsg.text}
              </span>
            )}
          </div>
        )}

        {/* Candidate Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mt-4">
          {candidatos.map((c, i) => (
            <div
              key={c.id}
              className={`p-3 rounded-xl border bg-surface-canvas ${
                i === 0 ? "border-primary-border bg-primary-tint/30" : "border-ink-border"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="w-7 h-7 rounded-lg bg-primary-tint text-primary font-bold text-xs flex items-center justify-center">
                  {c.iniciales}
                </div>
                <span
                  className="px-2 py-0.5 rounded-md font-bold text-xs"
                  style={{ background: c.compatBg, color: c.compatColor }}
                >
                  {c.compat}%
                </span>
              </div>
              <div className="text-xs font-bold text-ink-title truncate">{c.nombre}</div>
              {i === 0 && (
                <div className="text-[10px] font-bold text-accent flex items-center gap-1 mt-0.5">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Mayor afinidad</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Comparison Rows */}
      <div className="bg-white border border-ink-border rounded-2xl overflow-hidden shadow-xs divide-y divide-ink-border">
        {rows.map((row) => {
          const isAttr = row.label.toLowerCase().includes("atributos");
          const isCompat = row.label.toLowerCase().includes("compatibilidad");

          return (
            <div key={row.label} className="p-4 space-y-2">
              <div className="text-[11px] font-bold text-ink-muted uppercase tracking-wider">
                {row.label}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {row.values.map((val, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-surface-canvas text-xs">
                    <div className="text-[10px] font-bold text-ink-muted mb-1 truncate">
                      {candidatos[idx]?.nombre.split(" ")[0]}
                    </div>
                    {isAttr ? (
                      <div className="flex flex-wrap gap-1">
                        {val.split(", ").map((t) => (
                          <span
                            key={t}
                            className="text-[10px] font-medium bg-accent-tint text-accent-dark px-1.5 py-0.5 rounded"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    ) : isCompat ? (
                      <span className="font-extrabold text-primary-dark text-sm">
                        {val}
                      </span>
                    ) : (
                      <span className="font-medium text-ink-title text-xs leading-snug">
                        {val}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

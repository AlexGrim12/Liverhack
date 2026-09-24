"use client";

import { ArrowLeft, GitCompare, Check, Eye, UserPlus, Sparkles } from "lucide-react";

type FiltroOption = { label: string; checkedBg: string; onClick: () => void };

type FilteredCandidato = {
  id: string;
  nombre: string;
  escolaridad: string;
  compat: number;
  estatus: string;
  iniciales: string;
  compatBg: string;
  compatColor: string;
  estatusBg: string;
  estatusColor: string;
  checkedBg: string;
  atributosIA?: string[];
  onToggle: () => void;
  onVerPerfil: () => void;
};

export default function AtCandidatos({
  vacanteTitulo,
  vacanteArea,
  candidatos,
  escolaridadFiltro,
  estatusFiltro,
  compatMin,
  onCompatMinChange,
  compareCount,
  compareCursor,
  compareBg,
  compareColor,
  onComparar,
  onNavAtDashboard,
  onNuevoCandidato,
  onCompatIA,
  mensaje,
}: {
  vacanteTitulo: string;
  vacanteArea: string;
  candidatos: FilteredCandidato[];
  escolaridadFiltro: FiltroOption[];
  estatusFiltro: FiltroOption[];
  compatMin: number;
  onCompatMinChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  compareCount: number;
  compareCursor: string;
  compareBg: string;
  compareColor: string;
  onComparar: () => void;
  onNavAtDashboard: () => void;
  onNuevoCandidato?: () => void; // solo con la vacante entre Búsqueda y Oferta
  onCompatIA?: () => void; // compatibilidad con IA (CVs vs. proyecto de GitHub)
  mensaje?: { ok: boolean; text: string } | null;
}) {
  const canCompare = compareCount >= 2;

  return (
    <div className="space-y-4 max-w-4xl mx-auto pb-20">
      {/* Back button */}
      <div>
        <button
          type="button"
          onClick={onNavAtDashboard}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-primary hover:text-primary-dark transition-colors py-1"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver a vacantes</span>
        </button>
      </div>

      {/* Vacancy Title */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-ink-border shadow-xs">
        <span className="text-[10px] font-bold text-primary bg-primary-tint px-2.5 py-0.5 rounded-md">
          {vacanteArea}
        </span>
        <h1 className="text-lg sm:text-xl font-black text-ink-title mt-1.5">
          {vacanteTitulo}
        </h1>
        <p className="text-xs text-ink-muted mt-0.5">
          {candidatos.length} candidatos en proceso · Selecciona 2 para comparar
        </p>
        {onCompatIA && (
          <button
            type="button"
            onClick={onCompatIA}
            className="mt-3 mr-2 inline-flex items-center gap-1.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all active:scale-95"
          >
            <Sparkles className="w-4 h-4" />
            <span>Analizar compatibilidad con IA</span>
          </button>
        )}
        {onNuevoCandidato && (
          <button
            type="button"
            onClick={onNuevoCandidato}
            className="mt-3 inline-flex items-center gap-1.5 bg-accent hover:bg-accent-hover text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all active:scale-95"
          >
            <UserPlus className="w-4 h-4" />
            <span>Agregar candidato</span>
          </button>
        )}
        {mensaje && (
          <div
            role={mensaje.ok ? "status" : "alert"}
            className={`mt-3 text-xs font-semibold rounded-lg px-3 py-2 border ${mensaje.ok ? "text-emerald-700 bg-emerald-50 border-emerald-200" : "text-rose-700 bg-rose-50 border-rose-200"}`}
          >
            {mensaje.text}
          </div>
        )}

        {/* Simple Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-3 mt-3 border-t border-ink-border/60">
          <span className="text-[11px] font-bold text-ink-muted shrink-0 mr-1">Filtrar:</span>
          {escolaridadFiltro.map((e) => {
            const checked = e.checkedBg !== "transparent";
            return (
              <button
                type="button"
                key={e.label}
                onClick={e.onClick}
                className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition-all whitespace-nowrap ${
                  checked
                    ? "bg-primary text-white border-primary"
                    : "bg-surface-canvas text-ink-body border-ink-border hover:border-primary-border"
                }`}
              >
                {e.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Candidates List */}
      <div className="space-y-3">
        {candidatos.length === 0 && (
          <div className="bg-white border border-ink-border rounded-2xl p-8 text-center text-sm text-ink-muted">
            Aún no hay candidatos con estos filtros.{onNuevoCandidato ? " Agrega el primero con el botón de arriba." : ""}
          </div>
        )}
        {candidatos.map((c) => {
          const isChecked = c.checkedBg !== "transparent";

          return (
            <div
              key={c.id}
              className={`bg-white border rounded-2xl p-4 transition-all shadow-xs ${
                isChecked
                  ? "border-primary-border bg-primary-tint/20 ring-1 ring-primary/20"
                  : "border-ink-border hover:border-primary-border/60"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                {/* Checkbox + Info */}
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <button
                    type="button"
                    onClick={c.onToggle}
                    className={`w-5 h-5 rounded-md border mt-0.5 flex items-center justify-center transition-colors shrink-0 ${
                      isChecked
                        ? "bg-primary border-primary text-white"
                        : "border-ink-border hover:border-primary bg-white"
                    }`}
                    title="Comparar"
                  >
                    {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </button>

                  <div className="w-10 h-10 rounded-xl bg-primary-tint text-primary font-bold text-xs flex items-center justify-center shrink-0">
                    {c.iniciales}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h2 className="text-sm font-bold text-ink-title">
                      {c.nombre}
                    </h2>
                    <p className="text-xs text-ink-muted truncate">
                      {c.escolaridad}
                    </p>

                    {/* AI tags */}
                    {c.atributosIA && c.atributosIA.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {c.atributosIA.slice(0, 2).map((a) => (
                          <span
                            key={a}
                            className="text-[10px] font-semibold bg-accent-tint text-accent-dark px-2 py-0.5 rounded-md"
                          >
                            {a}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Compatibility Badge */}
                <div
                  className="px-2.5 py-1 rounded-xl font-black text-xs text-center shrink-0 shadow-2xs"
                  style={{ background: c.compatBg, color: c.compatColor }}
                >
                  <div>{c.compat}%</div>
                  <div className="text-[7px] uppercase font-bold opacity-80 leading-none">
                    Match
                  </div>
                </div>
              </div>

              {/* Bottom: Status & Action */}
              <div className="flex items-center justify-between pt-3 mt-3 border-t border-ink-border/60">
                <span
                  className="text-[11px] font-bold px-2.5 py-0.5 rounded-full"
                  style={{ background: c.estatusBg, color: c.estatusColor }}
                >
                  {c.estatus}
                </span>

                <button
                  type="button"
                  onClick={c.onVerPerfil}
                  className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:text-primary-dark hover:bg-primary-tint px-3 py-1.5 rounded-lg border border-primary-border/60 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Ver perfil</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Bottom Compare Bar */}
      {compareCount > 0 && (
        <div className="fixed bottom-4 left-0 right-0 p-3 flex justify-center z-30 pointer-events-none">
          <button
            type="button"
            onClick={onComparar}
            disabled={!canCompare}
            className={`pointer-events-auto inline-flex items-center gap-2 text-xs sm:text-sm font-bold px-6 py-3 rounded-2xl shadow-lg transition-all active:scale-95 ${
              canCompare
                ? "bg-primary hover:bg-primary-hover text-white cursor-pointer shadow-pink-glow"
                : "bg-surface-subtle text-ink-muted border border-ink-border cursor-not-allowed"
            }`}
          >
            <GitCompare className="w-4 h-4" />
            <span>
              {canCompare
                ? `Comparar seleccionados (${compareCount})`
                : `Selecciona 1 más para comparar (${compareCount}/2)`}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}

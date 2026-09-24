"use client";

import { useState } from "react";
import { Plus, ChevronRight, Search, ShieldCheck } from "lucide-react";

export type BuiltVacante = {
  id: string;
  titulo: string;
  area: string;
  responsable: string;
  responsableIniciales: string;
  etapaLabel: string;
  slaColor: string;
  candidatosLabel: string;
  etapas: { label: string; color: string }[];
  // Estado de la validación del BP (solo mientras la requisición está en revisión)
  bpBadge?: { label: string; tone: "amber" | "rose" | "accent" };
  bpComentarios?: string;
  // Cambios de etapa que el rol puede ejecutar sobre esta vacante (la base valida las reglas)
  acciones?: { key: string; label: string; tone: "primary" | "neutral" | "danger"; onClick: () => void }[];
  onClick: () => void;
};

type Urgencia = "riesgo" | "atencion" | "tiempo";
const RANGO: Record<Urgencia, number> = { riesgo: 0, atencion: 1, tiempo: 2 };
const URG_UI: { key: Urgencia; label: string; hint: string; dot: string; on: string; off: string }[] = [
  { key: "riesgo", label: "Riesgo", hint: "fuera de tiempo", dot: "bg-rose-500", on: "border-rose-500 bg-rose-50 text-rose-800", off: "border-ink-border bg-white text-ink-title hover:border-rose-300" },
  { key: "atencion", label: "Atención", hint: "por vencer", dot: "bg-amber-500", on: "border-amber-500 bg-amber-50 text-amber-800", off: "border-ink-border bg-white text-ink-title hover:border-amber-300" },
  { key: "tiempo", label: "En tiempo", hint: "sin retraso", dot: "bg-emerald-500", on: "border-emerald-500 bg-emerald-50 text-emerald-800", off: "border-ink-border bg-white text-ink-title hover:border-emerald-300" },
];

const BADGE_TONES = {
  amber: "text-amber-800 bg-amber-50 border-amber-200",
  rose: "text-rose-700 bg-rose-50 border-rose-200",
  accent: "text-accent-dark bg-accent-tint border-accent-border",
};

export default function Dashboard({
  title,
  subtitle,
  isHrbp,
  isHm,
  urgencia = false,
  entrevistaPendiente,
  mensaje,
  accionesBloqueadas,
  vacantes,
  porValidarCount,
  onNavNueva,
  onNavValidar,
  onNavHmEntrevista,
}: {
  title: string;
  subtitle: string;
  isHrbp: boolean;
  isHm: boolean;
  urgencia?: boolean; // AT, HM y HRBP: tablero por urgencia (Riesgo / Atención / En tiempo)
  entrevistaPendiente: { candidato: string; compat: number; detalle: string; etiqueta: string } | null;
  mensaje?: { ok: boolean; text: string } | null;
  accionesBloqueadas?: boolean;
  vacantes: BuiltVacante[];
  porValidarCount: number;
  onNavNueva: () => void;
  onNavValidar: () => void;
  onNavHmEntrevista: () => void;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroUrg, setFiltroUrg] = useState<Urgencia | null>(null);

  const urgDe = (color: string): Urgencia => (color === "#1E8E3E" ? "tiempo" : color.toLowerCase().includes("f9") || color.toLowerCase().includes("yellow") ? "atencion" : "riesgo");
  const conteo: Record<Urgencia, number> = { riesgo: 0, atencion: 0, tiempo: 0 };
  vacantes.forEach((v) => (conteo[urgDe(v.slaColor)] += 1));

  // Con el tablero de urgencia, lo más urgente va primero (Riesgo → Atención → En tiempo)
  const filteredVacantes = vacantes
    .filter((v) => {
      const q = searchTerm.toLowerCase();
      return (
        (v.titulo.toLowerCase().includes(q) || v.responsable.toLowerCase().includes(q) || v.area.toLowerCase().includes(q)) &&
        (!urgencia || !filtroUrg || urgDe(v.slaColor) === filtroUrg)
      );
    })
    .sort((a, b) => (urgencia ? RANGO[urgDe(a.slaColor)] - RANGO[urgDe(b.slaColor)] : 0));

  const getSlaIndicator = (color: string) => {
    if (color === "#1E8E3E") {
      return { label: "En tiempo", dot: "bg-emerald-500", text: "text-emerald-700 bg-emerald-50" };
    }
    if (color.toLowerCase().includes("f9") || color.toLowerCase().includes("yellow")) {
      return { label: "Atención", dot: "bg-amber-500", text: "text-amber-700 bg-amber-50" };
    }
    return { label: "Riesgo", dot: "bg-rose-500", text: "text-rose-700 bg-rose-50" };
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-ink-title">
            {title}
          </h1>
          <p className="text-xs text-ink-muted">{subtitle}</p>
        </div>

        {isHm && (
          <button
            type="button"
            onClick={onNavNueva}
            className="inline-flex items-center gap-1.5 bg-primary hover:bg-primary-hover text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all shadow-xs active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Nueva requisición</span>
          </button>
        )}
      </div>

      {mensaje && (
        <div
          role={mensaje.ok ? "status" : "alert"}
          className={`text-xs font-semibold rounded-xl px-3 py-2 border ${mensaje.ok ? "text-emerald-700 bg-emerald-50 border-emerald-200" : "text-rose-700 bg-rose-50 border-rose-200"}`}
        >
          {mensaje.text}
        </div>
      )}

      {/* BP: requisiciones del HM por validar */}
      {isHrbp && porValidarCount > 0 && (
        <div className="bg-white border border-accent-border rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent-tint text-accent-dark flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-ink-title">
                {porValidarCount} {porValidarCount === 1 ? "requisición espera" : "requisiciones esperan"} tu validación
              </div>
              <p className="text-xs text-ink-muted">Valida lo que necesita el Hiring Manager y asigna al reclutador.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onNavValidar}
            className="inline-flex items-center justify-center gap-1 bg-accent hover:bg-accent-hover text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all active:scale-95 shrink-0"
          >
            <span>Ir a validar</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* HM: Entrevista Pendiente */}
      {isHm && entrevistaPendiente && (
        <div className="bg-white border border-primary-border rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-tint text-primary font-black text-xs flex items-center justify-center shrink-0">
              {entrevistaPendiente.candidato.split(" ").slice(0, 2).map((w) => w[0]).join("")}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-ink-title">
                  {entrevistaPendiente.candidato}
                </span>
                <span className="text-[10px] font-bold bg-accent-tint text-accent-dark px-2 py-0.5 rounded-full border border-accent-border/60">
                  {entrevistaPendiente.compat}% Match
                </span>
              </div>
              <p className="text-xs text-ink-muted">
                {entrevistaPendiente.detalle}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onNavHmEntrevista}
            className="inline-flex items-center justify-center gap-1 bg-accent hover:bg-accent-hover text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all active:scale-95 shrink-0"
          >
            <span>{entrevistaPendiente.etiqueta}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {urgencia && (
        <div className="grid grid-cols-3 gap-2 sm:gap-3" role="group" aria-label="Filtrar vacantes por urgencia">
          {URG_UI.map((u) => {
            const activo = filtroUrg === u.key;
            return (
              <button
                key={u.key}
                type="button"
                aria-pressed={activo}
                onClick={() => setFiltroUrg(activo ? null : u.key)}
                className={`text-left rounded-2xl border px-3 py-3 shadow-xs transition-all active:scale-95 ${activo ? u.on : u.off}`}
              >
                <div className="flex items-center gap-1.5 text-[11px] font-bold">
                  <span className={`w-2 h-2 rounded-full ${u.dot}`} /> {u.label}
                </div>
                <div className="text-2xl font-black leading-none mt-1.5">{conteo[u.key]}</div>
                <div className="text-[10px] text-ink-muted mt-1">{u.hint}</div>
              </button>
            );
          })}
        </div>
      )}

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />
        <input
          type="text"
          placeholder="Buscar vacante o responsable…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm bg-white rounded-xl border border-ink-border focus:border-primary focus:outline-none transition-all"
        />
      </div>

      {/* Vacancy Cards List */}
      <div className="space-y-3">
        {filteredVacantes.length === 0 && (
          <div className="bg-white border border-ink-border rounded-2xl p-6 text-center text-xs text-ink-muted">No hay vacantes en esta categoría.</div>
        )}
        {filteredVacantes.map((v) => {
          const sla = getSlaIndicator(v.slaColor);
          return (
            <div
              key={v.id}
              onClick={v.onClick}
              className="bg-white border border-ink-border hover:border-primary-border/80 rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-card transition-all cursor-pointer active:scale-99"
            >
              {/* Top row: Area & SLA */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[10px] font-bold text-primary bg-primary-tint px-2.5 py-0.5 rounded-md">
                  {v.area}
                </span>

                <div className="flex items-center gap-1.5">
                  {v.bpBadge && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${BADGE_TONES[v.bpBadge.tone]}`}>
                      {v.bpBadge.label}
                    </span>
                  )}
                  <div className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full ${sla.text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${sla.dot}`} />
                    <span>{sla.label}</span>
                  </div>
                </div>
              </div>

              {/* Title */}
              <h2 className="text-base font-bold text-ink-title leading-snug mb-2">
                {v.titulo}
              </h2>

              {v.bpComentarios && (
                <p className="text-xs text-amber-900 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5 mb-3 italic">
                  BP: “{v.bpComentarios}”
                </p>
              )}

              {/* Responsable & Candidates */}
              <div className="flex items-center justify-between text-xs text-ink-muted mb-3">
                <span>Responsable: <b className="text-ink-title font-medium">{v.responsable}</b></span>
                <span className="font-semibold text-primary">{v.candidatosLabel}</span>
              </div>

              {v.acciones && v.acciones.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {v.acciones.map((a) => (
                    <button
                      key={a.key}
                      type="button"
                      disabled={accionesBloqueadas}
                      onClick={(e) => {
                        e.stopPropagation();
                        a.onClick();
                      }}
                      className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all active:scale-95 disabled:opacity-60 ${
                        a.tone === "primary"
                          ? "bg-accent hover:bg-accent-hover text-white border-accent"
                          : a.tone === "danger"
                          ? "bg-white hover:bg-rose-50 text-rose-700 border-rose-200"
                          : "bg-white hover:bg-surface-canvas text-ink-title border-ink-border"
                      }`}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Stage Progress Segment */}
              <div className="space-y-1.5">
                <div className="flex gap-1.5">
                  {v.etapas.map((etapa, i) => {
                    const isPastOrCurrent = etapa.color === "#E10098";
                    return (
                      <div
                        key={i}
                        className={`flex-1 h-1.5 rounded-full ${
                          isPastOrCurrent ? "bg-accent" : "bg-ink-border"
                        }`}
                        title={etapa.label}
                      />
                    );
                  })}
                </div>
                <div className="flex items-center justify-between text-xs pt-0.5">
                  <span className="font-extrabold text-primary-dark">
                    Etapa actual: {v.etapaLabel}
                  </span>
                  <span className="text-ink-muted flex items-center gap-0.5 font-medium">
                    <span>Ver detalle</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

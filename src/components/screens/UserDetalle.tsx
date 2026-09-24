"use client";

import { ArrowLeft, Calendar, Video, Clock } from "lucide-react";

type ProximaEntrevista = {
  fecha: string;
  candidato: string;
  entrevistadores: string;
} | null;

type HistorialItem = {
  fecha: string;
  candidato: string;
  estatus: string;
};

export default function UserDetalle({
  titulo,
  area,
  etapas,
  etapaLabel,
  slaColor,
  proximaEntrevista,
  historial,
  onNavUserDashboard,
}: {
  titulo: string;
  area: string;
  etapas: { label: string; color: string }[];
  etapaLabel: string;
  slaColor: string;
  proximaEntrevista: ProximaEntrevista;
  historial: HistorialItem[];
  onNavUserDashboard: () => void;
}) {
  const sla =
    slaColor === "#1E8E3E"
      ? { label: "en tiempo", text: "text-emerald-700 bg-emerald-50" }
      : slaColor === "#D93025"
      ? { label: "en riesgo", text: "text-rose-700 bg-rose-50" }
      : { label: "requieren atención", text: "text-amber-700 bg-amber-50" };

  return (
    <div className="space-y-4 max-w-2xl mx-auto pb-12">
      {/* Back button */}
      <div>
        <button
          type="button"
          onClick={onNavUserDashboard}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-primary hover:text-primary-dark transition-colors py-1"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver a vacantes</span>
        </button>
      </div>

      {/* Header */}
      <div className="bg-white border border-ink-border rounded-2xl p-5 shadow-xs">
        <span className="text-[10px] font-bold text-primary bg-primary-tint px-2.5 py-0.5 rounded-md">
          {area}
        </span>
        <h1 className="text-lg sm:text-xl font-black text-ink-title mt-1.5">
          {titulo}
        </h1>
      </div>

      {/* Status Card */}
      <div className="bg-white border border-ink-border rounded-2xl p-5 shadow-xs space-y-3">
        <h2 className="text-xs font-bold text-ink-muted uppercase tracking-wider">
          Avance del Proceso
        </h2>

        <div className="space-y-1.5">
          <div className="flex gap-1.5">
            {etapas.map((etapa, i) => {
              const isPastOrCurrent = etapa.color === "#E10098";
              return (
                <div
                  key={i}
                  className={`flex-1 h-2 rounded-full ${
                    isPastOrCurrent ? "bg-accent" : "bg-ink-border"
                  }`}
                  title={etapa.label}
                />
              );
            })}
          </div>
          <div className="flex items-center justify-between text-xs pt-1">
            <span className="font-extrabold text-primary-dark">
              Etapa actual: {etapaLabel}
            </span>
            <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full ${sla.text}`}>
              <Clock className="w-3.5 h-3.5" />
              <span>Tiempos: {sla.label}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Upcoming interview */}
      {proximaEntrevista && (
        <div className="bg-white border border-accent-border rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-accent uppercase tracking-wider">
            <Calendar className="w-4 h-4 text-accent" />
            <span>Próxima Entrevista</span>
          </div>

          <div className="text-xs space-y-1">
            <div className="text-sm font-bold text-ink-title">
              {proximaEntrevista.fecha}
            </div>
            <div>
              Candidato: <span className="font-semibold text-ink-title">{proximaEntrevista.candidato}</span>
            </div>
            <div className="text-ink-muted">
              Entrevistadores: {proximaEntrevista.entrevistadores}
            </div>
          </div>

          <button
            type="button"
            className="inline-flex items-center gap-1.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold px-4 py-2 rounded-xl transition-all"
          >
            <Video className="w-3.5 h-3.5 text-white" />
            <span>Unirse con Google Meet</span>
          </button>
        </div>
      )}

      {/* History */}
      <div className="bg-white border border-ink-border rounded-2xl p-5 shadow-xs space-y-3">
        <h3 className="text-xs font-bold text-ink-muted uppercase tracking-wider">
          Historial de Entrevistas
        </h3>

        {historial.length === 0 ? (
          <p className="text-xs text-ink-muted">Aún no hay entrevistas previas registradas.</p>
        ) : (
          <div className="divide-y divide-ink-border text-xs">
            {historial.map((h, i) => (
              <div key={i} className="py-2.5 flex items-center justify-between">
                <div>
                  <span className="font-bold text-ink-title">{h.candidato}</span>
                  <span className="text-ink-muted ml-2">· {h.fecha}</span>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  {h.estatus}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

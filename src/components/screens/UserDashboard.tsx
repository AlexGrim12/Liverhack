"use client";

import { ChevronRight } from "lucide-react";

type UserVacanteVM = {
  id: string;
  titulo: string;
  area: string;
  slaColor: string;
  etapaLabel: string;
  etapas: { label: string; color: string }[];
  onClick: () => void;
};

export default function UserDashboard({ vacantes }: { vacantes: UserVacanteVM[] }) {
  return (
    <div className="space-y-4 max-w-3xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-ink-title">
          Tus Vacantes Solicitadas
        </h1>
        <p className="text-xs text-ink-muted mt-0.5">
          Consulta el avance del proceso de selección de tus posiciones
        </p>
      </div>

      {/* Vacancies */}
      <div className="space-y-3">
        {vacantes.map((v) => (
          <div
            key={v.id}
            onClick={v.onClick}
            className="bg-white border border-ink-border hover:border-primary-border rounded-2xl p-4 sm:p-5 shadow-xs transition-all cursor-pointer active:scale-99"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-primary bg-primary-tint px-2.5 py-0.5 rounded-md">
                {v.area}
              </span>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                En proceso
              </span>
            </div>

            <h2 className="text-base font-bold text-ink-title mb-3">
              {v.titulo}
            </h2>

            {/* Stages */}
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
                  <span>Ver seguimiento</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

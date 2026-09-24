"use client";

import { AlertCircle, ChevronRight, Circle } from "lucide-react";

export type PendienteVM = {
  id: string;
  title: string;
  subtitle: string;
  due: string;
  urgent?: boolean;
  onClick: () => void;
};

export default function Pendientes({ items }: { items: PendienteVM[] }) {
  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-ink-title">Pendientes</h1>
        <p className="text-xs text-ink-muted">
          {items.length === 0
            ? "No tienes pendientes por ahora."
            : `Tienes ${items.length} ${items.length === 1 ? "pendiente" : "pendientes"} por atender.`}
        </p>
      </div>

      {items.length === 0 ? (
        <div className="bg-white border border-ink-border rounded-2xl p-10 text-center">
          <Circle className="w-8 h-8 text-ink-border mx-auto mb-2" />
          <p className="text-sm font-bold text-ink-title">Todo al día</p>
          <p className="text-xs text-ink-muted mt-1">No hay acciones pendientes en este momento.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {items.map((item) => (
            <div
              key={item.id}
              onClick={item.onClick}
              className="bg-white border border-ink-border hover:border-accent-border rounded-2xl p-4 shadow-xs hover:shadow-card transition-all cursor-pointer active:scale-99 flex items-start gap-3.5"
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                  item.urgent ? "bg-rose-50 text-rose-600" : "bg-accent-tint text-accent-dark"
                }`}
              >
                <AlertCircle className="w-4 h-4" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <h2 className="text-sm font-bold text-ink-title truncate">{item.title}</h2>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                      item.urgent
                        ? "bg-rose-50 text-rose-600"
                        : "bg-surface-subtle text-ink-muted"
                    }`}
                  >
                    {item.due}
                  </span>
                </div>
                <p className="text-xs text-ink-muted leading-relaxed">{item.subtitle}</p>
              </div>

              <ChevronRight className="w-4 h-4 text-ink-muted shrink-0 mt-1" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

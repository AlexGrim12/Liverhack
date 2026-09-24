"use client";

import { useState, useRef, useEffect } from "react";
import { LogOut, ChevronDown, Menu, Bell } from "lucide-react";
import { Role } from "@/lib/data";

type NotifItem = {
  id: string;
  title: string;
  subtitle: string;
  urgent?: boolean;
  onClick: () => void;
};

export default function TopBar({
  roleLabel,
  resetRole,
  currentRole,
  onSelectRole,
  onOpenSidebar,
  notifications,
  onVerTodosPendientes,
  onReiniciar,
}: {
  roleLabel: string;
  resetRole: () => void;
  currentRole?: Role | null;
  onSelectRole?: (r: Role) => void;
  onOpenSidebar: () => void;
  notifications: NotifItem[];
  onVerTodosPendientes: () => void;
  onReiniciar?: () => void; // solo en modo demo; se activa con triple clic en el logo (sin botón visible)
}) {

  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const roles: { id: Role; label: string }[] = [
    { id: "hrbp", label: "HRBP" },
    { id: "at", label: "Reclutamiento (AT)" },
    { id: "hm", label: "Hiring Manager" },
    { id: "candidato", label: "Candidato/a" },
  ];

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-30 w-full bg-white border-b border-ink-border shadow-2xs">
      <div className="px-3 sm:px-5 h-14 sm:h-16 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onOpenSidebar}
            className="lg:hidden p-2 -ml-1 text-ink-muted hover:text-ink-title hover:bg-surface-subtle rounded-lg transition-colors"
            aria-label="Abrir menú"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div
            onClick={(e) => (e.detail >= 3 && onReiniciar ? onReiniciar() : resetRole())}
            className="flex items-center gap-2.5 cursor-pointer select-none"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/liverpool.png" alt="Liverpool" className="h-7 w-auto shrink-0" />
            <span className="hidden sm:block text-xs font-semibold text-accent border-l border-line pl-2.5 leading-none py-1">Liver Companion</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => setNotifOpen((v) => !v)}
              className="relative p-2 text-ink-muted hover:text-ink-title hover:bg-surface-subtle rounded-lg transition-colors"
              aria-label="Notificaciones"
            >
              <Bell className="w-[18px] h-[18px]" />
              {notifications.length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-accent ring-2 ring-white" />
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 mt-2 w-80 max-w-[90vw] bg-white border border-ink-border rounded-2xl shadow-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-ink-border">
                  <span className="text-sm font-bold text-ink-title">Pendientes</span>
                </div>
                {notifications.length === 0 ? (
                  <div className="px-4 py-6 text-center text-xs text-ink-muted">
                    No tienes pendientes.
                  </div>
                ) : (
                  <div className="max-h-80 overflow-y-auto divide-y divide-ink-border">
                    {notifications.slice(0, 4).map((n) => (
                      <button
                        type="button"
                        key={n.id}
                        onClick={() => {
                          n.onClick();
                          setNotifOpen(false);
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-surface-subtle transition-colors"
                      >
                        <div className="flex items-center gap-1.5 mb-0.5">
                          {n.urgent && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />}
                          <span className="text-xs font-bold text-ink-title truncate">{n.title}</span>
                        </div>
                        <p className="text-[11px] text-ink-muted line-clamp-2">{n.subtitle}</p>
                      </button>
                    ))}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => {
                    onVerTodosPendientes();
                    setNotifOpen(false);
                  }}
                  className="w-full text-center text-xs font-bold text-accent hover:bg-accent-tint py-2.5 transition-colors border-t border-ink-border"
                >
                  Ver todos los pendientes
                </button>
              </div>
            )}
          </div>

          {onSelectRole && currentRole ? (
            <div className="relative flex items-center">
              <select
                value={currentRole}
                onChange={(e) => onSelectRole(e.target.value as Role)}
                className="appearance-none bg-surface-canvas hover:bg-surface-subtle text-ink-title font-bold text-xs pl-3 pr-7 py-1.5 rounded-lg border border-ink-border focus:outline-none focus:border-primary cursor-pointer transition-colors"
                aria-label="Seleccionar rol"
              >
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-ink-muted absolute right-2 pointer-events-none" />
            </div>
          ) : (
            <span className="text-xs font-bold bg-surface-subtle text-ink-title px-2.5 py-1 rounded-md">
              {roleLabel}
            </span>
          )}

          <button
            type="button"
            onClick={resetRole}
            className="p-1.5 text-ink-muted hover:text-ink-title hover:bg-surface-subtle rounded-lg transition-colors"
            title="Cerrar sesión / Cambiar de rol"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}

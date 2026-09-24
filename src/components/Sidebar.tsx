"use client";

import { LucideIcon } from "lucide-react";

export type SidebarItem = {
  key: string;
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  isActive: boolean;
  badge?: number;
};

export default function Sidebar({
  items,
  open,
  onClose,
}: {
  items: SidebarItem[];
  open: boolean;
  onClose: () => void;
}) {
  const NavList = (
    <nav className="flex flex-col gap-1 px-3 py-4">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <button
            type="button"
            key={item.key}
            onClick={() => {
              item.onClick();
              onClose();
            }}
            className={`relative flex items-center gap-3 pl-4 pr-3 py-2.5 rounded-r-full text-sm font-semibold transition-colors text-left ${
              item.isActive
                ? "bg-surface-subtle text-ink-title font-bold"
                : "text-ink-muted hover:bg-surface-subtle/70 hover:text-ink-title"
            }`}
          >
            {item.isActive && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-accent" />
            )}
            <Icon className={`w-[18px] h-[18px] shrink-0 ${item.isActive ? "text-accent" : ""}`} />
            <span className="flex-1 truncate">{item.label}</span>
            {!!item.badge && (
              <span className="text-[10px] font-bold bg-rose-500 text-white h-[18px] min-w-[18px] px-1 rounded-full flex items-center justify-center">
                {item.badge}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Desktop persistent sidebar */}
      <aside className="hidden lg:block w-60 shrink-0 border-r border-ink-border bg-white">
        <div className="sticky top-14 sm:top-16">{NavList}</div>
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/40" onClick={onClose} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-white shadow-xl overflow-y-auto">
            <div className="h-14 flex items-center px-4 border-b border-ink-border font-black text-ink-title">
              Liver Companion
            </div>
            {NavList}
          </aside>
        </div>
      )}
    </>
  );
}

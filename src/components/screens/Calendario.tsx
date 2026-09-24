"use client";

import { ChevronRight, Clock } from "lucide-react";

export type CalendarEventVM = {
  id: string;
  day: number;
  time: string;
  title: string;
  subtitle: string;
  onClick: () => void;
};

const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export default function Calendario({
  year,
  month,
  monthLabel,
  todayDay,
  events,
}: {
  year: number;
  month: number; // 0-indexed
  monthLabel: string;
  todayDay: number;
  events: CalendarEventVM[];
}) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7; // 0 = lunes

  const eventsByDay = new Map<number, CalendarEventVM[]>();
  events.forEach((e) => {
    const list = eventsByDay.get(e.day) || [];
    list.push(e);
    eventsByDay.set(e.day, list);
  });

  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const upcoming = [...events].sort((a, b) => a.day - b.day);

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-ink-title">Calendario</h1>
        <p className="text-xs text-ink-muted">Tus próximas entrevistas y fechas clave.</p>
      </div>

      {/* Month grid */}
      <div className="bg-white border border-ink-border rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="text-sm font-bold text-ink-title mb-3">{monthLabel}</div>

        <div className="grid grid-cols-7 gap-1 mb-1">
          {WEEKDAYS.map((d) => (
            <div key={d} className="text-center text-[10px] font-bold text-ink-muted uppercase tracking-wider py-1">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, i) => {
            if (day === null) return <div key={`blank-${i}`} />;
            const dayEvents = eventsByDay.get(day) || [];
            const isToday = day === todayDay;
            return (
              <div
                key={day}
                className={`h-11 sm:h-12 rounded-lg flex flex-col items-center justify-center gap-0.5 text-xs font-semibold transition-colors ${
                  isToday
                    ? "bg-ink-title text-white font-black"
                    : "text-ink-title hover:bg-surface-subtle"
                }`}
                title={dayEvents.map((e) => e.title).join(", ")}
              >
                <span>{day}</span>
                {dayEvents.length > 0 && (
                  <span
                    className={`w-1 h-1 rounded-full ${isToday ? "bg-white" : "bg-accent"}`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Agenda list */}
      <div className="space-y-2">
        <h2 className="text-xs font-bold text-ink-muted uppercase tracking-wider px-1">
          Agenda del mes
        </h2>

        {upcoming.length === 0 ? (
          <div className="bg-white border border-ink-border rounded-2xl p-6 text-center text-xs text-ink-muted">
            No tienes eventos programados este mes.
          </div>
        ) : (
          upcoming.map((e) => {
            const isPast = e.day < todayDay;
            return (
              <div
                key={e.id}
                onClick={e.onClick}
                className="bg-white border border-ink-border hover:border-accent-border rounded-2xl p-3.5 sm:p-4 shadow-xs hover:shadow-card transition-all cursor-pointer active:scale-99 flex items-center gap-3.5"
              >
                <div
                  className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0 font-black ${
                    isPast ? "bg-surface-subtle text-ink-muted" : "bg-accent-tint text-accent-dark"
                  }`}
                >
                  <span className="text-base leading-none">{e.day}</span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 text-[11px] text-ink-muted font-medium mb-0.5">
                    <Clock className="w-3 h-3" />
                    <span>{e.time}</span>
                    {isPast && <span className="text-ink-subtle">· Completada</span>}
                  </div>
                  <div className="text-sm font-bold text-ink-title truncate">{e.title}</div>
                  <div className="text-xs text-ink-muted truncate">{e.subtitle}</div>
                </div>

                <ChevronRight className="w-4 h-4 text-ink-muted shrink-0" />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

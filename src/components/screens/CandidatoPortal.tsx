"use client";

import { useState } from "react";
import { CalendarClock, Check, Clock, Gift, HeartHandshake, PartyPopper, Video } from "lucide-react";
import { LiverMark } from "@/components/LiverLoader";

export type EstadoPortal = "revision" | "entrevista" | "decision" | "finalista" | "oferta" | "aceptada" | "rechazada" | "cerrado";
export type PasoPortal = { label: string; estado: "hecho" | "actual" | "pendiente"; detalle?: string };
export type PersonaPortal = {
  id: string;
  nombre: string;
  vacante: string;
  area: string;
  estado: EstadoPortal;
  pasos: PasoPortal[];
  responsable: string; // quién tiene la pelota
  plazo: string; // días hábiles para su respuesta (semáforo)
  semaforo: string;
  nota?: string; // recuento de sus pruebas, se muestra en la oferta
  entrevista?: { fecha: string; meet: string };
  oferta?: { sueldo: string; inicio: string; vigencia: string; prestaciones: string[] };
};

const HERO: Record<EstadoPortal, { titulo: (n: string) => string; texto: string; cls: string; Icon: typeof Gift }> = {
  oferta: { titulo: (n) => `¡${n}, tienes una oferta!`, texto: "Liverpool quiere que te sumes como colaborador o colaboradora. Revisa los detalles y responde antes de que venza.", cls: "bg-gradient-to-br from-accent to-[#a8007a] text-white", Icon: Gift },
  aceptada: { titulo: () => "¡Te damos la bienvenida al equipo!", texto: "Aceptaste la oferta y ya eres parte de los colaboradores de Liverpool. Recursos Humanos te contactará para el alta y tu primer día.", cls: "bg-emerald-600 text-white", Icon: PartyPopper },
  rechazada: { titulo: () => "Gracias por tu respuesta", texto: "Registramos que declinaste la oferta. Tu perfil se conserva para futuras posiciones.", cls: "bg-white border border-ink-border text-ink-title", Icon: HeartHandshake },
  finalista: { titulo: (n) => `¡${n}, eres finalista!`, texto: "El equipo decidió avanzar contigo. Recursos Humanos prepara tu oferta.", cls: "bg-primary text-white", Icon: Check },
  entrevista: { titulo: () => "Tu entrevista está agendada", texto: "Ya solo falta conectarte. Todas las personas del panel verán tu perfil antes de la sesión.", cls: "bg-primary text-white", Icon: CalendarClock },
  decision: { titulo: () => "Ya entrevistaste con todo el equipo", texto: "Estás en la última revisión. Te avisaremos en cuanto haya una decisión.", cls: "bg-white border border-ink-border text-ink-title", Icon: Clock },
  revision: { titulo: () => "Estamos revisando tu perfil", texto: "Reclutamiento analiza tu experiencia y pronto te contactará para agendar una entrevista.", cls: "bg-white border border-ink-border text-ink-title", Icon: Clock },
  cerrado: { titulo: () => "Gracias por participar", texto: "En esta ocasión el equipo decidió continuar con otro perfil. Valoramos tu tiempo y conservaremos tu información para futuras vacantes.", cls: "bg-white border border-ink-border text-ink-title", Icon: HeartHandshake },
};

export default function CandidatoPortal({
  personas,
  activaId,
  onElegir,
  onResponder,
}: {
  personas: PersonaPortal[];
  activaId: string;
  onElegir: (id: string) => void;
  onResponder: (id: string, acepta: boolean) => void;
}) {
  const p = personas.find((x) => x.id === activaId) ?? personas[0];
  const [dudas, setDudas] = useState(false);
  const h = HERO[p.estado];
  const oscuro = ["oferta", "aceptada", "finalista", "entrevista"].includes(p.estado);
  const nombre = p.nombre.split(" ")[0];

  return (
    <div className="space-y-4 max-w-2xl mx-auto pb-16">
      <div className="bg-white border border-ink-border rounded-2xl p-3 shadow-xs">
        <p className="text-[10px] font-bold text-ink-muted uppercase tracking-wider mb-2">Vista de demostración · elige a la persona candidata</p>
        <div className="flex flex-wrap gap-1.5">
          {personas.map((x) => (
            <button
              key={x.id}
              type="button"
              aria-pressed={x.id === p.id}
              onClick={() => {
                setDudas(false);
                onElegir(x.id);
              }}
              className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-colors ${x.id === p.id ? "bg-primary text-white border-primary" : "bg-white text-ink-title border-ink-border hover:border-accent"}`}
            >
              {x.nombre.split(" ")[0]}
              {x.estado === "oferta" && <span className="ml-1.5 text-[9px] bg-accent text-white px-1.5 py-0.5 rounded-full">OFERTA</span>}
            </button>
          ))}
        </div>
      </div>

      <div className={`rounded-2xl p-6 shadow-xs ${h.cls}`}>
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${oscuro ? "bg-white/15" : "bg-primary-tint text-primary"}`}>
            <h.Icon className="w-6 h-6" />
          </div>
          <div>
            <p className={`text-[11px] font-bold uppercase tracking-wider ${oscuro ? "text-white/70" : "text-ink-muted"}`}>
              {p.vacante} · {p.area}
            </p>
            <h1 className="text-xl sm:text-2xl font-black mt-1">{h.titulo(nombre)}</h1>
            <p className={`text-sm mt-1.5 leading-relaxed ${oscuro ? "text-white/85" : "text-ink-body"}`}>{h.texto}</p>
            {p.estado === "oferta" && p.nota && <p className="text-xs mt-2 font-semibold text-white/90 bg-white/15 rounded-lg px-3 py-2">{p.nota}</p>}
          </div>
        </div>

        {p.estado === "oferta" && p.oferta && (
          <div className="mt-5 space-y-4">
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                ["Sueldo mensual bruto", p.oferta.sueldo],
                ["Fecha de inicio", p.oferta.inicio],
                ["Vigencia", p.oferta.vigencia],
              ].map(([k, v]) => (
                <div key={k} className="bg-white/15 rounded-xl px-2 py-3">
                  <div className="text-[10px] font-bold text-white/70 uppercase leading-tight">{k}</div>
                  <div className="text-sm sm:text-base font-black mt-1 leading-tight">{v}</div>
                </div>
              ))}
            </div>
            <ul className="text-xs text-white/90 grid sm:grid-cols-2 gap-x-4 gap-y-1">
              {p.oferta.prestaciones.map((x) => (
                <li key={x} className="flex gap-1.5">
                  <Check className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {x}
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => onResponder(p.id, true)} className="bg-white text-accent-dark font-black text-sm px-5 py-2.5 rounded-xl hover:bg-white/90 active:scale-95 transition-all">
                Aceptar oferta
              </button>
              <button type="button" onClick={() => setDudas((v) => !v)} className="border border-white/50 text-white font-bold text-sm px-4 py-2.5 rounded-xl hover:bg-white/10">
                Tengo dudas
              </button>
              <button type="button" onClick={() => onResponder(p.id, false)} className="text-white/80 text-xs font-semibold px-2 py-2.5 hover:text-white">
                Declinar
              </button>
            </div>
            {dudas && <p role="status" className="text-xs bg-white/15 rounded-xl px-3 py-2">Avisamos a {p.responsable} de que tienes preguntas: te responderá en máximo 1 día hábil.</p>}
          </div>
        )}

        {p.estado === "entrevista" && p.entrevista && (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <div className="bg-white/15 rounded-xl px-4 py-2.5">
              <div className="text-[10px] font-bold text-white/70 uppercase">Fecha y hora</div>
              <div className="text-sm font-black">{p.entrevista.fecha}</div>
            </div>
            <a href={`https://${p.entrevista.meet}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 bg-white text-primary font-black text-sm px-4 py-2.5 rounded-xl">
              <Video className="w-4 h-4" /> Abrir Google Meet
            </a>
          </div>
        )}
      </div>

      {/* Que todos vean lo mismo: la persona candidata ve las mismas etapas y el mismo semáforo que el equipo */}
      <div className="bg-white border border-ink-border rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-xs font-bold text-primary uppercase tracking-wider">Tu proceso</h2>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-ink-muted">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: p.semaforo }} /> {p.plazo}
          </span>
        </div>
        <ol className="space-y-3">
          {p.pasos.map((s, i) => (
            <li key={s.label} className="flex items-start gap-3">
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black shrink-0 ${
                  s.estado === "hecho" ? "bg-emerald-600 text-white" : s.estado === "actual" ? "bg-accent text-white ring-4 ring-accent/20" : "bg-surface-subtle text-ink-muted"
                }`}
              >
                {s.estado === "hecho" ? <Check className="w-3.5 h-3.5" /> : i + 1}
              </span>
              <div>
                <div className={`text-sm font-bold ${s.estado === "pendiente" ? "text-ink-muted" : "text-ink-title"}`}>{s.label}</div>
                {s.detalle && <div className="text-xs text-ink-muted">{s.detalle}</div>}
              </div>
            </li>
          ))}
        </ol>
        {p.estado !== "cerrado" && p.estado !== "aceptada" && p.estado !== "rechazada" && (
          <p className="text-xs text-ink-muted border-t border-ink-border/60 pt-3">
            <strong className="text-ink-title">Quién tiene la pelota:</strong> {p.responsable}.
          </p>
        )}
      </div>

      <div className="flex items-center justify-center gap-2 text-[11px] text-ink-muted">
        <LiverMark size={20} animated={false} /> Liverpool · Portal de personas candidatas
      </div>
    </div>
  );
}

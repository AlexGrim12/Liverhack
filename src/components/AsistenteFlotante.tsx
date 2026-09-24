"use client";

import { useRef, useState } from "react";
import { LiverMark } from "@/components/LiverLoader";
import { Send, X } from "lucide-react";

type Msg = { role: "user" | "assistant"; text: string };

const SUGERENCIAS = ["¿Qué perfil me toca?", "¿Qué hace el BP?", "¿Cómo funciona la IA?"];

// Respuestas de respaldo si Gemini no está disponible (sin clave o sin internet)
function respaldo(q: string): string {
  const t = q.toLowerCase();
  if (/bp|business|hrbp|valid/.test(t)) return "El BP solo valida lo que el Hiring Manager necesita: viabilidad y banda salarial. No captura ni cambia la requisición.";
  if (/ia|inteligencia|gemini|compat/.test(t)) return "La IA compara los CVs contra un repositorio de GitHub, acepta contexto libre (ignora datos personales sensibles), resume entrevistas y responde preguntas. La decisión final es humana.";
  if (/hm|hiring|captur|requisici/.test(t)) return "El Hiring Manager captura la requisición, revisa las entrevistas con apoyo de IA y decide finalistas.";
  if (/reclut|at\b|candidat/.test(t)) return "Reclutamiento filtra candidatos, los compara por compatibilidad y agenda entrevistas en Google Meet.";
  if (/cliente interno|seguimiento/.test(t)) return "El Hiring Manager, como cliente interno, ve la etapa, el semáforo y las entrevistas de su vacante.";
  return "Puedo ayudarte a elegir un perfil: HRBP valida, Reclutamiento filtra y agenda, Hiring Manager captura y decide, y la persona candidata ve su proceso. Al final, la persona que entra es colaborador o colaboradora de Liverpool.";
}

export default function AsistenteFlotante() {
  const [abierto, setAbierto] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([{ role: "assistant", text: "Hola, soy el asistente de Liver Companion. Cuéntame qué quieres hacer y te digo qué perfil elegir." }]);
  const [input, setInput] = useState("");
  const [enviando, setEnviando] = useState(false);
  const fin = useRef<HTMLDivElement>(null);

  async function enviar(texto?: string) {
    const q = (texto ?? input).trim();
    if (!q || enviando) return;
    const historial = msgs.slice(1);
    setMsgs((m) => [...m, { role: "user", text: q }]);
    setInput("");
    setEnviando(true);
    let respuesta = "";
    try {
      const res = await fetch("/api/ai/gemini", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ tarea: "ayuda", datos: { pregunta: q, historial } }) });
      const j = await res.json().catch(() => null);
      respuesta = res.ok && j?.respuesta ? j.respuesta : respaldo(q);
    } catch {
      respuesta = respaldo(q);
    }
    setMsgs((m) => [...m, { role: "assistant", text: respuesta }]);
    setEnviando(false);
    setTimeout(() => fin.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3">
      {abierto && (
        <div className="w-[min(92vw,360px)] h-[min(70vh,460px)] bg-white border border-line rounded-2xl shadow-lg flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-primary text-white">
            <div className="flex items-center gap-2 text-sm font-bold">
              <LiverMark size={22} /> Asistente Liver Companion
            </div>
            <button type="button" onClick={() => setAbierto(false)} aria-label="Cerrar asistente" className="p-1 rounded hover:bg-white/10">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2 text-sm">
            {msgs.map((m, i) => (
              <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <div className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 ${m.role === "user" ? "bg-accent text-white" : "bg-surface-subtle text-ink"}`}>{m.text}</div>
              </div>
            ))}
            {enviando && <div className="flex items-center gap-2 text-xs text-ink-muted"><LiverMark size={24} /> Pensando…</div>}
            {msgs.length === 1 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {SUGERENCIAS.map((s) => (
                  <button key={s} type="button" onClick={() => enviar(s)} className="text-xs border border-line rounded-full px-2.5 py-1 text-ink-muted hover:text-ink-title hover:border-accent">
                    {s}
                  </button>
                ))}
              </div>
            )}
            <div ref={fin} />
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void enviar();
            }}
            className="flex items-center gap-2 p-2 border-t border-line"
          >
            <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Escribe tu pregunta…" className="flex-1 text-sm px-3 py-2 rounded-lg border border-line focus:outline-none focus:border-accent" />
            <button type="submit" disabled={enviando || !input.trim()} aria-label="Enviar" className="p-2 rounded-lg bg-accent text-white disabled:opacity-40">
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
      <button type="button" onClick={() => setAbierto((v) => !v)} aria-label="Abrir asistente" className="w-12 h-12 rounded-full bg-accent text-white shadow-lg flex items-center justify-center hover:scale-105 transition-transform">
        {abierto ? <X className="w-5 h-5" /> : <LiverMark variant="glyph" size={26} once />}
      </button>
    </div>
  );
}

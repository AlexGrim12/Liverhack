"use client";

import { useEffect, useRef, useState } from "react";
import { MessageSquareText, X } from "lucide-react";
import { LiverMark } from "@/components/LiverLoader";
import { CHAT_EVENT } from "@/lib/chat";

type Msg = { id: number; texto: string; hora: string };

// Muestra en la interfaz los avisos que la plataforma manda a Google Chat, con el mismo texto. Es una vista simulada:
// sirve cuando el administrador de Workspace no permite webhooks. Con webhook configurado, el mensaje además llega a Chat.
function Texto({ t }: { t: string }) {
  return (
    <>
      {t.split("\n").map((linea, i) => (
        <p key={i} className={i ? "mt-0.5" : ""}>
          {linea.split(/(\*[^*]+\*)/g).map((p, j) => (p.startsWith("*") && p.endsWith("*") ? <strong key={j}>{p.slice(1, -1)}</strong> : <span key={j}>{p}</span>))}
        </p>
      ))}
    </>
  );
}

export default function ChatSimulado() {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [abierto, setAbierto] = useState(false);
  const [nuevos, setNuevos] = useState(0);
  const [vista, setVista] = useState<string | null>(null);
  const id = useRef(0);
  const abiertoRef = useRef(false);
  abiertoRef.current = abierto;

  useEffect(() => {
    let t: ReturnType<typeof setTimeout> | undefined;
    const on = (e: Event) => {
      const d = (e as CustomEvent<{ texto: string; hora: string }>).detail;
      setMsgs((m) => [...m, { id: ++id.current, texto: d.texto, hora: d.hora }]);
      if (!abiertoRef.current) {
        setNuevos((n) => n + 1);
        setVista(d.texto.split("\n")[0].replace(/\*/g, ""));
        clearTimeout(t);
        t = setTimeout(() => setVista(null), 4500);
      }
    };
    window.addEventListener(CHAT_EVENT, on);
    return () => {
      window.removeEventListener(CHAT_EVENT, on);
      clearTimeout(t);
    };
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2">
      {abierto && (
        <div className="w-[min(92vw,340px)] max-h-[min(70vh,440px)] bg-white border border-ink-border rounded-2xl shadow-lg flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-ink-border bg-surface-canvas">
            <div>
              <div className="text-sm font-bold text-ink-title">Liver Companion — Demo</div>
              <div className="text-[10px] text-ink-muted">Espacio de Google Chat · vista simulada</div>
            </div>
            <button type="button" onClick={() => setAbierto(false)} aria-label="Cerrar chat" className="p-1 rounded hover:bg-surface-subtle">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {msgs.length === 0 && <p className="text-xs text-ink-muted">Aquí aparecerán los avisos: requisición validada, entrevista agendada, nuevo finalista y vacantes fuera de tiempo.</p>}
            {msgs.map((m) => (
              <div key={m.id} className="flex gap-2">
                <div className="shrink-0 mt-0.5">
                  <LiverMark size={28} animated={false} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xs font-bold text-ink-title">Liver Companion</span>
                    <span className="text-[9px] font-bold text-ink-muted bg-surface-subtle px-1 rounded">App</span>
                    <span className="text-[10px] text-ink-muted">{m.hora}</span>
                  </div>
                  <div className="text-xs text-ink-body leading-relaxed">
                    <Texto t={m.texto} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {!abierto && vista && (
        <button type="button" onClick={() => { setAbierto(true); setNuevos(0); setVista(null); }} className="max-w-[260px] text-left text-xs bg-white border border-ink-border shadow-lg rounded-xl px-3 py-2 animate-pulse">
          <span className="font-bold text-ink-title">Google Chat · </span>
          <span className="text-ink-body">{vista}</span>
        </button>
      )}
      <button
        type="button"
        onClick={() => {
          setAbierto((v) => !v);
          setNuevos(0);
          setVista(null);
        }}
        aria-label="Abrir chat de avisos"
        className="relative w-11 h-11 rounded-full bg-white border border-ink-border shadow-lg flex items-center justify-center text-ink-title hover:scale-105 transition-transform"
      >
        <MessageSquareText className="w-5 h-5" />
        {nuevos > 0 && <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-accent text-white text-[10px] font-black flex items-center justify-center">{nuevos}</span>}
      </button>
    </div>
  );
}

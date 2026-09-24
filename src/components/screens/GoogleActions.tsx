"use client";

import { useEffect, useState } from "react";
import { CalendarClock, Loader2, Mail, RefreshCw, X } from "lucide-react";

export type Panelista = { id: string; nombre: string; cargo: string };
export type AgendarInput = { inicio: string; duracionMin: number; tipo: string; entrevistadores: string[] };
export type GoogleActions = {
  panelistas: Panelista[];
  onAgendar: (i: AgendarInput) => Promise<void>;
  checkBusy: (ids: string[], inicio: string, fin: string) => Promise<Record<string, boolean | null>>;
  onSync: () => Promise<string>;
  onNotify: (plantilla: string) => Promise<string>;
};

const inputCls = "w-full px-3 py-2 text-xs bg-surface-canvas rounded-lg border border-ink-border focus:outline-none focus:border-primary";
const isoDay = (d: Date) => d.toISOString().slice(0, 10);

// Agenda la entrevista en Google Calendar (con Meet) y consulta la disponibilidad del panel (Free/Busy).
export function AgendarGoogleModal({ google, onClose }: { google: GoogleActions; onClose: () => void }) {
  const [fecha, setFecha] = useState(isoDay(new Date(Date.now() + 86400_000)));
  const [hora, setHora] = useState("10:00");
  const [dur, setDur] = useState(45);
  const [tipo, setTipo] = useState("tecnica");
  const [sel, setSel] = useState<string[]>([]);
  const [busy, setBusy] = useState<Record<string, boolean | null>>({});
  const [checking, setChecking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // CDMX no tiene horario de verano desde 2022: UTC-6 fijo
  const inicioISO = `${fecha}T${hora}:00-06:00`;
  const finISO = new Date(new Date(inicioISO).getTime() + dur * 60_000).toISOString();

  useEffect(() => {
    if (!sel.length || Number.isNaN(new Date(inicioISO).getTime())) {
      setBusy({});
      return;
    }
    setChecking(true);
    const t = setTimeout(() => {
      google
        .checkBusy(sel, new Date(inicioISO).toISOString(), finISO)
        .then(setBusy)
        .catch(() => setBusy(Object.fromEntries(sel.map((id) => [id, null]))))
        .finally(() => setChecking(false));
    }, 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sel, fecha, hora, dur]);

  async function submit() {
    if (!sel.length) return setError("Elige al menos un entrevistador.");
    setSaving(true);
    setError(null);
    try {
      await google.onAgendar({ inicio: new Date(inicioISO).toISOString(), duracionMin: dur, tipo, entrevistadores: sel });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo agendar.");
    } finally {
      setSaving(false);
    }
  }

  const badge = (id: string) => {
    if (!sel.includes(id) || checking) return null;
    const b = busy[id];
    if (b === true) return <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded">Ocupado</span>;
    if (b === false) return <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">Libre</span>;
    return <span className="text-[10px] text-ink-muted bg-surface-subtle px-1.5 py-0.5 rounded">Sin datos</span>;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" role="dialog" aria-modal="true" aria-label="Agendar entrevista">
      <div className="bg-white rounded-2xl p-5 max-w-md w-full shadow-xl border border-ink-border space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-2 border-b border-ink-border">
          <h3 className="text-sm font-bold text-ink-title flex items-center gap-2">
            <CalendarClock className="w-4 h-4 text-accent" /> Agendar en Google Calendar + Meet
          </h3>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="text-ink-muted hover:text-ink-title">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="ag-fecha" className="block text-xs font-bold text-ink-title mb-1">Fecha</label>
            <input id="ag-fecha" type="date" value={fecha} min={isoDay(new Date())} onChange={(e) => setFecha(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label htmlFor="ag-hora" className="block text-xs font-bold text-ink-title mb-1">Hora (CDMX)</label>
            <input id="ag-hora" type="time" value={hora} onChange={(e) => setHora(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label htmlFor="ag-dur" className="block text-xs font-bold text-ink-title mb-1">Duración</label>
            <select id="ag-dur" value={dur} onChange={(e) => setDur(Number(e.target.value))} className={inputCls}>
              {[30, 45, 60, 90].map((m) => <option key={m} value={m}>{m} min</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="ag-tipo" className="block text-xs font-bold text-ink-title mb-1">Tipo</label>
            <select id="ag-tipo" value={tipo} onChange={(e) => setTipo(e.target.value)} className={inputCls}>
              <option value="screening">Screening</option>
              <option value="tecnica">Técnica</option>
              <option value="cultural">Cultural</option>
              <option value="final">Final</option>
            </select>
          </div>
        </div>

        <fieldset>
          <legend className="text-xs font-bold text-ink-title mb-1.5 flex items-center gap-2">
            Entrevistadores {checking && <Loader2 className="w-3 h-3 animate-spin text-ink-muted" />}
          </legend>
          <div className="space-y-1 max-h-40 overflow-y-auto border border-ink-border rounded-lg p-1.5">
            {google.panelistas.map((p) => (
              <label key={p.id} className="flex items-center justify-between gap-2 text-xs px-1.5 py-1 rounded hover:bg-surface-canvas cursor-pointer">
                <span className="flex items-center gap-2">
                  <input type="checkbox" checked={sel.includes(p.id)} onChange={() => setSel((s) => (s.includes(p.id) ? s.filter((x) => x !== p.id) : [...s, p.id]))} />
                  <span className="font-semibold text-ink-title">{p.nombre}</span>
                  {p.cargo && <span className="text-ink-muted">· {p.cargo}</span>}
                </span>
                {badge(p.id)}
              </label>
            ))}
          </div>
          <p className="text-[10px] text-ink-muted mt-1">Se invita también a la persona candidata. El evento sale de tu calendario.</p>
        </fieldset>

        {error && (
          <div role="alert" className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">{error}</div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-ink-border">
          <button type="button" onClick={onClose} className="px-3 py-2 text-xs font-semibold text-ink-muted">Cancelar</button>
          <button
            type="button"
            onClick={submit}
            disabled={saving}
            className="px-4 py-2 text-xs font-bold bg-accent hover:bg-accent-hover disabled:opacity-60 text-white rounded-lg transition-all"
          >
            {saving ? "Agendando…" : "Agendar y enviar invitaciones"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Acciones con Google desde el perfil: notas de Meet (Drive + Gemini) y correo al candidato (Gmail).
export function GoogleAcciones({ google }: { google: GoogleActions }) {
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [plantilla, setPlantilla] = useState("avanza");

  async function run(key: string, fn: () => Promise<string>) {
    setBusy(key);
    setMsg(null);
    try {
      setMsg({ ok: true, text: await fn() });
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "No se pudo completar la acción." });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="bg-white border border-ink-border rounded-2xl p-5 shadow-xs space-y-3">
      <h2 className="text-xs font-extrabold text-ink-muted uppercase tracking-wider">Google Workspace</h2>
      <div className="flex flex-col sm:flex-row gap-2">
        <button
          type="button"
          onClick={() => run("sync", google.onSync)}
          disabled={busy !== null}
          className="inline-flex items-center justify-center gap-1.5 bg-white hover:bg-surface-canvas border border-ink-border text-ink-title text-xs font-bold px-3 py-2 rounded-lg disabled:opacity-60"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${busy === "sync" ? "animate-spin" : ""}`} />
          <span>Sincronizar notas de Meet</span>
        </button>
        <div className="flex gap-2 flex-1">
          <select aria-label="Plantilla de correo" value={plantilla} onChange={(e) => setPlantilla(e.target.value)} className={`${inputCls} sm:max-w-[180px]`}>
            <option value="recibida">Postulación recibida</option>
            <option value="avanza">Tu proceso avanza</option>
            <option value="entrevista">Entrevista programada</option>
            <option value="cierre">Cierre del proceso</option>
          </select>
          <button
            type="button"
            onClick={() => run("mail", () => google.onNotify(plantilla))}
            disabled={busy !== null}
            className="inline-flex items-center justify-center gap-1.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold px-3 py-2 rounded-lg disabled:opacity-60 shrink-0"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>{busy === "mail" ? "Enviando…" : "Enviar por Gmail"}</span>
          </button>
        </div>
      </div>
      {msg && (
        <div role={msg.ok ? "status" : "alert"} className={`text-xs font-semibold rounded-lg px-3 py-2 border ${msg.ok ? "text-emerald-700 bg-emerald-50 border-emerald-200" : "text-rose-700 bg-rose-50 border-rose-200"}`}>
          {msg.text}
        </div>
      )}
    </div>
  );
}

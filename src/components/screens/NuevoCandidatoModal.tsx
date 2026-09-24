"use client";

import { useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import type { NuevoCandidatoInput } from "@/lib/supabase/repo";

const EMPTY: NuevoCandidatoInput = {
  nombre: "",
  email: "",
  telefono: "",
  nivelEstudios: "licenciatura",
  institucion: "",
  carrera: "",
  compActual: "",
  compDeseada: "",
  fuente: "Bolsa de trabajo",
  compat: "",
  idiomas: [{ idioma: "Inglés", nivel: "intermedio" }],
  avisoPrivacidad: false,
};

const inputCls = "w-full px-3 py-2 text-xs bg-surface-canvas rounded-lg border border-ink-border focus:outline-none focus:border-primary";
const labelCls = "block text-xs font-bold text-ink-title mb-1";

// Alta de un candidato en la vacante: datos, idiomas y CV (PDF/DOC/DOCX, máx. 10 MB).
export default function NuevoCandidatoModal({
  vacante,
  soportaCv,
  onSubmit,
  onClose,
}: {
  vacante: string;
  soportaCv: boolean; // en modo demo no se sube archivo
  onSubmit: (input: NuevoCandidatoInput, cv: File | null) => Promise<void>;
  onClose: () => void;
}) {
  const [f, setF] = useState<NuevoCandidatoInput>(EMPTY);
  const [cv, setCv] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (patch: Partial<NuevoCandidatoInput>) => setF((p) => ({ ...p, ...patch }));

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      await onSubmit(f, cv);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo registrar al candidato.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" role="dialog" aria-modal="true" aria-label="Agregar candidato">
      <div className="bg-white rounded-2xl p-5 max-w-lg w-full shadow-xl border border-ink-border space-y-4 max-h-[92vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-2 pb-2 border-b border-ink-border">
          <div>
            <h3 className="text-sm font-bold text-ink-title">Agregar candidato</h3>
            <p className="text-xs text-ink-muted mt-0.5">{vacante}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar ventana" className="text-ink-muted hover:text-ink-title">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className={labelCls} htmlFor="nc-nombre">Nombre completo *</label>
            <input id="nc-nombre" value={f.nombre} onChange={(e) => set({ nombre: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className={labelCls} htmlFor="nc-email">Correo</label>
            <input id="nc-email" type="email" value={f.email} onChange={(e) => set({ email: e.target.value })} className={inputCls} placeholder="para invitarle a la entrevista" />
          </div>
          <div>
            <label className={labelCls} htmlFor="nc-tel">Teléfono</label>
            <input id="nc-tel" value={f.telefono} onChange={(e) => set({ telefono: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className={labelCls} htmlFor="nc-nivel">Nivel de estudios</label>
            <select id="nc-nivel" value={f.nivelEstudios} onChange={(e) => set({ nivelEstudios: e.target.value as NuevoCandidatoInput["nivelEstudios"] })} className={inputCls}>
              <option value="preparatoria">Preparatoria</option>
              <option value="licenciatura_trunca">Licenciatura trunca</option>
              <option value="licenciatura">Licenciatura terminada</option>
              <option value="posgrado">Posgrado</option>
            </select>
          </div>
          <div>
            <label className={labelCls} htmlFor="nc-fuente">Fuente</label>
            <select id="nc-fuente" value={f.fuente} onChange={(e) => set({ fuente: e.target.value })} className={inputCls}>
              {["Bolsa de trabajo", "Chatbot", "Referido", "LinkedIn", "Otra"].map((x) => <option key={x}>{x}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls} htmlFor="nc-inst">Institución</label>
            <input id="nc-inst" value={f.institucion} onChange={(e) => set({ institucion: e.target.value })} className={inputCls} placeholder="UNAM, ITESO…" />
          </div>
          <div>
            <label className={labelCls} htmlFor="nc-carrera">Carrera</label>
            <input id="nc-carrera" value={f.carrera} onChange={(e) => set({ carrera: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className={labelCls} htmlFor="nc-actual">Compensación actual (MXN/mes)</label>
            <input id="nc-actual" type="number" min={0} value={f.compActual} onChange={(e) => set({ compActual: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className={labelCls} htmlFor="nc-deseada">Pretensión (MXN/mes)</label>
            <input id="nc-deseada" type="number" min={0} value={f.compDeseada} onChange={(e) => set({ compDeseada: e.target.value })} className={inputCls} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls} htmlFor="nc-compat">Compatibilidad estimada % (opcional)</label>
            <input id="nc-compat" type="number" min={0} max={100} value={f.compat} onChange={(e) => set({ compat: e.target.value })} className={inputCls} />
          </div>
        </div>

        <fieldset>
          <legend className={labelCls}>Idiomas</legend>
          <div className="space-y-1.5">
            {f.idiomas.map((l, i) => (
              <div key={i} className="flex gap-2">
                <input
                  aria-label="Idioma"
                  value={l.idioma}
                  onChange={(e) => set({ idiomas: f.idiomas.map((x, j) => (j === i ? { ...x, idioma: e.target.value } : x)) })}
                  className={inputCls}
                />
                <select
                  aria-label="Nivel del idioma"
                  value={l.nivel}
                  onChange={(e) => set({ idiomas: f.idiomas.map((x, j) => (j === i ? { ...x, nivel: e.target.value as typeof l.nivel } : x)) })}
                  className={`${inputCls} max-w-[130px]`}
                >
                  <option value="basico">Básico</option>
                  <option value="intermedio">Intermedio</option>
                  <option value="avanzado">Avanzado</option>
                  <option value="nativo">Nativo</option>
                </select>
                <button type="button" aria-label="Quitar idioma" onClick={() => set({ idiomas: f.idiomas.filter((_, j) => j !== i) })} className="text-ink-muted hover:text-rose-600 px-1">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => set({ idiomas: [...f.idiomas, { idioma: "", nivel: "intermedio" }] })} className="mt-1.5 inline-flex items-center gap-1 text-xs font-bold text-primary">
            <Plus className="w-3.5 h-3.5" /> Agregar idioma
          </button>
        </fieldset>

        {soportaCv && (
          <div>
            <label className={labelCls} htmlFor="nc-cv">CV (PDF, DOC o DOCX · máx. 10 MB)</label>
            <input id="nc-cv" type="file" accept=".pdf,.doc,.docx" onChange={(e) => setCv(e.target.files?.[0] ?? null)} className="block w-full text-xs text-ink-body file:mr-3 file:rounded-lg file:border-0 file:bg-primary-tint file:px-3 file:py-2 file:text-xs file:font-bold file:text-primary" />
            <p className="text-[10px] text-ink-muted mt-1">Si es PDF, Gemini extraerá atributos e idiomas automáticamente.</p>
          </div>
        )}

        <label className="flex items-start gap-2 text-xs text-ink-body cursor-pointer">
          <input type="checkbox" checked={f.avisoPrivacidad} onChange={(e) => set({ avisoPrivacidad: e.target.checked })} className="mt-0.5" />
          <span>Confirmo que la persona candidata aceptó el aviso de privacidad para el tratamiento de sus datos.</span>
        </label>

        {error && <div role="alert" className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">{error}</div>}

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-ink-border">
          <button type="button" onClick={onClose} className="px-3 py-2 text-xs font-semibold text-ink-muted">Cancelar</button>
          <button type="button" onClick={submit} disabled={busy} className="px-4 py-2 text-xs font-bold bg-accent hover:bg-accent-hover disabled:opacity-60 text-white rounded-lg">
            {busy ? "Guardando…" : "Agregar a la vacante"}
          </button>
        </div>
      </div>
    </div>
  );
}

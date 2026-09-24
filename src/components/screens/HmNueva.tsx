"use client";

import { AlertCircle, CheckCircle, MessageSquareWarning, Send } from "lucide-react";

export type RequisicionForm = {
  titulo: string;
  categoria: string;
  nivel: string;
  stack: string[];
  competencias: string[];
  expMinima: number;
  cert: string;
  estudios: string;
  habilidades: string;
  salarioMin: string;
  salarioMax: string;
  solicitante: string;
  bp: string;
};

const inputCls =
  "w-full px-3 py-2 text-xs bg-surface-canvas rounded-xl border border-ink-border focus:outline-none focus:border-primary";
const labelCls = "block text-xs font-bold text-ink-title mb-1";

function Chip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`text-xs font-semibold px-3 py-1 rounded-full border transition-all ${
        selected
          ? "bg-accent text-white border-accent"
          : "bg-surface-canvas text-ink-body border-ink-border hover:border-primary-border"
      }`}
    >
      {label}
    </button>
  );
}

export default function HmNueva({
  form,
  onChange,
  categorias,
  stackOpciones,
  certPlaceholder,
  competenciasOpciones,
  niveles,
  estudios,
  solicitantes,
  pedirSolicitante = true,
  bps,
  editing,
  revalidacion,
  comentariosBp,
  enviado,
  error,
  onEnviar,
}: {
  form: RequisicionForm;
  onChange: (patch: Partial<RequisicionForm>) => void;
  categorias: string[];
  stackOpciones: string[];
  certPlaceholder: string;
  competenciasOpciones: string[];
  niveles: { value: string; label: string }[];
  estudios: string[];
  solicitantes: string[];
  pedirSolicitante?: boolean; // en la demo no hay perfil solicitante
  bps: string[];
  editing: boolean;
  revalidacion: boolean;
  comentariosBp?: string;
  enviado: string | null;
  error: string | null;
  onEnviar: () => void;
}) {
  const toggle = (key: "stack" | "competencias", value: string) => {
    const cur = form[key];
    onChange({ [key]: cur.includes(value) ? cur.filter((x) => x !== value) : [...cur, value] } as Partial<RequisicionForm>);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-12">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-ink-title">
          {editing ? "Ajustar requisición" : "Nueva requisición"}
        </h1>
        <p className="text-xs text-ink-muted mt-0.5">
          Captura lo que necesitas para la posición. El BP solo lo valida: no lo modifica.
        </p>
      </div>

      {comentariosBp && (
        <div className="flex gap-2.5 bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900">
          <MessageSquareWarning className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold mb-0.5">El BP devolvió tu requisición con comentarios</div>
            <p className="italic">“{comentariosBp}”</p>
          </div>
        </div>
      )}
      {revalidacion && (
        <div className="flex gap-2.5 bg-accent-tint border border-accent-border rounded-2xl p-4 text-xs text-accent-dark">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <p>
            Esta requisición ya estaba validada. Si cambias algo, el BP tendrá que <b>revalidarla</b>.
          </p>
        </div>
      )}

      <div className="bg-white border border-ink-border rounded-2xl p-4 sm:p-6 shadow-xs space-y-5">
        <div>
          <label className={labelCls} htmlFor="titulo">Título de la posición</label>
          <input
            id="titulo"
            type="text"
            value={form.titulo}
            onChange={(e) => onChange({ titulo: e.target.value })}
            placeholder="Ej. Backend Developer Sr — Equipo Pagos"
            className={inputCls}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={labelCls} htmlFor="categoria">Categoría del puesto</label>
            <select
              id="categoria"
              value={form.categoria}
              onChange={(e) => onChange({ categoria: e.target.value })}
              className={`${inputCls} cursor-pointer`}
            >
              <option value="">Selecciona una categoría…</option>
              {categorias.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls} htmlFor="nivel">Nivel de la vacante</label>
            <select
              id="nivel"
              value={form.nivel}
              onChange={(e) => onChange({ nivel: e.target.value })}
              className={`${inputCls} cursor-pointer`}
            >
              {niveles.map((n) => (
                <option key={n.value} value={n.value}>{n.label}</option>
              ))}
            </select>
            <p className="text-[10px] text-ink-muted mt-1">Define los tiempos (SLA) de cada etapa.</p>
          </div>
        </div>

        {form.categoria && (
          <>
            <div>
              <div className="text-xs font-bold text-ink-title uppercase tracking-wider mb-2">
                Herramientas y tecnologías necesarias
              </div>
              <div className="flex flex-wrap gap-1.5">
                {stackOpciones.map((s) => (
                  <Chip key={s} label={s} selected={form.stack.includes(s)} onClick={() => toggle("stack", s)} />
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-ink-border">
              <div>
                <label className={labelCls} htmlFor="cert">Certificación deseable</label>
                <input
                  id="cert"
                  type="text"
                  value={form.cert}
                  onChange={(e) => onChange({ cert: e.target.value })}
                  placeholder={certPlaceholder || "Ej. Certificación técnica"}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls} htmlFor="exp">Años de experiencia mínima</label>
                <input
                  id="exp"
                  type="number"
                  value={form.expMinima}
                  min={0}
                  max={40}
                  onChange={(e) => onChange({ expMinima: Number(e.target.value) })}
                  className={inputCls}
                />
              </div>
            </div>
          </>
        )}

        <div className="pt-2 border-t border-ink-border space-y-3">
          <div className="text-xs font-bold text-ink-title uppercase tracking-wider">No negociables</div>
          <div>
            <label className={labelCls} htmlFor="estudios">Estudios indispensables</label>
            <select
              id="estudios"
              value={form.estudios}
              onChange={(e) => onChange({ estudios: e.target.value })}
              className={inputCls}
            >
              {estudios.map((e) => (
                <option key={e}>{e}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls} htmlFor="habilidades">Habilidades técnicas clave</label>
            <textarea
              id="habilidades"
              rows={3}
              value={form.habilidades}
              onChange={(e) => onChange({ habilidades: e.target.value })}
              placeholder="Ej. Arquitectura de microservicios, AWS, liderazgo de equipo…"
              className={`${inputCls} resize-y`}
            />
          </div>
          <div>
            <div className={`${labelCls} mb-2`}>Competencias a evaluar en las entrevistas</div>
            <div className="flex flex-wrap gap-1.5">
              {competenciasOpciones.map((c) => (
                <Chip key={c} label={c} selected={form.competencias.includes(c)} onClick={() => toggle("competencias", c)} />
              ))}
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-ink-border space-y-3">
          <div className="text-xs font-bold text-ink-title uppercase tracking-wider">Banda salarial (mensual, MXN)</div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls} htmlFor="smin">Mínimo</label>
              <input id="smin" type="number" min={0} value={form.salarioMin} onChange={(e) => onChange({ salarioMin: e.target.value })} placeholder="28000" className={inputCls} />
            </div>
            <div>
              <label className={labelCls} htmlFor="smax">Máximo</label>
              <input id="smax" type="number" min={0} value={form.salarioMax} onChange={(e) => onChange({ salarioMax: e.target.value })} placeholder="36000" className={inputCls} />
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-ink-border grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={labelCls} htmlFor="bp">BP que la validará</label>
            <select id="bp" value={form.bp} onChange={(e) => onChange({ bp: e.target.value })} className={inputCls}>
              <option value="">Selecciona…</option>
              {bps.map((b) => (
                <option key={b}>{b}</option>
              ))}
            </select>
          </div>
          {pedirSolicitante && (
            <div>
              <label className={labelCls} htmlFor="sol">Cliente interno que solicita (seguimiento)</label>
              <select id="sol" value={form.solicitante} onChange={(e) => onChange({ solicitante: e.target.value })} className={inputCls}>
                <option value="">Selecciona…</option>
                {solicitantes.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
          )}
          <p className="sm:col-span-2 text-[10px] text-ink-muted -mt-1">
            El reclutador (AT) lo asigna el BP al validar.
          </p>
        </div>

        {error && (
          <div role="alert" className="flex items-center gap-1.5 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="pt-3 border-t border-ink-border flex flex-col sm:flex-row items-center gap-3">
          <button
            type="button"
            onClick={onEnviar}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover text-white font-bold text-xs sm:text-sm px-6 py-2.5 rounded-xl transition-all active:scale-95"
          >
            <Send className="w-4 h-4" />
            <span>{editing ? "Reenviar al BP para validación" : "Enviar al BP para validación"}</span>
          </button>
          {enviado && (
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>{enviado}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

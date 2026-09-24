"use client";

import { LiverMark } from "@/components/LiverLoader";
import { useMemo, useState } from "react";
import { summarizeTranscript } from "@/lib/ai/transcript";
import type { TranscriptSummary } from "@/lib/ai/types";
import { ArrowLeft, CheckCircle2, XCircle } from "lucide-react";

export type FeedbackVM = { profileId: string; nombre: string; cargo: string; veredicto: "recomendado" | "con_reservas" | "no_recomendado" | null; notas: string };
// Una ronda de entrevista: RH (screening, la hace el AT) y técnica (la hace el panel del HM), cada una con su feedback
export type RondaVM = {
  id: string;
  tipo: "screening" | "tecnica" | "cultural" | "final";
  titulo: string;
  fecha: string;
  entrevistadores: FeedbackVM[];
  resumen: string;
  puntos: string[];
  transcripcion?: string;
};
export type EntrevistaVM = {
  rondas?: RondaVM[];
  interviewId: string;
  applicationId: string;
  vacante: string;
  candidato: string;
  compat: number;
  fecha: string;
  resumen: string;
  puntos: string[];
  feedback: FeedbackVM[];
  decidido: "finalista" | "descartado" | null;
  miFeedbackPendiente: boolean;
  puedeDecidir: boolean;
  transcripcion?: string; // notas de Meet (demo)
};

const VEREDICTO: Record<string, { label: string; cls: string }> = {
  recomendado: { label: "Recomendado", cls: "text-emerald-700 bg-emerald-50" },
  con_reservas: { label: "Con reservas", cls: "text-amber-800 bg-amber-50" },
  no_recomendado: { label: "No recomendado", cls: "text-rose-700 bg-rose-50" },
};

export default function HmEntrevista({
  entrevista,
  onDecidir,
  onFeedback,
  onNavHmDashboard,
  mensaje,
  requeridas,
  resumir,
}: {
  requeridas?: string[];
  resumir?: (texto: string, candidato: string) => Promise<TranscriptSummary>;
  mensaje?: string | null;
  entrevista: EntrevistaVM | null;
  onDecidir: (estatus: "finalista" | "descartado", justificacion: string) => Promise<void> | void;
  onFeedback?: (veredicto: "recomendado" | "con_reservas" | "no_recomendado", notas: string) => Promise<void> | void;
  onNavHmDashboard: () => void;
}) {
  const [justificacion, setJustificacion] = useState("");
  const [descartando, setDescartando] = useState(false);
  const [fbVeredicto, setFbVeredicto] = useState<"recomendado" | "con_reservas" | "no_recomendado">("recomendado");
  const [fbNotas, setFbNotas] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [verTrans, setVerTrans] = useState(false);
  const [pegado, setPegado] = useState("");
  const [otro, setOtro] = useState<TranscriptSummary | null>(null);
  const [resumiendo, setResumiendo] = useState(false);
  const rondas = entrevista?.rondas ?? [];
  const [selRonda, setSelRonda] = useState<string | null>(null);
  const ronda = rondas.find((r) => r.id === selRonda) ?? rondas[rondas.length - 1] ?? null;
  const transActiva = ronda ? ronda.transcripcion : entrevista?.transcripcion;
  const base = useMemo(
    () => (transActiva ? summarizeTranscript(transActiva, entrevista!.candidato, requeridas) : null),
    [transActiva, entrevista?.candidato, requeridas] // eslint-disable-line react-hooks/exhaustive-deps
  );

  async function run(fn: () => Promise<void> | void) {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo completar la acción.");
    } finally {
      setBusy(false);
    }
  }

  const back = (
    <button type="button" onClick={onNavHmDashboard} className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-primary hover:text-primary-dark transition-colors py-1">
      <ArrowLeft className="w-4 h-4" />
      <span>Volver a vacantes</span>
    </button>
  );

  if (!entrevista) {
    return (
      <div className="space-y-4 max-w-2xl mx-auto pb-16">
        <div>{back}</div>
        {mensaje && <div role="status" className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">{mensaje}</div>}
        <div className="bg-white border border-ink-border rounded-2xl p-8 text-center text-sm text-ink-muted">No hay entrevistas por evaluar.</div>
      </div>
    );
  }
  const e = ronda ? { ...entrevista, fecha: ronda.fecha, resumen: ronda.resumen, puntos: ronda.puntos, feedback: ronda.entrevistadores, transcripcion: ronda.transcripcion } : entrevista;
  const evals = rondas.flatMap((r) => r.entrevistadores).filter((f) => f.veredicto);
  const aFavor = evals.filter((f) => f.veredicto === "recomendado").length;

  return (
    <div className="space-y-4 max-w-2xl mx-auto pb-16">
      <div>{back}</div>

      <div className="bg-white border border-ink-border rounded-2xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-bold text-primary bg-primary-tint px-2.5 py-0.5 rounded-md">{e.vacante}</span>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">{e.compat}% Match</span>
        </div>
        <h1 className="text-lg sm:text-xl font-black text-ink-title">{e.candidato}</h1>
        <p className="text-xs text-ink-muted mt-0.5">{ronda ? `${ronda.titulo} completada` : "Entrevista completada"} · {e.fecha}</p>
      </div>

      {rondas.length > 1 && (
        <div className="bg-white border border-ink-border rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-xs font-bold text-primary uppercase tracking-wider">Rondas de entrevista</h2>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md">{aFavor} de {evals.length} evaluaciones lo recomiendan</span>
          </div>
          <ol className="space-y-2">
            {rondas.map((r, i) => {
              const activa = r.id === ronda?.id;
              return (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelRonda(r.id);
                      setOtro(null);
                      setVerTrans(false);
                    }}
                    aria-pressed={activa}
                    className={`w-full text-left rounded-xl border px-3 py-2.5 transition-colors ${activa ? "border-accent bg-accent/5" : "border-ink-border hover:border-accent"}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-ink-title">
                        {i + 1}. {r.titulo}
                      </span>
                      <span className="text-[11px] text-ink-muted">{r.fecha}</span>
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {r.entrevistadores.map((f) => (
                        <span key={f.profileId} className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${f.veredicto ? VEREDICTO[f.veredicto].cls : "text-ink-muted bg-surface-subtle"}`}>
                          {f.nombre.split(" ")[0]} · {f.veredicto ? VEREDICTO[f.veredicto].label : "Pendiente"}
                        </span>
                      ))}
                    </div>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
      )}

      {/* Sin transcripción a la mano (datos de la base), se muestra el resumen que dejó Gemini en Meet */}
      {!base && !otro && (
      <div className="bg-white border border-ink-border rounded-2xl p-5 shadow-xs space-y-3">
        <h2 className="text-xs font-bold text-primary uppercase tracking-wider">Resumen de la entrevista (Gemini)</h2>
        {e.resumen ? (
          <p className="text-xs sm:text-sm text-ink-body leading-relaxed">{e.resumen}</p>
        ) : (
          <p className="text-xs text-ink-muted">Aún no llega el resumen. Cuando Gemini deje las notas en Meet, el reclutador puede sincronizarlas.</p>
        )}
        {e.puntos.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1 text-xs">
            {e.puntos.map((p) => (
              <span key={p} className="bg-surface-canvas border border-ink-border text-ink-title font-medium px-2 py-0.5 rounded">✓ {p}</span>
            ))}
          </div>
        )}
      </div>
      )}

      {(base || otro) && (
        <div className="bg-white border border-ink-border rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-xs font-bold text-primary uppercase tracking-wider">Transcripción → análisis</h2>
            <span className="text-[10px] font-bold text-ink-muted bg-surface-subtle px-2 py-1 rounded-md">
              Motor: {(otro ?? base)?.motor === "gemini" ? "Gemini" : "local"} · {(otro ?? base)?.metricas.turnos} intervenciones · {(otro ?? base)?.metricas.participacionCandidato}% habló la persona candidata
            </span>
          </div>
          {(() => {
            const a = (otro ?? base)!;
            return (
              <div className="space-y-3 text-xs">
                <p className="text-ink-body leading-relaxed">{a.resumen}</p>
                {a.frasesClave.length > 0 && (
                  <div>
                    <div className="font-bold text-ink-title uppercase tracking-wider text-[10px] mb-1">Frases clave</div>
                    <ul className="space-y-1">
                      {a.frasesClave.map((f) => (
                        <li key={f.texto} className="text-ink-body">
                          <span className="text-ink-muted">#{f.turno}</span> “{f.texto}”
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {a.competencias.length > 0 && (
                  <div>
                    <div className="font-bold text-ink-title uppercase tracking-wider text-[10px] mb-1">Competencias con evidencia</div>
                    <div className="space-y-1.5">
                      {a.competencias.map((c) => (
                        <div key={c.nombre} className="flex items-start gap-2">
                          <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded ${c.nivel === "fuerte" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800"}`}>{c.nombre}</span>
                          <span className="text-ink-muted italic">“{c.evidencia}”</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {(a.dudas.length > 0 || a.seguimiento.length > 0) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {a.dudas.length > 0 && (
                      <div>
                        <div className="font-bold text-amber-800 uppercase tracking-wider text-[10px] mb-1">Dudas que reconoció</div>
                        <ul className="list-disc pl-4 space-y-0.5 text-ink-body">{a.dudas.map((d) => <li key={d}>{d}</li>)}</ul>
                      </div>
                    )}
                    {a.seguimiento.length > 0 && (
                      <div>
                        <div className="font-bold text-ink-title uppercase tracking-wider text-[10px] mb-1">Para profundizar</div>
                        <ul className="list-disc pl-4 space-y-0.5 text-ink-body">{a.seguimiento.map((d) => <li key={d}>{d}</li>)}</ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })()}

          {entrevista?.transcripcion && (
            <div>
              <button type="button" onClick={() => setVerTrans((v) => !v)} className="text-xs font-bold text-primary hover:underline">
                {verTrans ? "Ocultar transcripción" : "Ver transcripción completa"}
              </button>
              {verTrans && <pre className="mt-2 whitespace-pre-wrap text-[11px] leading-relaxed text-ink-body bg-surface-canvas border border-ink-border rounded-xl p-3 max-h-64 overflow-y-auto font-sans">{e.transcripcion}</pre>}
            </div>
          )}

          <div className="pt-3 border-t border-ink-border space-y-2">
            <label htmlFor="trans-otra" className="block text-xs font-bold text-ink-title">Probar con otra transcripción (pega las notas de Meet: “Nombre: texto”)</label>
            <textarea id="trans-otra" rows={3} value={pegado} onChange={(ev) => setPegado(ev.target.value)} placeholder={"Entrevistador: ¿Cuéntame de tu último proyecto?\n" + (entrevista?.candidato.split(" ")[0] ?? "Candidata") + ": Migré el servicio de pagos y reduje 30% la latencia…"} className="w-full px-3 py-2 text-xs bg-surface-canvas rounded-xl border border-ink-border focus:outline-none focus:border-primary resize-y" />
            <button
              type="button"
              disabled={resumiendo || pegado.trim().length < 40}
              onClick={async () => {
                setResumiendo(true);
                try {
                  setOtro(resumir ? await resumir(pegado, entrevista!.candidato) : summarizeTranscript(pegado, entrevista!.candidato, requeridas));
                } finally {
                  setResumiendo(false);
                }
              }}
              className="bg-primary hover:bg-primary-hover disabled:opacity-50 text-white font-bold text-xs px-4 py-2 rounded-xl"
            >
              {resumiendo ? <span className="inline-flex items-center gap-2"><LiverMark variant="glyph" size={16} /> Analizando…</span> : "Analizar transcripción"}
            </button>
            {otro && <button type="button" onClick={() => setOtro(null)} className="ml-3 text-xs font-semibold text-ink-muted">Volver a la entrevista de la demo</button>}
          </div>
        </div>
      )}

      <div className="bg-white border border-ink-border rounded-2xl p-5 shadow-xs space-y-3">
        <h3 className="text-xs font-bold text-ink-muted uppercase tracking-wider">Feedback de entrevistadores</h3>
        {e.feedback.length === 0 && <p className="text-xs text-ink-muted">Esta entrevista no tiene entrevistadores asignados.</p>}
        <div className="space-y-3 divide-y divide-ink-border text-xs">
          {e.feedback.map((f, i) => {
            const v = f.veredicto ? VEREDICTO[f.veredicto] : null;
            return (
              <div key={f.profileId} className={i === 0 ? "pt-2 first:pt-0" : "pt-3"}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-ink-title">{f.nombre}{f.cargo ? ` (${f.cargo})` : ""}</span>
                  {v ? <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${v.cls}`}>{v.label}</span> : <span className="text-[10px] font-bold text-ink-muted bg-surface-subtle px-2 py-0.5 rounded">Pendiente</span>}
                </div>
                {f.notas && <p className="text-ink-muted italic">“{f.notas}”</p>}
              </div>
            );
          })}
        </div>
      </div>

      {e.miFeedbackPendiente && onFeedback && (
        <div className="bg-accent-tint border border-accent-border rounded-2xl p-5 space-y-3">
          <h3 className="text-xs font-bold text-accent-dark uppercase tracking-wider">Tu feedback</h3>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Veredicto">
            {Object.entries(VEREDICTO).map(([k, v]) => (
              <button
                key={k}
                type="button"
                role="radio"
                aria-checked={fbVeredicto === k}
                onClick={() => setFbVeredicto(k as typeof fbVeredicto)}
                className={`text-xs font-bold px-3 py-1.5 rounded-full border ${fbVeredicto === k ? "bg-accent text-white border-accent" : "bg-white text-ink-title border-ink-border"}`}
              >
                {v.label}
              </button>
            ))}
          </div>
          <textarea
            rows={3}
            value={fbNotas}
            onChange={(ev) => setFbNotas(ev.target.value)}
            placeholder="Fortalezas, dudas y evidencias que viste en la entrevista…"
            aria-label="Notas del feedback"
            className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-ink-border focus:outline-none focus:border-primary resize-y"
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => run(() => onFeedback(fbVeredicto, fbNotas))}
            className="bg-accent hover:bg-accent-hover disabled:opacity-60 text-white font-bold text-xs px-4 py-2 rounded-xl"
          >
            Enviar mi feedback
          </button>
        </div>
      )}

      <div className="bg-white border border-ink-border rounded-2xl p-5 shadow-xs">
        <h3 className="text-xs font-bold text-ink-title uppercase tracking-wider mb-3">Decisión del Hiring Manager</h3>
        {e.decidido ? (
          <div
            className="inline-flex items-center gap-2 font-bold text-xs sm:text-sm px-4 py-2 rounded-xl"
            style={e.decidido === "finalista" ? { background: "#E9F5EC", color: "#1E8E3E" } : { background: "#FBEAE9", color: "#D93025" }}
          >
            {e.decidido === "finalista" ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
            <span>{e.decidido === "finalista" ? "✓ Marcado como finalista" : "✕ Descartado"}</span>
          </div>
        ) : !e.puedeDecidir ? (
          <p className="text-xs text-ink-muted">Solo el Hiring Manager de la vacante decide sobre el candidato.</p>
        ) : descartando ? (
          <div className="space-y-2.5">
            <label htmlFor="just" className="block text-xs font-bold text-ink-title">Justificación (obligatoria)</label>
            <textarea
              id="just"
              rows={3}
              value={justificacion}
              onChange={(ev) => setJustificacion(ev.target.value)}
              placeholder="Explica por qué se descarta al candidato."
              className="w-full px-3 py-2 text-xs bg-surface-canvas rounded-xl border border-ink-border focus:outline-none focus:border-primary resize-y"
            />
            <div className="flex gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => (justificacion.trim() ? run(() => onDecidir("descartado", justificacion)) : setError("Escribe la justificación para descartar."))}
                className="bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white font-bold text-xs px-4 py-2 rounded-xl"
              >
                Confirmar descarte
              </button>
              <button type="button" onClick={() => { setDescartando(false); setError(null); }} className="text-xs font-semibold text-ink-muted px-3">Cancelar</button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <button
              type="button"
              disabled={busy}
              onClick={() => run(() => onDecidir("finalista", ""))}
              className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold text-xs sm:text-sm py-2.5 px-5 rounded-xl transition-all active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Aprobar como finalista</span>
            </button>
            <button
              type="button"
              onClick={() => setDescartando(true)}
              className="inline-flex items-center justify-center gap-2 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 font-bold text-xs sm:text-sm py-2.5 px-4 rounded-xl transition-all"
            >
              <XCircle className="w-4 h-4" />
              <span>Descartar</span>
            </button>
          </div>
        )}
        {error && (
          <div role="alert" className="mt-3 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">{error}</div>
        )}
      </div>
    </div>
  );
}

"use client";

import { LiverLoader, LiverMark } from "@/components/LiverLoader";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Check, ChevronDown, ChevronRight, FileText, GitBranch, Minus, Sparkles, X } from "lucide-react";
import PdfViewerModal from "@/components/PdfViewerModal";
import type { Fila } from "@/lib/demo/candidatos";
import type { RepoInfo, RepoProfile } from "@/lib/ai/types";

export type CompatUI = {
  repo: RepoInfo;
  perfil: RepoProfile;
  contexto: string;
  conRequisicion: boolean;
  analizado: boolean;
  filas: Fila[];
  progreso: string | null;
  cargandoRepo: boolean;
  error: string | null;
  motor: "local" | "gemini";
  explicaciones: Record<string, string>; // explicación redactada por Gemini (si hay clave)
};

const EJEMPLOS = [
  "Vive en Ciudad de México o puede trasladarse",
  "Ha trabajado en fintech o pagos",
  "Contribuye a open source o da charlas en comunidad",
  "Ha liderado o mentoreado a otras personas",
  "Inglés avanzado",
  "Disponible para guardias (on-call)",
];

const color = (p: number) => (p >= 80 ? { bar: "bg-emerald-500", txt: "text-emerald-700 bg-emerald-50" } : p >= 55 ? { bar: "bg-amber-500", txt: "text-amber-700 bg-amber-50" } : { bar: "bg-rose-400", txt: "text-rose-700 bg-rose-50" });
const iniciales = (n: string) => n.split(" ").slice(0, 2).map((w) => w[0]).join("");

function Barra({ etiqueta, valor }: { etiqueta: string; valor: number }) {
  return (
    <div className="flex items-center gap-2 text-[11px]">
      <span className="w-24 text-ink-muted shrink-0">{etiqueta}</span>
      <div className="flex-1 h-1.5 rounded-full bg-ink-border overflow-hidden">
        <div className={`h-full rounded-full ${color(valor).bar}`} style={{ width: `${valor}%` }} />
      </div>
      <span className="w-8 text-right font-bold text-ink-title">{valor}%</span>
    </div>
  );
}

export default function AtCompat({
  vacanteTitulo,
  requisicion,
  repos,
  ui,
  urlInicial = "",
  onVolver,
  onSeleccionarRepo,
  onTraerRepo,
  onContexto,
  onAgregarContexto,
  onToggleRequisicion,
  onAnalizar,
  onVerPerfil,
}: {
  vacanteTitulo: string;
  requisicion: { stack: string[]; habilidades: string };
  repos: RepoInfo[];
  ui: CompatUI;
  urlInicial?: string; // URL de GitHub preestablecida en el cuadro
  onVolver: () => void;
  onSeleccionarRepo: (fullName: string) => void;
  onTraerRepo: (url: string) => void;
  onContexto: (texto: string) => void;
  onAgregarContexto: (linea: string) => void;
  onToggleRequisicion: (v: boolean) => void;
  onAnalizar: () => void;
  onVerPerfil: (cvId: string) => void;
}) {
  const [url, setUrl] = useState(urlInicial);
  const [abierto, setAbierto] = useState<string | null>(null);
  const [pdfModal, setPdfModal] = useState<{ url: string; nombre: string } | null>(null);
  const tablero = useRef<HTMLDivElement>(null);
  const estabaAnalizando = useRef(false);
  // al terminar el análisis, baja al tablero de resultados
  useEffect(() => {
    if (estabaAnalizando.current && !ui.progreso && ui.analizado) tablero.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    estabaAnalizando.current = !!ui.progreso;
  }, [ui.progreso, ui.analizado]);
  const filas = ui.filas;
  const mejor = filas[0];
  const promedio = filas.length ? Math.round(filas.reduce((a, f) => a + f.compat.total, 0) / filas.length) : 0;
  const altos = filas.filter((f) => f.compat.total >= 80).length;

  return (
    <div className="space-y-4 max-w-4xl mx-auto pb-20">
      <button type="button" onClick={onVolver} className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-primary hover:text-primary-dark py-1">
        <ArrowLeft className="w-4 h-4" />
        <span>Volver a candidatos</span>
      </button>

      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-ink-border shadow-xs">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-lg sm:text-xl font-black text-ink-title flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-accent" /> Compatibilidad con IA
            </h1>
            <p className="text-xs text-ink-muted mt-0.5">{vacanteTitulo} · {ui.filas.length} CVs cargados y analizados automáticamente</p>
          </div>
          <span className="text-[10px] font-bold text-ink-muted bg-surface-subtle px-2 py-1 rounded-md shrink-0" title="Reglas + vocabulario técnico; con GEMINI_API_KEY el servidor puede redactar explicaciones con Gemini">
            Motor: {ui.motor === "gemini" ? "Gemini" : "local"}
          </span>
        </div>

        {/* 1. Proyecto de referencia */}
        <div className="mt-4 pt-4 border-t border-ink-border/60 space-y-2.5">
          <div className="text-xs font-bold text-ink-title uppercase tracking-wider flex items-center gap-1.5"><GitBranch className="w-3.5 h-3.5" /> 1 · Proyecto de referencia (GitHub)</div>
          <div className="flex flex-col sm:flex-row gap-2">
            <select
              aria-label="Proyecto guardado"
              value={repos.some((r) => r.fullName === ui.repo.fullName) ? ui.repo.fullName : ""}
              onChange={(e) => e.target.value && onSeleccionarRepo(e.target.value)}
              className="px-3 py-2 text-xs bg-surface-canvas rounded-lg border border-ink-border focus:outline-none focus:border-primary sm:w-64"
            >
              <option value="">Otro repositorio…</option>
              {repos.map((r) => <option key={r.fullName} value={r.fullName}>{r.fullName}</option>)}
            </select>
            <input
              aria-label="URL de GitHub"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && url.trim() && onTraerRepo(url)}
              placeholder="https://github.com/usuario/repositorio"
              className="flex-1 px-3 py-2 text-xs bg-surface-canvas rounded-lg border border-ink-border focus:outline-none focus:border-primary"
            />
            <button type="button" disabled={!url.trim() || ui.cargandoRepo} onClick={() => onTraerRepo(url)} className="px-3 py-2 text-xs font-bold bg-white border border-ink-border hover:bg-surface-canvas rounded-lg disabled:opacity-50">
              {ui.cargandoRepo ? "Trayendo…" : "Traer de GitHub"}
            </button>
          </div>
          {ui.error && <div role="alert" className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">{ui.error}</div>}
          <div className="bg-surface-canvas rounded-xl p-3 text-xs space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <a href={ui.repo.url} target="_blank" rel="noopener noreferrer" className="font-bold text-primary hover:underline">{ui.repo.fullName}</a>
              <span className="text-[10px] font-semibold text-ink-muted">{ui.repo.fuente === "github" ? "GitHub en vivo" : "Copia guardada de GitHub"} · ★ {ui.repo.stars.toLocaleString("es-MX")}</span>
            </div>
            <p className="text-ink-body">{ui.repo.descripcion}</p>
            <div className="flex flex-wrap gap-1 pt-0.5">
              {ui.perfil.skills.filter((s) => s.cat !== "blanda").slice(0, 9).map((s) => (
                <span key={s.id} className="px-2 py-0.5 rounded-md bg-white border border-ink-border text-ink-title font-semibold">{s.label}</span>
              ))}
            </div>
          </div>
          <label className="flex items-start gap-2 text-xs text-ink-body cursor-pointer">
            <input type="checkbox" checked={ui.conRequisicion} onChange={(e) => onToggleRequisicion(e.target.checked)} className="mt-0.5" />
            <span>Incluir la <b>requisición validada por el BP</b> ({requisicion.stack.join(", ")} · {requisicion.habilidades}). Sin ella, la IA solo ve el código.</span>
          </label>
        </div>

        {/* 2. Contexto libre */}
        <div className="mt-4 pt-4 border-t border-ink-border/60 space-y-2">
          <div className="text-xs font-bold text-ink-title uppercase tracking-wider">2 · Contexto: cualquier cosa de la vida diaria</div>
          <textarea
            aria-label="Contexto libre"
            rows={3}
            value={ui.contexto}
            onChange={(e) => onContexto(e.target.value)}
            placeholder={"Una idea por línea, con tus propias palabras.\nEj. vive cerca de la oficina, le gusta enseñar, ha trabajado en startups…"}
            className="w-full px-3 py-2 text-xs bg-surface-canvas rounded-xl border border-ink-border focus:outline-none focus:border-primary resize-y"
          />
          <p className="text-[11px] text-ink-muted">Los criterios sobre datos personales sensibles (edad, género, religión, salud, estado civil…) se ignoran por diseño y no afectan el porcentaje.</p>
          <div className="flex flex-wrap gap-1.5">
            {EJEMPLOS.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => onAgregarContexto(e)}
                className="text-[11px] font-semibold px-2.5 py-1 rounded-full border border-ink-border bg-white hover:border-accent hover:text-accent-dark"
              >
                + {e}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button type="button" onClick={onAnalizar} disabled={!!ui.progreso} className="inline-flex items-center gap-2 bg-accent hover:bg-accent-hover disabled:opacity-70 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition-all active:scale-95">
            {ui.progreso ? <LiverMark variant="glyph" size={18} /> : <Sparkles className="w-4 h-4" />}
            <span>{ui.analizado ? "Analizar de nuevo" : "Analizar CVs con IA"}</span>
          </button>
        </div>
        {ui.progreso && (
          <div className="mt-4 rounded-xl border border-ink-border bg-surface-canvas px-4 py-3">
            <LiverLoader label={ui.progreso} />
          </div>
        )}
      </div>

      {/* Dashboard */}
      {ui.analizado && mejor && (
        <div ref={tablero} className="space-y-4 scroll-mt-20">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              { k: "CVs analizados", v: String(filas.length) },
              { k: "Mejor ajuste", v: `${mejor.compat.total}%`, s: mejor.cv.nombre.split(" ").slice(0, 2).join(" ") },
              { k: "Promedio del pool", v: `${promedio}%` },
              { k: "Con 80 % o más", v: String(altos) },
            ].map((t) => (
              <div key={t.k} className="bg-white border border-ink-border rounded-2xl p-3.5 shadow-xs">
                <div className="text-[10px] font-bold text-ink-muted uppercase tracking-wider">{t.k}</div>
                <div className="text-2xl font-black text-ink-title mt-0.5">{t.v}</div>
                {t.s && <div className="text-[11px] text-ink-muted truncate">{t.s}</div>}
              </div>
            ))}
          </div>

          <div className="bg-white border border-ink-border rounded-2xl shadow-xs divide-y divide-ink-border">
            {filas.map((f, i) => {
              const c = f.compat;
              const col = color(c.total);
              const abiertoAqui = abierto === f.cv.id;
              return (
                <div key={f.cv.id}>
                  <button type="button" onClick={() => setAbierto(abiertoAqui ? null : f.cv.id)} aria-expanded={abiertoAqui} className="w-full text-left p-3.5 sm:p-4 hover:bg-surface-canvas/60 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="w-5 text-xs font-black text-ink-muted shrink-0">{i + 1}</span>
                      <div className="w-9 h-9 rounded-xl bg-primary-tint text-primary font-black text-xs flex items-center justify-center shrink-0">{iniciales(f.cv.nombre)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <div className="text-sm font-bold text-ink-title truncate">{f.cv.nombre}</div>
                            <div className="text-[11px] text-ink-muted truncate">{f.cv.titular} · {f.analisis.anios} {f.analisis.anios === 1 ? "año" : "años"}</div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {ui.contexto.trim() && c.base !== c.total && (
                              <span className="text-[10px] font-bold text-ink-muted" title="Compatibilidad sin el contexto libre">{c.base}% → </span>
                            )}
                            <span className={`text-sm font-black px-2 py-0.5 rounded-lg ${col.txt}`}>{c.total}%</span>
                            {abiertoAqui ? <ChevronDown className="w-4 h-4 text-ink-muted" /> : <ChevronRight className="w-4 h-4 text-ink-muted" />}
                          </div>
                        </div>
                        <div className="h-2 rounded-full bg-ink-border mt-2 overflow-hidden">
                          <div className={`h-full rounded-full ${col.bar} transition-all duration-700`} style={{ width: `${c.total}%` }} />
                        </div>
                      </div>
                    </div>
                  </button>

                  {abiertoAqui && (
                    <div className="px-4 sm:px-5 pb-4 pt-1 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 bg-surface-canvas/40 text-xs">
                      <div className="space-y-1.5">
                        <div className="font-bold text-ink-title uppercase tracking-wider text-[10px]">Por qué este porcentaje</div>
                        <Barra etiqueta="Stack técnico" valor={c.componentes.stack} />
                        <Barra etiqueta="Dominio" valor={c.componentes.dominio} />
                        <Barra etiqueta="Experiencia" valor={c.componentes.experiencia} />
                        <Barra etiqueta="Colaboración" valor={c.componentes.colaboracion} />
                        {c.componentes.contexto !== null && <Barra etiqueta="Contexto" valor={c.componentes.contexto} />}
                      </div>
                      <div className="space-y-2">
                        <div>
                          <div className="font-bold text-ink-title uppercase tracking-wider text-[10px] mb-1">Coincide con el proyecto</div>
                          <div className="flex flex-wrap gap-1">
                            {c.coincidencias.length ? c.coincidencias.map((m) => (
                              <span key={m.label} className={`px-2 py-0.5 rounded-md font-semibold ${m.tipo === "exacta" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{m.label}</span>
                            )) : <span className="text-ink-muted">Sin coincidencias técnicas.</span>}
                          </div>
                        </div>
                        {c.brechas.length > 0 && (
                          <div>
                            <div className="font-bold text-ink-title uppercase tracking-wider text-[10px] mb-1">Brechas</div>
                            <div className="flex flex-wrap gap-1">{c.brechas.map((b) => <span key={b} className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 font-semibold">{b}</span>)}</div>
                          </div>
                        )}
                      </div>
                      {c.criterios.length > 0 && (
                        <div className="sm:col-span-2">
                          <div className="font-bold text-ink-title uppercase tracking-wider text-[10px] mb-1">Tu contexto</div>
                          <ul className="space-y-1">
                            {c.criterios.map((k) => (
                              <li key={k.texto} className="flex items-start gap-2">
                                <span className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${k.ignorado ? "bg-ink-subtle text-white" : k.cumple === "si" ? "bg-emerald-500 text-white" : k.cumple === "parcial" ? "bg-amber-400 text-white" : "bg-rose-300 text-white"}`} aria-label={k.ignorado ? "ignorado" : k.cumple}>
                                  {k.ignorado ? <Minus className="w-3 h-3" /> : k.cumple === "si" ? <Check className="w-3 h-3" /> : k.cumple === "parcial" ? <Minus className="w-3 h-3" /> : <X className="w-3 h-3" />}
                                </span>
                                <span><b className="text-ink-title">{k.texto}</b>{k.evidencia && <span className="text-ink-muted"> — {k.evidencia}</span>}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <p className="sm:col-span-2 text-ink-body leading-relaxed">{ui.explicaciones[f.cv.id] ?? c.explicacion}</p>
                      <div className="sm:col-span-2 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setPdfModal({ url: `/cvs/${f.cv.id}.pdf`, nombre: f.cv.nombre })}
                          className="inline-flex items-center gap-1.5 bg-white border border-ink-border hover:bg-surface-canvas text-ink-title font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5 text-primary" /> Ver CV (PDF)
                        </button>
                        <button type="button" onClick={() => onVerPerfil(f.cv.id)} className="inline-flex items-center gap-1.5 bg-primary hover:bg-primary-hover text-white font-bold px-3 py-1.5 rounded-lg">
                          Ver perfil
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {pdfModal && (
        <PdfViewerModal
          isOpen={!!pdfModal}
          onClose={() => setPdfModal(null)}
          pdfUrl={pdfModal.url}
          candidateName={pdfModal.nombre}
        />
      )}
    </div>
  );
}
